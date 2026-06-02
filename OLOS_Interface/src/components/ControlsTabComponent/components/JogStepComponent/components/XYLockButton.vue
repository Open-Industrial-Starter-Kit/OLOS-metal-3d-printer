<template>
  <!-- Lock Button -->
  <q-btn
    :icon="isXYLocked ? 'lock_open' : 'lock'"
    text-color="black"
    class="self-start bg-white q-pa-xs lock-margin"
    color="bg-white"
    outline
    push
    size="1.3vh"
    :disable="isDisabled"
    @click="jogControlsStore.changeXYLockStatus()"
  >
    <q-tooltip class="bg-black">{{
      isXYLocked ? 'Unlock XY' : 'Lock XY'
    }}</q-tooltip>
  </q-btn>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useJogControlsStore } from 'src/stores/jog-controls';
import { watch } from 'vue';

/**
 * Props:
 * - isDisabled: Whether jog controls should be disabled entirely (not directly used here,
 *               but may be relevant for parent component logic).
 */
defineProps<{
  isDisabled: boolean;
}>();

/**
 * Store bindings for reactive jog control state.
 */
const jogControlsStore = useJogControlsStore();
const { isXYLocked, xJogStep, yJogStep, xSliderValue, ySliderValue } =
  storeToRefs(jogControlsStore);

/**
 * Watch for changes in the X-axis jog step.
 * If XY lock is active, sync Y-axis jog step and slider value with X-axis values.
 */
watch(
  () => xJogStep.value,
  () => {
    if (isXYLocked.value) {
      ySliderValue.value = xSliderValue.value;
      yJogStep.value = xJogStep.value;
    }
  }
);
</script>
<style scoped>
.lock-margin {
  position: relative;
  top: 25%;
}
</style>
