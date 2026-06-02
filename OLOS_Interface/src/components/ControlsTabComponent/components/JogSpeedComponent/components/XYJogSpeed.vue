<template>
  <div class="column col q-gutterxy-sm">
    <div class="row col items-center justify-around">
      <span class="axis-title">XY</span>
      <span class="text-bold">{{ xyJogSpeed }} mm/s</span>
      <q-btn
        outline
        round
        :icon="isCustomXYSpeedValue ? 'close' : 'edit'"
        color="light-grey-4"
        size="1.2vh"
        :disable="isDisabled"
        @click="
          isCustomXYSpeedValue
            ? clearXYSpeedCustom()
            : openXYCustomSpeedDialog()
        "
      />
    </div>
    <q-btn-group flat push rounded class="col flex-center full-width">
      <q-btn
        outline
        label="slow"
        :class="[
          { 'bg-white': xyChosenSpeed === 'slow' },
          'group-button-width',
        ]"
        :disable="isDisabled"
        @click="setXYSpeed"
      />
      <q-btn
        outline
        label="normal"
        :class="[
          { 'bg-white': xyChosenSpeed === 'normal' },
          'group-button-width',
        ]"
        :disable="isDisabled"
        @click="setXYSpeed"
      />
      <q-btn
        outline
        label="fast"
        :class="[
          { 'bg-white': xyChosenSpeed === 'fast' },
          'group-button-width',
        ]"
        :disable="isDisabled"
        @click="setXYSpeed"
      />
    </q-btn-group>
    <!-- Dialog Component -->
    <custom-dialog
      v-model="dialogVisible"
      :jog-value="xyJogSpeed"
      jog-axis="XY"
      :set-speed-custom-value="setXYCustomSpeed"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useJogControlsStore } from 'src/stores/jog-controls';
import CustomDialog from 'src/components/CustomDialogs/JogSpeedDialog.vue';
import { ref } from 'vue';

/**
 * Props:
 * - isDisabled: Boolean flag indicating if the speed controls should be disabled
 */
defineProps<{
  isDisabled: boolean;
}>();

// Access the jog controls store
const store = useJogControlsStore();
const { xyJogSpeed, xyChosenSpeed, isCustomXYSpeedValue } = storeToRefs(store);

// State to control visibility of the custom speed dialog
const dialogVisible = ref(false);

/**
 * Sets the XY jogging speed based on a preset choice clicked by the user.
 * Resets the custom speed flag when a preset is chosen.
 *
 * @param event - Click event from the preset button
 */
const setXYSpeed = (event: Event) => {
  const targetElement = event.target as HTMLElement | null;
  if (targetElement && targetElement.textContent) {
    store.setXYSpeedChoice(targetElement.textContent);
    isCustomXYSpeedValue.value = false;
  }
};

/**
 * Opens the dialog for entering a custom XY speed.
 */
const openXYCustomSpeedDialog = () => {
  dialogVisible.value = true;
};

/**
 * Sets a custom XY speed entered by the user.
 *
 * @param newValue - The custom speed value
 */
const setXYCustomSpeed = (newValue: number) => {
  xyJogSpeed.value = newValue;
  xyChosenSpeed.value = '';
  isCustomXYSpeedValue.value = true;
};

/**
 * Resets the XY speed to default values and disables custom speed mode.
 */
const clearXYSpeedCustom = () => {
  xyJogSpeed.value = 10; // default speed
  xyChosenSpeed.value = 'slow'; // default preset
  isCustomXYSpeedValue.value = false;
};
</script>
