<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl">
	<MkLoading v-if="fetching"/>
	<div v-else>
		<canvas ref="chartEl"></canvas>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onMounted, nextTick } from 'vue';
import { Chart } from 'chart.js';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { useChartTooltip } from '@/scripts/use-chart-tooltip';
import { alpha } from '@/scripts/color';
import { initChart } from '@/scripts/init-chart';

initChart();

const rootEl = $shallowRef<HTMLDivElement>(null);
const chartEl = $shallowRef<HTMLCanvasElement>(null);
let chartInstance: Chart | null = null;
let fetching = $ref(true);

const { handler: externalTooltipHandler } = useChartTooltip({
	position: 'middle',
});

async function renderChart(): Promise<void> {
	if (chartInstance) {
		chartInstance.destroy();
	}

	const wide = rootEl.offsetWidth > 600;
	const narrow = rootEl.offsetWidth < 400;

	const maxDays = wide ? 10 : narrow ? 5 : 7;

	let raw = await os.api('retention', { });

	raw = raw.slice(0, maxDays + 1);

	const data: {
		x: number;
		y: string;
		v: number;
	}[] = [];

	for (const record of raw) {
		data.push({
			x: 0,
			y: record.createdAt,
			v: record.users,
		});

		let i = 1;
		for (const date of Object.keys(record.data).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())) {
			data.push({
				x: i,
				y: record.createdAt,
				v: record.data[date],
			});
			i++;
		}
	}

	fetching = false;

	await nextTick();

	const color = defaultStore.state.darkMode ? '#b4e900' : '#86b300';

	const getYYYYMMDD = (date: Date) => {
		const y = date.getFullYear().toString().padStart(2, '0');
		const m = (date.getMonth() + 1).toString().padStart(2, '0');
		const d = date.getDate().toString().padStart(2, '0');
		return `${y}/${m}/${d}`;
	};

	// 視覚上の分かりやすさのため上から最も大きい3つの値の平均を最大値とする
	//const max = raw.readWrite.slice().sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0) / 3;
	const max = (createdAt: string) => raw.find(x => x.createdAt === createdAt)!.users;

	const marginEachCell = 12;

	chartInstance = new Chart(chartEl, {
		type: 'matrix',
		data: {
			datasets: [{
				label: 'Active',
				data: data as any,
				borderWidth: 0,
				borderRadius: 3,
				backgroundColor(c) {
					const v = c.dataset.data[c.dataIndex] as unknown as typeof data[0];
					const value = v.v;
					const m = max(v.y);
					if (m === 0) {
						return alpha(color, 0);
					} else {
						const a = value / m;
						return alpha(color, a);
					}
				},
				width(c) {
					const a = c.chart.chartArea ?? {};
					return (a.right - a.left) / maxDays - marginEachCell;
				},
				height(c) {
					const a = c.chart.chartArea ?? {};
					return (a.bottom - a.top) / maxDays - (marginEachCell / 1.5);
				},
			}],
		},
		options: {
			aspectRatio: wide ? 2 : narrow ? 2 : 2,
			layout: {
				padding: {
					left: 8,
					right: 0,
					top: 0,
					bottom: 0,
				},
			},
			scales: {
				x: {
					position: 'top',
					suggestedMax: maxDays,
					grid: {
						display: false,
					},
					ticks: {
						display: true,
						padding: 0,
						maxRotation: 0,
						autoSkipPadding: 0,
						autoSkip: false,
						callback: (value, index, values) => value,
					},
				},
				y: {
					type: 'time',
					offset: true,
					reverse: true,
					position: 'left',
					time: {
						unit: 'day',
						round: 'day',
					},
					grid: {
						display: false,
					},
					ticks: {
						maxRotation: 0,
						autoSkip: true,
						padding: 1,
						font: {
							size: 9,
						},
					},
				},
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					enabled: false,
					callbacks: {
						title(context) {
							const v = context[0].dataset.data[context[0].dataIndex];
							return getYYYYMMDD(new Date(new Date(v.y).getTime() + (v.x * 86400000)));
						},
						label(context) {
							const v = context.dataset.data[context.dataIndex] as unknown as typeof data[0];
							const m = max(v.y);
							if (m === 0) {
								return [`Active: ${v.v} (-%)`];
							} else {
								return [`Active: ${v.v} (${Math.round((v.v / m) * 100)}%)`];
							}
						},
					},
					//mode: 'index',
					animation: {
						duration: 0,
					},
					external: externalTooltipHandler,
				},
			},
		},
	});
}

onMounted(async () => {
	renderChart();
});
</script>
