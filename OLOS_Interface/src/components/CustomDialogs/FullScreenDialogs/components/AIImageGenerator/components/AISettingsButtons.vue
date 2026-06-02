<template>
  <div class="row full-width q-gutter-sm items-center justify-end">
    <q-btn
      unelevated
      color="positive"
      size="2vh"
      label="Save Settings"
      @click="showSaveAISettingsDialog"
      :disable="isLoadingImages"
    />
    <q-btn
      unelevated
      color="accent"
      size="2vh"
      label="Load Settings"
      @click="showLoadAISettingsDialog"
      :disable="!aiSettingsList.length || isLoadingImages"
    />
    <q-btn
      unelevated
      color="deep-orange-10"
      size="2vh"
      label="Reset All"
      @click="aiImageGeneratorDialogStore.resetAiImageGeneratorSettings"
      :disable="isLoadingImages"
    />
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAiImageGeneratorStore } from 'src/stores/ai-image-generator';
import { useQuasar } from 'quasar';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { AISetting } from 'src/interfaces/aiGeneratorImage.interface';
import AiSettingsListDialog from 'src/components/CustomDialogs/FullScreenDialogs/components/AIImageGenerator/components/AISettingsListDialog.vue';
import AiSettingsNameDialog from 'src/components/CustomDialogs/FullScreenDialogs/components/AIImageGenerator/components/AISettingsNameDialog.vue';

// Use Quasar's hook to access its plugins.
const $q = useQuasar();

// Access the Pinia store for the AI image generator.
const aiImageGeneratorDialogStore = useAiImageGeneratorStore();

/**
 * Destructures reactive properties from the store using `storeToRefs`.
 */
const { isLoadingImages, aiSettingsList, aiSettingName } = storeToRefs(
  aiImageGeneratorDialogStore
);

// Utility function for showing notifications.
const notifyMessage = showNotifyMessage();

/**
 * Opens a dialog to prompt the user for a name to save the current AI settings.
 * The `handleSaveAISettings` function is passed as a callback to the dialog.
 */
const showSaveAISettingsDialog = () => {
  $q.dialog({
    component: AiSettingsNameDialog,
    componentProps: {
      handleSaveAISettings,
    },
  });
};

/**
 * Saves or modifies the current AI settings.
 *
 * This function checks if the provided setting name already exists. If it does,
 * it prompts the user to confirm if they want to modify the existing setting.
 * Otherwise, it adds a new setting. Notifications are shown for success or failure.
 */
const handleSaveAISettings = async () => {
  const settingsNamesList = aiSettingsList.value.map(
    (setting: AISetting) => setting.name
  );

  // Check if the user is modifying an existing setting.
  if (settingsNamesList.includes(aiSettingName.value.trim())) {
    showAlreadyExistAISetting(aiSettingName.value).onOk(() => {
      aiImageGeneratorDialogStore
        .modifyAISetting(aiSettingName.value)
        .then(() => notifyMessage.success('AI Setting modified successfully'))
        .catch((error) => {
          notifyMessage.error(error.message);
        });
    });
  } else {
    // Add a new setting.
    aiImageGeneratorDialogStore
      .addAISetting(aiSettingName.value)
      .then(() => notifyMessage.success('AI Setting saved successfully'))
      .catch((error) => {
        notifyMessage.error(error.message);
      });
  }
};

/**
 * Displays a confirmation dialog when a user attempts to save a setting
 * with a name that already exists.
 *
 * @param {string} settingsName - The name of the setting.
 * @returns {Promise} - A promise from the Quasar dialog, which resolves when the dialog is closed.
 */
const showAlreadyExistAISetting = (settingsName: string) => {
  return $q.dialog({
    title: `<strong>${settingsName}</strong> setting Already exist!`,
    message: 'Are sure you want to modify this setting?',
    html: true,
    color: 'primary',
    ok: {
      label: 'Yes',
      flat: true,
    },
    cancel: {
      flat: true,
      label: 'No',
    },
  });
};

/**
 * Opens a dialog to display the list of saved AI settings, allowing the user
 * to load a previous setting.
 */
const showLoadAISettingsDialog = () => {
  $q.dialog({
    component: AiSettingsListDialog,
  });
};
</script>
