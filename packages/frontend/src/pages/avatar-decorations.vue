<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->
<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="900">
		<div class="_gaps">
			<MkFolder v-for="avatarDecoration in avatarDecorations" :key="avatarDecoration.id ?? avatarDecoration._id" :defaultOpen="avatarDecoration.id == null">
				<template #label>{{ avatarDecoration.name }}</template>
				<template #caption>{{ avatarDecoration.description }}</template>
				<div :class="$style.editorRoot">
					<div :class="$style.editorWrapper">
						<div :class="$style.preview">
							<div :class="[$style.previewItem, $style.light]">
								<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="[avatarDecoration]" forceShowDecoration/>
							</div>
							<div :class="[$style.previewItem, $style.dark]">
								<MkAvatar style="width: 60px; height: 60px;" :user="$i" :decorations="[avatarDecoration]" forceShowDecoration/>
							</div>
						</div>
						<div class="_gaps_m">
							<MkInput v-model="avatarDecoration.name">
								<template #label>{{ i18n.ts.name }}</template>
							</MkInput>
							<MkTextarea v-model="avatarDecoration.description">
								<template #label>{{ i18n.ts.description }}</template>
							</MkTextarea>
							<MkInput v-model="avatarDecoration.url">
								<template #label>{{ i18n.ts.imageUrl }}</template>
							</MkInput>
							<MkButton @click="addFile($event)"><i class="ti ti-upload"></i> {{ i18n.ts.selectFile }}</MkButton>
							<div class="_buttons">
								<MkButton inline primary @click="save(avatarDecoration)"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
								<MkButton v-if="avatarDecoration.id != null" inline danger @click="del(avatarDecoration)"><i class="ti ti-trash"></i> {{ i18n.ts.delete }}</MkButton>
							</div>
						</div>
					</div>
				</div>
			</MkFolder>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>
<script lang="ts" setup>
import { } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import MkFolder from '@/components/MkFolder.vue';
import { selectFile } from '@/scripts/select-file';
import copyToClipboard from '@/scripts/copy-to-clipboard';

let avatarDecorations: any[] = $ref([]);

function add(): void {
	avatarDecorations.unshift({
		_id: Math.random().toString(36),
		id: null,
		name: '',
		description: '',
		url: '',
	});
}

function del(avatarDecoration): void {
	os.confirm({
		type: 'warning',
		text: i18n.t('deleteAreYouSure', { x: avatarDecoration.name }),
	}).then(({ canceled }) => {
		if (canceled) return;
		avatarDecorations = avatarDecorations.filter(x => x !== avatarDecoration);
		os.api('admin/avatar-decorations/delete', avatarDecoration);
	});
}

async function save(avatarDecoration): Promise<void> {
	if (avatarDecoration.id == null) {
		await os.apiWithDialog('admin/avatar-decorations/create', avatarDecoration);
		load();
	} else {
		os.apiWithDialog('admin/avatar-decorations/update', avatarDecoration);
	}
}

function load(): void {
	os.api('admin/avatar-decorations/list').then(_avatarDecorations => {
		avatarDecorations = _avatarDecorations;
	});
}

const addFile = async (ev: MouseEvent): Promise<void> => {
	const file = await selectFile(ev.currentTarget ?? ev.target);
	copyToClipboard(file.url);
	os.toast(i18n.ts.urlCopiedToClipboard);
};

load();

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.add,
	handler: add,
}]);

const headerTabs = $computed(() => []);
definePageMetadata({
	title: i18n.ts.avatarDecorations,
	icon: 'ti ti-sparkles',
});
</script>

<style lang="scss" module>
.editorRoot {
	container: editor / inline-size;
}
.editorWrapper {
	display: grid;
	grid-template-columns: 1fr;
	grid-template-rows: auto auto;
	gap: var(--margin);
}
.preview {
	display: grid;
	place-items: center;
	grid-template-columns: 1fr 1fr;
	grid-template-rows: 1fr;
	gap: var(--margin);
}
.previewItem {
	width: 100%;
	height: 100%;
	min-height: 160px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--radius);
	&.light {
		background: #eee;
	}
	&.dark {
		background: #222;
	}
}
@container editor (min-width: 600px) {
	.editorWrapper {
		grid-template-columns: 200px 1fr;
		grid-template-rows: 1fr;
		gap: calc(var(--margin) * 2);
	}
	.preview {
		grid-template-columns: 1fr;
		grid-template-rows: 1fr 1fr;
	}
}
</style>
