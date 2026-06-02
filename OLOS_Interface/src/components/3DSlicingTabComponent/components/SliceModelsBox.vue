<template>
  <q-card
    v-if="!isSlicingContainerEmpty"
    bordered
    class="slice-box no-border-radius q-ma-md"
  >
    <q-card-section v-if="!isSlicingProcess && !isSlicingDone">
      <q-btn
        :color="colorTheme"
        label="Slice"
        icon="layers"
        unelevated
        class="full-width"
        size="sm"
        @click="handleSliceModels"
        :disable="isModelOutsidePlatform || !isValidSlicingSettings"
      />
    </q-card-section>
    <q-card-section v-if="isSlicingProcess">
      <div class="column flex-center full-width q-gutter-y-sm">
        <span class="text-h7"
          >Please wait until the slicing process to finish...</span
        >
        <q-linear-progress
          size="25px"
          :value="sliceProgress"
          :color="colorTheme"
          instant-feedback
        >
          <div class="absolute-full flex flex-center">
            <q-badge
              color="white"
              :text-color="colorTheme"
              :label="progressSliceLabel"
            />
          </div>
        </q-linear-progress>
        <q-btn
          :color="colorTheme"
          label="Cancel"
          outline
          class="full-width"
          size="sm"
          @click="handleCancelSlicingProcess"
        />
      </div>
    </q-card-section>

    <q-card-section v-if="!isSlicingProcess && isSlicingDone">
      <div class="column flex-center full-width q-gutter-y-sm">
        <div class="row full-width items-center justify-between">
          <span class="text-h7 text-bold">Done</span>
          <q-icon name="check_circle" color="green" size="xs" />
        </div>
        <div
          v-if="estimatedPrintTimeLabel"
          class="row full-width items-center justify-between text-caption"
        >
          <span class="text-bold">Estimated print time</span>
          <span>{{ estimatedPrintTimeLabel }}</span>
        </div>
        <div class="row full-width flex-center">
          <q-btn
            color="dark"
            label="Save Locally"
            unelevated
            icon="archive"
            class="col q-mr-sm"
            stack
            size="sm"
            :loading="isSlicingSaveLocallyLoading"
            @click="handleSaveSlicingLocally"
          />
          <q-btn
            color="accent"
            label="Preview"
            unelevated
            icon="preview"
            class="col q-ml-sm"
            stack
            size="sm"
            :loading="isSlicingPreviewerLoading"
            @click="handlePreviewSlice"
          />
        </div>
        <q-btn
          :color="colorTheme"
          label="Slice Again"
          icon="refresh"
          unelevated
          class="full-width"
          size="sm"
          @click="handleSliceModels"
          :disable="isModelOutsidePlatform || !isValidSlicingSettings"
        />
      </div>
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useJobsFilesManagementStore } from 'src/stores/jobs-files-management';
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import PreviewSliceDialog from 'src/components/CustomDialogs/PreviewSliceDialog.vue';
import GcodeFileNameDialog from 'src/components/CustomDialogs/GcodeFileNameDialog.vue';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { Constants } from 'src/constants';
import { useSliceInfoStore } from 'src/stores/slice-info';
import { computed, ref } from 'vue';

/**
 * Quasar instance for UI dialogs and notifications.
 */
const $q = useQuasar();

/**
 * Notification service helper.
 */
const notifyMessage = showNotifyMessage();

/**
 * Store managing 3D slicing state and actions.
 */
const slicingStore = use3DSlicingStore();

/**
 * Store managing job file operations.
 */
const jobManagerStore = useJobsFilesManagementStore();

/**
 * Store managing slice progress and state.
 */
const sliceInfoStore = useSliceInfoStore();

/**
 * Slice info state refs from store.
 */
const { isSlicingProcess, isSlicingDone, sliceProgress } =
  storeToRefs(sliceInfoStore);

