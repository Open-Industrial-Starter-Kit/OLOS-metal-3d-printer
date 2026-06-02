<template>
  <div
    class="column col-lg-2 col-md-2 col-sm-2 col-xs-12 q-gutter-sm items-center q-py-lg"
  >
    <q-btn
      label="Z"
      icon="arrow_drop_up"
      stack
      color="white"
      text-color="blue-grey-10"
      class="button-size"
      push
      @click="jogControlsStore.XYZJog(0, 0, -zJogStep, zJogSpeed)"
      :disable="isDisabled"
    />

    <div class="button-size" />

    <q-btn
      stack
      color="white"
      text-color="blue-grey-10"
      class="button-size"
      push
      @click="jogControlsStore.XYZJog(0, 0, zJogStep, zJogSpeed)"
      :disable="isDisabled"
    >
      <span>Z</span>
      <q-icon name="arrow_drop_down" />
    </q-btn>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useJogControlsStore } from 'src/stores/jog-controls';

/**
 * Props:
 * - isDisabled: boolean — Disables jog controls when true.
 */
defineProps<{
  isDisabled: boolean;
}>();

// Access the jog controls store
const jogControlsStore = useJogControlsStore();

// Extract Z-axis jog step and speed as reactive references
const { zJogStep, zJogSpeed } = storeToRefs(jogControlsStore);
</script>
<style scoped>
.button-size {
  font-size: 1.5vh;
  width: 7vh;
  height: 7vh;

  i {
    padding: 0;
    margin: -5;
  }
}
</style>
