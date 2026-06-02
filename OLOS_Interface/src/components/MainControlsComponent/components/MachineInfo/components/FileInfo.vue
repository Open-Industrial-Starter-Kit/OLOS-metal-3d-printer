<template>
  <div class="column q-gutter-y-md sub-text-size">
    <div class="row items-center justify-between">
      <span>Job name:</span>
      <span class="text-bold">{{ fileData.fileName }}</span>
    </div>

    <div
      v-if="config?.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER"
      class="row items-center justify-between"
    >
      <span>Material(s):</span>
      <div class="row items-end q-gutter-x-sm">
        <span>{{ fileData.materialName }}</span>
        <img
          v-if="fileData.materialImage"
          :src="fileData.materialImage"
          class="material-img"
          alt="material image"
        />
      </div>
    </div>

    <div
      v-if="config?.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER"
      class="row items-center justify-between"
    >
      <span>Thickness(es):</span>
      <span>{{ fileData.materialThickness }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useJobsFilesManagementStore } from 'src/stores/jobs-files-management';
import { Config } from 'src/interfaces/configSettings.interface';
import { Constants } from 'src/constants';

/**
 * Defines the props for the component.
 * @property {Config | null} config - The machine's configuration settings.
 */
defineProps<{
  config: Config | null;
}>();

// Access the Pinia store for job and file management.
const filesManagerStore = useJobsFilesManagementStore();
/**
 * Destructures the `fileData` state from the store to make it reactive.
 */
const { fileData } = storeToRefs(filesManagerStore);
</script>
<style scoped>
.material-img {
  border: solid rgb(218, 215, 215) 2px;
  border-radius: 5px;
  max-width: 3vw;
  max-height: 3vw;
}
</style>
