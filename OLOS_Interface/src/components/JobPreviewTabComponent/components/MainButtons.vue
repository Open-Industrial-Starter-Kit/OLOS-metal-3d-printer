<template>
  <div class="row full-width items-center justify-between main-buttons-header">
    <div class="row flex-center col-lg col-md col-sm-6 col-xs-6">
      <q-toggle
        v-model="gcodePreviewerGraphSettings.showGrid"
        @update:model-value="handleGridToggleClick"
        color="green"
        label="Grid"
        :icon="gcodePreviewerGraphSettings.showGrid ? 'grid_off' : 'grid_on'"
        class="col-md col-xs-12"
        size="xs"
        name="showGrid"
        :disable="isGcodeError || isGcodeBiggerThanPlatform"
        style="z-index: 1"
      />
      <q-toggle
        v-if="config?.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER"
        v-model="gcodePreviewerGraphSettings.showCamera"
        @update:model-value="handleCameraToggleClick"
        color="light-blue-9"
        :icon="
          gcodePreviewerGraphSettings.showCamera ? 'videocam_off' : 'videocam'
        "
        label="Camera"
        class="col-md col-xs-12"
        size="xs"
        name="showCamera"
        :disable="isGcodeError || isGcodeBiggerThanPlatform"
        style="z-index: 1"
      />
      <q-toggle
        v-if="config?.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER"
        v-model="gcodePreviewerGraphSettings.showLabels"
        @update:model-value="handleLabelToggleClick"
        color="deep-orange-6"
        icon="design_services"
        label="Labels"
        class="col-md col-xs-12"
        size="xs"
        name="showLabel"
        :disable="isGcodeError || isGcodeBiggerThanPlatform"
        style="z-index: 1"
      />
    </div>
    <div class="row justify-end ccol-lg col-md col-sm-6 col-xs-6 q-gutter-sm">
      <q-btn
        @click="downloadPNG"
        stack
        color="green-6"
        icon="image"
        label="Download png file"
        class="col-lg-5 col-md-5 col-sm-6 col-xs-6"
        size="1vh"
        :disable="isGcodeError || isGcodeBiggerThanPlatform"
        :loading="isDownloadingPNG"
        style="z-index: 1"
      />
      <q-btn
        @click="downloadSVG"
        stack
        color="red-9"
        icon="web_asset"
        label="Download Svg file"
        class="col-lg-5 col-md-5 col-sm-6 col-xs-6"
        size="1vh"
        :disable="isGcodeError || isGcodeBiggerThanPlatform"
        :loading="isDownloadingSVG"
        style="z-index: 1"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useJobsFilesManagementStore } from 'src/stores/jobs-files-management';
import { useGcodePreviewStore } from 'src/stores/gcode-preview';
import { createSVGString } from 'src/services/gcode.previewer.service/gcode.svg.helper.service';
import { onMounted, ref, watch } from 'vue';
import { Config } from 'src/interfaces/configSettings.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { Constants } from 'src/constants';
import { getPlatformDimensions } from 'src/services/gcode.previewer.service/gcode.previewer.helper.service';

// Access Pinia stores for G-code preview and job file management.
const gcodePreviewStore = useGcodePreviewStore();
const jobManagerStore = useJobsFilesManagementStore();

/**
 * Reactive variables for component state.
 * @type {ref<Config | null>}
 */
const config = ref<Config | null>(null);

/**
 * Destructures reactive properties from the stores using `storeToRefs`.
 *
 * @property {boolean} isGcodeError - Flag for G-code parsing errors.
 * @property {boolean} isGcodeBiggerThanPlatform - Flag if the G-code exceeds the platform size.
 * @property {any} gcodePreviewerGraphSettings - Settings for the previewer graph.
 * @property {string} gcodeJobSVGString - The SVG content of the G-code job.
 * @property {any} fileData - The data of the currently active job file.
 */
const {
  isGcodeError,
  isGcodeBiggerThanPlatform,
  gcodePreviewerGraphSettings,
  gcodeJobSVGString,
} = storeToRefs(gcodePreviewStore);
const { fileData } = storeToRefs(jobManagerStore);

/**
 * Reactive flags for download button states.
 */
const isDownloadingSVG = ref(false);
const isDownloadingPNG = ref(false);

/**
 * Handles the toggling of the G-code preview grid.
 * @param {boolean} newShowGrid - The new state of the grid visibility.
 */
const handleGridToggleClick = (newShowGrid: boolean) => {
  if (newShowGrid) {
    gcodePreviewStore.showGrid();
  } else {
    gcodePreviewStore.hideGrid();
  }
};

/**
 * Handles the toggling of the camera stream.
 * @param {boolean} newShowCamera - The new state of the camera stream.
 */
const handleCameraToggleClick = (newShowCamera: boolean) => {
  if (newShowCamera) {
    gcodePreviewStore.startCameraStream();
  } else {
    gcodePreviewStore.stopCameraStream();
  }
};

/**
 * Handles the toggling of G-code labels.
 * @param {boolean} newShowLabels - The new state of the labels visibility.
 */
const handleLabelToggleClick = (newShowLabels: boolean) => {
  if (newShowLabels) {
    gcodePreviewStore.showLabels();
  } else {
    gcodePreviewStore.hideLabels();
  }
};

/**
 * Converts the G-code preview SVG to an HTML Image element.
 *
 * It uses the `createSVGString` helper to generate a complete SVG string
 * from the SVG content in the store and then converts it into a `Blob`
 * and an `Image` object.
 *
 * @returns {HTMLImageElement | undefined} - The created Image object or `undefined` if config is not available.
 */
const convertSvgToImage = () => {
  if (config.value) {
    const svgString = createSVGString(
      gcodeJobSVGString.value,
      getPlatformDimensions(config.value)
    );
    const svgBlob = new Blob([svgString], {
      type: 'image/svg+xml',
    });
    const svgImage = new Image();
    svgImage.src = URL.createObjectURL(svgBlob);
    return svgImage;
  }
};

/**
 * Initiates the download of the G-code preview as a PNG file.
 *
 * This function converts the SVG preview to a canvas, draws it, and then
 * creates a download link for the resulting PNG image. It also manages
 * a loading state for the download button.
 */
const downloadPNG = () => {
  const svgImage = convertSvgToImage();
  if (svgImage) {
    isDownloadingPNG.value = true;
    svgImage.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      canvas.width = svgImage.width;
      canvas.height = svgImage.height;
      if (ctx) {
        ctx.drawImage(svgImage, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = dataURL;
        downloadLink.download = fileData.value.fileName + '.png';
        downloadLink.click();
        isDownloadingPNG.value = false;
      }
    };
  }
};

/**
 * Initiates the download of the G-code preview as an SVG file.
 *
 * This function generates the SVG string from the store data, creates a `Blob`,
 * and triggers a download of the file. It also manages a loading state.
 */
const downloadSVG = async () => {
  isDownloadingSVG.value = true;
  if (config.value) {
    const svgString = createSVGString(
      gcodeJobSVGString.value,
      getPlatformDimensions(config.value)
    );
    const blob = new Blob([svgString], {
      type: 'image/svg+xml',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileData.value.fileName + '.svg';
    link.click();
    isDownloadingSVG.value = false;
  }
};

/**
 * Lifecycle hook `onMounted`.
 *
 * This hook is called when the component is first mounted. It loads the
 * application configuration asynchronously.
 */
onMounted(async () => (config.value = await configurationSettings()));
</script>
<style scoped>
.main-buttons-header {
  position: sticky;
  background-color: #fff;
  top: 0;
  z-index: 1000;
  padding: 10px 0px 10px 0px;
}
</style>
