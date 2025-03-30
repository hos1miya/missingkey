/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import * as cheerio from 'cheerio';
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

type InfoData = {
	line: string;
	status: string;
	detail: string;
}[];

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		private httpRequestService: HttpRequestService,
	) {
		super(meta, paramDef, async (ps) => {
			const keyName = `traininformation:${ps.area}`;
			const savedData = await this.redisClient.get(keyName);
			const savedSuperData = await this.redisClient.get('traininformation:shinkansen');

			const time = Date.now();
			const jstHour = new Date(time).getHours();
			const isSuperOperatingTime = jstHour >= 5 && jstHour <= 24;

			if (savedData) {
				const parsedData = JSON.parse(savedData);

				// 取得から5分経っていなければ保存されているデータをreturn
				if (parsedData.time > Date.now() - 1000 * 60 * 5) {
					if (savedSuperData && isSuperOperatingTime) { // 新幹線情報があり5時～24時であれば追加
						return [...parsedData.data, ...JSON.parse(savedSuperData).data];
					} else {
						return parsedData.data;
					}
				}
			}

			/*
			// 在来線
			*/

			// HTML取得
			const url = `https://transit.yahoo.co.jp/diainfo/area/${ps.area}`;
			const res = await this.httpRequestService.getHtml(url);

			// アラート抜き出し
			const $ = cheerio.load(res);
			const rows = $('#mdStatusTroubleLine tr');
			const alertRows = rows.filter((i, row) => $(row).find('.icnAlert').length > 0);
				
			// 配列に整形
			let extractedData: InfoData = alertRows.map((i, row) => {
				// <td>のセルを取得
				const cells = $(row).find('td');
				// 路線
				const line = cells.eq(0).find('a').text().trim() ?? '';
				// 状態
				const status = cells.eq(1).find('.colTrouble').text().trim() ?? '';
				// 詳細
				const detail = cells.eq(2).text().trim() ?? '';
				return { line, status, detail };
			}).get();

			// 配列に変換
			extractedData = Array.from(new Map(extractedData.map(item => [item.line, item])).values());

			// 保存
			this.redisClient.set(keyName, JSON.stringify({
				time: time,
				data: extractedData,
			}));
			
			/*
			// 新幹線
			*/

			// 5時～24時以外は在来線のみreturnして以下は処理しない
			if (!isSuperOperatingTime) {
				return extractedData;
			}

			// 取得から5分経っていなければ保存されているデータをreturn
			if (savedSuperData && JSON.parse(savedSuperData).time > Date.now() - 1000 * 60 * 5) {
				return [...extractedData, ...JSON.parse(savedSuperData).data];
			}

			// トップページHTML取得
			const urlSuper = 'https://transit.yahoo.co.jp/diainfo';
			const resSuper = await this.httpRequestService.getHtml(urlSuper);
			const $Super = cheerio.load(resSuper);
			const result: string[] = [];

			// "新幹線" の th を持つ tr を探し、 td を取得
			$Super('tr').each((_, tr) => {
				const th = $Super(tr).find('th');
				if (th.text().includes('新幹線')) {
					const td = $Super(tr).find('td');

					// td 内で icnAlert を含む li の中の a を取得
					td.find('li').each((_, li) => {
						if ($Super(li).find('.icnAlert').length > 0) {
							const linkText = $Super(li).find('a').text().trim();
							// 配列に追加
							if (linkText) result.push(linkText);
						}
					});
				}
			});

			// 名前とアドレスの対応
			const superPages: Map<string, number> = new Map([
				['北海道新幹線', 637],
				['東北新幹線', 1],
				['秋田新幹線', 6],
				['山形新幹線', 5],
				['上越新幹線', 3],
				['北陸新幹線', 624],
				['東海道新幹線', 7],
				['山陽新幹線', 8],
				['九州新幹線', 410],
				['西九州新幹線', 640],
			]);

			// アラートがある路線ごとに処理
			const extractedSuperData: InfoData = [];
			for (const routeName of result) {
				// HTML取得
				const routeId = superPages.get(routeName);
				if (!routeId) continue; // IDがない場合はスキップ
				const routeUrl = `https://transit.yahoo.co.jp/diainfo/${routeId}/0`;
				const routeHtml = await this.httpRequestService.getHtml(routeUrl);
				const $Route = cheerio.load(routeHtml);

				// 抽出
				const dt = $Route('dt:has(.icnAlertLarge)');
				if (dt.length) {
					// `dt` のテキストを取得（`span` を除外するために `.text()` を使用）
					const dtText = dt.contents().not('span').text().trim();

					// `dt` の次の `dd` を取得
					const dd = dt.next('dd');

					// `span` を削除してからテキストを取得
					dd.find('span').remove();
					const ddText = dd.text().trim();
					
					extractedSuperData.push({
						line: routeName,
						status: dtText,
						detail: ddText,
					});
				}
			}

			// 保存
			this.redisClient.set('traininformation:shinkansen', JSON.stringify({
				time: time,
				data: extractedSuperData,
			}));

			return [...extractedData, ...extractedSuperData];
		});
	}
}
