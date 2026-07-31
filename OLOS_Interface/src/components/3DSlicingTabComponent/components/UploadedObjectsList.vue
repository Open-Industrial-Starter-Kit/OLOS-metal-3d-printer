<template>
  <q-expansion-item
    v-if="!isSlicingContainerEmpty && isModelsListVisible"
    default-opened
    dense
    icon="view_in_ar"
    label="Models"
    class="models-list no-border-radius"
    header-class="sticky-header"
  >
    <q-list
      v-for="model in uploadedModels"
      :key="model.object.userData.id"
    >
      <q-item
        clickable
        :active="selectedModel.object?.userData.id === model.object.userData.id"
        @click="slicingStore.setNewSelectedModel(model.object.userData.id)"
      >
        <q-item-section>
          {{ model.object.name }}
        </q-item-section>
      </q-item>
    </q-list>
  </q-expansion-item>
</template>
<script setup lang="ts">
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import { storeToRefs } from 'pinia';

/**
 * Access the 3D slicing store, which manages uploaded models,
 * selected model, and the overall slicing container state.
 */
const slicingStore = use3DSlicingStore();

/**
 * Reactive references to store state:
 *
 * - selectedModel: the currently selected 3D model in the scene.
 * - uploadedModels: list of all models uploaded into the slicing container.
 * - isSlicingContainerEmpty: boolean indicating whether the slicing container has any models.
 * - isModelsListVisible: boolean controlling the visibility of the models list UI.
 */
const {
  selectedModel,
  uploadedModels,
  isSlicingContainerEmpty,
  isModelsListVisible,
} = storeToRefs(slicingStore);
</script>

<style lang="scss">
.sticky-header {
  position: sticky;
  top: 0;
  background: white;
}
.models-list {
  position: absolute;
  top: 8vh;
  left: 0.5vw;
  width: 170px;
  max-height: 25vh;
  background-color: #fff;
  border-radius: 10px;
  overflow: auto;
}
</style>
