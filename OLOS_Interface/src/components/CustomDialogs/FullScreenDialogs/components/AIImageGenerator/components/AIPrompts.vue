<template>
  <div class="column full-width">
    <span class="title-text-size">Prompts:</span>
    <q-input
      ref="promptInputElement"
      v-model="aiGeneratorSettingsData.mainPrompts"
      outlined
      color="primary"
      bg-color="white"
      type="textarea"
      @touchstart="
        virtualKeyboardStore.handleInputTouchStart(
          aiDialogCardElement,
          promptInputElement
        )
      "
      @blur="virtualKeyboardStore.handleInputBlur"
      @change="(value: string) => aiGeneratorSettingsData.mainPrompts = value"
      data-kioskboard-specialcharacters="true"
      :placeholder="Constants.AI_ASSISTANT_MESSAGES.PROMPTS_PLACEHOLDER"
      class="full-width sub-text-size"
      :disable="isLoadingImages"
    />
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAiImageGeneratorStore } from 'src/stores/ai-image-generator';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';
import { Constants } from 'src/constants';
import { ref } from 'vue';
import { QInput, QCard } from 'quasar';

/**
 * Defines the props for the component.
 *
 * @property {QCard | null} aiDialogCardElement - A reference to the parent dialog's QCard element.
 */
defineProps<{
  aiDialogCardElement: QCard | null;
}>();

/**
 * Defines the events that this component can emit.
 *
 * @event update:aiDialogCardElement - Emitted to update the parent with a reference to the dialog's QCard element.
 */
const emit = defineEmits(['update:aiDialogCardElement']);

// Access the Pinia store instances for the AI image generator and the virtual keyboard.
const aiImageGeneratorDialogStore = useAiImageGeneratorStore();
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Destructures reactive properties from the `aiImageGeneratorDialogStore` using `storeToRefs`.
 */
const { aiGeneratorSettingsData, isLoadingImages } = storeToRefs(
  aiImageGeneratorDialogStore
);

/**
 * A reactive reference to the Quasar QInput component used for the main prompt.
 * This allows for direct manipulation of the input element if needed.
 * @type {ref<QInput | null>}
 */
const promptInputElement = ref<QInput | null>(null);
</script>
