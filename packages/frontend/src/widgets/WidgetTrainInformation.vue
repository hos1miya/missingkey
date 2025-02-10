<template>
<MkContainer :show-header="true" class="mkw-trends data-cy-mkw-trends">
	<template #icon><i class="ti ti-hash"></i></template>
	<template #header>路線情報</template>
	
	<div class="wbrkwala">
		<MkLoading v-if="fetching"/>
		<TransitionGroup v-else tag="div" :name="$store.state.animation ? 'chart' : ''" class="tags">
			<div v-for="alert in alerts" :key="alert.line">
				<div class="tag">
					<p>{{ alert.line }} {{ alert.status }}</p>
					<p>{{ alert.detail }}</p>
				</div>
			</div>
			<div v-if="!alerts">
				<p>現在、遅延等の情報はありません</p>
			</div>
		</TransitionGroup>
	</div>
</MkContainer>
</template>
	
<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useWidgetPropsManager, Widget, WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget';
import { GetFormResultType } from '@/scripts/form';
import MkContainer from '@/components/MkContainer.vue';
import * as os from '@/os';
import { useInterval } from '@/scripts/use-interval';
import { i18n } from '@/i18n';
	
const name = 'traininformation';
	
const widgetPropsDef = {
	area: {
		type: 'radio' as const,
		default: 4,
		options: [{
			label: '北海道',
			value: 2,
		}, {
			label: '東北',
			value: 3,
		}, {
			label: '関東',
			value: 4,
		}, {
			label: '中部',
			value: 5,
		}, {
			label: '近畿',
			value: 6,
		}, {
			label: '中国',
			value: 8,
		}, {
			label: '四国',
			value: 9,
		}, {
			label: '九州',
			value: 7,
		}],
	},
};

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;
	
// 現時点ではvueの制限によりimportしたtypeをジェネリックに渡せない
//const props = defineProps<WidgetComponentProps<WidgetProps>>();
//const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();
const props = defineProps<{ widget?: Widget<WidgetProps>; }>();
const emit = defineEmits<{ (ev: 'updateProps', props: WidgetProps); }>();
	
const { widgetProps, configure } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);
	
let alerts = ref([]);
let fetching = ref(true);
	
const fetch = () => {
	const area = widgetProps.area;
	os.api('train-information', { area: area }).then(res => {
		alerts.value = res;
		fetching.value = false;
	});
};
	
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
	.wbrkwala {
		height: (62px + 1px) + (62px + 1px) + (62px + 1px) + (62px + 1px) + 62px;
		overflow: hidden;
	
		> .tags {
			.chart-move {
				transition: transform 1s ease;
			}
	
			> div {
				display: flex;
				align-items: center;
				padding: 14px 16px;
				border-bottom: solid 0.5px var(--divider);
	
				> .tag {
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
						font-size: 75%;
						opacity: 0.7;
						line-height: 16px;
					}
				}
	
				> .chart {
					height: 30px;
				}
			}
		}
	}
	</style>
