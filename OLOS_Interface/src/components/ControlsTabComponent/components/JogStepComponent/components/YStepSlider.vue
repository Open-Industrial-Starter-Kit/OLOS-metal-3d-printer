<template>
  <div class="row full-width items-center">
    <span class="sub-text-size q-pr-md">Y</span>

    <q-slider
      class="slider-width"
      v-model="ySliderValue"
      @change="jogControlsStore.setYJogStepSlider"
      markers
      :min="0"
      :max="3"
      thumb-size="2.5vh"
      :disable="isSliderDisabled() || isXYLocked"
    />
    <div class="row col flex-center q-gutter-x-sm">
      <span class="sub-text-size text-bold">{{ yJogStep }} mm</span>
      <q-btn
        :icon="
          isCustomYStepValue || (isCustomXStepValue && isXYLocked)
            ? 'close'
            : 'edit'
        "
        round
        outline
        size="1.3vh"
        @click="
          isCustomYStepValue ? clearYStepCustomValue() : openYCustomStepDialog()
        "
        :disable="isDisabled || isXYLocked"
      />
    </div>
  </div>
  <!-- Dialog Component -->
  <custom-dialog
    v-model="dialogVisible"
    :jog-value="yJogStep"
    jog-axis="Y"
    :set-step-custom-value="setYStepCustomValue"
  />
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useJogControlsStore } from 'src/stores/jog-controls';
import CustomDialog from 'src/components/CustomDialogs/JogStepDialog.vue';
import { ref } from 'vue';

/**
 * Props:
 * - isDisabled: Boolean flag to disable the Y-axis jog step controls entirely.
 */
const props = defineProps<{
  isDisabled: boolean;
}>();

/**
 * Pinia store for managing jog control state.
 */
const jogControlsStore = useJogControlsStore();
const {
  yJogStep, // Current Y-axis jog step value
  ySliderValue, // Current slider position for Y-axis jog step
  isCustomXStepValue, // Whether a custom X-axis step is active (may be used with XY lock)
  isCustomYStepValue, // Whether a custom Y-axis step is active
  isXYLocked, // Whether X and Y jog steps are linked
} = storeToRefs(jogControlsStore);

/**
 * Controls the visibility of the custom jog step dialog.
 */
const dialogVisible = ref(false);

/**
 * Determines if the slider should be disabled.
 * - Disabled if the component is disabled OR a custom Y step is in use.
 */
const isSliderDisabled = () => {
  return props.isDisabled || isCustomYStepValue.value;
};

/**
 * Opens the dialog for entering a custom Y-axis jog step.
 */
const openYCustomStepDialog = () => {
  dialogVisible.value = true;
};

/**
 * Sets a custom Y-axis jog step value and disables the slider.
 */
const setYStepCustomValue = (newValue: number) => {
  yJogStep.value = newValue;
  isCustomYStepValue.value = true;
};

/**
 * Resets the Y-axis jog step to its default value and re-enables the slider.
 */
const clearYStepCustomValue = () => {
  yJogStep.value = 0.1;
  ySliderValue.value = 0;
  isCustomYStepValue.value = false;
};
</script>
