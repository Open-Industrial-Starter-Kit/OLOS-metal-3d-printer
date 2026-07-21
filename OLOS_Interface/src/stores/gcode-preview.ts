import { defineStore } from 'pinia';
import { Constants } from 'src/constants';
import { Config } from 'src/interfaces/configSettings.interface';
import {
  CameraData,
  GCodeColors,
  Line,
  Point,
} from 'src/interfaces/gcodePreivew.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { executeCamerasSystem } from 'src/services/execute.commands.service';
import { Gcode2DPreviewer } from 'src/services/gcode.previewer.service/gcode.2D.previewer.service';
import { Gcode3DPreviewer } from 'src/services/gcode.previewer.service/gcode.3D.previewer.service';
import { getPlatformDimensions } from 'src/services/gcode.previewer.service/gcode.previewer.helper.service';
import { convertLinesToSVGElements } from 'src/services/gcode.previewer.service/gcode.svg.helper.service';
import { getPreviewerWorker } from 'src/workers';
import { useDebuggerDialogStore } from './debugger-dialog';

/**
 * Pinia store managing G-code preview rendering in 2D/3D and related UI state.
 */
export const useGcodePreviewStore = defineStore('gcodePreview', {
  state: () => ({
    /** Instance of the active G-code previewer (2D or 3D). */
    gcodePreviewerInstance: null as Gcode3DPreviewer | Gcode2DPreviewer | null,

    /** HTML container element for the G-code preview graph. */
    gcodePreviewerGraph: document.createElement('div') as HTMLDivElement,

    /** Base64 encoded camera frame image string for overlay in 2D preview. */
    cameraFrame: '' as string,

    /** Settings controlling graph display options and colors. */
    gcodePreviewerGraphSettings: {
      showCamera: false as boolean,
      showLabels: true as boolean,
      showGrid: true as boolean,
      GcodeCommandsColor: {
        G0: 'green',
        G1: 'red',
        G2: 'yellow',
        G3: 'red',
        executedLine: '#a6f5f7',
      },
      startPoint: {
        x: 0,
        y: 0,
        z: 0,
      } as Point,
      endPoint: {
        x: 0,
        y: 0,
        z: 0,
      } as Point,
    },

    /** Reference to the debugger dialog store for logging errors and info. */
    debuggerStore: useDebuggerDialogStore(),

    /** SVG string representation of the G-code job lines. */
    gcodeJobSVGString: '' as string,

    /** Flag indicating if there is a G-code parsing error. */
    isGcodeError: false as boolean,

    /** Flag indicating whether the graph is currently loading/drawing. */
    isGraphLoading: false as boolean,

    /** Flag indicating if the G-code exceeds platform dimensions. */
    isGcodeBiggerThanPlatform: false as boolean,

    /** Flag to mark if a new file is opened and needs drawing. */
    isNewFileToDraw: true as boolean,

    /** Web Worker instance for parsing and processing G-code asynchronously. */
    previewWebWorker: null as Worker | null,

    /** Flag for the camera stream status */
    isCameraStreamActive: false,

    /** Modal G0/G1/G2/G3 mode used to match live commands to drawn moves. */
    executionMotionMode: '' as string,
  }),

  actions: {
    /**
     * Creates the appropriate G-code preview graph based on machine type.
     * @param {string} fileContent - The raw G-code content as a string.
     */
    async createGcodePreviewerGraph(fileContent: string) {
      const config = await configurationSettings();
      this.resetGraph();

      if (
        config.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER ||
        config.machine_type === Constants.MACHINE_TYPE.VINYL_CUTTER
      ) {
        this.gcodePreviewerInstance = new Gcode2DPreviewer(config);
        await this.create2DGraph(fileContent, config);
      } else if (
        config.machine_type === Constants.MACHINE_TYPE.CNC ||
        config.machine_type === Constants.MACHINE_TYPE.THREE_D_PRINTER
      ) {
        this.gcodePreviewerInstance = new Gcode3DPreviewer(config);
        await this.create3DGraph(fileContent, config);
      }
    },

    /**
     * Creates and draws a 2D graph for the G-code preview.
     * @param {string} gcode - The G-code string.
     * @param {Config} config - Configuration settings for the machine.
     */
    async create2DGraph(gcode: string, config: Config) {
      if (
        this.gcodePreviewerInstance &&
        this.gcodePreviewerInstance instanceof Gcode2DPreviewer
      ) {
        if (this.isNewFileToDraw) {
          await this.startDrawingGcodeLinesOnGraph(gcode, config);
          this.isNewFileToDraw = false;
        }

        // Special handling for vinyl cutter infinite Y axis
        if (config.machine_type === Constants.MACHINE_TYPE.VINYL_CUTTER) {
          this.gcodePreviewerInstance.setGraphHeightSize(
            this.gcodePreviewerGraphSettings.endPoint.y
          );
        }

        await this.addGraphTools();
      }
    },

    /**
     * Creates and draws a 3D graph for the G-code preview.
     * @param {string} gcode - The G-code string.
     * @param {Config} config - Configuration settings for the machine.
     */
    async create3DGraph(gcode: string, config: Config) {
      if (
        this.gcodePreviewerInstance &&
        this.gcodePreviewerInstance instanceof Gcode3DPreviewer
      ) {
        if (this.isNewFileToDraw) {
          await this.startDrawingGcodeLinesOnGraph(gcode, config);
          this.isNewFileToDraw = false;
        }
      }
    },

    /**
     * Starts drawing G-code lines by sending data to a Web Worker for parsing.
     * @param {string} gcodeStr - G-code string to parse and draw.
     * @param {Config} config - Machine configuration settings.
     */
    async startDrawingGcodeLinesOnGraph(gcodeStr: string, config: Config) {
      this.isGraphLoading = true;
      this.previewWebWorker = getPreviewerWorker();

      if (!this.previewWebWorker) {
        const error = new Error('Failed to initialize worker');
        this.handleGcodeError(error);
        return;
      }

      const data = { gcodeStr, config };
      this.previewWebWorker.postMessage(data);

      await this.listenToWebWorkerMessages();
    },

    /**
     * Listens for messages from the Web Worker, handles drawing and errors.
     * @returns {Promise<void>} Resolves when worker finishes processing.
     */
    listenToWebWorkerMessages(): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        if (!this.previewWebWorker) {
          reject(new Error('No preview web worker available'));
          return;
        }

        const handleDrawLines = (
          linesToDraw: Line[],
          color: GCodeColors,
          config: Config
        ) => {
          if (this.gcodePreviewerInstance instanceof Gcode3DPreviewer) {
            this.gcodePreviewerInstance.draw3DGcodeLinesOnGraph(
              linesToDraw,
              color
            );
          } else if (this.gcodePreviewerInstance instanceof Gcode2DPreviewer) {
            this.gcodePreviewerInstance.draw2DGcodeLinesOnGraph(
              linesToDraw,
              color
            );
            this.gcodeJobSVGString += convertLinesToSVGElements(
              linesToDraw,
              color,
              getPlatformDimensions(config),
              this.gcodePreviewerGraphSettings.startPoint
            );
          }
        };

        const onMessage = async (e: MessageEvent) => {
          try {
            const config = await configurationSettings();
            const {
              error,
              linesToDraw,
              isBiggerThanPlatform,
              done,
              startPoint,
              endPoint,
            } = e.data;

            // handle error from the web worker
            if (error) {
              this.handleGcodeError(error);
              reject(error);
              return;
            }

            // incase the gcode is bigger than the platform
            if (isBiggerThanPlatform) {
              this.handleGcodeBiggerThanPlatform();
            }

            // handle drawing gcode line in the previewer
            if (linesToDraw?.length) {
              handleDrawLines(
                linesToDraw,
                this.gcodePreviewerGraphSettings.GcodeCommandsColor,
                config
              );
            }

            // when the webworker finish parsing all gcode lines it will send done message
            if (done) {
              this.isGraphLoading = false;
              if (startPoint)
                this.gcodePreviewerGraphSettings.startPoint = startPoint;
              if (endPoint)
                this.gcodePreviewerGraphSettings.endPoint = endPoint;

              this.previewWebWorker?.terminate();
              this.previewWebWorker = null;
              resolve();
            }
          } catch (err) {
            this.handleGcodeError(err);
            reject(err);
          }
        };

        const onError = (error: ErrorEvent) => {
          this.handleGcodeError(error);
          this.isGraphLoading = false;
          reject(error);
        };

        this.previewWebWorker.addEventListener('message', onMessage);
        this.previewWebWorker.addEventListener('error', onError);
      });
    },

    /**
     * Adds the G-code preview graph to a given HTML container.
     * @param {HTMLDivElement} container - Container element to append the graph to.
     */
    addGraphToContainer(container: HTMLDivElement) {
      if (this.gcodePreviewerInstance) {
        if (this.gcodePreviewerInstance instanceof Gcode2DPreviewer) {
          this.gcodePreviewerInstance.add2DGraphToContainer(
            container,
            this.isNewFileToDraw
          );
        } else if (this.gcodePreviewerInstance instanceof Gcode3DPreviewer) {
          this.gcodePreviewerInstance.add3DGraphToContainer(
            container,
            this.isNewFileToDraw
          );
        }
      }
    },

    /**
     * Highlights the currently executed G-code line in the preview graph.
     */
    async drawExecutedGcodeLine() {
      if (this.gcodePreviewerInstance) {
        this.gcodePreviewerInstance.addExecutedLineToGraph(
          this.gcodePreviewerGraphSettings.GcodeCommandsColor.executedLine
        );
      }
    },

    /**
     * Returns true when a controller-acknowledged command corresponds to a
     * drawable XYZ move in the preview. Feed-only, comments, M-codes, G53,
     * G92, and auxiliary A/B moves must not advance the highlight cursor.
     */
    isDrawableMotionCommand(command: string) {
      const code = command.split(';', 1)[0].trim();
      if (!code) return false;

      const explicitMotion = code.match(
        /^G0?([0123])(?=\s|[XYZABFIJKR]|$)/i
      );
      if (explicitMotion) {
        this.executionMotionMode = `G${explicitMotion[1]}`;
      } else if (/^G(?:53|92)(?=\s|[XYZAB]|$)/i.test(code)) {
        return false;
      }

      if (!this.executionMotionMode) return false;
      return /[XYZ]-?(?:\d|\.)/i.test(code);
    },

    /**
     * Adds auxiliary tools like grid, camera frames, and labels to the graph.
     */
    async addGraphTools() {
      const config = await configurationSettings();

      if (
        config.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER &&
        this.gcodePreviewerInstance instanceof Gcode2DPreviewer
      ) {
        this.gcodePreviewerInstance.initDragAndDropForGraph();
      }

      if (this.gcodePreviewerGraphSettings.showGrid) {
        this.showGrid();
      }
      if (
        this.gcodePreviewerGraphSettings.showCamera &&
        config.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER
      ) {
        this.startCameraStream();
      }
      if (
        this.gcodePreviewerGraphSettings.showLabels &&
        config.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER
      ) {
        this.showLabels();
      }
    },

    /**
     * Shows grid on the preview graph.
     */
    showGrid() {
      if (this.gcodePreviewerInstance) {
        this.gcodePreviewerInstance.showGrid();
      }
    },

    /**
     * Start camera stream.
     */
    startCameraStream() {
      this.isCameraStreamActive = true;
      executeCamerasSystem(Constants.START_CAMERAS_STREAM);
    },

    /**
     * Shows labels on the preview graph.
     */
    showLabels() {
      if (this.gcodePreviewerInstance instanceof Gcode2DPreviewer) {
        this.gcodePreviewerInstance.showLabels();
      }
    },

    /**
     * Hide labels on the preview graph.
     */
    hideGrid() {
      if (this.gcodePreviewerInstance) {
        this.gcodePreviewerInstance.hideGrid();
      }
    },

    /**
     * Stop camera stream and hide frame overlay in the graph.
     */
    stopCameraStream() {
      this.isCameraStreamActive = false;
      executeCamerasSystem(Constants.STOP_CAMERAS_STREAM);
      if (
        this.gcodePreviewerInstance &&
        this.gcodePreviewerInstance instanceof Gcode2DPreviewer &&
        this.gcodePreviewerGraphSettings.showCamera
      ) {
        this.gcodePreviewerInstance.hideCameraFrame();
      }
    },

    /**
     * Hide grid on the preview graph.
     */
    hideLabels() {
      if (
        this.gcodePreviewerInstance &&
        this.gcodePreviewerInstance instanceof Gcode2DPreviewer
      ) {
        this.gcodePreviewerInstance.hideLabels();
      }
    },

    /**
     * Activate the drag and control events for the job object in the graph.
     */
    activateDragAndDropControls() {
      if (
        this.gcodePreviewerInstance &&
        this.gcodePreviewerInstance instanceof Gcode2DPreviewer
      ) {
        this.gcodePreviewerInstance.dragAndDropControls?.activate();
      }
    },

    /**
     * Deactivate the drag and control events for the job object in the graph.
     */
    deactivateDragAndDropControls() {
      if (
        this.gcodePreviewerInstance &&
        this.gcodePreviewerInstance instanceof Gcode2DPreviewer
      ) {
        this.gcodePreviewerInstance.dragAndDropControls?.deactivate();
      }
    },

    /**
     * For Laser cutters show the camera stream as background for the 2D graph.
     */
    setCameraFrame(res: CameraData) {
      this.cameraFrame = `data:image/png;base64,${res.frame}`;
      if (
        this.gcodePreviewerInstance &&
        this.gcodePreviewerInstance instanceof Gcode2DPreviewer
      ) {
        this.gcodePreviewerInstance.showCameraFrame(
          this.cameraFrame,
          this.isCameraStreamActive
        );
      }
    },

    /**
     * Handles the scenario when G-code is larger than platform dimensions.
     */
    handleGcodeBiggerThanPlatform() {
      this.resetGraph();
      this.isGcodeBiggerThanPlatform = true;
      this.debuggerStore.addLog(
        new Date(),
        Constants.JOBS_MANAGER_DATA_TYPE,
        'Preview',
        Constants.PREVIEWER_BIG_GCODE_MESSAGE
      );
    },

    /**
     * Handles error occurring during G-code parsing or drawing.
     */
    handleGcodeError(error: unknown) {
      this.resetGraph();
      this.isGcodeError = true;
      this.isGraphLoading = false;
      this.debuggerStore.addLog(
        new Date(),
        Constants.JOBS_MANAGER_DATA_TYPE,
        'Preview',
        (error as Error).message
      );
    },

    /**
     * Resets the graph and internal state, clearing any loaded G-code.
     */
    resetGraph() {
      if (this.gcodePreviewerInstance) {
        this.gcodePreviewerInstance.resetAllGraphElements();
        this.gcodePreviewerInstance.removeExecutionLayer();
      }
      this.gcodePreviewerGraph = document.createElement('div');
      this.gcodeJobSVGString = '';
      this.isGraphLoading = false;
      this.isGcodeBiggerThanPlatform = false;
      this.isGcodeError = false;
      this.isNewFileToDraw = true;
      this.executionMotionMode = '';
      this.previewWebWorker?.terminate();
      this.previewWebWorker = null;
    },
  },
});
