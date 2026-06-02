<template>
  <q-dialog
    v-model="isAddNewMediaDialogShown"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card>
      <media-source-choices :media-type />
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import MediaSourceChoices from 'src/components/GcodeGeneratorTabComponent/components/components/MediaSourceChoices.vue';
import { storeToRefs } from 'pinia';
import { useMediaFilesManagementStore } from 'src/stores/media-files-management';

/**
 * Defines the props for the component.
 *
 * @property {string} mediaType - The type of media to be handled, used to
 * customize the media source options.
 */
defineProps<{
  mediaType: string;
}>();

// Access the Pinia store for media file management.
const mediaFilesManagementStore = useMediaFilesManagementStore();

/**
 * Destructures reactive properties from the store using `storeToRefs`.
 */
const { isAddNewMediaDialogShown } = storeToRefs(mediaFilesManagementStore);
</script>
