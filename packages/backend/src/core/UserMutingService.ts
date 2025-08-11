import { Inject, Injectable } from '@nestjs/common';
import type { MutingsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import type { User } from '@/models/entities/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class UserMutingService {
	constructor(
		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		private idService: IdService,
	) {
	}

	@bindThis
	public async mute(user: User, target: User): Promise<void> {
		await this.mutingsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			muterId: user.id,
			muteeId: target.id,
		});
	}
}
