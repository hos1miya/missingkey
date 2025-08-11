import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { MutingsRepository, AdvancedMutingsRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { MutingEntityService } from '@/core/entities/MutingEntityService.js';
import { AdvancedMutingEntityService } from '@/core/entities/AdvancedMutingEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'read:mutes',

	res: {
		type: 'array',
		optional: false, nullable: false,
		anyOf: [
			{
				items: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'Muting',
				},
			},
			{
				items: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'AdvancedMuting',
				},
			},
		]
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		type: { type: 'string' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.advancedMutingsRepository)
		private advancedMutingsRepository: AdvancedMutingsRepository,

		private mutingEntityService: MutingEntityService,
		private advancedMutingEntityService: AdvancedMutingEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let query;

			if (ps.type && ps.type === 'renote') {
				query = this.queryService.makePaginationQuery(this.advancedMutingsRepository.createQueryBuilder('advancedMuting'), ps.sinceId, ps.untilId)
					.andWhere('advancedMuting.muterId = :meId', { meId: me.id })
					.andWhere('advancedMuting.renoteMuted = :isMuted', { isMuted: true });
			} else if (ps.type && ps.type === 'media') {
				query = this.queryService.makePaginationQuery(this.advancedMutingsRepository.createQueryBuilder('advancedMuting'), ps.sinceId, ps.untilId)
					.andWhere('advancedMuting.muterId = :meId', { meId: me.id })
					.andWhere('advancedMuting.mediaMuted = :isMuted', { isMuted: true });
			} else {
				query = this.queryService.makePaginationQuery(this.mutingsRepository.createQueryBuilder('muting'), ps.sinceId, ps.untilId)
					.andWhere('muting.muterId = :meId', { meId: me.id });
			}

			const mutings = await query
				.take(ps.limit)
				.getMany();

			if (ps.type && ( ps.type === 'renote' || ps.type === 'media')) {
				return await this.advancedMutingEntityService.packMany(mutings, me);
			}
			return await this.mutingEntityService.packMany(mutings, me);
		});
	}
}
