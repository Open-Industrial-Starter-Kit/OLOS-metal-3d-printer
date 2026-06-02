<template>
  <div class="row flex-center images-container">
    <transition
      appear
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
    >
      <q-carousel
        v-if="originalGeneratedImages.length"
        v-model="imageSliderNumber"
        v-model:fullscreen="isFullScreen"
        swipeable
        animated
        thumbnails
        infinite
        class="fit"
      >
        <q-carousel-slide
          v-for="(image, index) in base64GeneratedImages"
          :key="index"
          :name="index"
          :img-src="image"
          class="images-style"
        />
        <template v-slot:control>
          <image-controls-button
            :is-full-screen="isFullScreen"
            :is-loading-images="isLoadingImages"
            :handle-full-screen
            :handle-use-image
            :handle-save-image
            :handle-download-image
          />
        </template>
      </q-carousel>

      <q-icon v-else name="image" size="20vw" color="grey" />
    </transition>

    <q-inner-loading
      class="column fit items-center justify-between"
      :showing="isLoadingImages"
    >
      <q-spinner class="col" size="5vw" color="primary" />
    </q-inner-loading>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useAiImageGeneratorStore } from 'src/stores/ai-image-generator';
import { useImageToGcodeConvertor } from 'src/stores/image-to-gcode';
import { useMediaFilesManagementStore } from 'src/stores/media-files-management';
import { useMaterialLibraryStore } from 'src/stores/material-library';
import { fileFromMediaUrl } from 'src/services/media.helper.service';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import ImageControlsButton from 'src/components/CustomDialogs/FullScreenDialogs/components/AIImageGenerator/components/ImageControlsButton.vue';
import AiImageNameDialog from 'src/components/CustomDialogs/FullScreenDialogs/components/AIImageGenerator/components/AIImageNameDialog.vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';

// Quasar's useQuasar hook provides access to Quasar's plugins and features.
const $q = useQuasar();

// Pinia store instances for managing application state.
const aiImageGeneratorDialogStore = useAiImageGeneratorStore();
const imageToGcodeConvertorStore = useImageToGcodeConvertor();
const mediaFilesManagementStore = useMediaFilesManagementStore();
const materialLibraryStore = useMaterialLibraryStore();

// Utility function for showing notifications.
const notifyMessage = showNotifyMessage();

// Destructure reactive properties from the AI image generator store using `storeToRefs`
// to maintain reactivity.
const {
  originalGeneratedImages,
  base64GeneratedImages,
  isLoadingImages,
  isReceivedImagesSVGForm,
} = storeToRefs(aiImageGeneratorDialogStore);

/**
 * A reactive variable to track the index of the currently displayed image in the slider.
 * @type {ref<number>}
 */
const imageSliderNumber = ref<number>(0);

/**
 * A reactive variable to track the full-screen state of the image viewer.
 * @type {ref<boolean>}
 */
const isFullScreen = ref<boolean>(false);

/**
 * Toggles the full-screen mode for the image viewer.
 */
const handleFullScreen = () => {
  isFullScreen.value = !isFullScreen.value;
};

/**
 * Initiates the image download process by opening a dialog.
 * The dialog prompts the user to name the image before downloading.
 */
const handleDownloadImage = async () => {
  $q.dialog({
    component: AiImageNameDialog,
    componentProps: {
      isReceivedImagesSVGForm: isReceivedImagesSVGForm.value,
      downloadImage,
    },
  });
};

/**
 * Downloads the selected image from the slider.
 *
 * It fetches the image, creates a temporary blob URL, and triggers a download
 * using a temporary anchor element. It also revokes the blob URL to free up memory.
 *
 * @param {string} name - The name to save the image as.
 */
const downloadImage = async (name: string) => {
  const imageSrc = originalGeneratedImages.value[imageSliderNumber.value];
  const blob = await fetch(imageSrc).then((res) => res.blob());
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const imageName = name + (isReceivedImagesSVGForm.value ? '.svg' : '.png');
  link.download = imageName;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Initiates the process of using the selected image by opening a dialog.
 * This function is used to convert the image to G-code for further processing.
 */
const handleUseImage = async () => {
  $q.dialog({
    component: AiImageNameDialog,
    componentProps: {
      isReceivedImagesSVGForm: isReceivedImagesSVGForm.value,
      useImage,
    },
  });
};

/**
 * Converts the selected image into a G-code file and adds it to the system.
 *
 * This function fetches the image, uploads it as a media file, adds it to the
 * G-code convertor's list of images, closes the AI generator dialog, and updates
 * the G-code file settings.
 *
 * @param {string} name - The name to save the image as in the system.
 */
const useImage = async (name: string) => {
  const imageSrc = originalGeneratedImages.value[imageSliderNumber.value];
  const imageName = name + (isReceivedImagesSVGForm.value ? '.svg' : '.png');
  const image = await fileFromMediaUrl(imageSrc, imageName);
  await mediaFilesManagementStore.uploadMediaFile(image);
  await imageToGcodeConvertorStore.addNewImageData(image);
  aiImageGeneratorDialogStore.closeAIGeneratorDialog();
  materialLibraryStore.updateGcodeFileSettings();
};

/**
 * Initiates the process of saving the selected image to the system by opening a dialog.
 */
const handleSaveImage = async () => {
  $q.dialog({
    component: AiImageNameDialog,
    componentProps: {
      isReceivedImagesSVGForm: isReceivedImagesSVGForm.value,
      saveImage,
    },
  });
};

/**
 * Saves the selected image to the system's media files.
 *
 * This function fetches the image, converts it to a file, and uploads it
 * to the system via the `mediaFilesManagementStore`. It then displays a
 * success notification to the user.
 *
 * @param {string} name - The name to save the image as in the system.
 */
const saveImage = async (name: string) => {
  const imageSrc = originalGeneratedImages.value[imageSliderNumber.value];
  const imageName = name + (isReceivedImagesSVGForm.value ? '.svg' : '.png');
  const image = await fileFromMediaUrl(imageSrc, imageName);
  await mediaFilesManagementStore.uploadMediaFile(image).then(() => {
    notifyMessage.success('Image saved successfully in the system');
  });
};
</script>
<style scoped>
.images-container {
  width: 100%;
  height: 50vh;
  position: relative;
  background-color: white;
  border-radius: 5px;
  border: 2px solid gray;
}

.images-style {
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
</style>
