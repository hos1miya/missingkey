<template>
<div>
	<Transition
		:enter-active-class="$store.state.animation ? $style.transition_toast_enterActive : ''"
		:leave-active-class="$store.state.animation ? $style.transition_toast_leaveActive : ''"
		:enter-from-class="$store.state.animation ? $style.transition_toast_enterFrom : ''"
		:leave-to-class="$store.state.animation ? $style.transition_toast_leaveTo : ''"
		appear @after-leave="emit('closed')"
	>
		<div v-if="showing" class="_acrylic" :class="$style.root" :style="{ zIndex }">
			<div style="padding: 16px 24px;">
				<Mfm :text="message"/>
			</div>
		</div>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as os from '@/os';

const props = withDefaults(defineProps<{
	message: string;
	timeout?: number;
}>(), {
	timeout: 4000,
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const zIndex = os.claimZIndex('high');
let showing = $ref(true);

onMounted(() => {
	window.setTimeout(() => {
		showing = false;
	}, props.timeout);
});
</script>

<style lang="scss" module>
.transition_toast_enterActive,
.transition_toast_leaveActive {
	transition: opacity 0.3s, transform 0.3s !important;
}
.transition_toast_enterFrom,
.transition_toast_leaveTo {
	opacity: 0;
	transform: translateY(-100%);
}

.root {
	position: fixed;
	left: 0;
	right: 0;
	top: 0;
	margin: 0 auto;
	margin-top: 16px;
	min-width: 300px;
	max-width: calc(100% - 32px);
	width: min-content;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
	border-radius: 8px;
	overflow: clip;
	text-align: center;
	pointer-events: none;
}
</style>
