<!--
SPDX-FileCopyrightText: hos1miya
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :show-header="true" class="mkw-traininformations data-cy-mkw-traininformations">
	<template #icon><i class="ti ti-train"></i></template>
	<template #header>{{ i18n.ts._widgets.trainInformation }} ({{ areaOptions.find(option => option.value === widgetProps.area as number)?.label }})</template>
	
	<div class="kjidhajs" :style="`height: ${widgetProps.height}px;`">
		<MkLoading v-if="fetching"/>
		<div v-else-if="(!alerts || alerts.length === 0) && widgetProps.showHeader" class="_fullinfo">
			<div>{{ i18n.ts._widgets._trainInformation.normal }}</div>
		</div>
		<div v-else class="alerts">
			<div v-for="alert in alerts" :key="alert.line">
				<div class="alert">
					<p class="title">{{ alert.line }}</p>
					<p class="detail" :style="alert.status.startsWith('運転見合わせ') ? 'color: red' : alert.status.startsWith('列車遅延') ? 'color: yellow' : undefined">{{ alert.status }}: {{ alert.detail }}</p>
				</div>
			</div>
			<div class="notice">
				<p>Source: <a href="https://transit.yahoo.co.jp/diainfo" target="_blank">Yahoo! Transit</a></p>
				<p>{{ i18n.ts._widgets._trainInformation.notice }}</p>
			</div>
		</div>
	</div>
</MkContainer>
</template>
	
<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentExpose } from './widget';
import { GetFormResultType } from '@/scripts/form';
import MkContainer from '@/components/MkContainer.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import { i18n } from '@/i18n';
	
const name = 'trainInformation';

const areaOptions = [
	{
		value: 2, label: '北海道',
	}, {
		value: 3, label: '東北',
	}, {
		value: 4, label: '関東',
	}, {
		value: 5, label: '中部',
	}, {
		value: 6, label: '近畿',
	}, {
		value: 8, label: '中国',
	}, {
		value: 9, label: '四国',
	}, {
		value: 7, label: '九州',
	}
];
	
const widgetPropsDef = {
	area: {
		type: 'radio' as const,
		default: 4,
		options: areaOptions,
	},
	height: {
		type: 'number' as const,
		default: 180,
	},
	showHeader: {
		type: 'boolean' as const,
		default: true,
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;
	
// 現時点ではvueの制限によりimportしたtypeをジェネリックに渡せない
//const props = defineProps<WidgetComponentProps<WidgetProps>>();
//const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const props = defineProps<{ widget?: Widget<WidgetProps>; }>();
const emit = defineEmits<{ (ev: 'updateProps', props: WidgetProps); }>(); // eslint-disable-line no-shadow

const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);
console.log('widgetProps:', widgetProps);
	
const alerts = ref<{ line: string; status: string; detail: string }[]>([]);
const fetching = ref(true);

const fetch = async() : Promise<void> => {
	try {
		const res = await os.api('train-information', { area: widgetProps.area as number });
		alerts.value = res;
	} catch (error) {
		alerts.value = [];
	} finally {
		fetching.value = false;
	}
};

watch(() => widgetProps.area, fetch);

useInterval(fetch, 1000 * 60, {
	immediate: true,
	afterMounted: true,
});
	
defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>
	
	<style lang="scss" scoped>
	.kjidhajs {
		overflow: auto;
	
		> .alerts {
	
			> div {
				display: flex;
				align-items: center;
				padding: 14px 16px;
				border-bottom: solid 0.5px var(--divider);
	
				> .alert {
					flex: 1;
					overflow: hidden;
					font-size: 0.9em;
					color: var(--fg);
	
					> .a {
						display: block;
						width: 100%;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
						line-height: 18px;
					}

					> p {
						margin: 0;
						opacity: 0.7;
						line-height: 16px;
					}
	
					> p.title {
						font-size: 100%;
					}
					
					> p.detail {
						padding: 4px 0;
						font-size: 80%;
					}
				}
			}
	
			> div.notice {
				display: block;
				font-size: 8px;
				opacity: .6;
				line-height: 10px;
				padding-top: 0;
				padding-bottom: 0;
			}
		}
	}
	</style>
