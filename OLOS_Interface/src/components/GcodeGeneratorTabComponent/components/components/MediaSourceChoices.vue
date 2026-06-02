<template>
  <div class="column flex-center full-width q-pa-md">
    <p class="title-text-size">Choice {{ mediaType }} Source</p>
    <div class="row flex-center q-gutter-md">
      <q-btn
        :label="`Browse Uploaded ${mediaType}`"
        color="brown-5"
        stack
        icon="search"
        size="2vh"
        class="source-button"
        @click="
          mediaFilesManagementStore.showUploadedMediaFilesDialog(mediaType)
        "
      />
      <q-btn
        v-if="isUSBStorageConnected"
        :label="`Check USB ${mediaType} Files`"
        color="purple-5"
        stack
        icon="usb"
        class="source-button"
        @click="usbMonitorStore.showMediaUSBFilesDialog(mediaType)"
      />

      <div
        v-if="
          config?.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER &&
          config.laser_cutter_settings?.ai_image_generator
        "
        class="column items-center"
      >
        <q-btn
          label="Generate Using AI"
          color="blue-5"
          stack
          icon="smart_toy"
          class="source-button"
          @click="aiImageGeneratorDialogStore.showAIGeneratorDialog"
        />
      </div>

      <q-btn
        :label="`Pick ${mediaType} Files`"
        color="green"
        stack
        icon="attach_file"
        class="source-button"
        @click="mediaFilesInput?.pickFiles()"
      >
        <q-file
          ref="mediaFilesInput"
          v-model="mediaFiles"
          :accept="
            props.mediaType === Constants.MEDIA_TYPES.IMAGES
              ? Constants.MEDIA_FILES_EXTENSIONS.IMAGES.join(',')
              : Constants.MEDIA_FILES_EXTENSIONS.THREE_D_MODELS.join(',')
          "
          :max-file-size="Constants.MAX_MEDIA_FILE_SIZE"
          multiple
          @rejected="onRejected"
          style="display: none"
          @update:model-value="handleAddNewMediaFiles"
        />
      </q-btn>
    </div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useUSBMonitorStore } from 'src/stores/usb-monitor';
import { useAiImageGeneratorStore } from 'src/stores/ai-image-generator';
import { useMediaFilesManagementStore } from 'src/stores/media-files-management';
import { ref } from 'vue';
import { QFile } from 'quasar';
import { Constants } from 'src/constants';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { RejectedFileEntry } from 'src/interfaces/imageToGcode.interface';
import { Config } from 'src/interfaces/configSettings.interface';
import { useImageToGcodeConvertor } from 'src/stores/image-to-gcode';
import { useMaterialLibraryStore } from 'src/stores/material-library';
import { use3DSlicingStore } from 'src/stores/3d-slicing';

/**
 * Defines the props for the component.
 *
 * @property {Config | null} config - The machine's configuration settings.
 * @property {string} mediaType - The type of media to handle, such as 'images' or '3d_models'.
 */
const props = defineProps<{
  config: Config | null;
  mediaType: string;
}>();

/**
 * Reactive references to Quasar and native HTML elements for file handling.
 *
 * @property {QFile | null} mediaFilesInput - A reference to the Quasar file picker component.
 * @property {Array<File> | File | null} mediaFiles - A reactive variable to hold the selected file(s).
 */
const mediaFilesInput = ref<QFile | null>(null);
const mediaFiles = ref<Array<File> | File | null>(null);

// Access Pinia stores for application state management.
const aiImageGeneratorDialogStore = useAiImageGeneratorStore();
const mediaFilesManagementStore = useMediaFilesManagementStore();
const imageToGcodeConvertorStore = useImageToGcodeConvertor();
const usbMonitorStore = useUSBMonitorStore();
const materialLibraryStore = useMaterialLibraryStore();
const sliceStore = use3DSlicingStore();

/**
 * Destructures reactive properties from the store using `storeToRefs`.
 *
 * @property {boolean} isUSBStorageConnected - A boolean flag indicating if a USB storage device is connected.
 */
const { isUSBStorageConnected } = storeToRefs(usbMonitorStore);

// Utility function for showing notifications.
const notifyMessage = showNotifyMessage();

/**
 * Handles the process of adding new media files.
 *
 * This function iterates through a list of files, uploads each one to the system
 * via the `mediaFilesManagementStore`, and then passes the file data to the
 * appropriate application store (`imageToGcodeConvertorStore` or `sliceStore`)
 * based on the `mediaType` prop. Finally, it closes the relevant dialogs and
 * clears the local `mediaFiles` array.
 *
 * @param {Array<File>} files - An array of file objects to be processed.
 */
const handleAddNewMediaFiles = (files: Array<File>) => {
  files.forEach(async (file) => {
    await mediaFilesManagementStore.uploadMediaFile(file);
    if (props.mediaType === Constants.MEDIA_TYPES.IMAGES) {
      await imageToGcodeConvertorStore.addNewImageData(file);
      materialLibraryStore.updateGcodeFileSettings();
    } else {
      sliceStore.addNew3DModelToSlicingContainer(file);
    }
  });
  mediaFilesManagementStore.closeUploadedMediaFilesDialog();
  mediaFilesManagementStore.closeAddNewMediaDialog();
  mediaFiles.value = null;
};

/**
 * Handles rejected file uploads and displays appropriate notifications.
 *
 * This function is a handler for Quasar's file picker `onRejected` event.
 * It iterates through the rejected files and shows a user-friendly error
 * message based on the reason for rejection, such as max file size, file type, etc.
 *
 * @param {RejectedFileEntry[]} rejectedEntries - An array of rejected file objects.
 */
const onRejected = (rejectedEntries: RejectedFileEntry[]) => {
  rejectedEntries.forEach((entry) => {
    const notifyMessage = showNotifyMessage();
    switch (entry.failedPropValidation) {
      case Constants.UPLOAD_FILES_ERRORS.MAX_FILES.NAME:
        notifyMessage.error(Constants.UPLOAD_FILES_ERRORS.MAX_FILES.MESSAGE);
        break;
      case Constants.UPLOAD_FILES_ERRORS.MAX_FILE_SIZE.NAME:
        notifyMessage.error(
          Constants.UPLOAD_FILES_ERRORS.MAX_FILE_SIZE.MESSAGE
        );
        break;
      case Constants.UPLOAD_FILES_ERRORS.ACCEPT.NAME:
        notifyMessage.error(Constants.UPLOAD_FILES_ERRORS.ACCEPT.MESSAGE);
        break;
      case Constants.UPLOAD_FILES_ERRORS.DUPLICATE.NAME:
        notifyMessage.error(Constants.UPLOAD_FILES_ERRORS.DUPLICATE.MESSAGE);
        break;
      default:
        notifyMessage.error(Constants.UPLOAD_FILES_ERRORS.DEFAULT.MESSAGE);
    }
  });
};
</script>
<style scoped>
.source-button {
  font-size: 2vh;
  max-width: 40vh;
}
</style>
