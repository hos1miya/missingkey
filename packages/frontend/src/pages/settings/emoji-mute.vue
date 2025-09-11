<template>
<div class="_gaps_m">
	<MkInfo>{{ i18n.ts._emojiMute.title }}</MkInfo>
	<MkTextarea v-model="emojiMutes">
		<template #label>{{ i18n.ts._emojiMute.heading }}</template>
		<template #caption>{{ i18n.ts._emojiMute.description }}<br>{{ i18n.ts._emojiMute.description2 }}</template>
	</MkTextarea>
	<MkButton primary :disabled="!changed" @click="save()"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
</div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const emojiMutes = ref($i!.mutedEmojis.join('\n'));
const changed = ref(false);

async function save() {
	let mutes = emojiMutes.value
		.trim().split('\n')
		.map(el => el.trim())
		.filter(el => el);

	await os.api('i/update', {
		mutedEmojis: mutes,
	});

	changed.value = false;

	// Refresh filtered list to signal to the user how they've been saved
	emojiMutes.value = mutes.join('\n');
}

watch(emojiMutes, () => {
	changed.value = true;
});

definePageMetadata({
	title: i18n.ts.emojiMute,
	icon: 'ti ti-planet-off',
});
</script>
