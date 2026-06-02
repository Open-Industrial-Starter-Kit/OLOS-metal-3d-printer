<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="true">
    <q-card
      ref="imageNameCardElement"
      class="full-width q-pa-sm bg-blue-grey-1"
    >
      <q-card-section class="column q-pa-sm q-gutter-y-sm">
        <span class="text-bold title-text-size">AI Image Generator</span>
        <span class="*sub-text-size"
          >What would you like to name your image?</span
        >
        <q-space />
      </q-card-section>
      <q-card-section>
        <q-input
          ref="imageNameInputElement"
          v-model="imageName"
          placeholder="Enter image name"
          :suffix="isReceivedImagesSVGForm ? '.svg' : '.png'"
          @touchstart="
            virtualKeyboardStore.handleInputTouchStart(
              imageNameCardElement,
              imageNameInputElement
            )
          "
          @blur="virtualKeyboardStore.handleInputBlur"
          @change="(value: string) => (imageName = value)"
          data-kioskboard-specialcharacters="true"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn
          label="Ok"
          color="primary"
          @click="setNewImageName"
          :disable="isOkButtonDisabled"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';
import { useDialogPluginComponent, QInput, QCard } from 'quasar';

// The useDialogPluginComponent provides the necessary methods for a Quasar dialog
// to function correctly. These are used to control the dialog's lifecycle.
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
defineEmits([...useDialogPluginComponent.emits]);

/**

Props for the ImageNameDialog component.

@property {boolean} isReceivedImagesSVGForm - Indicates if the image is in SVG format.

@property {Function} [downloadImage] - Optional function to download the image with a given name.

@property {Function} [useImage] - Optional function to use the image with a given name.

@property {Function} [saveImage] - Optional function to save the image with a given name.
*/
const props = defineProps<{
  isReceivedImagesSVGForm: boolean;
  downloadImage?: (name: string) => Promise<void>;
  useImage?: (name: string) => Promise<void>;
  saveImage?: (name: string) => Promise<void>;
}>();

// Access the virtual keyboard store to manage keyboard state.
const virtualKeyboardStore = useVirtualKeyboardStore();

/**

Reactive variable to store the image name entered by the user.

@type {ref<string>}
*/
const imageName = ref<string>('');

// Refs for accessing the Quasar components in the template.
const imageNameInputElement = ref<QInput | null>(null);
const imageNameCardElement = ref<QCard | null>(null);

// Methods

/**

Sets the new image name and triggers the corresponding action.

This method checks which action function (downloadImage, useImage, or saveImage)

was provided via props and calls it with the user-provided image name.

After the action is initiated, it closes the dialog with an "OK" status.
*/
const setNewImageName = () => {
  if (props.downloadImage) {
    props.downloadImage(imageName.value);
  } else if (props.useImage) {
    props.useImage(imageName.value);
  } else if (props.saveImage) {
    props.saveImage(imageName.value);
  }
  onDialogOK();
};

/**

Computed property to determine if the "OK" button should be disabled.

The button is disabled if the imageName is an empty string,

preventing the user from submitting a blank name.

@returns {boolean} - true if the button should be disabled, false otherwise.
*/
const isOkButtonDisabled = computed(() => {
  if (imageName.value !== '') return false;
  return true;
});
</script>
