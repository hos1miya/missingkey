<template>
<span v-if="errored">:{{ customEmojiName }}:</span>
<img v-else ref="customEmojiRef" :class="[$style.root, { [$style.normal]: normal, [$style.noStyle]: noStyle }]" :src="url" :alt="alt" :title="alt" decoding="async" @error="errored = true" @load="errored = false"/>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { getStaticImageUrl } from '@/scripts/media-proxy';
import { defaultStore } from '@/store';
import { customEmojis } from '@/custom-emojis';
import { useTooltip } from '@/scripts/use-tooltip';
import * as os from '@/os';

const props = defineProps<{
	name: string;
	normal?: boolean;
	noStyle?: boolean;
	host?: string | null;
	url?: string;
}>();

const customEmojiRef = ref(null);

const customEmojiName = computed(() => (props.name[0] === ':' ? props.name.substr(1, props.name.length - 2) : props.name).replace('@.', ''));

const rawUrl = computed(() => {
	if (props.url) {
		return props.url;
	}
	if (props.host == null && !customEmojiName.value.includes('@')) {
		return customEmojis.value.find(x => x.name === customEmojiName.value)?.url ?? null;
	}
	return props.host ? `/emoji/${customEmojiName.value}@${props.host}.webp` : `/emoji/${customEmojiName.value}.webp`;
});

const url = computed(() =>
	defaultStore.reactiveState.disableShowingAnimatedImages.value && rawUrl.value
		? getStaticImageUrl(rawUrl.value)
		: rawUrl.value,
);

const alt = computed(() => `:${customEmojiName.value}:`);
let errored = $ref(url.value == null);

useTooltip(customEmojiRef, () => {
	os.toastShort(props.host ? `${customEmojiName.value}@${props.host}` : `${customEmojiName.value}`);
});
</script>

<style lang="scss" module>
.root {
	height: 2em;
	vertical-align: middle;
	transition: transform 0.2s ease;

	&:hover {
		transform: scale(1.2);
	}
}

.normal {
	height: 1.25em;
	vertical-align: -0.25em;

	&:hover {
		transform: none;
	}
}

.noStyle {
	height: auto !important;
}
</style>
