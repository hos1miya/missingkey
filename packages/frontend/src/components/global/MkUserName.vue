<template>
<Mfm :text="user.name ?? user.username" :author="user" :plain="true" :nowrap="nowrap" :emoji-urls="user.emojis"/>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as pleaides from 'pleaides-lib';

const props = withDefaults(defineProps<{
	user: pleaides.entities.User;
	nowrap?: boolean;
}>(), {
	nowrap: true,
});
</script>
