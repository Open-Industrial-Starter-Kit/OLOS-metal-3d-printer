import { defineStore } from 'pinia';
import {
  USBFileData,
  USBJobMonitorData,
} from 'src/interfaces/usbMonitor.interface';
import { Dialog } from 'quasar';
import USBJobFilesDialog from 'src/components/CustomDialogs/USBJobFilesDialog.vue';
import USBMediaFilesDialog from 'src/components/CustomDialogs/USBMediaFilesDialog.vue';

/**
 * Pinia store for managing USB storage monitoring,
 * including connection status, device info,
 * and dialogs for displaying USB job and media files.
 */
export const useUSBMonitorStore = defineStore('usbMonitor', {
  state: () => ({
    /** Whether the USB job files dialog is currently shown */
    isJobUSBFilesDialogShown: false as boolean,

    /** Whether the USB media files dialog is currently shown */
    isUSBMediaFilesDialogShown: false as boolean,

    /** Whether a USB storage device is connected */
    isUSBStorageConnected: false as boolean,

    /** Name of the connected USB device */
    usbDeviceName: '' as string,

    /** List of job-related files on the USB device */
    usbJobFilesListData: [] as USBFileData[],

    /** List of media-related files on the USB device */
    usbMediaFilesListData: [] as USBFileData[],
  }),

  actions: {
    /**
     * Updates the USB monitor status from the given data,
     * including connection status, device name, and file lists.
     *
     * @param {USBJobMonitorData} res - The USB job monitor data response.
     */
    updateUSBMonitorStatus(res: USBJobMonitorData) {
      this.isUSBStorageConnected = res.is_connected;
      this.usbDeviceName = res.device_name;
      this.usbJobFilesListData = res.job_files_data;
      this.usbMediaFilesListData = res.media_files_data;
    },

    /**
     * Shows the USB Job Files dialog.
     * Sets the flag and opens a Quasar Dialog component.
     */
    showJobUSBFilesDialog() {
      this.isJobUSBFilesDialogShown = true;
      Dialog.create({
        component: USBJobFilesDialog,
      });
    },

    /**
     * Closes the USB Job Files dialog.
     * Resets the dialog shown flag.
     */
    closeJobUSBFilesDialog() {
      this.isJobUSBFilesDialogShown = false;
    },

    /**
     * Shows the USB Media Files dialog for a specific media type.
     * Opens a Quasar Dialog component and passes the media type as prop.
     *
     * @param {string} mediaType - The type of media to display in the dialog.
     */
    showMediaUSBFilesDialog(mediaType: string) {
      this.isUSBMediaFilesDialogShown = true;
      Dialog.create({
        component: USBMediaFilesDialog,
        componentProps: {
          mediaType,
        },
      });
    },

    /**
     * Closes the USB Media Files dialog.
     * Resets the dialog shown flag.
     */
    closeMediaUSBFilesDialog() {
      this.isUSBMediaFilesDialogShown = false;
    },

    /**
     * Checks if a file (by filename) exists in the USB job files list.
     * If it exists, marks the file as not uploaded (to allow reupload).
     *
     * @param {string} filename - The filename to check for.
     */
    checkIfDeletedFileExistInUSBJobFiles(filename: string) {
      const usbJobFile = this.usbJobFilesListData.find(
        (file) => file.file === filename
      );
      if (usbJobFile) {
        usbJobFile.uploaded = false;
      }
    },

    /**
     * Checks if a media file (by name) exists in the USB media files list.
     * If it exists, marks the media file as not uploaded (to allow reupload).
     *
     * @param {string} mediaName - The media filename to check for.
     */
    checkIfDeletedMediaExistInUSBMediaFiles(mediaName: string) {
      const usbMediaFile = this.usbMediaFilesListData.find(
        (media) => media.file === mediaName
      );
      if (usbMediaFile) {
        usbMediaFile.uploaded = false;
      }
    },
  },
});
