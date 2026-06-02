<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="true">
    <q-card ref="jogSpeedCardElement" class="full-width q-pa-sm bg-blue-grey-1">
      <q-card-section class="row items-center">
        <span class="text-bold title-text-size"
          >Custom {{ jogAxis }} Jogging Speed Value</span
        >
        <q-space />
      </q-card-section>
      <q-card-section>
        <q-input
          ref="jogSpeedInputElement"
          v-model="jogSpeedValue"
          placeholder="Enter a number"
          :rules="[
            (val: number) => !!val || '* Required',
            (val: number) => val > 0 || 'Only positive numbers are allowed.',
            (val: number) =>
              val <= 10000 || 'Number must be less than or equal to 10000.',
          ]"
          @keydown="virtualKeyboardStore.handleSanitizeNumberInput"
          @touchstart="
            virtualKeyboardStore.handleInputTouchStart(
              jogSpeedCardElement,
              jogSpeedInputElement
            )
          "
          @blur="virtualKeyboardStore.handleInputBlur"
          @change.capture="handleChangeJogSpeedValue"
          data-kioskboard-specialcharacters="true"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" size="2vh" @click="onDialogCancel" />
        <q-btn
          label="Set"
          color="primary"
          size="2vh"
          @click="setCustomValue"
          :disable="isSetButtonDisabled"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDialogPluginComponent, QInput, QCard } from 'quasar';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';

// The `useDialogPluginComponent` hook provides the necessary methods for a Quasar dialog
// to function correctly, such as closing and hiding the dialog.
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
defineEmits([...useDialogPluginComponent.emits]);

/**
 * Defines the props for the component.
 *
 * @property {string} jogAxis - The axis for which the jog speed is being set (e.g., 'X', 'Y', 'Z').
 * @property {number} jogValue - The initial jog speed value to display in the input field.
 * @property {Function} setSpeedCustomValue - A callback function from the parent to set the new custom speed value.
 */
const props = defineProps<{
  jogAxis: string;
  jogValue: number;
  setSpeedCustomValue: (value: number) => void;
}>();

// Access the Pinia store for the virtual keyboard.
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Reactive variable to store the custom jog speed value entered by the user.
 * It is initialized with the `jogValue` prop.
 * @type {ref<number>}
 */
const jogSpeedValue = ref<number>(props.jogValue);

// Refs for accessing the Quasar components in the template.
const jogSpeedInputElement = ref<QInput | null>(null);
const jogSpeedCardElement = ref<QCard | null>(null);

/**
 * A computed property to determine if the "Set" button should be disabled.
 *
 * The button is enabled only when `jogSpeedValue` is a positive number
 * between 1 and 10000. This prevents the user from submitting invalid or unsafe values.
 *
 * @returns {boolean} - `true` if the button should be disabled, `false` otherwise.
 */
const isSetButtonDisabled = computed(() => {
  if (
    jogSpeedValue.value &&
    jogSpeedValue.value > 0 &&
    jogSpeedValue.value <= 10000
  )
    return false;
  return true;
});

// Methods

/**
 * Sets the custom speed value and closes the dialog.
 *
 * This method calls the `setSpeedCustomValue` function passed via props with the
 * new `jogSpeedValue` and then closes the dialog with an "OK" status.
 */
const setCustomValue = () => {
  props.setSpeedCustomValue(jogSpeedValue.value);
  onDialogOK();
};

/**
 * Handles keyboard or touch input for the jog speed value.
 *
 * This function uses the `virtualKeyboardStore` to sanitize the input,
 * ensuring that only valid numbers are set to the `jogSpeedValue` variable.
 *
 * @param {KeyboardEvent | TouchEvent} event - The input event from the virtual keyboard.
 */
const handleChangeJogSpeedValue = (event: KeyboardEvent | TouchEvent) => {
  jogSpeedValue.value = virtualKeyboardStore.handleSanitizeNumberInput(event);
};
</script>
