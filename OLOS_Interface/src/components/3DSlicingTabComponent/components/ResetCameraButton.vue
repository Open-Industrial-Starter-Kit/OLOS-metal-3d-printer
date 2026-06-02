<template>
  <q-btn
    icon="cameraswitch"
    size="lg"
    color="white"
    class="reset-camera"
    flat
    @click="slicingStore.resetSlicingContainerControls"
  />
</template>
<script setup lang="ts">
import { use3DSlicingStore } from 'src/stores/3d-slicing';

/**
 * 3D Slicing store manages scene objects, helpers, and model interactions.
 */
const slicingStore = use3DSlicingStore();
</script>
<style lang="scss">
.reset-camera {
  position: absolute;
  top: 8vh;
  right: 0.3vw;
}
</style>
