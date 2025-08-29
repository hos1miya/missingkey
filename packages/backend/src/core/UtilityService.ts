import { URL } from 'node:url';
import { toASCII } from 'punycode';
import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { bindThis } from '@/decorators.js';
import { MetaService } from '@/core/MetaService.js';
import type { InstancesRepository } from '@/models/index.js';

@Injectable()
export class UtilityService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private metaService: MetaService,
	) {
	}

	@bindThis
	public getFullApAccount(username: string, host: string | null): string {
		return host ? `${username}@${this.toPuny(host)}` : `${username}@${this.toPuny(this.config.host)}`;
	}

	@bindThis
	public isSelfHost(host: string | null): boolean {
		if (host == null) return true;
		return this.toPuny(this.config.host) === this.toPuny(host);
	}

	@bindThis
	public isBlockedHost(blockedHosts: string[], host: string | null): boolean {
		if (host == null) return false;
		return blockedHosts.some(x => `.${host.toLowerCase()}`.endsWith(`.${x}`));
	}

	@bindThis
	public isBlockedSoftware(blockedSoftwares: string[], software: string | null): boolean {
		if (software == null) return false;
		return blockedSoftwares.some(x => `.${software.toLowerCase()}`.includes(`.${x}`));
	}

	@bindThis
	public extractDbHost(uri: string): string {
		const url = new URL(uri);
		return this.toPuny(url.hostname);
	}

	@bindThis
	public toPuny(host: string): string {
		return toASCII(host.toLowerCase());
	}

	@bindThis
	public toPunyNullable(host: string | null | undefined): string | null {
		if (host == null) return null;
		return toASCII(host.toLowerCase());
	}

	@bindThis
	public async isFederationAllowedHost(host: string): Promise<boolean> {
		const meta = await this.metaService.fetch();
		const instance = await this.instancesRepository.findOneBy({ host: host });
		
		if (this.isBlockedHost(meta.blockedHosts, host)) return false;
		if (instance && instance.softwareName && this.isBlockedSoftware(meta.blockedSoftwares, instance.softwareName)) return false;

		return true;
	}
}
