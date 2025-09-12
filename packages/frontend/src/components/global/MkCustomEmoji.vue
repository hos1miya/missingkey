<template>
<img v-if="errored" ref="customEmojiRef" :class="[$style.root, { [$style.normal]: normal, [$style.noStyle]: noStyle }]" :src="emojiErrorImageUrl" :alt="alt" :title="alt" decoding="async" @contextmenu.stop="onContextmenu"/>
<img v-else ref="customEmojiRef" :class="[$style.root, { [$style.normal]: normal, [$style.noStyle]: noStyle }]" :src="url ?? undefined" :alt="alt" :title="alt" decoding="async" @error="errored = true" @load="errored = false" @contextmenu.stop="onContextmenu"/>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { getStaticImageUrl } from '@/scripts/media-proxy';
import { defaultStore } from '@/store';
import { customEmojis } from '@/custom-emojis';
import { emojiErrorImageUrl } from '@/instance';
import * as os from '@/os';
import { getEmojiMenu } from '@/scripts/get-emoji-menu';
import { $i } from '@/account';

const props = defineProps<{
	name: string;
	normal?: boolean;
	noStyle?: boolean;
	host?: string | null;
	url?: string;
}>();

const customEmojiRef = ref(null);

const customEmojiName = computed(() => (props.name[0] === ':' ? props.name.substr(1, props.name.length - 2) : props.name).replace('@.', ''));
const customEmojiNameWithHost = computed(() => props.host ? `${customEmojiName.value}@${props.host}` : `${customEmojiName.value}`);

const rawUrl = computed(() => {
	if (props.url) {
		return props.url;
	}
	if (props.host == null && !customEmojiName.value.includes('@')) {
		return customEmojis.value.find(x => x.name === customEmojiName.value)?.url ?? null;
	}
	return `/emoji/${customEmojiNameWithHost.value}.webp`;
});

const url = computed(() =>
	defaultStore.reactiveState.disableShowingAnimatedImages.value && rawUrl.value
		? getStaticImageUrl(rawUrl.value)
		: rawUrl.value,
);

const alt = computed(() => `:${customEmojiName.value}:`);
const errored = ref(url.value == null || ($i ? $i.mutedEmojis.indexOf(customEmojiNameWithHost.value) !== -1 : false));

function onContextmenu(ev: MouseEvent): void {
	os.contextMenu(getEmojiMenu({ emojiName: customEmojiNameWithHost.value, hide: errored }), ev).then(focus);
}
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
