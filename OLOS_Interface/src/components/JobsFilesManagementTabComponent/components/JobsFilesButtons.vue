<template>
  <div class="row fititems-center justify-between">
    <div class="row q-gutter-x-md col-lg col-md col-sm-12 col-xs-12">
      <q-btn
        icon="file_open"
        label="Open Job"
        text-color="black"
        :color="isFileSelected ? 'grey-4' : 'blue-grey-2'"
        :disable="!isFileSelected"
        @click="handleOpenJob"
        size="2vh"
        class="q-mb-md"
      />
      <q-btn
        icon="edit_square"
        label="Rename Job"
        text-color="black"
        :color="isFileSelected ? 'grey-4' : 'blue-grey-2'"
        :disable="!isFileSelected"
        @click="handleRenameJob"
        size="2vh"
        class="q-mb-md"
      />
    </div>
    <div
      class="row col-lg-5 col-md-5 col-sm-12 col-xs-12"
      :class="{
        'justify-end': $q.screen.gt.sm,
      }"
    >
      <q-btn
        v-if="isUSBStorageConnected"
        icon="usb"
        label="Check USB Jobs Files"
        text-color="black"
        color="grey-4"
        size="2vh"
        @click="usbMonitorStore.showJobUSBFilesDialog"
        class="q-mb-md"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useJobsFilesManagementStore } from 'src/stores/jobs-files-management';
import { useUSBMonitorStore } from 'src/stores/usb-monitor';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { Constants } from 'src/constants';
import RenameFileDialog from 'src/components/CustomDialogs/RenameFileDialog.vue';
// Get the Quasar instance
const $q = useQuasar();

// Initialize the notification service
const notifyMessage = showNotifyMessage();
// Access Pinia stores for job file management and USB monitoring.
const jobManagerStore = useJobsFilesManagementStore();
const usbMonitorStore = useUSBMonitorStore();

/**
 * Destructures reactive properties from the stores using `storeToRefs`.
 */
const { filesListData, selectedFilename, isFileSelected } =
  storeToRefs(jobManagerStore);
const { isUSBStorageConnected } = storeToRefs(usbMonitorStore);

/**
 * Handles the action to open a selected job file.
 *
 * It calls the `openFile` action from the `jobManagerStore` and provides
 * user feedback via a success or error notification.
 */
const handleOpenJob = () => {
  jobManagerStore
    .openFile()
    .then(() => {
      notifyMessage.success(Constants.API_SUCCESS_MESSAGES.OPEN_MESSAGE);
    })
    .catch((error) => {
      notifyMessage.error(error.message);
    });
};

/**
 * Displays a Quasar dialog for renaming the currently selected job file.
 *
 * It passes the list of files and the selected filename to the dialog component
 * along with a callback function (`renameJob`) to handle the renaming logic.
 */
const handleRenameJob = () => {
  $q.dialog({
    component: RenameFileDialog,
    componentProps: {
      filesListData: filesListData.value,
      filename: selectedFilename.value,
      renameJob,
    },
  });
};

/**
 * Performs the actual renaming of a job file via a backend API call.
 *
 * It calls the `renameFile` action from the `jobManagerStore` and provides
 * user feedback with a success or error notification.
 *
 * @param {string} newFilename - The new name for the file.
 */
const renameJob = (newFilename: string) => {
  jobManagerStore
    .renameFile(selectedFilename.value, newFilename)
    .then(() => {
      notifyMessage.success(Constants.API_SUCCESS_MESSAGES.RENAME_MESSAGE);
    })
    .catch((error) => {
      notifyMessage.error(error.message);
    });
};
</script>
