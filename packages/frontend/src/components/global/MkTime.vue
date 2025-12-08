<template>
<time :title="absolute" :class="{ [$style.old1]: colored && (ago > 60 * 60 * 24 * 90), [$style.old2]: colored && (ago > 60 * 60 * 24 * 180) }">
	<template v-if="invalid">{{ i18n.ts._ago.invalid }}</template>
	<template v-else-if="mode === 'relative'">{{ relative }}</template>
	<template v-else-if="mode === 'absolute'">{{ absolute }}</template>
	<template v-else-if="mode === 'detail'">{{ absolute }} ({{ relative }})</template>
</time>
</template>

<script lang="ts" setup>
import { onUnmounted } from 'vue';
import { i18n } from '@/i18n';
import { dateTimeFormat } from '@/scripts/intl-const';

const props = withDefaults(defineProps<{
	time: Date | string | number | null;
	mode?: 'relative' | 'absolute' | 'detail';
	colored?: boolean;
}>(), {
	mode: 'relative',
});

const _time = props.time == null ? NaN :
	typeof props.time === 'number' ? props.time :
	(props.time instanceof Date ? props.time : new Date(props.time)).getTime();
const invalid = Number.isNaN(_time);
const absolute = !invalid ? dateTimeFormat.format(_time) : i18n.ts._ago.invalid;

let now = $ref((new Date()).getTime());
const relative = $computed<string>(() => {
	if (props.mode === 'absolute') return ''; // absoluteではrelativeを使わないので計算しない
	if (invalid) return i18n.ts._ago.invalid;
	const ago = (now - _time) / 1000/*ms*/;
	return (
		ago >= 31536000 ? i18n.t('_ago.yearsAgo', { n: Math.round(ago / 31536000).toString() }) :
		ago >= 2592000 ? i18n.t('_ago.monthsAgo', { n: Math.round(ago / 2592000).toString() }) :
		ago >= 604800 ? i18n.t('_ago.weeksAgo', { n: Math.round(ago / 604800).toString() }) :
		ago >= 86400 ? i18n.t('_ago.daysAgo', { n: Math.round(ago / 86400).toString() }) :
		ago >= 3600 ? i18n.t('_ago.hoursAgo', { n: Math.round(ago / 3600).toString() }) :
		ago >= 60 ? i18n.t('_ago.minutesAgo', { n: (~~(ago / 60)).toString() }) :
		ago >= 10 ? i18n.t('_ago.secondsAgo', { n: (~~(ago % 60)).toString() }) :
		ago >= -3 ? i18n.ts._ago.justNow :
		ago < -31536000 ? i18n.t('_timeIn.years', { n: Math.round(-ago / 31536000).toString() }) :
		ago < -2592000 ? i18n.t('_timeIn.months', { n: Math.round(-ago / 2592000).toString() }) :
		ago < -604800 ? i18n.t('_timeIn.weeks', { n: Math.round(-ago / 604800).toString() }) :
		ago < -86400 ? i18n.t('_timeIn.days', { n: Math.round(-ago / 86400).toString() }) :
		ago < -3600 ? i18n.t('_timeIn.hours', { n: Math.round(-ago / 3600).toString() }) :
		ago < -60 ? i18n.t('_timeIn.minutes', { n: (~~(-ago / 60)).toString() }) :
		i18n.t('_timeIn.seconds', { n: (~~(-ago % 60)).toString() })
	);
});

let tickId: number;

function tick() : void {
	now = (new Date()).getTime();
	const ago = (now - _time) / 1000/*ms*/;
	const next = ago < 60 ? 10000 : ago < 300 ? 60000 : 300000;

	tickId = window.setTimeout(tick, next);
}

if (props.mode === 'relative' || props.mode === 'detail') {
	tick();

	onUnmounted(() => {
		window.clearTimeout(tickId);
	});
}
</script>

<style lang="scss" module>
.old1 {
	color: var(--warn);
}
.old1.old2 {
	color: var(--error);
}
</style>