/**
 * Slicing validation and scene-related refs from slicing store.
 */
const {
  isValidSlicingSettings,
  isModelOutsidePlatform,
  isSlicingContainerEmpty,
  colorTheme,
  estimatedPrintTimeLabel,
} = storeToRefs(slicingStore);

/**
 * Job files list ref from job manager store.
 */
const { filesListData } = storeToRefs(jobManagerStore);

/**
 * Percentage label for slicing progress (e.g. "42.50%").
 */
const progressSliceLabel = computed(
  () => (sliceProgress.value * 100).toFixed(2) + '%'
);

/**
 * Loading state for slice previewer.
 */
const isSlicingPreviewerLoading = ref<boolean>(false);

/**
 * Loading state for saving slicing result locally.
 */
const isSlicingSaveLocallyLoading = ref<boolean>(false);

/**
 * Starts the slicing process for all models in the scene.
 * - Initializes slice progress tracking.
 * - Catches errors and resets progress if failed.
 */
const handleSliceModels = () => {
  sliceInfoStore.startSliceProgress();
  slicingStore.sliceAllSceneModels().catch((error) => {
    notifyMessage.error(error.message);
    sliceInfoStore.restSliceProgress();
  });
};

/**
 * Cancels the ongoing slicing process.
 * - Resets progress.
 * - Handles errors from cancel request.
 */
const handleCancelSlicingProcess = () => {
  sliceInfoStore.restSliceProgress();
  slicingStore.cancelSlicingProcess().catch((error) => {
    notifyMessage.error(error.message);
  });
};

/**
 * Triggers file name dialog for saving slicing result locally.
 * - Checks if file already exists and prompts overwrite confirmation.
 */
const handleSaveSlicingLocally = () => {
  showFileNameDialog().onOk((name: string) => {
    const filename = `${name}.nc`;
    const filesNameList = filesListData.value.map((fileData) => fileData.file);
    if (filesNameList.includes(filename)) {
      showAlreadyExistFileAlert().onOk(() => saveSlicingResult(filename));
    } else {
      saveSlicingResult(filename);
    }
  });
};

/**
 * Saves slicing result locally using the provided filename.
 * - Shows success or error notifications.
 * @param filename - The filename to save as (including extension).
 */
const saveSlicingResult = (filename: string) => {
  isSlicingSaveLocallyLoading.value = true;
  slicingStore
    .saveSlicingResultLocally(filename)
    .then(() => {
      notifyMessage.success(
        Constants.API_SUCCESS_MESSAGES.SAVE_SLICED_FILE_MESSAGE
      );
      isSlicingSaveLocallyLoading.value = false;
    })
    .catch((error) => {
      notifyMessage.error(error.message);
      sliceInfoStore.restSliceProgress();
      isSlicingSaveLocallyLoading.value = false;
    });
};

/**
 * Previews sliced models in a dialog.
 * - Sets loading state during preview preparation.
 */
const handlePreviewSlice = async () => {
  isSlicingPreviewerLoading.value = true;
  slicingStore.previewSlicedModels().then(() => {
    showPreviewSliceDialog();
    isSlicingPreviewerLoading.value = false;
  });
};

/**
 * Opens the preview slice dialog component.
 */
const showPreviewSliceDialog = () => {
  return $q.dialog({
    component: PreviewSliceDialog,
  });
};

/**
 * Opens a dialog for entering G-code file name.
 */
const showFileNameDialog = () => {
  return $q.dialog({
    component: GcodeFileNameDialog,
  });
};

/**
 * Shows overwrite confirmation if a file with the same name exists.
 */
const showAlreadyExistFileAlert = () => {
  return $q.dialog({
    title: 'Gcode Generator',
    html: true,
    color: 'primary',
    persistent: true,
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
</script>

<style scoped lang="scss">
.slice-box {
  position: absolute;
  bottom: 0;
  right: 0;
  min-width: 20vw;
}
</style>
