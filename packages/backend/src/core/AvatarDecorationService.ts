/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Redis from 'ioredis';
import { IsNull } from "typeorm";
import type { AvatarDecorationsRepository, InstancesRepository, UsersRepository, AvatarDecoration, User } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { Cache } from '@/misc/cache.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { StreamMessages } from '@/server/api/stream/types.js';
import { HttpRequestService } from "@/core/HttpRequestService.js";
import { appendQuery, query } from '@/misc/prelude/url.js';
import type { Config } from '@/config.js';

@Injectable()
export class AvatarDecorationService implements OnApplicationShutdown {
	public cache: Cache<AvatarDecoration[]>;
	public cacheWithRemote: Cache<AvatarDecoration[]>;
	constructor(

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redisSubscriber)
		private redisForSub: Redis.Redis,

		@Inject(DI.avatarDecorationsRepository)
		private avatarDecorationsRepository: AvatarDecorationsRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private idService: IdService,
		private moderationLogService: ModerationLogService,
		private globalEventService: GlobalEventService,
		private httpRequestService: HttpRequestService,

	) {
		this.cache = new Cache<AvatarDecoration[]>(1000 * 60 * 30);
		this.cacheWithRemote = new Cache<AvatarDecoration[]>(1000 * 60 * 30);
		this.redisForSub.on('message', this.onMessage);
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);
		if (obj.channel === 'internal') {
			const { type, body } = obj.message as StreamMessages['internal']['payload'];
			switch (type) {
				case 'avatarDecorationCreated':
				case 'avatarDecorationUpdated':
				case 'avatarDecorationDeleted': {
					this.cache.delete(null);
					break;
				}
				default:
					break;
			}
		}
	}

	@bindThis
	public async create(options: Partial<AvatarDecoration>, moderator?: User): Promise<AvatarDecoration> {
		const created = await this.avatarDecorationsRepository.insert({
			id: this.idService.genId(),
			...options,
		}).then(x => this.avatarDecorationsRepository.findOneByOrFail(x.identifiers[0]));
		this.globalEventService.publishInternalEvent('avatarDecorationCreated', created);
		if (moderator) {
			this.moderationLogService.insertModerationLog(moderator, 'createAvatarDecoration', {
				avatarDecorationId: created.id,
				avatarDecoration: created,
			});
		}
		return created;
	}

	@bindThis
	public async update(id: AvatarDecoration['id'], params: Partial<AvatarDecoration>, moderator?: User): Promise<void> {
		const avatarDecoration = await this.avatarDecorationsRepository.findOneByOrFail({ id });
		const date = new Date();
		await this.avatarDecorationsRepository.update(avatarDecoration.id, {
			updatedAt: date,
			...params,
		});
		const updated = await this.avatarDecorationsRepository.findOneByOrFail({ id: avatarDecoration.id });
		this.globalEventService.publishInternalEvent('avatarDecorationUpdated', updated);
		if (moderator) {
			this.moderationLogService.insertModerationLog(moderator, 'updateAvatarDecoration', {
				avatarDecorationId: avatarDecoration.id,
				before: avatarDecoration,
				after: updated,
			});
		}
	}
	
	// From CherryPick (Remote avatar)
	@bindThis
	public async remoteUserUpdate(user: User) {
		const userHost = user.host ?? '';
		const instance = await this.instancesRepository.findOneBy({ host: userHost });
		const userHostUrl = `https://${user.host}`;
		const endpointsApiUrl = `${userHostUrl}/api/endpoints`;
		const showUserApiUrl = `${userHostUrl}/api/users/show`;

		let endpoints: any;
		try {
			const ep = await this.httpRequestService.send(endpointsApiUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			});
			endpoints = await ep.json();
		} catch (e: any) {
			if (e?.statusCode === 404) return; // 404ならreturnで処理中断
			throw e; // 他のエラーはそのまま投げる
		}

		// endpointsにget-avatar-decorationsが無ければアバターデコ非対応
		if (!endpoints.includes('get-avatar-decorations')) return;

		let userData: any;
		try {
			const res = await this.httpRequestService.send(showUserApiUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: user.username }),
			});
			userData = await res.json();
		} catch (e: any) {
			if (e?.statusCode === 404) return; // ユーザー情報取得で404 → return
			throw e;
		}
		const userAvatarDecorations = userData.avatarDecorations ?? undefined;
		
		if (!userAvatarDecorations || userAvatarDecorations.length === 0) {
			const updates = {} as Partial<User>;
			updates.avatarDecorations = [];
			await this.usersRepository.update({ id: user.id }, updates);
			return;
		}

		const instanceHost = instance?.host;
		const decorationApiUrl = `https://${instanceHost}/api/get-avatar-decorations`;
		const allRes = await this.httpRequestService.send(decorationApiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
		});

		const allDecorations: any = await allRes.json();
		const updates = {} as Partial<User>;
		updates.avatarDecorations = [];
		for (const avatarDecoration of userAvatarDecorations) {
			let name;
			let description;
			const avatarDecorationId = avatarDecoration.id;
			for (const decoration of allDecorations) {
				// eslint-disable-next-line eqeqeq
				if (decoration.id == avatarDecorationId) {
					name = decoration.name;
					description = decoration.description;
					break;
				}
			}
			
			const existingDecoration = await this.avatarDecorationsRepository.findOneBy({
				host: userHost,
				remoteId: avatarDecorationId,
			});
			const decorationData = {
				name: name,
				description: description,
				url: avatarDecoration.url,
				remoteId: avatarDecorationId,
				host: userHost,
			};
			if (existingDecoration == null) {
				await this.create(decorationData);
				this.cacheWithRemote.delete(null);
			} else {
				await this.update(existingDecoration.id, decorationData);
				this.cacheWithRemote.delete(null);
			}
			const findDecoration = await this.avatarDecorationsRepository.findOneBy({
				host: userHost,
				remoteId: avatarDecorationId,
			});
			updates.avatarDecorations.push({
				id: findDecoration?.id ?? '',
				angle: avatarDecoration.angle ?? 0,
				flipH: avatarDecoration.flipH ?? false,
				offsetX: avatarDecoration.offsetX ?? 0,
				offsetY: avatarDecoration.offsetY ?? 0,
			});
		}
		await this.usersRepository.update({ id: user.id }, updates);
	}

	@bindThis
	public async delete(id: AvatarDecoration['id'], moderator?: User): Promise<void> {
		const avatarDecoration = await this.avatarDecorationsRepository.findOneByOrFail({ id });
		await this.avatarDecorationsRepository.delete({ id: avatarDecoration.id });
		this.globalEventService.publishInternalEvent('avatarDecorationDeleted', avatarDecoration);
		if (moderator) {
			this.moderationLogService.insertModerationLog(moderator, 'deleteAvatarDecoration', {
				avatarDecorationId: avatarDecoration.id,
				avatarDecoration: avatarDecoration,
			});
		}
	}

	@bindThis
	public async getAll(noCache = false, withRemote = false): Promise<AvatarDecoration[]> {
		if (noCache) {
			this.cache.delete(null);
		}
		if (!withRemote) {
			return this.cache.fetch(null, () => this.avatarDecorationsRepository.find({ where: { host: IsNull() } }));
		} else {
			return this.cacheWithRemote.fetch(null, () => this.avatarDecorationsRepository.find({}));
		}
	}

	@bindThis
	public dispose(): void {
		this.redisForSub.off('message', this.onMessage);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
