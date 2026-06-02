<template>
  <div class="row full-width items-center">
    <span class="sub-text-size q-pr-md">Z</span>
    <q-slider
      class="slider-width"
      v-model="zSliderValue"
      @change="jogControlsStore.setZJogStepSlider"
      markers
      :min="0"
      :max="3"
      thumb-size="2.5vh"
      :disable="isSliderDisabled()"
    />

    <div class="row col flex-center q-gutter-x-sm">
      <span class="sub-text-size text-bold">{{ zJogStep }} mm</span>
      <q-btn
        :icon="isCustomZStepValue ? 'close' : 'edit'"
        round
        outline
        size="1.3vh"
        @click="
          isCustomZStepValue ? clearZStepCustomValue() : openZCustomStepDialog()
        "
        :disable="isDisabled"
      />
    </div>
  </div>
  <!-- Dialog Component -->
  <custom-dialog
    v-model="dialogVisible"
    :jog-value="zJogStep"
    jog-axis="Z"
    :set-step-custom-value="setZStepCustomValue"
  />
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useJogControlsStore } from 'src/stores/jog-controls';
import CustomDialog from 'src/components/CustomDialogs/JogStepDialog.vue';
import { ref } from 'vue';

/**
 * Props:
 * - isDisabled: Boolean flag to disable the Z-axis jog step controls entirely
 */
const props = defineProps<{
  isDisabled: boolean;
}>();

/**
 * Access jog control state from Pinia store
 */
const jogControlsStore = useJogControlsStore();
const {
  zJogStep, // Current Z-axis jog step value
  zSliderValue, // Slider position for Z-axis jog step
  isCustomZStepValue, // Whether a custom Z-axis jog step is active
} = storeToRefs(jogControlsStore);

/**
 * State for controlling visibility of the custom step dialog
 */
const dialogVisible = ref(false);

/**
 * Checks if slider should be disabled
 * Disabled if component is disabled OR a custom value is in use
 */
const isSliderDisabled = () => {
  return props.isDisabled || isCustomZStepValue.value;
};

/**
 * Opens custom Z-step dialog
 */
const openZCustomStepDialog = () => {
  dialogVisible.value = true;
};

/**
 * Sets a custom Z-axis jog step value
 * Also disables the slider until cleared
 */
const setZStepCustomValue = (newValue: number) => {
  zJogStep.value = newValue;
  isCustomZStepValue.value = true;
};

/**
 * Clears custom step and resets Z-axis jog step to default
 * Re-enables the slider
 */
const clearZStepCustomValue = () => {
  zJogStep.value = 0.1;
  zSliderValue.value = 0;
  isCustomZStepValue.value = false;
};
</script>
