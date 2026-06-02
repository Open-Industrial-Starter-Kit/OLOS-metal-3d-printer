<template>
  <div class="row full-width items-center justify-between">
    <q-btn
      :loading="isLoadingImages"
      size="2vh"
      :class="{
        'col-11': isLoadingImages,
        'full-width': !isLoadingImages,
      }"
      color="primary"
      @click="handleAIGenerateImages"
      :disable="!aiGeneratorSettingsData.mainPrompts || isLoadingImages"
    >
      Generate
      <template v-slot:loading>
        <div class="row items-center q-gutter-x-md">
          Please be patient. This process may take some time
          <q-spinner-hourglass />
        </div>
      </template>
    </q-btn>
    <q-btn
      v-if="isLoadingImages"
      icon="cancel"
      size="2vh"
      color="negative"
      class="q-ml-sm col"
      @click="handleCancelGeneratingImage"
    />
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAiImageGeneratorStore } from 'src/stores/ai-image-generator';
import { useQuasar } from 'quasar';
import { Constants } from 'src/constants';
import { showNotifyMessage } from 'src/services/notify.messages.service';

// Use Quasar's hook to access its plugins.
const $q = useQuasar();
// Access the Pinia store for the AI image generator.
const aiImageGeneratorDialogStore = useAiImageGeneratorStore();
// Utility function for showing notifications.
const notifyMessage = showNotifyMessage();

/**
 * Destructures reactive properties from the store using `storeToRefs`.
 *
 * @property {object} aiGeneratorSettingsData - Contains the current settings for image generation.
 * @property {boolean} isLoadingImages - A flag indicating if images are currently being generated.
 */
const { aiGeneratorSettingsData, isLoadingImages } = storeToRefs(
  aiImageGeneratorDialogStore
);

/**
 * Initiates the AI image generation process.
 *
 * This function first validates the user's settings using `isAISettingsValid`.
 * If the settings are valid, it calls the `generateAIImages` action on the store.
 * If the settings are invalid, it displays a warning dialog to the user.
 * It also handles and displays any errors that occur during generation.
 */
const handleAIGenerateImages = async () => {
  // make sure that the user will not enter settings that may crash the system
  if (isAISettingsValid()) {
    aiImageGeneratorDialogStore
      .generateAIImages()
      .catch((error) => notifyMessage.error(error.message));
  } else {
    showWarningAISettingsDialog();
  }
};

/**
 * Cancels the ongoing image generation process.
 *
 * This function calls the `cancelGeneratingImages` action on the store and
 * displays a notification if an error occurs during the cancellation.
 */
const handleCancelGeneratingImage = () => {
  aiImageGeneratorDialogStore
    .cancelGeneratingImages()
    .catch((error) => notifyMessage.error(error.message));
};

/**
 * Validates the AI image generation settings against system limitations.
 *
 * This function checks if the combination of `numberOfImages`, `inferenceSteps`,
 * `imageWidth`, and `imageHeight` exceeds predefined limits from `Constants`.
 * This is a safeguard to prevent the user from requesting a job that could
 * crash the system.
 *
 * @returns {boolean} - `true` if the settings are within safe limits, `false` otherwise.
 */
const isAISettingsValid = () => {
  const settings = aiGeneratorSettingsData.value;
  const limits = Constants.AI_SETTINGS_LIMITATION;

  const isImagesNumberExceeded =
    settings.numberOfImages > limits.NUMBER_OF_IMAGES;
  const isInferenceStepsExceeded =
    settings.inferenceSteps > limits.INFERENCE_STEPS;
  const isImageWidthExceeded = settings.imageWidth > limits.IMAGE_WIDTH;
  const isImageHeightExceeded = settings.imageHeight > limits.IMAGE_HEIGHT;

  // If any single setting is exceeded, check for a combination that could cause instability.
  if (isImagesNumberExceeded) {
    if (
      isInferenceStepsExceeded ||
      isImageWidthExceeded ||
      isImageHeightExceeded
    )
      return false;
  }
  if (isInferenceStepsExceeded) {
    if (isImagesNumberExceeded || isImageWidthExceeded || isImageHeightExceeded)
      return false;
  }
  if (isImageWidthExceeded) {
    if (
      isImagesNumberExceeded ||
      isInferenceStepsExceeded ||
      isImageHeightExceeded
    )
      return false;
  }
  if (isImageHeightExceeded) {
    if (
      isImagesNumberExceeded ||
      isInferenceStepsExceeded ||
      isImageWidthExceeded
    )
      return false;
  }

  return true;
};

/**
 * Displays a warning dialog to the user about potentially unstable settings.
 *
 * This dialog informs the user that their selected settings may exceed system
 * limits and prompts them to adjust the values.
 */
const showWarningAISettingsDialog = () => {
  $q.dialog({
    color: 'primary',
    title: 'Warning!',
    message:
      'The selected settings may exceed system limits and cause instability. Please adjust them to ensure smooth operation.',
    progress: false,
    ok: true,
  });
};
</script>
