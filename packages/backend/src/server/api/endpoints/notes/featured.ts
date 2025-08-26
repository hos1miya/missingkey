import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository, MutingsRepository, AdvancedMutingsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['notes'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.advancedMutingsRepository)
		private advancedMutingsRepository: AdvancedMutingsRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const max = 30;
			const day = 1000 * 60 * 60 * 24 * 3; // 3日前まで

			const query = this.notesRepository.createQueryBuilder('note')
				.addSelect('note.score')
				.where('note.userHost IS NULL')
				.andWhere('note.score > 0')
				.andWhere('note.createdAt > :date', { date: new Date(Date.now() - day) })
				.andWhere('note.visibility = \'public\'')
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('user.avatar', 'avatar')
				.leftJoinAndSelect('user.banner', 'banner')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('replyUser.avatar', 'replyUserAvatar')
				.leftJoinAndSelect('replyUser.banner', 'replyUserBanner')
				.leftJoinAndSelect('renote.user', 'renoteUser')
				.leftJoinAndSelect('renoteUser.avatar', 'renoteUserAvatar')
				.leftJoinAndSelect('renoteUser.banner', 'renoteUserBanner');

			if (me) this.queryService.generateMutedUserQuery(query, me);
			if (me) this.queryService.generateBlockedUserQuery(query, me);

			let notes = await query
				.orderBy('note.score', 'DESC')
				.take(max)
				.getMany();

			notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

			notes = notes.slice(ps.offset, ps.offset + ps.limit);

			const packedTimeline = await this.noteEntityService.packMany(notes, me);

			if (!me) return packedTimeline;

			// renote, reply含む再帰的なミュート処理
			const mutings = await this.mutingsRepository.find({
				where: {
					muterId: me.id,
				},
				select: ['muteeId'],
			});
			const muting = new Set<string>(mutings.map(x => x.muteeId));

			const renoteMutings = await this.advancedMutingsRepository.find({
				where: {
					muterId: me.id,
					renoteMuted: true,
				},
				select: ['muteeId'],
			});
			const renoteMuting = new Set<string>(renoteMutings.map(x => x.muteeId));

			const mediaMutings = await this.advancedMutingsRepository.find({
				where: {
					muterId: me.id,
					mediaMuted: true,
				},
				select: ['muteeId'],
			});
			const mediaMuting = new Set<string>(mediaMutings.map(x => x.muteeId));

			return packedTimeline.filter(note => {
				if (isUserRelated(note, muting)) return false;
				if (note.renoteId && renoteMuting.has(note.userId)) return false;
				if (note.renote) {
					if (note.renote.fileIds?.length !== 0 && mediaMuting.has(note.renote.userId)) return false;
				} else {
					if (note.fileIds?.length !== 0 && mediaMuting.has(note.userId)) return false;
				}
				return true;
			});
		});
	}
}
