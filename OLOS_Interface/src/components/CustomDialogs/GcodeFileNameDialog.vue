<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="true">
    <q-card
      ref="gcodeFileNameCardElement"
      class="full-width q-pa-sm bg-blue-grey-1"
    >
      <q-card-section class="column q-pa-sm q-gutter-y-sm">
        <span class="subtitle-text-size"
          >what would you like to name your job file?</span
        >
        <q-space />
      </q-card-section>
      <q-card-section>
        <q-input
          ref="gcodeFileNameInputElement"
          v-model="gcodeFileName"
          placeholder="Enter your file name"
          :rules="[(val: string) => !!val || '* Required']"
          reactive-rules
          @touchstart="
            virtualKeyboardStore.handleInputTouchStart(
              gcodeFileNameCardElement,
              gcodeFileNameInputElement
            )
          "
          @blur="virtualKeyboardStore.handleInputBlur"
          @change="handleChangeFileNameValue"
          data-kioskboard-specialcharacters="true"
          suffix=".nc"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" color="grey-8" />
        <q-btn
          label="OK"
          color="primary"
          @click="onDialogOK(gcodeFileName)"
          :disable="isFileNameButtonDisabled"
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

// Access the Pinia store for the virtual keyboard.
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Reactive variable to store the G-code file name entered by the user.
 * It is initialized as an empty string.
 * @type {ref<string>}
 */
const gcodeFileName = ref<string>('');

// Refs for accessing the Quasar components in the template.
const gcodeFileNameInputElement = ref<QInput | null>(null);
const gcodeFileNameCardElement = ref<QCard | null>(null);

/**
 * A computed property to determine if the "Set" button should be disabled.
 *
 * The button is disabled if the `gcodeFileName` is an empty string,
 * preventing the user from submitting a blank file name.
 *
 * @returns {boolean} - `true` if the button should be disabled, `false` otherwise.
 */
const isFileNameButtonDisabled = computed(() => {
  if (gcodeFileName.value.length > 0) {
    return false;
  }
  return true;
});

/**
 * Updates the `gcodeFileName` reactive variable with the new value from the input.
 *
 * This function is typically used as an event handler for a v-model on a Quasar
 * input component.
 *
 * @param {string} value - The new value of the file name.
 */
const handleChangeFileNameValue = (value: string) => {
  gcodeFileName.value = value;
};
</script>
