import axios, { AxiosError } from 'axios';
import { defineStore } from 'pinia';
import { Dialog } from 'quasar';
import { Constants } from 'src/constants';
import { MediaFileData } from 'src/interfaces/mediaFilesManagement.interface';
import API from 'src/services/API.service';
import { fileFromMediaUrl } from 'src/services/media.helper.service';
import { useDebuggerDialogStore } from 'src/stores/debugger-dialog';
import UploadedMediaFilesDialog from 'src/components/CustomDialogs/UploadedMediaFilesDialog.vue';
import AddNewMediaDialog from 'src/components/CustomDialogs/AddNewMediaDialog.vue';
import { configurationSettings } from 'src/services/configuration.loader.service';

/**
 * Pinia store for managing media files upload, download, rename, delete,
 * and UI dialogs related to media file management.
 *
 * It integrates with the backend API and handles logging via the debugger store.
 */
export const useMediaFilesManagementStore = defineStore('mediaFilesManager', {
  state: () => ({
    /** Reference to the debugger dialog store for logging events */
    debuggerStore: useDebuggerDialogStore(),

    /** Flag indicating if the "Uploaded Media Files" dialog is currently shown */
    isUploadedMediaDialogShown: false as boolean,

    /** Flag indicating if the "Add New Media" dialog is currently shown */
    isAddNewMediaDialogShown: false as boolean,

    /** List of media files currently available, updated from the backend */
    mediaListData: [] as MediaFileData[],
  }),

  actions: {
    /**
     * Uploads a media file to the server.
     * Logs success or error to the debugger store.
     * Updates the media list with fresh data from the server.
     * @param mediaFile - The File object to be uploaded
     * @throws Error with API error message if upload fails
     */
    async uploadMediaFile(mediaFile: File) {
      try {
        const res = (await API.uploadMedia(mediaFile)).data;

        this.debuggerStore.addLog(
          new Date(),
          res.type,
          res.data.process,
          `${res.data.mediaData.mediaName} ${Constants.API_SUCCESS_MESSAGES.UPLOAD_MESSAGE}`
        );

        this.mediaListData = res.data.mediaListData;
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.MEDIA_MANAGER_DATA_TYPE,
            Constants.MEDIA_MANAGER_ERRORS.UPLOAD_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.UPLOAD_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },

    /**
     * Uploads a media file from a USB device path.
     * Useful for importing media directly from USB storage.
     * Logs and updates media list similarly to uploadMediaFile.
     * @param mediaPath - Path string pointing to the media file on USB
     * @throws Error with API error message if upload fails
     */
    async uploadMediaFileFromUSB(mediaPath: string) {
      try {
        const res = (await API.uploadMediaFileFromUSB(mediaPath)).data;

        this.debuggerStore.addLog(
          new Date(),
          res.type,
          res.data.process,
          `${res.data.mediaData.mediaName} ${Constants.API_SUCCESS_MESSAGES.UPLOAD_MESSAGE}`
        );

        this.mediaListData = res.data.mediaListData;
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.MEDIA_MANAGER_DATA_TYPE,
            Constants.MEDIA_MANAGER_ERRORS.UPLOAD_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.UPLOAD_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },

    /**
     * Retrieves the current list of media files from the server.
     * Updates the mediaListData state.
     * Logs errors if the API call fails.
     * @throws Error with API error message if listing fails
     */
    async listMedia() {
      try {
        const res = (await API.listMediaData()).data;
        this.mediaListData = res.data.mediaListData;
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.MEDIA_MANAGER_DATA_TYPE,
            Constants.MEDIA_MANAGER_ERRORS.LIST_MEDIA_DATA,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.LIST_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },

    /**
     * Renames an existing media file on the server.
     * Logs the action and updates media list with the server response.
     * @param oldMediaName - The current media file name
     * @param newMediaName - The desired new media file name
     * @throws Error with API error message if rename fails
     */
    async renameMediaFile(oldMediaName: string, newMediaName: string) {
      try {
        const res = (await API.renameMedia(oldMediaName, newMediaName)).data;

        this.debuggerStore.addLog(
          new Date(),
          res.type,
          res.data.process,
          `${res.data.mediaData.mediaName} ${Constants.API_SUCCESS_MESSAGES.RENAME_MESSAGE}`
        );

        this.mediaListData = res.data.mediaListData;
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.MEDIA_MANAGER_DATA_TYPE,
            Constants.MEDIA_MANAGER_ERRORS.RENAME_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.RENAME_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },

    /**
     * Deletes a media file from the server.
     * Logs the deletion and updates the media list.
     * @param mediaName - The name of the media file to delete
     * @throws Error with API error message if deletion fails
     */
    async deleteMediaFile(mediaName: string) {
      try {
        const res = (await API.deleteMedia(mediaName)).data;

        this.debuggerStore.addLog(
          new Date(),
          res.type,
          res.data.process,
          `${res.data.mediaData.mediaName} ${Constants.API_SUCCESS_MESSAGES.DELETE_MESSAGE}`
        );

        this.mediaListData = res.data.mediaListData;
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.MEDIA_MANAGER_DATA_TYPE,
            Constants.MEDIA_MANAGER_ERRORS.DELETE_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.DELETE_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },

    /**
     * Downloads a media file by fetching it and triggering a browser download.
     * @param mediaName - The name of the media file to download
     */
    async downloadMediaFile(mediaName: string) {
      const media = await this.fetchMediaFile(mediaName);
      if (media) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(media);
        link.download = mediaName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
    },

    /**
     * Fetches a media file from the server as a Blob/File object.
     * Logs success or errors.
     * @param mediaName - The name of the media file to fetch
     * @returns A File object representing the media, or undefined if failed
     * @throws Error with API error message if fetching fails
     */
    async fetchMediaFile(mediaName: string) {
      try {
        const res = (await API.fetchMediaData(mediaName)).data;
        this.debuggerStore.addLog(
          new Date(),
          res.type,
          res.data.process,
          `${res.data.mediaData.mediaName} ${Constants.API_SUCCESS_MESSAGES.FETCH_MESSAGE}`
        );
        return fileFromMediaUrl(
          res.data.mediaData.mediaSource,
          res.data.mediaData.mediaName
        );
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.MEDIA_MANAGER_DATA_TYPE,
            Constants.MEDIA_MANAGER_ERRORS.FETCH_MESSAGE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.FETCH_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },

    /**
     * Shows the "Add New Media" dialog.
     * Loads configuration settings before opening the dialog.
     * @param mediaType - The type of media to add (e.g., image, video)
     */
    async showAddNewMediaDialog(mediaType: string) {
      this.isAddNewMediaDialogShown = true;
      const config = await configurationSettings();
      Dialog.create({
        component: AddNewMediaDialog,
        componentProps: {
          config,
          mediaType,
        },
      });
    },

    /**
     * Closes the "Add New Media" dialog.
     */
    closeAddNewMediaDialog() {
      this.isAddNewMediaDialogShown = false;
    },

    /**
     * Shows the dialog listing uploaded media files.
     * @param mediaType - The type of media to list (e.g., image, video)
     */
    showUploadedMediaFilesDialog(mediaType: string) {
      this.isUploadedMediaDialogShown = true;
      Dialog.create({
        component: UploadedMediaFilesDialog,
        componentProps: {
          mediaType,
        },
      });
    },

    /**
     * Closes the uploaded media files dialog.
     */
    closeUploadedMediaFilesDialog() {
      this.isUploadedMediaDialogShown = false;
    },
  },
});
