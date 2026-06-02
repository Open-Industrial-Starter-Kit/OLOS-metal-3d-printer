<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="true">
    <q-card ref="jogStepCardElement" class="full-width q-pa-sm bg-blue-grey-1">
      <q-card-section class="row items-center q-pa-sm">
        <span class="text-bold title-text-size"
          >Customize {{ jogAxis }} Jogging Step Value</span
        >
        <q-space />
      </q-card-section>
      <q-card-section>
        <q-input
          ref="jogStepInputElement"
          v-model="jogStepValue"
          placeholder="Enter a number"
          min="0"
          max="10000"
          step=".1"
          :rules="[
            (val: number) => !!val || '* Required',
            (val: number) => val > 0 || 'Only positive numbers are allowed.',
            (val: number) =>
              val <= 1000 || 'Number must be less than or equal to 1000.',
          ]"
          reactive-rules
          @keydown="virtualKeyboardStore.handleSanitizeNumberInput"
          @touchstart="
            virtualKeyboardStore.handleInputTouchStart(
              jogStepCardElement,
              jogStepInputElement
            )
          "
          @blur="virtualKeyboardStore.handleInputBlur"
          @change.capture="handleChangeJogStepValue"
          data-kioskboard-specialcharacters="true"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn
          label="Set"
          color="primary"
          @click="setCustomValue"
          :disable="isSetButtonDisabled"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';
import { useDialogPluginComponent, QInput, QCard } from 'quasar';

// The `useDialogPluginComponent` hook provides the necessary methods for a Quasar dialog
// to function correctly, such as closing and hiding the dialog.
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

defineEmits([...useDialogPluginComponent.emits]);

/**
 * Defines the props for the component.
 *
 * @property {string} jogAxis - The axis for which the jog step is being set (e.g., 'X', 'Y', 'Z').
 * @property {number} jogValue - The initial jog step value to display in the input field.
 * @property {Function} setStepCustomValue - A callback function from the parent to set the new custom step value.
 */
const props = defineProps<{
  jogAxis: string;
  jogValue: number;
  setStepCustomValue: (value: number) => void;
}>();

// Access the Pinia store for the virtual keyboard.
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Reactive variable to store the custom jog step value entered by the user.
 * It is initialized with the `jogValue` prop.
 * @type {ref<number>}
 */
const jogStepValue = ref<number>(props.jogValue);

// Refs for accessing the Quasar components in the template.
const jogStepCardElement = ref<QInput | null>(null);
const jogStepInputElement = ref<QInput | null>(null);

/**
 * A computed property to determine if the "Set" button should be disabled.
 *
 * The button is enabled only when `jogStepValue` is a positive number
 * between 1 and 1000. This prevents the user from submitting invalid or unsafe values.
 *
 * @returns {boolean} - `true` if the button should be disabled, `false` otherwise.
 */
const isSetButtonDisabled = computed(() => {
  if (
    jogStepValue.value &&
    jogStepValue.value > 0 &&
    jogStepValue.value <= 1000
  )
    return false;
  return true;
});

// Methods

/**
 * Sets the custom step value and closes the dialog.
 *
 * This method calls the `setStepCustomValue` function passed via props with the
 * new `jogStepValue` and then closes the dialog with an "OK" status.
 */
const setCustomValue = () => {
  props.setStepCustomValue(jogStepValue.value);
  onDialogOK();
};

/**
 * Handles keyboard or touch input for the jog step value.
 *
 * This function uses the `virtualKeyboardStore` to sanitize the input,
 * ensuring that only valid numbers are set to the `jogStepValue` variable.
 *
 * @param {KeyboardEvent | TouchEvent} event - The input event from the virtual keyboard.
 */
const handleChangeJogStepValue = (event: KeyboardEvent | TouchEvent) => {
  jogStepValue.value = virtualKeyboardStore.handleSanitizeNumberInput(event);
};
</script>
