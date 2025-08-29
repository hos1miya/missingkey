<template>
<MkWindow
	ref="window"
	:initial-width="800"
	:initial-height="500"
	:can-resize="true"
	@closed="emit('closed')"
>
	<template #header>
		{{ i18n.ts.drive }}
	</template>
	<XDrive :initial-folder="initialFolder"/>
</MkWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Pleaides from 'pleaides-lib';
import XDrive from '@/components/MkDrive.vue';
import MkWindow from '@/components/MkWindow.vue';
import { i18n } from '@/i18n';

defineProps<{
	initialFolder?: Pleaides.entities.DriveFolder;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();
</script>
