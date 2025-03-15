<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700" :margin-min="16" :margin-max="32">
		<FormSuspense :p="init">
			<div class="_gaps_m">
				<MkTextarea v-model="blockedHosts">
					<template #label>{{ i18n.ts.blockedInstances }}</template>
					<template #caption>{{ i18n.ts.blockedInstancesDescription }}</template>
				</MkTextarea>
				<MkTextarea v-model="blockedSoftwares">
					<template #label>{{ i18n.ts.blockedSoftwares }}</template>
					<template #caption>{{ i18n.ts.blockedSoftwaresDescription }}</template>
				</MkTextarea>
			</div>
		</FormSuspense>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XHeader from './_header_.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import FormSuspense from '@/components/form/suspense.vue';
import * as os from '@/os';
import { fetchInstance } from '@/instance';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let blockedHosts: string = $ref('');
let blockedSoftwares: string = $ref('');

async function init() {
	const meta = await os.api('admin/meta');
	blockedHosts = meta.blockedHosts.join('\n');
	blockedSoftwares = meta.blockedSoftwares.join('\n');
}

function save() {
	os.apiWithDialog('admin/update-meta', {
		blockedHosts: blockedHosts.split('\n') || [],
		blockedSoftwares: blockedSoftwares.split('\n') || [],
	}).then(() => {
		fetchInstance();
	});
}

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'ti ti-check',
	text: i18n.ts.save,
	handler: save,
}]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.instanceBlocking,
	icon: 'ti ti-ban',
});
</script>
