<template>
  <q-btn-dropdown
    title="View"
    label="View"
    no-caps
    menu-anchor="bottom left"
    menu-self="top start"
    flat
    dropdown-icon="none"
  >
    <q-list>
      <q-item clickable @click="handleGridHelper">
        <q-item-section class="col-2">
          <q-icon v-if="isGridHelperVisible" name="check" size="xs" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Grid</q-item-label>
        </q-item-section>
      </q-item>
      <q-item clickable @click="handleModelsList">
        <q-item-section class="col-2">
          <q-icon v-if="isModelsListVisible" name="check" size="xs" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Models List</q-item-label>
        </q-item-section>
      </q-item>
      <q-item clickable @click="handleViewerHelper">
        <q-item-section class="col-2">
          <q-icon v-if="isViewerHelperVisible" name="check" size="xs" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Viewer Helper</q-item-label>
        </q-item-section>
      </q-item>
      <q-item clickable @click="handleDirectionalLightHelper">
        <q-item-section class="col-2">
          <q-icon
            v-if="isDirectionalLightHelperVisible"
            name="check"
            size="xs"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Directional Light</q-item-label>
        </q-item-section>
      </q-item>
      <q-item clickable @click="handleAmbientLightHelper">
        <q-item-section class="col-2">
          <q-icon v-if="isAmbientLightHelperVisible" name="check" size="xs" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Ambient Light</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator color="black" />

      <q-item
        clickable
        @click="handleTransformTools"
        :disable="!selectedModel.object"
      >
        <q-item-section class="col-2">
          <q-icon
            v-if="selectedModel.object?.userData.isTransformToolsVisible"
            name="check"
            size="xs"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Transform Tools</q-item-label>
        </q-item-section>
      </q-item>
      <q-item
        clickable
        @click="handleBoxHelper"
        :disable="!selectedModel.object"
      >
        <q-item-section class="col-2">
          <q-icon
            v-if="selectedModel.object?.userData.isBoxHelperVisible"
            name="check"
            size="xs"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Box Helper</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { use3DSlicingStore } from 'src/stores/3d-slicing';

/**
 * 3D Slicing store manages scene objects, helpers, and model interactions.
 */
const slicingStore = use3DSlicingStore();

/**
 * Reactive references for scene and model states
 */
const {
  selectedModel,
  isGridHelperVisible,
  isModelsListVisible,
  isViewerHelperVisible,
  isAmbientLightHelperVisible,
  isDirectionalLightHelperVisible,
} = storeToRefs(slicingStore);

/**
 * Toggles the visibility of the grid helper in the 3D scene.
 */
const handleGridHelper = () => {
  if (isGridHelperVisible.value) {
    slicingStore.removeGridHelper();
  } else {
    slicingStore.addGridHelper();
  }
  isGridHelperVisible.value = !isGridHelperVisible.value;
};

/**
 * Toggles the visibility of the models list UI panel.
 */
const handleModelsList = () => {
  isModelsListVisible.value = !isModelsListVisible.value;
};

/**
 * Toggles the visibility of the viewer helper in the 3D scene.
 */
const handleViewerHelper = () => {
  if (isViewerHelperVisible.value) {
    slicingStore.removeViewerHelper();
  } else {
    slicingStore.addViewerHelper();
  }
  isViewerHelperVisible.value = !isViewerHelperVisible.value;
};

/**
 * Toggles the visibility of the directional light helper.
 */
const handleDirectionalLightHelper = () => {
  if (isDirectionalLightHelperVisible.value) {
    slicingStore.removeDirectionalLightHelper();
  } else {
    slicingStore.addDirectionalLightHelper();
  }
  isDirectionalLightHelperVisible.value =
    !isDirectionalLightHelperVisible.value;
};

/**
 * Toggles the visibility of the ambient light helper.
 */
const handleAmbientLightHelper = () => {
  if (isAmbientLightHelperVisible.value) {
    slicingStore.removeAmbientLightHelper();
  } else {
    slicingStore.addAmbientLightHelper();
  }
  isAmbientLightHelperVisible.value = !isAmbientLightHelperVisible.value;
};

/**
 * Toggles transform tools (e.g., move/rotate/scale) for the selected model.
 */
const handleTransformTools = () => {
  if (!selectedModel.value.object) return;

  const isVisible = selectedModel.value.object.userData.isTransformToolsVisible;

  if (isVisible) {
    slicingStore.removeTransformTools();
  } else {
    slicingStore.addTransformTools();
  }

  selectedModel.value.object.userData.isTransformToolsVisible = !isVisible;
};

/**
 * Toggles box helper (bounding box) for the selected model.
 */
const handleBoxHelper = () => {
  if (!selectedModel.value.object) return;

  const isVisible = selectedModel.value.object.userData.isBoxHelperVisible;

  if (isVisible) {
    slicingStore.removeBoxHelper();
  } else {
    slicingStore.addBoxHelper();
  }

  selectedModel.value.object.userData.isBoxHelperVisible = !isVisible;
};
</script>
