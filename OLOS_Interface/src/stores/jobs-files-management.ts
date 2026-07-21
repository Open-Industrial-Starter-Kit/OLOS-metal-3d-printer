import axios, { AxiosError } from 'axios';
import { defineStore } from 'pinia';
import { Constants } from 'src/constants';
import {
  JobFileData,
  JobsManagerWebsocketData,
  OpenedJobFileData,
} from 'src/interfaces/jobsFilesManagement.interface';
import { GcodeFileData } from 'src/interfaces/imageToGcode.interface';
import API from 'src/services/API.service';
import { useDebuggerDialogStore } from './debugger-dialog';

/**
 * Pinia store managing job files including selection, opening, execution, uploading,
 * downloading, renaming, deleting, and G-code generation.
 */
export const useJobsFilesManagementStore = defineStore('jobsFilesManager', {
  state: () => ({
    /**
     * Reference to the debugger store for logging API interactions and errors.
     */
    debuggerStore: useDebuggerDialogStore(),

    /** Indicates if a file is currently selected. */
    isFileSelected: false as boolean,

    /** Indicates if a file is currently opened (loaded). */
    isFileOpen: false as boolean,

    /** Indicates if a file is in the process of loading from the backend. */
    isFileLoading: false as boolean,

    /** Indicates if the selected file is currently executing on the machine. */
    isFileExecuting: false as boolean,

    /** Filename of the currently selected job file. */
    selectedFilename: '' as string,

    /** Details about the currently opened job file. */
    fileData: {
      fileName: '-',
      fileContent: '',
      materialName: '-',
      materialImage: '',
      materialThickness: '-',
    } as OpenedJobFileData,

    /** List of all available job files retrieved from the backend/system. */
    filesListData: [] as JobFileData[],
  }),

  actions: {
    /**
     * Marks a file as selected by its filename.
     * @param filename - The name of the file to select.
     */
    selectFile(filename: string) {
      this.isFileSelected = true;
      this.selectedFilename = filename;
    },

    /**
     * Checks if there is an open file on the backend and updates state accordingly.
     * Loads file details and files list.
     * Logs the operation in debugger store.
     * Throws an error if the API call fails.
     */
    async checkOpenFile() {
      try {
        this.isFileLoading = true;
        const res = (await API.checkOpenFile()).data;

        if (res.data.fileData.fileName !== '-') {
          this.isFileOpen = true;
          this.fileData = { ...res.data.fileData };
          this.selectedFilename = this.fileData.fileName;
          this.isFileSelected = true;

          this.debuggerStore.addLog(
            new Date(),
            res.type,
            res.data.process,
            `${res.data.fileData.fileName} ${Constants.API_SUCCESS_MESSAGES.OPEN_MESSAGE}`
          );
        }

        this.filesListData = res.data.filesListData;
        this.isFileLoading = false;
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.CONNECTION_DATA_TYPE,
            Constants.JOBS_MANAGER_ERRORS.CHECK_OPEN_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.CHECK_OPEN_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },

    /**
     * Starts execution of the currently opened file on the machine.
     * Logs the execution event.
     * Throws an error if the API call fails.
     */
    async startFileExecution() {
      try {
        const res = (await API.startFile()).data;

        this.debuggerStore.addLog(
          new Date(),
          res.type,
          res.data.process,
          `${res.data.fileData.fileName} ${Constants.API_SUCCESS_MESSAGES.START_MESSAGE}`
        );
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.CONNECTION_DATA_TYPE,
            Constants.JOBS_MANAGER_ERRORS.START_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.START_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },

    /**
     * Opens the currently selected file by loading its content and metadata from the backend.
     * Updates state and logs the open event.
     * Throws an error if the API call fails.
     */
    async openFile() {
      const filename = this.selectedFilename;

      if (!filename) {
        throw new Error('Please select a job file before opening it.');
      }

      try {
        this.isFileLoading = true;

        const res = (await API.openFile(filename)).data;

        this.isFileOpen = true;
        this.fileData = { ...res.data.fileData };
        this.selectedFilename = this.fileData.fileName;
        this.isFileSelected = true;

        this.debuggerStore.addLog(
          new Date(),
          res.type,
          res.data.process,
          `${res.data.fileData.fileName} ${Constants.API_SUCCESS_MESSAGES.OPEN_MESSAGE}`
        );
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.JOBS_MANAGER_DATA_TYPE,
            Constants.JOBS_MANAGER_ERRORS.OPEN_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.OPEN_MESSAGE +
              error.response?.data.detail
          );
        }
        throw error;
      } finally {
        this.isFileLoading = false;
      }
    },

    /**
     * Deletes a specified file from the backend.
     * If the deleted file is currently opened, resets the file-related state.
     * Updates files list and logs the deletion.
     * Throws an error if the API call fails.
     * @param filename - The name of the file to delete.
     */
    async deleteFile(filename: string) {
      try {
        const res = (await API.deleteFile(filename)).data;

        if (filename === this.fileData.fileName) {
          this.fileData = {
            fileName: '-',
            fileContent: '',
            materialName: '-',
            materialImage: '',
            materialThickness: '-',
          };
          this.isFileOpen = false;
          this.isFileSelected = false;
          this.selectedFilename = '';
        }

        this.debuggerStore.addLog(
          new Date(),
          res.type,
          res.data.process,
          `${res.data.fileData.fileName} ${Constants.API_SUCCESS_MESSAGES.DELETE_MESSAGE}`
        );

        this.filesListData = res.data.filesListData;
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.JOBS_MANAGER_DATA_TYPE,
            Constants.JOBS_MANAGER_ERRORS.DELETE_FILE,
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
     * Downloads the specified file from the backend.
     * Triggers browser download of the file.
     * Reopens the file if it is currently opened.
     * Logs the download event.
     * Throws an error if the API call fails.
     * @param filename - The name of the file to download.
     */
    async downloadFile(filename: string) {
      try {
        const res = await API.downloadFile(filename);
        const blob = new Blob([res.data], {
          type: res.headers['content-type'],
        });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (filename === this.fileData.fileName) {
          this.openFile();
        }

        this.debuggerStore.addLog(
          new Date(),
          Constants.JOBS_MANAGER_DATA_TYPE,
          ' ',
          `${filename} ${Constants.API_SUCCESS_MESSAGES.DOWNLOAD_MESSAGE}`
        );
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.JOBS_MANAGER_DATA_TYPE,
            Constants.JOBS_MANAGER_ERRORS.DOWNLOAD_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.DOWNLOAD_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },

    /**
     * Renames a file on the backend.
     * Updates current file info and selected filename if applicable.
     * Updates files list and logs the rename event.
     * Throws an error if the API call fails.
     * @param oldFilename - The current name of the file.
     * @param newFilename - The new name for the file.
     */
    async renameFile(oldFilename: string, newFilename: string) {
      try {
        const res = (await API.renameFile(oldFilename, newFilename)).data;

        if (oldFilename === this.fileData.fileName) {
          this.fileData.fileName = newFilename;
        }
        this.selectedFilename = newFilename;

        this.debuggerStore.addLog(
          new Date(),
          res.type,
          res.data.process,
          `${res.data.fileData.fileName} ${Constants.API_SUCCESS_MESSAGES.RENAME_MESSAGE}`
        );

        this.filesListData = res.data.filesListData;
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.JOBS_MANAGER_DATA_TYPE,
            Constants.JOBS_MANAGER_ERRORS.RENAME_FILE,
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
     * Saves edited G-code content for a job file.
     * Updates the opened file data and file list so preview and metadata refresh.
     * @param filename - The name of the file to save.
     * @param fileContent - Edited G-code content.
     */
    async saveFile(filename: string, fileContent: string) {
      try {
        this.isFileLoading = true;
        const res = (await API.saveFile(filename, fileContent)).data;

        this.isFileOpen = true;
        this.fileData = { ...res.data.fileData };
        this.selectedFilename = this.fileData.fileName;
        this.isFileSelected = true;
        this.filesListData = res.data.filesListData;

        this.debuggerStore.addLog(
          new Date(),
          res.type,
          res.data.process,
          `${res.data.fileData.fileName} ${Constants.API_SUCCESS_MESSAGES.SAVE_MESSAGE}`
        );
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.JOBS_MANAGER_DATA_TYPE,
            Constants.JOBS_MANAGER_ERRORS.SAVE_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.SAVE_MESSAGE +
              error.response?.data.detail
          );
        }
        throw error;
      } finally {
        this.isFileLoading = false;
      }
    },

    /**
     * Uploads a job file from a USB path to the backend.
     * Updates files list and logs the upload event.
     * Throws an error if the API call fails.
     * @param filePath - The USB file path to upload.
     */
    async uploadJobFileFromUSB(filePath: string) {
      try {
        const res = (await API.uploadJobFileFromUSB(filePath)).data;

        this.debuggerStore.addLog(
          new Date(),
          res.type,
          res.data.process,
          `${res.data.fileData.fileName} ${Constants.API_SUCCESS_MESSAGES.UPLOAD_MESSAGE}`
        );

        this.filesListData = res.data.filesListData;
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.JOBS_MANAGER_DATA_TYPE,
            Constants.JOBS_MANAGER_ERRORS.UPLOAD_FILE,
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
     * Uploads a local G-code job file from the PC into the backend job store.
     * @param file - Local file selected by the user.
     */
    async uploadJobFile(file: File) {
      try {
        const res = (await API.uploadJobFile(file)).data;

        this.debuggerStore.addLog(
          new Date(),
          res.type,
          res.data.process,
          `${file.name} ${Constants.API_SUCCESS_MESSAGES.UPLOAD_MESSAGE}`
        );

        this.filesListData = res.data.filesListData;
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.JOBS_MANAGER_DATA_TYPE,
            Constants.JOBS_MANAGER_ERRORS.UPLOAD_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.UPLOAD_MESSAGE +
              error.response?.data.detail
          );
        }
        throw error;
      }
    },

    /**
     * Sends request to generate a G-code file from given data.
     * Updates files list and logs the generation event.
     * Throws an error if the API call fails.
     * @param gcodeFileData - Data required to generate the G-code file.
     */
    async generateGcodeFile(gcodeFileData: GcodeFileData) {
      try {
        const res = (await API.generateGcodeFile(gcodeFileData)).data;

        if (res.data.fileData) {
          this.debuggerStore.addLog(
            new Date(),
            res.type,
            res.data.process,
            `${res.data.fileData.fileName} ${Constants.API_SUCCESS_MESSAGES.GENERATE_MESSAGE}`
          );
        }

        this.filesListData = res.data.filesListData;
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.JOBS_MANAGER_DATA_TYPE,
            Constants.JOBS_MANAGER_ERRORS.GENERATE_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.GENERATE_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },

    /**
     * Cancels an ongoing G-code file generation request.
     * Throws an error if the API call fails.
     */
    async cancelGenerateGcodeFile() {
      try {
        await API.cancelGenerateGcodeFile();
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.JOBS_MANAGER_DATA_TYPE,
            Constants.JOBS_MANAGER_ERRORS.GENERATE_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.CANCEL_GENERATE_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },

    /**
     * Updates the file manager status based on websocket data.
     * Updates the opened file content and files list if present in the update.
     * @param res - Websocket data containing file manager updates.
     */
    updateFileManagerStatus(res: JobsManagerWebsocketData) {
      if (res.opened_file) {
        this.selectedFilename = res.opened_file;
        this.fileData.fileContent = res.file_content;
        this.fileData.fileName = this.selectedFilename;
      }
      if (res.files_list) this.filesListData = res.files_list;
    },
  },
});
