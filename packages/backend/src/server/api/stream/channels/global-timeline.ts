import { Injectable } from '@nestjs/common';
import { checkWordMute } from '@/misc/check-word-mute.js';
import { isInstanceMuted } from '@/misc/is-instance-muted.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import type { Packed } from '@/misc/schema.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import Channel from '../channel.js';

class GlobalTimelineChannel extends Channel {
	public readonly chName = 'globalTimeline';
	public static shouldShare = true;
	public static requireCredential = false;

	constructor(
		private roleService: RoleService,
		private noteEntityService: NoteEntityService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
		//this.onNote = this.onNote.bind(this);
	}

	@bindThis
	public async init(params: any) {
		const policies = await this.roleService.getUserPolicies(this.user ? this.user.id : null);
		if (!policies.gtlAvailable) return;

		// Subscribe events
		this.subscriber.on('notesStream', this.onNote);
	}

	@bindThis
	private async onNote(note: Packed<'Note'>) {
		if (note.visibility !== 'public') return;

		// replyをpack
		if (note.replyId != null) {
			note.reply = await this.noteEntityService.pack(note.replyId, this.user, {
				detail: true,
			});
		}
		// renoteをpack
		if (note.renoteId != null) {
			note.renote = await this.noteEntityService.pack(note.renoteId, this.user, {
				detail: true,
			});
		}

		// 関係ない返信は除外
		if (note.reply && !this.user!.showTimelineReplies) {
			const reply = note.reply;
			// 「チャンネル接続主への返信」でもなければ、「チャンネル接続主が行った返信」でもなければ、「投稿者の投稿者自身への返信」でもない場合
			if (reply.userId !== this.user!.id && note.userId !== this.user!.id && reply.userId !== note.userId) return;
		}

		// ユーザーがミュートしたインスタンスからであれば無視
		if (isInstanceMuted(note, new Set<string>(this.userProfile?.mutedInstances ?? []))) return;

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.muting)) return;
		// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
		if (isUserRelated(note, this.blocking)) return;
		
		// RNミュート及びメディアミュート判定
		if (note.renoteId && this.renoteMuting.has(note.userId)) return;
		if (note.renote) {
			if (note.renote.fileIds?.length !== 0 && this.mediaMuting.has(note.renote.userId)) return;
		} else {
			if (note.fileIds?.length !== 0 && this.mediaMuting.has(note.userId)) return;
		}

		// ワードミュート判定
		this.checkWordMutes(note).then(result => {
			if (result) {
				return;
			}
			else {
				this.connection.cacheNote(note);
				this.send('note', note);
			}
		});
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}

	@bindThis
	private async checkWordMutes(note: Packed<'Note'>): Promise<boolean> {
		// リプライなら元ノート参照、ミュート判定
		if (note.replyId != null) {
			if (await this.noteEntityService.isManualMutedNote(note.replyId, this.user?.id ?? '')) return true;
			note.reply = await this.noteEntityService.pack(note.replyId, this.user, {
				detail: true,
			});
			if (this.userProfile !== null && this.userProfile !== undefined) {
				if (await checkWordMute(note.reply, this.user, this.userProfile.mutedWords)) return true;
			}
		}
		// Renoteなら元ノート参照、ミュート判定
		if (note.renoteId != null) {
			if (await this.noteEntityService.isManualMutedNote(note.renoteId, this.user?.id ?? '')) return true;
			note.renote = await this.noteEntityService.pack(note.renoteId, this.user, {
				detail: true,
			});
			if (this.userProfile !== null && this.userProfile !== undefined) {
				if (await checkWordMute(note.renote, this.user, this.userProfile.mutedWords)) return true;
			}
		}
		// このノート自体のミュート判定
		if (this.userProfile && await checkWordMute(note, this.user, this.userProfile.mutedWords)) return true;

		return false;
	}
}

@Injectable()
export class GlobalTimelineChannelService {
	public readonly shouldShare = GlobalTimelineChannel.shouldShare;
	public readonly requireCredential = GlobalTimelineChannel.requireCredential;

	constructor(
		private roleService: RoleService,
		private noteEntityService: NoteEntityService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): GlobalTimelineChannel {
		return new GlobalTimelineChannel(
			this.roleService,
			this.noteEntityService,
			id,
			connection,
		);
	}
}
