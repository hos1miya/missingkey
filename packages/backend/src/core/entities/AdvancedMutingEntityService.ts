import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AdvancedMutingsRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { AdvancedMuting } from '@/models/entities/AdvancedMuting.js';
import { UserEntityService } from './UserEntityService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class AdvancedMutingEntityService {
	constructor(
		@Inject(DI.advancedMutingsRepository)
		private advancedMutingsRepository: AdvancedMutingsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: AdvancedMuting['id'] | AdvancedMuting,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'AdvancedMuting'>> {
		const advancedMuting = typeof src === 'object' ? src : await this.advancedMutingsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: advancedMuting.id,
			createdAt: advancedMuting.createdAt.toISOString(),
			muteeId: advancedMuting.muteeId,
			mutee: this.userEntityService.pack(advancedMuting.muteeId, me, {
				detail: true,
			}),
			renoteMuted: advancedMuting.renoteMuted,
			mediaMuted: advancedMuting.mediaMuted,
		});
	}

	@bindThis
	public packMany(
		advancedMutings: any[],
		me: { id: User['id'] },
	) {
		return Promise.all(advancedMutings.map(x => this.pack(x, me)));
	}
}

