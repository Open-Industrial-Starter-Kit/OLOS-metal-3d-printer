import { defineStore } from 'pinia';
import { handleJoystickData } from 'src/services/joystick.movement.service';
import { Constants } from 'src/constants';
import { useConsoleOutputStore } from 'src/stores/console-output';
import { useDebuggerDialogStore } from 'src/stores/debugger-dialog';
import { useJobsFilesManagementStore } from 'src/stores/jobs-files-management';
import { useGcodePreviewStore } from 'src/stores/gcode-preview';
import { useJobInfoStore } from 'src/stores/job-info';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { useMessageOutputStore } from 'src/stores/message-output';
import { useUSBMonitorStore } from 'src/stores/usb-monitor';
import { useSliceInfoStore } from 'src/stores/slice-info';

/**
 * Pinia store responsible for managing the WebSocket connection and routing
 * incoming messages to the appropriate stores and handlers.
 */
export const useWebSocketStore = defineStore('websocket', {
  /**
   * Reactive state for the WebSocket store.
   * @returns {object} The initial state object.
   */
  state: () => ({
    /** WebSocket connection instance or null if disconnected */
    connection: null as WebSocket | null,

    /** Instance of machine status store */
    machineStatusStore: useMachineStatusStore(),

    /** Instance of console output store */
    consoleOutputStore: useConsoleOutputStore(),

    /** Instance of job info store */
    jobInfoStore: useJobInfoStore(),

    /** Instance of message output store */
    messagesOutputStore: useMessageOutputStore(),

    /** Instance of jobs files management store */
    jobManagerStore: useJobsFilesManagementStore(),

    /** Instance of debugger dialog store */
    debuggerStore: useDebuggerDialogStore(),

    /** Instance of G-code preview store */
    gcodePreviewStore: useGcodePreviewStore(),

    /** Instance of USB monitor store */
    usbMonitorStore: useUSBMonitorStore(),

    /** Instance of slice info store */
    sliceInfoStore: useSliceInfoStore(),
  }),

  actions: {
    /**
     * Establishes a WebSocket connection to the specified URL and sets up
     * event handlers for connection lifecycle and incoming messages.
     *
     * @param {string} url - The WebSocket server URL to connect to.
     */
    connect(url: string) {
      this.connection = new WebSocket(url);

      this.connection.onopen = () => {
        this.debuggerStore.addLog(
          new Date(),
          Constants.CONNECTION_DATA_TYPE,
          'Websocket',
          'webSocket connection opened.'
        );
      };

      this.connection.onclose = () => {
        this.connect(url);
        this.debuggerStore.addLog(
          new Date(),
          Constants.CONNECTION_DATA_TYPE,
          'Websocket',
          'websocket can not connect to server with the url'
        );
      };

      this.connection.onerror = (error) => {
        this.messagesOutputStore.updateMessageBasedOnStatus(
          Constants.DISCONNECTED
        );
        console.error('WebSocket error:', error);
      };

      /**
       * Handles incoming WebSocket messages by dispatching data
       * to the appropriate store or service based on the message type.
       *
       * @param {MessageEvent} event - The WebSocket message event.
       */
      this.connection.onmessage = async (event: MessageEvent) => {
        const res = JSON.parse(event.data);

        switch (res.type) {
          case Constants.MACHINE_STATUS_DATA_TYPE:
            this.machineStatusStore.updateStatus(res);
            this.messagesOutputStore.updateMessageBasedOnStatus(res.state);
            break;

          case Constants.MACHINE_CONNECTION_DATA_TYPE:
            this.machineStatusStore.updateConnectionStatus(res);
            if (res.success) {
              this.messagesOutputStore.updateMessageBasedOnStatus(
                Constants.CONNECTING
              );
            } else {
              this.messagesOutputStore.updateMessageBasedOnStatus(
                Constants.DISCONNECTED
              );
            }
            break;

          case Constants.JOB_EXECUTION_DATA_TYPE:
            this.jobInfoStore.updateJobProgress(
              res.line_index,
              res.total_lines
            );
            this.jobInfoStore.updateJobTimer(res.file_timer);
            this.consoleOutputStore.addText(res);
            await this.gcodePreviewStore.drawExecutedGcodeLine();
            break;

          case Constants.SERIAL_COMMAND_DATA_TYPE:
            this.consoleOutputStore.addText(res);
            this.messagesOutputStore.checkReceivedMessage(res.text);
            break;

          case Constants.NORMAL_COMMAND_DATA_TYPE:
            this.consoleOutputStore.addText(res);
            break;

          case Constants.JOBS_MANAGER_DATA_TYPE:
            this.jobManagerStore.updateFileManagerStatus(res);
            break;

          case Constants.CAMERAS_SYSTEM_DATA_TYPE:
            this.gcodePreviewStore.setCameraFrame(res);
            break;

          case Constants.JOYSTICK_STATUS_DATA_TYPE:
            handleJoystickData(res);
            break;

          case Constants.USB_STORAGE_MONITOR_DATA_TYPE:
            this.usbMonitorStore.updateUSBMonitorStatus(res);
            break;

          case Constants.SLICE_DATA_TYPE:
            this.sliceInfoStore.updateSlicingProgress(
              res.layer_index,
              res.total_layers
            );
            break;

          default:
            console.warn('Unhandled WebSocket message type:', res.type);
        }
      };
    },

    /**
     * Sends data through the WebSocket connection if it is open.
     *
     * @param {unknown} data - The data to send (will be JSON-stringified).
     */
    send(data: unknown) {
      if (this.connection && this.connection.readyState === WebSocket.OPEN) {
        this.connection.send(JSON.stringify(data));
      }
    },
  },
});
