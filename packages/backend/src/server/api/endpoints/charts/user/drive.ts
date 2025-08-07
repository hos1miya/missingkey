import { Inject, Injectable } from '@nestjs/common';
import type { UserProfilesRepository } from '@/models/index.js';
import { getJsonSchema } from '@/core/chart/core.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import PerUserDriveChart from '@/core/chart/charts/per-user-drive.js';
import { schema } from '@/core/chart/charts/entities/per-user-drive.js';
import { RoleService } from '@/core/RoleService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['charts', 'drive', 'users'],

	res: getJsonSchema(schema),

	errors: {
		activitiesNotPublic: {
			message: 'Activities of the user is not public.',
			code: 'ACTIVITIES_NOT_PUBLIC',
			id: '062b4d06-12a3-4ec3-9c5e-4fb1aa686066',
		},
	},

	allowGet: true,
	cacheSec: 60 * 60,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		span: { type: 'string', enum: ['day', 'hour'] },
		limit: { type: 'integer', minimum: 1, maximum: 500, default: 30 },
		offset: { type: 'integer', nullable: true, default: null },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['span', 'userId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private perUserDriveChart: PerUserDriveChart,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: ps.userId });
			const isModerator = me !== null ? await this.roleService.isModerator(me) : false;
		
			if ((me == null || me.id !== ps.userId) && profile.privateActivities && !isModerator) {
				throw new ApiError(meta.errors.activitiesNotPublic);
			}
			return await this.perUserDriveChart.getChart(ps.span, ps.limit, ps.offset ? new Date(ps.offset) : null, ps.userId);
		});
	}
}
