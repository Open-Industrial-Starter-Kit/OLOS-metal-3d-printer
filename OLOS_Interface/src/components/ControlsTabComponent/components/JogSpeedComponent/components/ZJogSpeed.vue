<template>
  <div class="column col q-gutter-y-sm">
    <div class="row col items-center justify-around">
      <span class="axis-title">Z</span>
      <span class="text-bold">{{ zJogSpeed }} mm/s</span>
      <q-btn
        outline
        round
        :icon="isCustomZSpeedValue ? 'close' : 'edit'"
        color="light-grey-4"
        size="1.2vh"
        :disable="isDisabled"
        @click="
          isCustomZSpeedValue ? clearZSpeedCustom() : openZCustomSpeedDialog()
        "
      />
    </div>
    <q-btn-group flat push rounded class="col flex-center">
      <q-btn
        outline
        label="slow"
        :class="[{ 'bg-white': zChosenSpeed === 'slow' }, 'group-button-width']"
        :disable="isDisabled"
        @click="setZSpeed"
      />
      <q-btn
        outline
        label="normal"
        :class="[
          { 'bg-white': zChosenSpeed === 'normal' },
          'group-button-width',
        ]"
        :disable="isDisabled"
        @click="setZSpeed"
      />
      <q-btn
        outline
        label="fast"
        :class="[{ 'bg-white': zChosenSpeed === 'fast' }, 'group-button-width']"
        :disable="isDisabled"
        @click="setZSpeed"
      />
    </q-btn-group>
    <!-- Dialog Component -->
    <custom-dialog
      v-model="dialogVisible"
      :jog-value="zJogSpeed"
      jog-axis="Z"
      :set-speed-custom-value="setZCustomSpeed"
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
const { zJogSpeed, zChosenSpeed, isCustomZSpeedValue } = storeToRefs(store);

// State to control visibility of the custom speed dialog
const dialogVisible = ref(false);

/**
 * Sets the Z-axis jogging speed based on a preset choice clicked by the user.
 * Resets the custom speed flag when a preset is chosen.
 *
 * @param event - Click event from the preset button
 */
const setZSpeed = (event: Event) => {
  const targetElement = event.target as HTMLElement | null;
  if (targetElement && targetElement.textContent) {
    store.setZSpeedChoice(targetElement.textContent);
    isCustomZSpeedValue.value = false;
  }
};

/**
 * Opens the dialog for entering a custom Z-axis speed.
 */
const openZCustomSpeedDialog = () => {
  dialogVisible.value = true;
};

/**
 * Sets a custom Z-axis speed entered by the user.
 *
 * @param newValue - The custom speed value
 */
const setZCustomSpeed = (newValue: number) => {
  zJogSpeed.value = newValue;
  zChosenSpeed.value = '';
  isCustomZSpeedValue.value = true;
};

/**
 * Resets the Z-axis speed to default values and disables custom speed mode.
 */
const clearZSpeedCustom = () => {
  zJogSpeed.value = 10; // default speed
  zChosenSpeed.value = 'slow'; // default preset
  isCustomZSpeedValue.value = false;
};
</script>
