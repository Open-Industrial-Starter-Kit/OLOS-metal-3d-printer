<template>
  <div ref="slicingGraph" class="slicing-container row fit"></div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import { onMounted } from 'vue';

/**
 * Access the 3D slicing store which manages models,
 * slicing operations, and the slicing container.
 */
const slicingStore = use3DSlicingStore();

/**
 * Reactive reference to the slicing graph structure,
 * representing the relationships between layers/models.
 */
const { slicingGraph } = storeToRefs(slicingStore);

/**
 * Initialize the slicing container when the component is mounted.
 * This sets up the 3D scene and prepares it for adding models.
 */
onMounted(async () => {
  await slicingStore.createSlicingContainer();
});
</script>

<style scoped>
.slicing-container {
  background-color: #000;
  overflow: hidden;
}
</style>
