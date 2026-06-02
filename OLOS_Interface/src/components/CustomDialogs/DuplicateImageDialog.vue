<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="true">
    <q-card
      ref="duplicateImageCardElement"
      class="full-width q-pa-sm bg-blue-grey-1"
    >
      <q-card-section class="column q-pa-sm q-gutter-y-sm">
        <span class="text-bold title-text-size">Duplicate Selected Image</span>
        <span class="subtitle-text-size"
          >Enter the number of image copies you want to generate</span
        >
        <q-space />
      </q-card-section>
      <q-card-section>
        <q-input
          ref="duplicateImageInputElement"
          v-model="numberOfCopies"
          placeholder="Enter a number"
          :rules="[
            (val: string) => !!val || '* Required',
            (val: string) =>
              Number.isInteger(parseFloat(val)) ||
              'Please Enter an Integer number',
          ]"
          reactive-rules
          @touchstart="
            virtualKeyboardStore.handleInputTouchStart(
              duplicateImageCardElement,
              duplicateImageInputElement
            )
          "
          @blur="virtualKeyboardStore.handleInputBlur"
          @change.capture="handleChangeNumberOfCopiesValue"
          data-kioskboard-specialcharacters="true"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" color="grey-8" />
        <q-btn
          label="Duplicate"
          color="grey-8"
          @click="setNumberOfCopies"
          :disable="isDuplicateButtonDisabled"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';
import { useImageToGcodeConvertor } from 'src/stores/image-to-gcode';
import { useDialogPluginComponent, QInput, QCard } from 'quasar';

// The `useDialogPluginComponent` hook provides the necessary methods for a Quasar dialog
// to function correctly, such as closing and hiding the dialog.
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
defineEmits([...useDialogPluginComponent.emits]);

// Access the Pinia store instances for image to G-code conversion and the virtual keyboard.
const imageToGcodeConvertorStore = useImageToGcodeConvertor();
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Reactive variable to store the number of copies entered by the user.
 * It is initialized to 1, representing one copy.
 * @type {ref<number>}
 */
const numberOfCopies = ref<number>(1);

// Refs for accessing the Quasar components in the template.
const duplicateImageInputElement = ref<QInput | null>(null);
const duplicateImageCardElement = ref<QCard | null>(null);

/**
 * A computed property to determine if the "Set" button should be disabled.
 *
 * The button is disabled if `numberOfCopies` is not a positive number,
 * preventing the user from submitting an invalid value.
 *
 * @returns {boolean} - `true` if the button should be disabled, `false` otherwise.
 */
const isDuplicateButtonDisabled = computed(() => {
  if (numberOfCopies.value > 0) {
    return false;
  }
  return true;
});

// Methods

/**
 * Duplicates the active image the specified number of times.
 *
 * This asynchronous function iterates from 0 to `numberOfCopies` and calls
 * the `duplicateActiveImage` action on the `imageToGcodeConvertorStore` for each iteration.
 * After the duplication is complete, it closes the dialog with an "OK" status.
 */
const setNumberOfCopies = async () => {
  for (let i = 0; i < numberOfCopies.value; i++) {
    await imageToGcodeConvertorStore.duplicateActiveImage();
  }
  onDialogOK();
};

/**
 * Handles keyboard or touch input for the number of copies.
 *
 * This function uses the `virtualKeyboardStore` to sanitize the input, ensuring
 * that only valid numbers are set to the `numberOfCopies` variable.
 *
 * @param {KeyboardEvent | TouchEvent} event - The input event from the virtual keyboard.
 */
const handleChangeNumberOfCopiesValue = (event: KeyboardEvent | TouchEvent) => {
  numberOfCopies.value = virtualKeyboardStore.handleSanitizeNumberInput(event);
};
</script>
