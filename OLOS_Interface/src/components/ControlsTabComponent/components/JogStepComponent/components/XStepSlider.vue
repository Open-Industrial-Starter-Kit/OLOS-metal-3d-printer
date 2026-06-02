<template>
  <div class="row full-width items-center">
    <span class="sub-text-size q-pr-md">X</span>

    <q-slider
      class="slider-width"
      v-model="xSliderValue"
      @change="jogControlsStore.setXJogStepSlider"
      markers
      :min="0"
      :max="3"
      thumb-size="2.5vh"
      :disable="isSliderDisabled()"
    />
    <div class="row col flex-center q-gutter-x-sm">
      <span class="sub-text-size text-bold">{{ xJogStep }} mm</span>
      <q-btn
        :icon="isCustomXStepValue ? 'close' : 'edit'"
        round
        outline
        size="1.3vh"
        @click="
          isCustomXStepValue ? clearXStepCustomValue() : openXCustomStepDialog()
        "
        :disable="isDisabled"
      />
    </div>
  </div>
  <!-- Dialog Component -->
  <custom-dialog
    v-model="dialogVisible"
    :jog-value="xJogStep"
    jog-axis="X"
    :set-step-custom-value="setXStepCustomValue"
  />
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useJogControlsStore } from 'src/stores/jog-controls';
import CustomDialog from 'src/components/CustomDialogs/JogStepDialog.vue';
import { ref } from 'vue';

/**
 * Props:
 * - isDisabled: Whether X-axis jog controls should be disabled entirely.
 */
const props = defineProps<{
  isDisabled: boolean;
}>();

/**
 * Store bindings for reactive jog control state.
 */
const jogControlsStore = useJogControlsStore();
const { xJogStep, xSliderValue, isCustomXStepValue } =
  storeToRefs(jogControlsStore);

/**
 * Controls the visibility of the custom step input dialog.
 */
const dialogVisible = ref(false);

/**
 * Returns `true` if the jog step slider should be disabled,
 * either because the whole control is disabled or a custom step value is active.
 */
const isSliderDisabled = () => {
  return props.isDisabled || isCustomXStepValue.value;
};

/**
 * Opens the dialog for entering a custom X-axis jog step value.
 */
const openXCustomStepDialog = () => {
  dialogVisible.value = true;
};

/**
 * Sets a custom jog step value and marks the step as custom.
 * @param newValue - The new jog step value in machine units.
 */
const setXStepCustomValue = (newValue: number) => {
  xJogStep.value = newValue;
  isCustomXStepValue.value = true;
};

/**
 * Clears the custom jog step and resets it to default values.
 * Also re-enables the slider.
 */
const clearXStepCustomValue = () => {
  xJogStep.value = 0.1; // default jog step
  xSliderValue.value = 0; // default slider position
  isCustomXStepValue.value = false;
};
</script>
