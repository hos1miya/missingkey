/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Global, Inject, Module } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { allSettled } from '@/misc/promise-tracker.js';
import { DI } from './di-symbols.js';
import { loadConfig } from './config.js';
import { createPostgresDataSource } from './postgres.js';
import { RepositoryModule } from './models/RepositoryModule.js';
import type { Provider, OnApplicationShutdown } from '@nestjs/common';

const config = loadConfig();

const $config: Provider = {
	provide: DI.config,
	useValue: config,
};

const $db: Provider = {
	provide: DI.db,
	useFactory: async (config) => {
		const db = createPostgresDataSource(config);
		return await db.initialize();
	},
	inject: [DI.config],
};

const $redis: Provider = {
	provide: DI.redis,
	useFactory: (config) => {
		return new Redis.Redis(config.redis);
	},
	inject: [DI.config],
};

const $redisSubscriber: Provider = {
	provide: DI.redisSubscriber,
	useFactory: (config) => {
		const redisSubscriber = new Redis.Redis(config.redisForSub);
		redisSubscriber.subscribe(config.host);
		return redisSubscriber;
	},
	inject: [DI.config],
};

@Global()
@Module({
	imports: [RepositoryModule],
	providers: [$config, $db, $redis, $redisSubscriber],
	exports: [$config, $db, $redis, $redisSubscriber, RepositoryModule],
})
export class GlobalModule implements OnApplicationShutdown {
	constructor(
		@Inject(DI.db) private db: DataSource,
		@Inject(DI.redis) private redisClient: Redis.Redis,
		@Inject(DI.redisSubscriber) private redisSubscriber: Redis.Redis,
	) { }

	public async dispose(): Promise<void> {
		// Wait for all potential DB queries
		await allSettled();
		// And then disconnect from DB
		await Promise.all([
			this.db.destroy(),
			this.redisClient.disconnect(),
			this.redisSubscriber.disconnect(),
		]);
	}

	async onApplicationShutdown(signal: string): Promise<void> {
		await this.dispose();
	}
}
