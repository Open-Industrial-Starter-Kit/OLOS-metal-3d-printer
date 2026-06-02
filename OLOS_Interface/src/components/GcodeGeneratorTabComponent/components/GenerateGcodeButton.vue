<template>
  <transition
    appear
    enter-active-class="animated  fadeIn"
    leave-active-class="animated fadeOut"
  >
    <q-btn
      v-if="isGenerateGcodeButtonDisplayed"
      label="Generate Gcode"
      icon="note_add"
      size="2vh"
      color="primary"
      unelevated
      class="self-start"
      @click="handleGenerateGcode"
      :loading="isGeneratingFile"
    />
  </transition>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useTabsStore } from 'src/stores/active-tab';
import { useJobsFilesManagementStore } from 'src/stores/jobs-files-management';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { useImageToGcodeConvertor } from 'src/stores/image-to-gcode';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { svgElementToBase64 } from 'src/services/svg.editor.service';
import { drawImageOnCanvas } from 'src/services/image.editor.service';
import { Constants } from 'src/constants';
import {
  GcodeFileData,
  ModifiedImageData,
} from 'src/interfaces/imageToGcode.interface';
import { Config } from 'src/interfaces/configSettings.interface';
import GcodeFileNameDialog from 'src/components/CustomDialogs/GcodeFileNameDialog.vue';
import { ref, computed } from 'vue';

/**
 * Defines the props for the component.
 *
 * @property {Config | null} config - The machine's configuration settings.
 */
const props = defineProps<{
  config: Config | null;
}>();

// Use Quasar's hook to access its plugins.
const $q = useQuasar();

// Access Pinia stores for application state management.
const tabsStore = useTabsStore();
const imageToGcodeConvertorStore = useImageToGcodeConvertor();
const jobManagerStore = useJobsFilesManagementStore();
const machineStatusStore = useMachineStatusStore();

/**
 * Destructures reactive properties from the stores using `storeToRefs`.
 *
 * @property {Array<NavTabs>} navList - The list of navigation tabs.
 * @property {Array<JobFileData>} filesListData - The list of existing job files.
 * @property {string} machineState - The current state of the machine.
 */
const { navList } = storeToRefs(tabsStore);
const { filesListData } = storeToRefs(jobManagerStore);
const { machineState } = storeToRefs(machineStatusStore);

// Utility function for showing notifications.
const notifyMessage = showNotifyMessage();

/**
 * Reactive variable to track if the G-code file generation is in progress.
 * @type {ref<boolean>}
 */
const isGeneratingFile = ref<boolean>(false);

/**
 * A computed property to determine if the "Generate G-code" button should be displayed.
 *
 * The button is displayed only if there is at least one modified image (SVG or raster)
 * and no image is currently being loaded.
 *
 * @returns {boolean} - `true` if the button should be displayed, `false` otherwise.
 */
const isGenerateGcodeButtonDisplayed = computed(
  () =>
    imageToGcodeConvertorStore.generatorImagesDataList.filter(
      (imageData) =>
        imageData.modifiedSVGCutting ||
        imageData.modifiedSVGMarking ||
        imageData.modifiedEngravingImage
    ).length && !imageToGcodeConvertorStore.isImageLoading
);

/**
 * Initiates the G-code generation process.
 *
 * This function is the main entry point for generating G-code. It first checks if all
 * images have been modified. If so, it collects the modified image data, sorts it
 * based on position, and prompts the user for a filename. It then handles potential
 * filename conflicts and starts the generation process.
 */
