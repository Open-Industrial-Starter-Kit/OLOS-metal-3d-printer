import { defineStore } from 'pinia';
import {
  LayersRange,
  ModelData,
  PrusaSettings,
  PyslmSettings,
  Slic3rSettings,
  SlicingData,
  SlicerJobProject,
  SlicingSettings,
} from 'src/interfaces/3D.slicing.interface';
import { ThreeDSlicer } from 'src/services/3d.slicer.service';
import { Constants } from 'src/constants';
import axios, { AxiosError } from 'axios';
import API from 'src/services/API.service';
import { useDebuggerDialogStore } from 'src/stores/debugger-dialog';
import { useJobsFilesManagementStore } from './jobs-files-management';
import { useSliceInfoStore } from './slice-info';
import { useMediaFilesManagementStore } from './media-files-management';
import { useGcodePreviewStore } from './gcode-preview';
import { Gcode3DPreviewer } from 'src/services/gcode.previewer.service/gcode.3D.previewer.service';
import { getSliceWorker } from 'src/workers';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { SlicingApiResponse } from 'src/interfaces/API.interface';

/**
 *  Pinia store for managing the state and actions of the 3D slicing interface.
 */
export const use3DSlicingStore = defineStore('3dSlicingStore', {
  state: () => ({
    /** Instance of the debugger dialog store. */
    debuggerStore: useDebuggerDialogStore(),

    /** Instance of the jobs and files management store. */
    jobManagerStore: useJobsFilesManagementStore(),

    /** Instance of the slice info store. */
    sliceInfoStore: useSliceInfoStore(),

    /** Instance of the media files management store. */
    mediaFilesManagementStore: useMediaFilesManagementStore(),

    /** Instance of the G-code preview store. */
    gcodePreviewStore: useGcodePreviewStore(),

    /** The DOM element where the 3D slicing scene is rendered. */
    slicingGraph: document.createElement('div') as HTMLDivElement,

    /** The resulting G-code from the slicing process. */
    slicingResult: '' as string,

    /** Estimated print duration in seconds, calculated from generated G-code. */
    estimatedPrintTimeSeconds: null as number | null,

    /** The instance of the 3D G-code previewer service. */
    slice3DPreviewerInstance: null as Gcode3DPreviewer | null,

    /** Flag indicating if there are any models in the slicing scene. */
    isSlicingContainerEmpty: true as boolean,

    /** Flag indicating when a 3D model is being loaded or processed. */
    isModelLoading: false as boolean,

    /** Flag indicating if the selected model is outside the build platform boundaries. */
    isModelOutsidePlatform: false as boolean,

    /** Toggles the visibility of the grid in the 3D scene. */
    isGridHelperVisible: true as boolean,

    /** Toggles the visibility of the machine coordinate scale in the 3D scene. */
    isCoordinateScaleHelperVisible: false as boolean,

    /** Toggles the visibility of the uploaded models list. */
    isModelsListVisible: true as boolean,

    /** Toggles the visibility of the view helper (orientation cube). */
    isViewerHelperVisible: true as boolean,

    /** Toggles the visibility of the ambient light source helper. */
    isAmbientLightHelperVisible: true as boolean,

    /** Toggles the visibility of the directional light source helper. */
    isDirectionalLightHelperVisible: true as boolean,

    /** Determines if the resizing operation should be uniform across all axes. */
    isResizeUniformed: true as boolean,

    /** Enables non-destructive truncation of the build above a selected height. */
    isPrintHeightLimited: false as boolean,

    /** Maximum model height currently present in the scene. */
    maximumPrintHeight: 0 as number,

    /** Height above the bed up to which layers will be generated. */
    printHeightLimit: 0 as number,

    /** Height above the bed below which layers will be skipped. */
    printHeightLowerLimit: 0 as number,

    /** Data of the currently selected 3D model in the scene. */
    selectedModel: {
      object: null,
      helperBox: null,
      preTransform: null,
      isTransforming: false,
    } as ModelData,

    /** An array containing data for all models loaded into the scene. */
    uploadedModels: [] as Array<ModelData>,

    /** The instance of the 3D slicer service. */
    threeDSlicerInstance: null as ThreeDSlicer | null,

    /** Flag indicating if a new slicing result is available for preview. */
    isNewSlicingProcess: false as boolean,

    /** Project waiting to be restored after the slicer scene is mounted. */
    pendingJobProject: null as SlicerJobProject | null,

    /** Fingerprint of the G-code currently drawn in the slice preview. */
    previewedSlicingResultKey: '' as string,

    /** A list of available slicing profiles. */
    slicingProfilesList: [] as Array<SlicingSettings>,

    /** The name of the currently selected slicing profile. */
    slicingProfileName: 'Default' as string,

    /** The currently selected slicing engine library (e.g., Slic3r, PrusaSlicer). */
    selectedSlicerLib: Constants.SLICING_LIBRARIES.SLIC3R as string,

    /** The configuration settings for the Slic3r engine. */
    slic3rSettings: structuredClone(
      Constants.DEFAULT_SLIC3r_SETTINGS
    ) as Slic3rSettings,

    /** The configuration settings for the PrusaSlicer engine. */
    prusaSettings: structuredClone(
      Constants.DEFAULT_PRUSA_SLICER_SETTINGS
    ) as PrusaSettings,

    /** The configuration settings for the PySLM engine. */
    pyslmSettings: structuredClone(
      Constants.DEFAULT_PYSLM_SETTINGS
    ) as PyslmSettings,
  }),
  getters: {
    /**
     *  Determines the color theme based on the selected slicer library.
     * @returns {string} The color name ('primary', 'orange', or 'green').
     */
    colorTheme(): string {
      return this.selectedSlicerLib === Constants.SLICING_LIBRARIES.SLIC3R
        ? 'primary'
        : this.selectedSlicerLib === Constants.SLICING_LIBRARIES.PRUSA_SLICER
        ? 'orange'
        : 'green';
    },
    /**
     *  Gets the total number of layers from the sliced G-code preview.
     * @returns {number} The total number of layers.
     */
    numberOfLayers(): number {
      if (this.slice3DPreviewerInstance?.numberOfSlicingLayers) {
        return this.slice3DPreviewerInstance.numberOfSlicingLayers;
      }
      return 0;
    },
    /**
     *  Gets the valid layer range for the preview slider.
     * @returns {LayersRange} An object with min and max layer values.
     */
    layersRange(): LayersRange {
      if (this.slice3DPreviewerInstance?.sliderLayerRange) {
        return this.slice3DPreviewerInstance.sliderLayerRange;
      }
      return {
        min: 0,
        max: 0,
      };
    },
    /**
     * Formats the generated G-code time estimate for display.
     * @returns {string} Human-readable duration, or an empty string if unknown.
     */
    estimatedPrintTimeLabel(): string {
      if (
        this.estimatedPrintTimeSeconds === null ||
        this.estimatedPrintTimeSeconds < 0
      ) {
        return '';
      }
      const totalSeconds = Math.round(this.estimatedPrintTimeSeconds);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
      }
      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      }
      return `${seconds}s`;
    },
    /**
     *  Provides a default slicing profile configuration.
     * @returns {SlicingSettings} The default slicing settings object.
     */
    defaultSlicingProfile(): SlicingSettings {
      return {
        profileName: Constants.DEFAULT_SLICING_PROFILE_NAME as string,
        slicingLib: Constants.SLICING_LIBRARIES.SLIC3R as string,
        slic3rSettings: structuredClone(
          Constants.DEFAULT_SLIC3r_SETTINGS
        ) as Slic3rSettings,
        prusaSettings: structuredClone(
          Constants.DEFAULT_PRUSA_SLICER_SETTINGS
        ) as PrusaSettings,
        pyslmSettings: structuredClone(
          Constants.DEFAULT_PYSLM_SETTINGS
        ) as PyslmSettings,
      };
    },
    /**
     *  Validates that all slicing settings have non-empty values.
     * @returns {boolean} True if all settings are valid, otherwise false.
     */
    isValidSlicingSettings(): boolean {
      function hasAllValues(
        obj: Slic3rSettings | PyslmSettings | PrusaSettings
      ) {
        return Object.values(obj).every(
          (value) => value !== undefined && value !== null && value !== ''
        );
      }
      return (
        hasAllValues(this.slic3rSettings) &&
        hasAllValues(this.pyslmSettings) &&
        hasAllValues(this.prusaSettings)
      );
    },
  },

  actions: {
    /**
     *  Initializes the ThreeDSlicer instance if it doesn't exist and draws the 3D container.
     * @returns {Promise<void>}
     */
    async createSlicingContainer() {
      if (!this.threeDSlicerInstance) {
        const config = await configurationSettings();
        this.threeDSlicerInstance = new ThreeDSlicer(config);
      }
      this.threeDSlicerInstance.drawSlicingContainer(this.slicingGraph);
      if (this.pendingJobProject) {
        await this.restorePendingJobProject();
      }
    },
    /**
     *  Exports all models in the scene, sends them to the backend API for slicing, and handles the response.
     * @returns {Promise<void>}
     */
    async sliceAllSceneModels() {
      try {
        if (this.threeDSlicerInstance) {
          const blob = this.threeDSlicerInstance.exportSceneModels(
            Constants.SLICING_FILES_FORMATE.STL
          );

          if (blob) {
            const slicingData = {
              modelFile: await this.threeDSlicerInstance.blobToBase64(blob),
              modelSize: this.threeDSlicerInstance.getModelsGroupSize(),
              printHeightLimit: this.isPrintHeightLimited
                ? this.printHeightLimit
                : undefined,
              printHeightLowerLimit: this.isPrintHeightLimited
                ? this.printHeightLowerLimit
                : undefined,
              slicingSettings: {
                profileName: this.slicingProfileName,
                slicingLib: this.selectedSlicerLib,
                engravingMode: this.prusaSettings.engravingMode,
                recoaterFeedRate: this.prusaSettings.recoaterFeedRate,
                slic3rSettings: this.slic3rSettings,
                prusaSettings: this.prusaSettings,
                pyslmSettings: this.pyslmSettings,
              } as SlicingSettings,
            } as SlicingData;
            const res = (await API.sliceModels(slicingData)).data;

            if (res.data.success) {
              this.isNewSlicingProcess = true;
              this.estimatedPrintTimeSeconds =
                res.data.estimatedPrintTimeSeconds ?? null;

              this.debuggerStore.addLog(
                new Date(),
                res.type,
                res.data.process,
                Constants.API_SUCCESS_MESSAGES.SLICING_MESSAGE
              );
            }
          }
        }
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.SLICE_DATA_TYPE,
            Constants.SLICE_ERRORS.SLICE_MODEL,
            error.response?.data.detail
          );
          // server encountered an unexpected condition
          if (error.status !== 499) {
            throw new Error(
              Constants.API_ERROR_MESSAGES.SLICING_MESSAGE +
                error.response?.data.detail
            );
          }
        }
      }
    },
    /**
     *  Sends a request to the backend API to cancel the currently ongoing slicing process.
     * @returns {Promise<void>}
     */
    async cancelSlicingProcess() {
      try {
        await API.cancelSlicingProcess();
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.SLICE_DATA_TYPE,
            Constants.SLICE_ERRORS.SLICE_MODEL,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.CANCEL_SLICING_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },
    /**
     *  Fetches the G-code result of a completed slicing process from the backend.
     * @returns {Promise<void>}
     */
    async previewSlicedModels() {
      try {
        if (this.isNewSlicingProcess) {
          const res = (await API.previewSlicingProcess()).data;
          if (res.data.success) {
            this.slicingResult = res.data.result;
            this.estimatedPrintTimeSeconds =
              res.data.estimatedPrintTimeSeconds ??
              this.estimatedPrintTimeSeconds;
          }
        }
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.SLICE_DATA_TYPE,
            Constants.SLICE_ERRORS.SLICE_MODEL,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.PREVIEW_SLICING_MESSAGE +
              error.response?.data.detail
          );
        }
      }
    },
    /**
     * Uploads an existing G-code file from the PC, opens it as the active job,
     * and prepares it for the slicer preview dialog.
     * @param file - Local .nc/.gcode/.cnc file.
     */
    async importGcodeFileToSlicer(file: File) {
      await this.jobManagerStore.uploadJobFile(file);
      this.jobManagerStore.selectFile(file.name);
      await this.jobManagerStore.openFile();

      this.slicingResult = this.jobManagerStore.fileData.fileContent;
      this.estimatedPrintTimeSeconds = null;
      this.previewedSlicingResultKey = '';
      this.isNewSlicingProcess = true;
    },
    /**
     *  Requests the backend to save the sliced G-code file to the local system storage.
     * @param {string} filename - The desired name for the saved file.
     * @returns {Promise<void>}
     */
    async saveSlicingResultLocally(filename: string) {
      try {
        if (!this.threeDSlicerInstance) {
          throw new Error('The 3D slicer is not initialized.');
        }

        const modelBlob = this.threeDSlicerInstance.exportSceneModels(
          Constants.SLICING_FILES_FORMATE.STL
        );
        if (!modelBlob) {
          throw new Error('The slicer model could not be saved.');
        }

        // Pinia state is reactive and cannot be passed to structuredClone.
        // JSON serialization creates the plain-data snapshot required here.
          const project: SlicerJobProject = {
            version: 1,
            modelFile: await this.threeDSlicerInstance.blobToBase64(modelBlob),
            printHeightLimit: this.isPrintHeightLimited
              ? this.printHeightLimit
              : undefined,
            printHeightLowerLimit: this.isPrintHeightLimited
              ? this.printHeightLowerLimit
              : undefined,
            slicingSettings: JSON.parse(
            JSON.stringify({
              profileName: this.slicingProfileName,
              slicingLib: this.selectedSlicerLib,
              engravingMode: this.prusaSettings.engravingMode,
              recoaterFeedRate: this.prusaSettings.recoaterFeedRate,
              slic3rSettings: this.slic3rSettings,
              prusaSettings: this.prusaSettings,
              pyslmSettings: this.pyslmSettings,
            })
          ),
        };

        const res = (await API.saveSlicingFile(filename)).data;

        if (res.data.success) {
          await API.saveJobProject(filename, project);

          this.debuggerStore.addLog(
            new Date(),
            res.type,
            res.data.process,
            filename +
              ' ' +
              Constants.API_SUCCESS_MESSAGES.SAVE_SLICED_FILE_MESSAGE
          );

          // update the list incase there is any changes from the system side
          this.jobManagerStore.filesListData = res.data.filesListData;

          // A saved slice must also be opened by the jobs manager before the
          // machine controls can execute it. Keep the newly generated G-code
          // as the active job so Play is immediately available.
          this.jobManagerStore.selectFile(filename);
          await this.jobManagerStore.openFile();
        }
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          this.debuggerStore.addLog(
            new Date(),
            Constants.SLICE_DATA_TYPE,
            Constants.SLICE_ERRORS.SAVE_FILE,
            error.response?.data.detail
          );
          throw new Error(
            Constants.API_ERROR_MESSAGES.SAVE_SLICED_FILE_MESSAGE +
              error.response?.data.detail
          );
        }
        throw error;
      }
    },
    /**
     *  Fetches the list of saved slicing profiles from the API.
     * @returns {Promise<void>}
     */
    async fetchSlicingProfilesList() {
      await API.listSlicingProfiles()
        .then((response) => this.updateSlicingProfilesList(response.data))
        .catch((error: AxiosError | unknown) => {
          if (axios.isAxiosError(error)) {
            this.debuggerStore.addLog(
              new Date(),
              Constants.SLICE_DATA_TYPE,
              Constants.SLICE_ERRORS.LIST_SLICING_PROFILES,
              error.response?.data.detail
            );
            throw new Error(
              Constants.API_ERROR_MESSAGES.LIST_SLICING_PROFILES_MESSAGE +
                error.response?.data.detail
            );
          }
        });
    },
    /**
     *  Creates a new slicing profile with the current settings and saves it via the API.
     * @param {string} name - The name for the new slicing profile.
     * @returns {Promise<void>}
     */
    async addSlicingProfile(name: string) {
      const slicingSettings = {
        profileName: name,
        slicingLib: this.selectedSlicerLib,
        engravingMode: this.prusaSettings.engravingMode,
        recoaterFeedRate: this.prusaSettings.recoaterFeedRate,
        slic3rSettings: this.slic3rSettings,
        prusaSettings: this.prusaSettings,
        pyslmSettings: this.pyslmSettings,
      } as SlicingSettings;

      await API.addNewSlicingProfile(slicingSettings)
        .then((response) => {
          this.updateSlicingProfilesList(response.data);
          this.slicingProfileName = name;
        })
        .catch((error: AxiosError | unknown) => {
          if (axios.isAxiosError(error)) {
            this.debuggerStore.addLog(
              new Date(),
              Constants.SLICE_DATA_TYPE,
              Constants.SLICE_ERRORS.ADD_SLICING_PROFILE,
              error.response?.data.detail
            );
            throw new Error(
              Constants.API_ERROR_MESSAGES.ADD_SLICING_PROFILE_MESSAGE +
                error.response?.data.detail
            );
          }
        });

      this.slicingProfileName = name;
    },
    /**
     *  Updates the currently selected slicing profile with the current settings via the API.
     * @returns {Promise<void>}
     */
    async modifySlicingProfile() {
      const slicingSettings = {
        profileName: this.slicingProfileName,
        slicingLib: this.selectedSlicerLib,
        engravingMode: this.prusaSettings.engravingMode,
        recoaterFeedRate: this.prusaSettings.recoaterFeedRate,
        slic3rSettings: this.slic3rSettings,
        prusaSettings: this.prusaSettings,
        pyslmSettings: this.pyslmSettings,
      } as SlicingSettings;

      if (slicingSettings) {
        await API.updateSlicingSetting(slicingSettings)
          .then((response) => {
            this.updateSlicingProfilesList(response.data);
          })
          .catch((error: AxiosError | unknown) => {
            if (axios.isAxiosError(error)) {
              this.debuggerStore.addLog(
                new Date(),
                Constants.SLICE_DATA_TYPE,
                Constants.SLICE_ERRORS.UPDATE_SLICING_PROFILE,
                error.response?.data.detail
              );
              console.log(error.response);
              throw new Error(
                Constants.API_ERROR_MESSAGES.UPDATE_SLICING_PROFILE_MESSAGE +
                  error.response?.data.detail
              );
            }
          });
      }
    },
    /**
     *  Deletes a specified slicing profile via the API.
     * @param {number} profileId - The ID of the profile to delete.
     * @param {string} profileName - The name of the profile to delete.
     * @returns {Promise<void>}
     */
    async deleteSlicingProfile(profileId: number, profileName: string) {
      // delete api call
      await API.deleteSlicingProfile(profileId)
        .then((response) => {
          this.updateSlicingProfilesList(response.data);
        })
        .catch((error: AxiosError | unknown) => {
          if (axios.isAxiosError(error)) {
            this.debuggerStore.addLog(
              new Date(),
              Constants.SLICE_DATA_TYPE,
              Constants.SLICE_ERRORS.DELETE_SLICING_PROFILE,
              error.response?.data.detail
            );
            throw new Error(
              Constants.API_ERROR_MESSAGES.DELETE_SLICING_PROFILE_MESSAGE +
                error.response?.data.detail
            );
          }
        });

      // in case the deleted profile is the same as the selected profile => set default profile
      if (profileName === this.slicingProfileName) {
        this.setSlicingProfileSettings(this.defaultSlicingProfile);
      }
    },
    /**
     *  Sets up the G-code previewer and starts rendering the slicing result.
     * @param {HTMLDivElement} graphContainer - The container element for the G-code preview graph.
     * @returns {Promise<void>}
     */
    async createSlicingResultGraph(graphContainer: HTMLDivElement) {
      // 3d gcode previewer instance
      if (!this.slice3DPreviewerInstance) {
        const config = await configurationSettings();
        this.slice3DPreviewerInstance = new Gcode3DPreviewer(config);
      }

      const previewKey = `${this.slicingResult.length}:${
        this.slicingResult.slice(0, 128)
      }:${this.slicingResult.slice(-128)}`;
      const shouldRedrawPreview =
        this.isNewSlicingProcess ||
        previewKey !== this.previewedSlicingResultKey;

      // add graph to its container
      this.slice3DPreviewerInstance.add3DGraphToContainer(
        graphContainer,
        shouldRedrawPreview
      );

      // incase of new slice
      if (shouldRedrawPreview) {
        // reset all the slicing previewer parameters on preview
        this.slice3DPreviewerInstance.resetSlicingPreviewerParameters();

        await this.startDrawingSlicingResult();
        this.previewedSlicingResultKey = previewKey;
        // after previewing the result it is no longer new process, to prevent
        // multiple request for the same result and drawing the sliced models again
        this.isNewSlicingProcess = false;
      }
    },
    /**
     *  Offloads G-code parsing to a web worker to begin the rendering process.
     * @returns {Promise<void>}
     */
    async startDrawingSlicingResult() {
      const previewWebWorker = getSliceWorker();
      // Send data to worker
      const data = { gcodeStr: this.slicingResult };
      previewWebWorker.postMessage(data);

      // Listen to worker response data
      await this.listenToWebWorkerMessages(previewWebWorker);
    },
    /**
     *  Listens for messages from the G-code parsing worker and updates the previewer accordingly.
     * @param {Worker | null} previewWebWorker - The worker instance to listen to.
     * @returns {Promise<void>} A promise that resolves when the worker is finished, or rejects on error.
     */
    listenToWebWorkerMessages(previewWebWorker: Worker | null) {
      return new Promise<void>((resolve, reject) => {
        if (previewWebWorker) {
          previewWebWorker.addEventListener('message', async (e) => {
            const {
              infillToDraw,
              contourToDraw,
              gridToDraw,
              variableGridStage1ToDraw,
              variableGridStage2ToDraw,
              variableGridStage3ToDraw,
              surfaceSkinToDraw,
              isEngravingLayer,
              done,
              error,
            } = e.data;

            // handle drawing gcode line in the previewer
            if (this.slice3DPreviewerInstance) {
              this.slice3DPreviewerInstance.drawSliceResult(
                contourToDraw,
                infillToDraw,
                gridToDraw,
                variableGridStage1ToDraw,
                variableGridStage2ToDraw,
                variableGridStage3ToDraw,
                surfaceSkinToDraw,
                isEngravingLayer
              );
            }

            // handle error from the web worker
            if (error) {
              reject(error);
              return;
            }

            // when the webworker finish parsing all gcode lines it will send done message
            if (done) {
              previewWebWorker?.terminate();
              previewWebWorker = null;
              resolve();
            }
          });
        }
      });
    },
    /**
     *  Sets the visibility of layers in the G-code preview.
     * @param {LayersRange} layersRange - The range of layers to be made visible.
     * @returns {void}
     */
    setSlicedLayerVisibility(layersRange: LayersRange) {
      if (this.slice3DPreviewerInstance) {
        this.slice3DPreviewerInstance.setSlicedLayerVisibility(layersRange);
      }
    },
    /**
     * Fetches a job's hidden slicer project and defers restoration until the
     * slicer scene has mounted.
     */
    async openJobProject(filename: string) {
      try {
        const response = await API.loadJobProject(filename);
        this.pendingJobProject = response.data;
        if (this.threeDSlicerInstance) {
          await this.restorePendingJobProject();
        }
      } catch (error: AxiosError | unknown) {
        if (axios.isAxiosError(error)) {
          throw new Error(
            error.response?.data?.detail ||
              'The slicer project could not be loaded.'
          );
        }
        throw error;
      }
    },
    /** Restores the saved transformed STL and its complete slicing settings. */
    async restorePendingJobProject() {
      if (!this.pendingJobProject || !this.threeDSlicerInstance) return;

      const project = this.pendingJobProject;
      this.isModelLoading = true;
      try {
        this.clearSlicingContainer();
        this.setSlicingProfileSettings(project.slicingSettings);

        const [metadata, encodedData] = project.modelFile.split(',', 2);
        const mimeType =
          metadata.match(/^data:(.*?);base64$/)?.[1] ||
          'application/octet-stream';
        const binary = atob(encodedData);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        const modelFile = new File([bytes], 'saved-job-model.stl', {
          type: mimeType,
        });

        await this.threeDSlicerInstance.addSavedProjectModel(modelFile);
        this.refreshPrintHeightRange();
        if (project.printHeightLimit != null) {
          this.isPrintHeightLimited = true;
          this.setPrintHeightLowerLimit(project.printHeightLowerLimit ?? 0);
          this.setPrintHeightLimit(project.printHeightLimit);
        }
        this.pendingJobProject = null;
        this.resetSlicingContainerControls();
      } finally {
        this.isModelLoading = false;
      }
    },
    setMachineCoordinateOverlayVisibility(isVisible: boolean) {
      if (this.slice3DPreviewerInstance) {
        this.slice3DPreviewerInstance.setMachineCoordinateOverlayVisible(
          isVisible
        );
      }
    },
    /**
     *  Removes all models from the 3D scene, cancels any ongoing slicing process, and resets related states.
     * @returns {void}
     */
    clearSlicingContainer() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.clearAllModelsFromSlicingContainer();
      }
      // if slicing process is still going, cancel it
      if (this.sliceInfoStore.isSlicingProcess) {
        this.cancelSlicingProcess();
      }
      this.sliceInfoStore.restSliceProgress();
      this.estimatedPrintTimeSeconds = null;
      this.previewedSlicingResultKey = '';
      this.isPrintHeightLimited = false;
      this.maximumPrintHeight = 0;
      this.printHeightLimit = 0;
      this.printHeightLowerLimit = 0;
      this.threeDSlicerInstance?.setPrintHeightLimit(null);
      this.setSlicingProfileSettings(this.defaultSlicingProfile);
    },
    /**
     *  Adds a new 3D model from a file to the slicer scene.
     * @param {File} file - The 3D model file to add.
     * @returns {void}
     */
    addNew3DModelToSlicingContainer(file: File) {
      if (this.threeDSlicerInstance) {
        this.isModelLoading = true;
        this.threeDSlicerInstance.addNew3DModel(file).then(() => {
          if (this.threeDSlicerInstance) {
            this.isModelLoading = false;
          }
        });
      }
    },
    /**
     *  Saves the current scene as a single 3D model file to the system's media storage.
     * @param {string} filename - The name for the new model file.
     * @returns {Promise<void>}
     */
    async saveModelsToSystem(filename: string) {
      if (this.threeDSlicerInstance) {
        this.isModelLoading = true;
        const blob = this.threeDSlicerInstance.exportSceneModels(
          Constants.SLICING_FILES_FORMATE.STL
        );

        if (blob) {
          const threeDModelFile = new File(
            [blob],
            filename + Constants.SLICING_FILES_FORMATE.STL
          );
          await this.mediaFilesManagementStore.uploadMediaFile(threeDModelFile);
          this.isModelLoading = false;
        }
      }
    },
    /**
     *  Exports all models in the scene to a specified format and triggers a browser download.
     * @param {string} filename - The name for the downloaded file.
     * @param {string} format - The file format to export (e.g., '.stl', '.obj').
     * @returns {void}
     */
    exportAllModels(filename: string, format: string) {
      if (this.threeDSlicerInstance) {
        this.isModelLoading = true;
        const blob = this.threeDSlicerInstance.exportSceneModels(format);
        if (blob) {
          // Trigger download
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename + format;
          link.click();
          URL.revokeObjectURL(url);
        }
        this.isModelLoading = false;
      }
    },
    /**
     *  Sets the currently selected model in the state.
     * @param {ModelData} model - The data of the model to be selected.
     * @returns {void}
     */
    setSelectedModel(model: ModelData) {
      this.selectedModel = {
        ...model,
      };
      this.refreshPrintHeightRange();
    },
    /**
     *  Updates the selection in the `ThreeDSlicer` instance based on model ID.
     * @param {string} id - The ID of the model to select.
     * @returns {void}
     */
    setNewSelectedModel(id: string) {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.setNewSelectedModel(id);
      }
    },
    /**
     *  Updates the list of uploaded models in the state.
     * @param {ModelData[]} list - The new list of uploaded models.
     * @returns {void}
     */
    setUploadedModelsList(list: ModelData[]) {
      this.uploadedModels = [...list];
      this.isSlicingContainerEmpty = this.uploadedModels.length ? false : true;
      this.refreshPrintHeightRange();
    },
    /** Refreshes the crop slider range after loading or transforming models. */
    refreshPrintHeightRange() {
      if (!this.threeDSlicerInstance) return;
      this.maximumPrintHeight =
        this.threeDSlicerInstance.getMaximumModelHeight();
      if (!this.isPrintHeightLimited) {
        this.printHeightLimit = this.maximumPrintHeight;
        this.printHeightLowerLimit = 0;
        this.threeDSlicerInstance.setPrintHeightLimit(null);
        return;
      }
      this.setPrintHeightRange(
        this.printHeightLowerLimit,
        this.printHeightLimit
      );
    },
    /** Applies a non-destructive horizontal print-height slab. */
    setPrintHeightRange(lowerHeight: number, upperHeight: number) {
      const maximum = Math.max(0, this.maximumPrintHeight);
      const lower = Math.min(Math.max(0, lowerHeight), maximum);
      const upper = Math.min(Math.max(lower, upperHeight), maximum);
      this.printHeightLowerLimit = lower;
      this.printHeightLimit = upper;
      this.threeDSlicerInstance?.setPrintHeightLimit(upper, lower);
    },
    /** Applies a non-destructive horizontal print-height cutoff. */
    setPrintHeightLimit(height: number) {
      this.setPrintHeightRange(this.printHeightLowerLimit, height);
    },
    /** Applies the lower print-height cutoff for slab printing. */
    setPrintHeightLowerLimit(height: number) {
      this.setPrintHeightRange(
        height,
        this.printHeightLimit || this.maximumPrintHeight
      );
    },
    /** Enables or disables print-height truncation without scaling the model. */
    setPrintHeightLimitEnabled(enabled: boolean) {
      this.isPrintHeightLimited = enabled;
      if (!enabled) {
        this.printHeightLimit = this.maximumPrintHeight;
        this.printHeightLowerLimit = 0;
        this.threeDSlicerInstance?.setPrintHeightLimit(null);
      } else {
        this.setPrintHeightRange(
          this.printHeightLowerLimit,
          this.printHeightLimit || this.maximumPrintHeight
        );
      }
    },
    /**
     *  Sets a flag indicating if the model is outside the build platform.
     * @param {boolean} isModelOutsidePlatform - The value to set the flag to.
     * @returns {void}
     */
    setIsModelOutsidePlatformFlag(isModelOutsidePlatform: boolean) {
      this.isModelOutsidePlatform = isModelOutsidePlatform;
    },
    /**
     *  Triggers a check in the `ThreeDSlicer` instance to see if the selected model is out of bounds.
     * @returns {void}
     */
    checkIfModelOutsidePlatform() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.checkIfModelOutsidePlatform(
          this.selectedModel
        );
      }
    },
    /**
     *  Triggers a check to see if the model is positioned below the build plate.
     * @returns {void}
     */
    checkIfModelBelowPlatform() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.checkIfModelBelowPlatform(this.selectedModel);
      }
    },
    /**
     *  Applies the translation (move) tool to the selected model.
     * @returns {void}
     */
    applyTranslatingTools() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.applyTranslatingToolsOnSelectedModel();
      }
    },
    /**
     *  Applies the rotation tool to the selected model.
     * @returns {void}
     */
    applyRotatingTools() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.applyRotatingToolsOnSelectedModel();
      }
    },
    /**
     *  Applies the resizing (scale) tool to the selected model.
     * @returns {void}
     */
    applyResizingTools() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.applyResizingToolsOnSelectedModel();
      }
    },
    /**
     *  Mirrors the selected model along a specified axis.
     * @param {string} axis - The axis to mirror across ('x', 'y', or 'z').
     * @returns {void}
     */
    applyMirroringTools(axis: string) {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.applyMirroringToolsOnSelectedModel(axis);
      }
    },
    /**
     *  Centers the selected model on the build platform.
     * @returns {void}
     */
    centralizeModel() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.centralizeSelectedModel();
      }
    },
    /**
     *  Moves the selected model down along the Z-axis to rest on the build platform.
     * @returns {void}
     */
    dropModelOnPlatform() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.dropModelOnPlatform();
      }
    },
    /**
     *  Creates a duplicate of the selected model.
     * @returns {void}
     */
    cloneModel() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.cloneSelectedModel();
      }
    },
    /**
     *  Deletes the selected model from the scene.
     * @returns {void}
     */
    deleteModel() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.deleteSelectedModel();
        // in case all models got deleted
        if (this.isSlicingContainerEmpty) {
          this.clearSlicingContainer();
        }
      }
    },
    /**  Adds a grid helper to the 3D scene. */
    addGridHelper() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.addGridHelper();
      }
    },
    /**  Removes the grid helper from the 3D scene. */
    removeGridHelper() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.removeGridHelper();
      }
    },
    /**  Adds the machine coordinate scale to the 3D scene. */
    addCoordinateScaleHelper() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.addCoordinateScaleHelper();
      }
    },
    /**  Removes the machine coordinate scale from the 3D scene. */
    removeCoordinateScaleHelper() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.removeCoordinateScaleHelper();
      }
    },
    /**  Adds a view helper (orientation cube) to the 3D scene. */
    addViewerHelper() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.addViewHelper();
      }
    },
    /**  Removes the view helper from the 3D scene. */
    removeViewerHelper() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.removeViewHelper();
      }
    },
    /**  Adds an ambient light helper to the 3D scene. */
    addAmbientLightHelper() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.addAmbientLightHelper();
      }
    },
    /**  Removes the ambient light helper from the 3D scene. */
    removeAmbientLightHelper() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.removeAmbientLightHelper();
      }
    },
    /**  Adds a directional light helper to the 3D scene. */
    addDirectionalLightHelper() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.addDirectionalLightHelper();
      }
    },
    /**  Removes the directional light helper from the 3D scene. */
    removeDirectionalLightHelper() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.removeDirectionalLightHelper();
      }
    },
    /**  Adds transformation tools (gizmos) to the selected model. */
    addTransformTools() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.addTransformTools();
      }
    },
    /**  Removes transformation tools from the selected model. */
    removeTransformTools() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.removeTransformTools();
      }
    },
    /**  Adds a bounding box helper to the selected model. */
    addBoxHelper() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.addBoxHelper();
      }
    },
    /**  Removes the bounding box helper from the selected model. */
    removeBoxHelper() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.removeBoxHelper();
      }
    },
    /**
     *  Adds a basic geometric shape (primitive) to the scene.
     * @param {string} shape - The type of shape to add (e.g., 'cube', 'sphere').
     * @returns {void}
     */
    addNewMesh(shape: string) {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.addNewMesh(shape);
      }
    },
    /**
     *  Toggles uniform scaling for the resize tool.
     * @returns {void}
     */
    setUniformedResizing() {
      if (this.threeDSlicerInstance) {
        this.isResizeUniformed = !this.isResizeUniformed;
        this.threeDSlicerInstance.setUniformedResizing(this.isResizeUniformed);
      }
    },
    /**  Adds a new command to the transformation history for undo/redo. */
    addNewTransformCommand() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.addNewTransformCommand();
      }
    },
    /**  Undoes the last transformation command. */
    undoTransformCommand() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.undoTransformCommand();
      }
    },
    /**  Redoes the last undone transformation command. */
    redoTransformCommand() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.redoTransformCommand();
      }
    },
    /**  Resets all transformations applied to the selected model. */
    resetSelectedModel() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.resetSelectedModel();
      }
    },
    /**
     *  Updates the local list of slicing profiles from an API response.
     * @param {SlicingApiResponse} data - The API response containing the list of profiles.
     * @returns {void}
     */
    updateSlicingProfilesList(data: SlicingApiResponse) {
      // add default slicing profile to the list of profiles
      this.slicingProfilesList = [this.defaultSlicingProfile].concat(
        data.data.slicingProfiles
      );
    },
    /**
     *  Applies the settings from a selected profile to the current state.
     * @param {SlicingSettings} slicingProfile - The slicing profile to apply.
     * @returns {void}
     */
    setSlicingProfileSettings(slicingProfile: SlicingSettings) {
      this.slicingProfileName = slicingProfile.profileName;
      this.selectedSlicerLib = slicingProfile.slicingLib;
      this.slic3rSettings = {
        ...slicingProfile.slic3rSettings,
      };
      this.prusaSettings = {
        ...structuredClone(Constants.DEFAULT_PRUSA_SLICER_SETTINGS),
        ...slicingProfile.prusaSettings,
      };
      this.pyslmSettings = {
        ...structuredClone(Constants.DEFAULT_PYSLM_SETTINGS),
        ...slicingProfile.pyslmSettings,
      };
    },
    /**  Resets the camera controls of the 3D viewer to their default state. */
    resetSlicingContainerControls() {
      if (this.threeDSlicerInstance) {
        this.threeDSlicerInstance.resetSlicingContainerControls();
      }
    },
  },
});
