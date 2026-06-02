<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    :persistent="true"
    backdrop-filter="blur(4px)"
  >
    <q-card class="q-dialog-plugin dialog-box">
      <div class="column q-ma-lg q-gutter-y-md">
        <span class="full-width text-bold text-h6">AI Settings List:</span>

        <q-scroll-area class="settings-list-box">
          <div v-for="setting in aiSettingsList" :key="setting.settingsId">
            <div
              class="row items-center justify-between q-py-sm"
              :class="[
                {
                  'bg-white': selectedSettingName === setting.name,
                },
              ]"
              @click="() => (selectedSettingName = setting.name)"
            >
              <span class="text-h6 q-pl-md">{{ setting.name }}</span>

              <q-btn
                icon="remove"
                color="negative"
                flat
                @click="handleDeleteSettings(setting.settingsId)"
              >
                <q-tooltip>Delete Setting</q-tooltip>
              </q-btn>
            </div>
            <q-separator />
          </div>
        </q-scroll-area>

        <q-card-actions align="right">
          <q-btn flat color="primary" label="Cancel" @click="onDialogCancel" />
          <q-btn
            unelevated
            color="accent"
            label="Load"
            @click="handleLoadSetting"
            :disable="!selectedSettingName"
          />
        </q-card-actions>
      </div>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useDialogPluginComponent } from 'quasar';
import { watch, ref } from 'vue';
import { useAiImageGeneratorStore } from 'src/stores/ai-image-generator';
import { showNotifyMessage } from 'src/services/notify.messages.service';

// The `useDialogPluginComponent` hook provides the essential methods for
// a Quasar dialog to function correctly.
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
defineEmits([...useDialogPluginComponent.emits]);

// Access the Pinia store for AI image generation.
const aiImageGeneratorDialogStore = useAiImageGeneratorStore();

/**
 * Destructures reactive properties from the store using `storeToRefs` to maintain reactivity.
 */
const { aiSettingsList, aiGeneratorSettingsData, aiSettingName } = storeToRefs(
  aiImageGeneratorDialogStore
);

/**
 * A reactive variable to track the name of the setting selected by the user.
 * It is initialized with the current setting name.
 * @type {ref<string>}
 */
const selectedSettingName = ref<string>(aiSettingName.value);

// Utility function for showing notifications.
const notifyMessage = showNotifyMessage();

/**
 * Loads the selected AI setting into the main generator settings.
 *
 * This function finds the selected setting from `aiSettingsList` and merges
 * its `settings` object with the current `aiGeneratorSettingsData`. It also
 * updates the `aiSettingName` and then closes the dialog with an "OK" status.
 */
const handleLoadSetting = () => {
  const selectedSetting = aiSettingsList.value.find(
    (setting) => setting.name === selectedSettingName.value
  );
  if (selectedSetting) {
    aiGeneratorSettingsData.value = {
      ...aiGeneratorSettingsData.value,
      ...selectedSetting.settings,
    };
    aiSettingName.value = selectedSetting.name;
  }
  onDialogOK();
};

/**
 * Deletes a saved AI setting.
 *
 * This function calls the `deleteAISetting` action on the store with the
 * provided setting ID. It displays a success or error notification based on the result.
 *
 * @param {number | undefined} aiSettingId - The ID of the setting to be deleted.
 */
const handleDeleteSettings = async (aiSettingId: number | undefined) => {
  if (aiSettingId) {
    await aiImageGeneratorDialogStore
      .deleteAISetting(aiSettingId)
      .then(() => notifyMessage.success('AI Setting deleted successfully'))
      .catch(() =>
        notifyMessage.error('Something went wrong while deleting the settings')
      );
  }
};

/**
 * A watcher that automatically closes the dialog if the `aiSettingsList` becomes empty.
 * This prevents the user from being stuck in an empty list dialog.
 */
watch(aiSettingsList, (newSettingsList) => {
  if (!newSettingsList.length) {
    onDialogHide();
  }
});
</script>

<style scoped>
.settings-list-box {
  background-color: rgb(236, 236, 236);
  border: solid rgb(206, 206, 206) 2px;
  border-radius: 5px;
  height: 200px;
  width: 100%;
}
.dialog-box {
  min-width: 50vw;
}
</style>
src/stores/ai-image-generator
