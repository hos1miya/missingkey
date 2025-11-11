import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository, MutingsRepository, AdvancedMutingsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { isUserRelated } from '@/misc/is-user-related.js';
import { DI } from '@/di-symbols.js';
import { sqlLikeEscape } from '@/misc/sql-like-escape.js';
import { RoleService } from '@/core/RoleService.js';

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

	errors: {
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		query: { type: 'string' },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		host: {
			type: 'string',
			nullable: true,
			description: 'The local host is represented with `null`.',
		},
		userId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
	},
	required: ['query'],
} as const;

// TODO: ロジックをサービスに切り出す

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
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId);

			if (ps.userId) {
				query.andWhere('note.userId = :userId', { userId: ps.userId });
			}

			if (!(me && await this.roleService.isModerator(me))) {
				query.andWhere('note.isDeleted = :isDeleted', { isDeleted: false });
			}

			query
				.andWhere('note.text ILIKE :q', { q: `%${ sqlLikeEscape(ps.query) }%` })
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

			this.queryService.generateVisibilityQuery(query, me);
			if (me) this.queryService.generateMutedUserQuery(query, me);
			if (me) this.queryService.generateBlockedUserQuery(query, me);

			const notes = await query.take(ps.limit).getMany();

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
