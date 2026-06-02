<template>
  <q-item-label class="text-bold"><u>Printing Configurations:</u></q-item-label>
  <slic3r-settings
    v-if="selectedSlicerLib === Constants.SLICING_LIBRARIES.SLIC3R"
  />
  <prusa-settings
    v-if="selectedSlicerLib === Constants.SLICING_LIBRARIES.PRUSA_SLICER"
  />
  <pyslm-settings
    v-if="selectedSlicerLib === Constants.SLICING_LIBRARIES.PYSLM"
  />
</template>
<script setup lang="ts">
import { Constants } from 'src/constants';
import Slic3rSettings from 'src/components/3DSlicingTabComponent/components/MainToolsBar/components/components/PrintingConfigurations/components/Slic3rSettings.vue';
import prusaSettings from 'src/components/3DSlicingTabComponent/components/MainToolsBar/components/components/PrintingConfigurations/components/prusaSettings.vue';
import PyslmSettings from 'src/components/3DSlicingTabComponent/components/MainToolsBar/components/components/PrintingConfigurations/components/PyslmSettings.vue';
import { storeToRefs } from 'pinia';
import { use3DSlicingStore } from 'src/stores/3d-slicing';

/**
 * Access the 3D slicing store to manage slicing-related settings.
 */
const slicerStore = use3DSlicingStore();
/**
 * Get the slicing library type.
 */
const { selectedSlicerLib } = storeToRefs(slicerStore);
</script>
