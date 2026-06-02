<template>
  <q-btn-dropdown
    title="Add"
    label="Add"
    no-caps
    menu-anchor="bottom left"
    menu-self="top start"
    flat
    dropdown-icon="none"
  >
    <q-list
      v-for="(shape, index) in Constants.SLICING_MESH_SHAPES"
      :key="index"
    >
      <q-item clickable @click="handleAddNewMesh(shape)" v-close-popup>
        <q-item-label class="text-capitalize">{{ shape }}</q-item-label>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>
<script setup lang="ts">
import { Constants } from 'src/constants';
import { use3DSlicingStore } from 'src/stores/3d-slicing';

/**
 * Access the 3D slicing store, which manages models, meshes,
 * and slicing operations in the scene.
 */
const slicingStore = use3DSlicingStore();

/**
 * Adds a new mesh of a given shape to the scene.
 *
 * @param shape - The type of mesh shape to add (e.g., "cube", "sphere").
 *                The available shape options are typically defined in
 *                `Constants` for consistency.
 */
const handleAddNewMesh = (shape: string) => {
  slicingStore.addNewMesh(shape);
};
</script>
