<template>
<div>
	<div v-if="c.type === 'root'" :class="$style.root">
		<template v-for="child in c.children" :key="child">
			<MkAsUi v-if="!g(child).hidden" :component="g(child)" :components="props.components" :size="size"/>
		</template>
	</div>
	<span v-else-if="c.type === 'text'" :class="{ [$style.fontSerif]: c.font === 'serif', [$style.fontMonospace]: c.font === 'monospace' }" :style="{ fontSize: c.size ? `${c.size * 100}%` : null, fontWeight: c.bold ? 'bold' : null, color: c.color ?? null }">{{ c.text }}</span>
	<Mfm v-else-if="c.type === 'mfm'" :class="{ [$style.fontSerif]: c.font === 'serif', [$style.fontMonospace]: c.font === 'monospace' }" :style="{ fontSize: c.size ? `${c.size * 100}%` : null, fontWeight: c.bold ? 'bold' : null, color: c.color ?? null }" :text="c.text !== undefined ? c.text : ''"/>
	<MkButton v-else-if="c.type === 'button'" :primary="c.primary" :rounded="c.rounded" :disabled="c.disabled" :small="size === 'small'" inline @click="c.onClick">{{ c.text }}</MkButton>
	<div v-else-if="c.type === 'buttons'" class="_buttons" :style="{ justifyContent: align }">
		<MkButton v-for="button in c.buttons" :primary="button.primary" :rounded="button.rounded" :disabled="button.disabled" inline :small="size === 'small'" @click="button.onClick">{{ button.text }}</MkButton>
	</div>
	<MkSwitch v-else-if="c.type === 'switch'" :model-value="valueForSwitch" @update:model-value="onSwitchUpdate">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkSwitch>
	<MkTextarea v-else-if="c.type === 'textarea'" :model-value="c.default" @update:model-value="c.onInput">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkTextarea>
	<MkInput v-else-if="c.type === 'textInput'" :small="size === 'small'" :model-value="c.default !== undefined ? c.default : ''" @update:model-value="c.onInput">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkInput>
	<MkInput v-else-if="c.type === 'numberInput'" :small="size === 'small'" :model-value="c.default !== undefined ? c.default : ''" type="number" @update:model-value="c.onInput">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
	</MkInput>
	<MkSelect v-else-if="c.type === 'select'" :small="size === 'small'" :model-value="c.default !== undefined ? c.default : ''" @update:model-value="c.onChange">
		<template v-if="c.label" #label>{{ c.label }}</template>
		<template v-if="c.caption" #caption>{{ c.caption }}</template>
		<option v-for="item in c.items" :key="item.value" :value="item.value">{{ item.text }}</option>
	</MkSelect>
	<MkButton v-else-if="c.type === 'postFormButton'" :primary="c.primary" :rounded="c.rounded" :small="size === 'small'" inline @click="openPostForm">{{ c.text }}</MkButton>
	<div v-else-if="c.type === 'postForm'" :class="$style.postForm">
		<MkPostForm
			fixed
			:instant="true"
			:initialText="c.form?.text"
		/>
	</div>
	<MkFolder v-else-if="c.type === 'folder'" :default-open="c.opened !== undefined ? c.opened : false">
		<template #label>{{ c.title }}</template>
		<template v-for="child in c.children" :key="child">
			<MkAsUi v-if="!g(child).hidden" :component="g(child)" :components="props.components" :size="size"/>
		</template>
	</MkFolder>
	<div v-else-if="c.type === 'container'" :class="[$style.container, { [$style.fontSerif]: c.font === 'serif', [$style.fontMonospace]: c.font === 'monospace', [$style.containerCenter]: c.align === 'center' }]" :style="containerStyle">
		<template v-for="child in c.children" :key="child">
			<MkAsUi v-if="!g(child).hidden" :component="g(child)" :components="props.components" :size="size" :align="c.align"/>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, Ref } from 'vue';
import * as os from '@/os';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkSelect from '@/components/MkSelect.vue';
import { AsUiComponent } from '@/scripts/aiscript/ui';
import MkFolder from '@/components/MkFolder.vue';
import MkPostForm from '@/components/MkPostForm.vue';

const props = withDefaults(defineProps<{
	component: AsUiComponent;
	components: Ref<AsUiComponent>[];
	size: 'small' | 'medium' | 'large';
	align: 'left' | 'center' | 'right';
}>(), {
	size: 'medium',
	align: 'left',
});

const c = props.component;

function g(id) {
	return props.components.find(x => x.value.id === id).value;
}

const containerStyle = computed(() => {
	if (c.type !== 'container') return undefined;

	// width, color, styleのうち一つでも指定があれば、枠線がちゃんと表示されるようにwidthとstyleのデフォルト値を設定
	// radiusは単に角を丸める用途もあるため除外
	const isBordered = c.borderWidth ?? c.borderColor ?? c.borderStyle;

	const border = isBordered ? {
		borderWidth: c.borderWidth ?? '1px',
		borderColor: c.borderColor ?? 'var(--divider)',
		borderStyle: c.borderStyle ?? 'solid',
	} : undefined;

	return {
		textAlign: c.align,
		backgroundColor: c.bgColor,
		color: c.fgColor,
		padding: c.padding ? `${c.padding}px` : 0,
		borderRadius: (c.borderRadius ?? (c.rounded ? 8 : 0)) + 'px',
		...border,
	};
});

let valueForSwitch = $ref(c.default ?? false);

function onSwitchUpdate(v) {
	valueForSwitch = v;
	if (c.onChange) c.onChange(v);
}

function openPostForm() {
	os.post({
		initialText: c.form.text,
		instant: true,
	});
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.container {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.containerCenter {
	text-align: center;
}

.fontSerif {
	font-family: serif;
}

.fontMonospace {
	font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
}

.postForm {
background: var(--bg);
border-radius: 8px;
}
</style>