const handleGenerateGcode = async () => {
  const modifiedImagesData = [] as Array<ModifiedImageData>;
  let areAllImagesModified = true;

  for (const imageData of imageToGcodeConvertorStore.generatorImagesDataList) {
    if (
      imageData.modifiedSVGCutting ||
      imageData.modifiedSVGMarking ||
      imageData.modifiedEngravingImage
    ) {
      const cuttingSVGBlob = imageData.modifiedSVGCutting
        ? svgElementToBase64(imageData.modifiedSVGCutting)
        : null;
      const markingSVGBlob = imageData.modifiedSVGMarking
        ? svgElementToBase64(imageData.modifiedSVGMarking)
        : null;
      const engravedImageBlob = imageData.modifiedEngravingImage
        ? drawImageOnCanvas(
            imageData.modifiedEngravingImage,
            props.config
          ).toDataURL('image/png')
        : null;

      modifiedImagesData.push({
        modifiedSVGCutting: cuttingSVGBlob,
        modifiedSVGMarking: markingSVGBlob,
        modifiedEngravingImage: engravedImageBlob,
        gcodeSettings: imageData.gcodeSettings,
      });
    } else {
      showNotAllImagesModifiedDialog();
      areAllImagesModified = false;
      break;
    }
  }

  if (areAllImagesModified) {
    const sortedModifiedImagesData = modifiedImagesData.sort((a, b) => {
      const aMetrics = a.gcodeSettings.mainSettings.metrics;
      const bMetrics = b.gcodeSettings.mainSettings.metrics;
      if (aMetrics.y !== bMetrics.y) {
        return aMetrics.y - bMetrics.y;
      }
      return aMetrics.x - bMetrics.x;
    });

    showFileNameDialog().onOk((name: string) => {
      const filename = `${name}.nc`;
      const filesNameList = filesListData.value.map(
        (fileData) => fileData.file
      );
      if (filesNameList.includes(filename)) {
        showAlreadyExistFileAlert().onOk(() =>
          startGeneratingGcode(filename, sortedModifiedImagesData)
        );
      } else {
        startGeneratingGcode(filename, sortedModifiedImagesData);
      }
    });
  }
};

/**
 * Starts the G-code generation API call.
 *
 * This function sets the `isGeneratingFile` flag to `true`, shows a progress dialog,
 * prepares the G-code data, and calls the `generateGcodeFile` action from the store.
 * It handles success and error cases, as well as cancellation of the process.
 *
 * @param {string} filename - The desired name of the G-code file.
 * @param {Array<ModifiedImageData>} modifiedImagesData - The array of modified image data to be converted.
 */
const startGeneratingGcode = (
  filename: string,
  modifiedImagesData: Array<ModifiedImageData>
) => {
  isGeneratingFile.value = true;
  const generatingDialog = showGeneratingFileDialog();

  const gcodeFileData = {
    name: filename,
    modifiedImagesData,
  } as GcodeFileData;

  jobManagerStore
    .generateGcodeFile(gcodeFileData)
    .then(() => {
      if (isGeneratingFile.value) {
        generatingDialog.hide();
        isGeneratingFile.value = false;
        showDoneGeneratingFileDialog();
      }
    })
    .catch((error) => {
      isGeneratingFile.value = false;
      notifyMessage.error(error.message);
    });

  generatingDialog.onCancel(async () => {
    if (isGeneratingFile.value) {
      isGeneratingFile.value = false;
      await jobManagerStore.cancelGenerateGcodeFile();
    }
  });
};

/**
 * Displays a dialog for the user to enter a G-code filename.
 * @returns {DialogChainObject} - The Quasar dialog instance.
 */
const showFileNameDialog = () => {
  return $q.dialog({
    component: GcodeFileNameDialog,
  });
};

/**
 * Displays a progress dialog during G-code generation.
 * @returns {DialogChainObject} - The Quasar dialog instance.
 */
const showGeneratingFileDialog = () => {
  return $q.dialog({
    title: 'Generating...',
    progress: {
      color: 'primary',
    },
    persistent: true,
    ok: false,
    cancel: true,
  });
};

/**
 * Displays a warning dialog if not all images have been modified before generating G-code.
 */
const showNotAllImagesModifiedDialog = () => {
  $q.dialog({
    color: 'primary',
    title: 'Modified Images',
    message:
      'Not all uploaded images in the viewer have been modified. Please ensure all images are updated or remove any unused ones.',
    progress: false,
    ok: true,
  });
};

/**
 * Displays a confirmation dialog if the entered filename already exists.
 * @returns {DialogChainObject} - The Quasar dialog instance.
 */
const showAlreadyExistFileAlert = () => {
  return $q.dialog({
    title: 'Gcode Generator',
    html: true,
    color: 'primary',
    message: 'Do you want to overwrite an already exist job file?',
    ok: {
      color: 'negative',
      label: 'Yes ⚠️',
      push: false,
    },
    cancel: {
      flat: true,
      label: 'No',
    },
  });
};

/**
 * Displays a success dialog after the G-code file has been generated successfully.
 *
 * This dialog provides an option to navigate to the "Jobs Manager" tab.
 */
const showDoneGeneratingFileDialog = () => {
  $q.dialog({
    color: 'primary',
    title: 'Done!',
    message: 'File generated and saved successfully in the Jobs Manager',
    progress: false,
    ok: {
      color: 'primary',
      label: 'Jobs Manager',
      push: false,
      disable: machineState.value === Constants.RUN,
    },
    cancel: true,
  }).onOk(() => tabsStore.changeTab(navList.value.files));
};
</script>
