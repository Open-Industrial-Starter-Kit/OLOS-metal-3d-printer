<template>
  <div class="column full-width">
    <span class="title-text-size">AI Models List:</span>
    <q-select
      outlined
      v-model="aiGeneratorSettingsData.model"
      :options="aiModelsList"
      bg-color="white"
      behavior="menu"
      :disable="isLoadingImages"
    >
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt }}</q-item-label>
            <q-item-label caption>{{
              getAIModelDescription(scope.opt)
            }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAiImageGeneratorStore } from 'src/stores/ai-image-generator';
import { Constants } from 'src/constants';

// Access the Pinia store for the AI image generator.
const aiImageGeneratorDialogStore = useAiImageGeneratorStore();

/**
 * Destructures reactive properties from the store using `storeToRefs` to maintain
 * reactivity.
 */
const { aiGeneratorSettingsData, aiModelsList, isLoadingImages } = storeToRefs(
  aiImageGeneratorDialogStore
);

/**
 * Retrieves the description for a given AI model name.
 *
 * This function checks if the provided model name is in the list of supported
 * AI models defined in `Constants.SUPPORTED_AI_MODELS`. If it is, it returns
 * the corresponding description. If the model is not supported, it returns a
 * default warning message.
 *
 * @param {string} modelName - The name of the AI model.
 * @returns {string | undefined} - The description of the model or a warning message.
 */
const getAIModelDescription = (modelName: string) => {
  // check if the ai model is supported by olos
  const supportedModels = Constants.SUPPORTED_AI_MODELS.map(
    (model) => model.name
  );
  if (supportedModels.includes(modelName)) {
    return Constants.SUPPORTED_AI_MODELS.find(
      (model) => model.name === modelName
    )?.description;
  }
  return 'This model is not supported. Use on your own risk';
};
</script>
