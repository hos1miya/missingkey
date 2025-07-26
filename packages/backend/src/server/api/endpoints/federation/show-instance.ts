import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { InstancesRepository } from '@/models/index.js';
import { InstanceEntityService } from '@/core/entities/InstanceEntityService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	res: {
		oneOf: [{
			type: 'object',
			allOf: [
				{ ref: 'FederationInstance' },
				{
					type: 'object',
					properties: {
						hiddenSuspended: {
							type: 'boolean',
							nullable: false,
						},
					},
				},
			],
		}, {
			type: 'null',
		}],
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		host: { type: 'string' },
		additionalInfo: { type: 'boolean' },
	},
	required: ['host'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private instanceEntityService: InstanceEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const instance = await this.instancesRepository
				.findOneBy({ host: this.utilityService.toPuny(ps.host) });

			if (instance && !ps.additionalInfo) {
				delete instance.hiddenSuspended;
			}

			return instance ? await this.instanceEntityService.pack(instance, ps.additionalInfo) : null;
		});
	}
}
