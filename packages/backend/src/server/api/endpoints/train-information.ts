import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	allowGet: true,
	cacheSec: 60 * 5,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				line: {
					type: 'string',
					optional: false, nullable: false,
					example: 'Example Line',
				},
				status: {
					type: 'string',
					optional: false, nullable: false,
					example: 'Delay, Operation suspend, etc...',
				},
				detail: {
					type: 'string',
					optional: false, nullable: false,
					example: 'Animal on rails, etc...',
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		area: { type: 'number' },
	},
	required: ['area'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		private httpRequestService: HttpRequestService,
	) {
		super(meta, paramDef, async (ps) => {
			const keyName = `traininformation:${ps.area}`;

			const savedData = await this.redisClient.get(keyName);
			if (savedData) {
				const parsedData = JSON.parse(savedData);
				if (parsedData.time > Date.now() - 1000 * 60 * 5) {
					// 取得から5分経っていなければ保存されたデータをreturn
					const cachedData = parsedData.data;
					return cachedData;
				}
			}

			// HTML取得
			const url = `https://transit.yahoo.co.jp/diainfo/area/${ps.area}`;
			const res = await this.httpRequestService.getHtml(url);

			// アラート抜き出し
			const parser = new DOMParser();
			const doc = parser.parseFromString(res, 'text/html');
			const rows = Array.from(doc.querySelectorAll('tr'));
			const alertRows = rows.filter(row => row.querySelector('.icnAlert') !== null);

			// 配列に整形
			const extractedData = alertRows.map(row => {
				const cells = row.querySelectorAll('td');
				// 路線
				const line = cells[0].querySelector('a')?.textContent?.trim() ?? '';
				// 状態
				const status = cells[1].querySelector('.colTrouble')?.textContent?.trim() ?? '';
				// 詳細
				const detail = cells[2].textContent?.trim() ?? '';

				return { line, status, detail };
			});

			const time = Date.now();

			// 保存
			this.redisClient.set(keyName, JSON.stringify({
				time: time,
				data: extractedData,
			}));

			return extractedData;
		});
	}
}
