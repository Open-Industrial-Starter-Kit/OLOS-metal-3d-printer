<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="true">
    <!-- Dialog content -->
    <q-card
      ref="settingsNameCardElement"
      class="full-width q-pa-sm bg-blue-grey-1"
    >
      <q-card-section class="row items-center q-pa-sm">
        <span class="text-bold title-text-size">Give your settings a name</span>
        <q-space />
      </q-card-section>
      <q-card-section>
        <q-input
          ref="settingsNameInputElement"
          v-model="aiImageGeneratorDialogStore.aiSettingName"
          placeholder="Enter settings name"
          reactive-rules
          @touchstart="
            virtualKeyboardStore.handleInputTouchStart(
              settingsNameCardElement,
              settingsNameInputElement
            )
          "
          @blur="virtualKeyboardStore.handleInputBlur"
          @change="(value: string) => (aiImageGeneratorDialogStore.aiSettingName = value)"
          data-kioskboard-specialcharacters="true"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn
          label="Ok"
          color="positive"
          @click="setNewSettingsName"
          :disable="isOkButtonDisabled"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAiImageGeneratorStore } from 'src/stores/ai-image-generator';
import { useDialogPluginComponent, QInput, QCard } from 'quasar';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';

// The `useDialogPluginComponent` provides the necessary methods for a Quasar dialog
// to function correctly.
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
defineEmits([...useDialogPluginComponent.emits]);

// Access the Pinia store instances for the AI image generator and the virtual keyboard.
const aiImageGeneratorDialogStore = useAiImageGeneratorStore();
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Defines the props for the component.
 *
 * @property {Function} handleSaveAISettings - A callback function from the parent
 * component to handle the actual saving of the settings.
 */
const props = defineProps<{
  handleSaveAISettings: () => void;
}>();

// Refs for accessing the Quasar components in the template.
const settingsNameInputElement = ref<QInput | null>(null);
const settingsNameCardElement = ref<QCard | null>(null);

// Methods

/**
 * Sets the new settings name and triggers the save action.
 *
 * This method calls the `handleSaveAISettings` function passed via props
 * and then closes the dialog with an "OK" status.
 */
const setNewSettingsName = () => {
  props.handleSaveAISettings();
  onDialogOK();
};

/**
 * A computed property to determine if the "OK" button should be disabled.
 *
 * The button is disabled if the `aiSettingName` from the store is an empty string,
 * preventing the user from saving a setting without a name.
 *
 * @returns {boolean} - `true` if the button should be disabled, `false` otherwise.
 */
const isOkButtonDisabled = computed(() => {
  if (aiImageGeneratorDialogStore.aiSettingName.length > 0) return false;
  return true;
});
</script>
