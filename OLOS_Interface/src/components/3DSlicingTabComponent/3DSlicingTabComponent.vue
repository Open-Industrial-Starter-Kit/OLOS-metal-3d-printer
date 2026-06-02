<template>
  <q-card class="row" flat style="height: 100vh">
    <main-tools-bar key="mainToolsBar" />
    <model-tools-bar key="modelToolsBar" />
    <slicing-container key="slicingContainer" />
    <uploaded-objects-list key="uploadedObjectsList" />
    <outside-platform-error-box
      v-if="isModelOutsidePlatform"
      key="outsidePlatformErrorBox"
    />
    <reset-camera-button key="resetCameraButton" />
    <q-inner-loading :showing="isModelLoading || isSlicingProcess">
      <q-spinner-gears size="100" :color="colorTheme" />
    </q-inner-loading>
  </q-card>
  <slice-models-box key="sliceModelsBox" />
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import SlicingContainer from 'src/components/3DSlicingTabComponent/components/SlicingContainer.vue';
import MainToolsBar from 'src/components/3DSlicingTabComponent/components/MainToolsBar/MainToolsBar.vue';
import ModelToolsBar from 'src/components/3DSlicingTabComponent/components/ModelToolsBar.vue';
import UploadedObjectsList from 'src/components/3DSlicingTabComponent/components/UploadedObjectsList.vue';
import SliceModelsBox from 'src/components/3DSlicingTabComponent/components/SliceModelsBox.vue';
import OutsidePlatformErrorBox from 'src/components/3DSlicingTabComponent/components/OutsidePlatformErrorBox.vue';
import ResetCameraButton from 'src/components/3DSlicingTabComponent/components/ResetCameraButton.vue';
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import { onUnmounted } from 'vue';
import { useSliceInfoStore } from 'src/stores/slice-info';

/**
 * Access the 3D slicing store, which manages uploaded models,
 * the selected model, and UI-related state.
 */
const slicingStore = use3DSlicingStore();

/**
 * Access the slice info store, which tracks the slicing process state.
 */
const sliceInfoStore = useSliceInfoStore();

/**
 * Reactive references from the stores:
 *
 * - selectedModel: the currently selected 3D model.
 * - isModelOutsidePlatform: whether the selected model exceeds platform bounds.
 * - isModelLoading: whether a model is currently loading.
 * - colorTheme: current UI color theme.
 * - isSlicingProcess: whether a slicing operation is currently running.
 */
const { selectedModel, isModelOutsidePlatform, isModelLoading, colorTheme } =
  storeToRefs(slicingStore);
const { isSlicingProcess } = storeToRefs(sliceInfoStore);

/**
 * Clean up the selected model when the component is unmounted.
 * This ensures no model remains selected when leaving the view.
 */
onUnmounted(() => {
  if (selectedModel.value) {
    slicingStore.resetSelectedModel();
  }
});
</script>
