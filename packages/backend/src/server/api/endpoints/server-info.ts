import * as os from 'node:os';
import si from 'systeminformation';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';

const MIN_SIZE_BYTES = 1 * 1024 * 1024 * 1024; // 1 GiB

export const meta = {
	requireCredential: false,

	tags: ['meta'],
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
	) {
		super(meta, paramDef, async () => {
			const memStats = await si.mem();
			const fsStats = await si.fsSize();

      // 1 GiB 以上のファイルシステムを探す（なければ先頭要素を使う）
      const fsInfo = fsStats.find(fs => fs.size >= MIN_SIZE_BYTES) ?? fsStats[0];

			return {
				machine: os.hostname(),
				cpu: {
					model: os.cpus()[0].model,
					cores: os.cpus().length,
				},
				mem: {
					total: memStats.total,
				},
				fs: {
          total: fsInfo.size,
          used:  fsInfo.used,
				},
			};
		});
	}
}
