import { defineStore } from 'pinia';
import { Constants } from 'src/constants';
import { createDialogComponent } from 'src/services/dialog.messages.service';
import { useDebuggerDialogStore } from './debugger-dialog';

/**
 * Pinia store for managing machine status messages and dialogs.
 *
 * This store keeps track of the machine connection status, error and alarm codes,
 * displays appropriate messages, and controls dialogs for errors, alarms, and disconnections.
 * It also logs messages to the debugger dialog store.
 */
export const useMessageOutputStore = defineStore('messagesOutput', {
  state: () => ({
    /** Current machine state/status (e.g., CONNECTING, DISCONNECTED, IDLE) */
    state: Constants.CONNECTING as string,

    /** Reference to the debugger dialog store for logging and opening debugger dialogs */
    debuggerStore: useDebuggerDialogStore(),

    /** Short/small message shown in the UI (status summary) */
    smallMessage: Constants.SMALL_MESSAGES.CONNECTING_MESSAGE as string,

    /** Title of the current status message */
    messageTitle: Constants.CONNECTING as string,

    /** Detailed message body, can be string or array of strings */
    messageBody: Constants.LONG_MESSAGES.CONNECTING_MESSAGE as
      | string
      | string[],

    /** Current alarm code extracted from machine messages */
    alarmCode: 0 as number,

    /** Current error code extracted from machine messages */
    errorCode: 0 as number,

    /** Flag indicating if an error has been detected */
    isError: false as boolean,

    /** Flag to track whether the alarm dialog is currently shown */
    isAlarmDialogShown: false as boolean,

    /** Flag to track whether the disconnect dialog is currently shown */
    isDisconnectDialogShown: false as boolean,
  }),

  actions: {
    /**
     * Parses the incoming machine text message to extract alarm and error codes.
     * Sets the alarmCode, errorCode, and isError flags accordingly.
     * @param text - The raw machine status text
     */
    checkReceivedMessage(text: string) {
      const alarmMatches = text.match(/ALARM:(\d+)/);
      if (alarmMatches) {
        this.alarmCode = parseInt(alarmMatches[1]);
      }

      const errorMatches = text.match(/error:(\d+)/);
      if (errorMatches) {
        this.errorCode = parseInt(errorMatches[1]);
        this.isError = true;
      }
    },

    /**
     * Updates the store based on the new machine state.
     * Runs checks for machine state changes, errors, and connection status.
     * @param state - The new machine state string
     */
    updateMessageBasedOnStatus(state: string, showDisconnectDialog = true) {
      if (state !== this.state) {
        this.state = state;
        this.checkMachineState();
      }
      this.checkForErrors();
      this.checkMachineConnection(showDisconnectDialog);
    },

    /**
     * Checks if an error has been flagged, updates message and shows error dialog.
     * Also logs the error message to the debugger store.
     */
    checkForErrors() {
      if (this.isError) {
        const code = this.errorCode;
        this.messageTitle = Constants.ERROR + ' ' + code;
        this.showDialog(Constants.ERROR, code);

        this.debuggerStore.addLog(
          new Date(),
          Constants.MACHINE_STATUS_DATA_TYPE,
          Constants.ERROR,
          Constants.LONG_MESSAGES.ERROR_MESSAGES[code]
        );
        this.isError = false;
      }
    },

    /**
     * Checks if the machine is disconnected or connecting and updates messages and dialogs accordingly.
     */
    checkMachineConnection(showDisconnectDialog = true) {
      if (this.state === Constants.DISCONNECTED) {
        this.messageTitle = Constants.DISCONNECTED;
        this.smallMessage = Constants.SMALL_MESSAGES.DISCONNECTED_MESSAGE;
        this.messageBody = Constants.LONG_MESSAGES.DISCONNECTED_MESSAGE;

        if (showDisconnectDialog && !this.isDisconnectDialogShown) {
          this.showDialog(Constants.DISCONNECTED);
        }
      } else if (this.state === Constants.CONNECTING) {
        this.messageTitle = Constants.CONNECTING;
        this.smallMessage = Constants.SMALL_MESSAGES.CONNECTING_MESSAGE;
        this.messageBody = Constants.LONG_MESSAGES.CONNECTING_MESSAGE;
      }
    },

    /**
     * Updates the message fields according to the current machine state,
     * shows alarm dialogs if needed, and logs state changes to the debugger.
     */
    checkMachineState() {
      switch (this.state) {
        case Constants.HOLD:
          this.messageTitle = Constants.HOLD;
          this.smallMessage = Constants.SMALL_MESSAGES.HOLD_MESSAGE;
          this.messageBody = Constants.LONG_MESSAGES.HOLD_MESSAGE;
          break;
        case Constants.IDLE:
          this.messageTitle = Constants.IDLE;
          this.smallMessage = Constants.SMALL_MESSAGES.IDLE_MESSAGE;
          this.messageBody = Constants.LONG_MESSAGES.IDLE_MESSAGE;
          break;
        case Constants.DOOR:
          this.messageTitle = Constants.DOOR;
          this.smallMessage = Constants.SMALL_MESSAGES.DOOR_MESSAGE;
          this.messageBody = Constants.LONG_MESSAGES.DOOR_MESSAGE;
          break;
        case Constants.HOMING:
          this.messageTitle = Constants.HOMING;
          this.smallMessage = Constants.SMALL_MESSAGES.HOMING_MESSAGE;
          this.messageBody = Constants.LONG_MESSAGES.HOMING_MESSAGE;
          break;
        case Constants.RUN:
          this.messageTitle = Constants.RUN;
          this.smallMessage = Constants.SMALL_MESSAGES.RUN_MESSAGE;
          this.messageBody = Constants.LONG_MESSAGES.RUN_MESSAGE;
          break;
        case Constants.ALARM:
          const code = this.alarmCode;
          this.messageTitle = `${Constants.ALARM} ${code}`;
          if (!this.isAlarmDialogShown) {
            this.showDialog(Constants.ALARM, code);
          }
          this.smallMessage = Constants.SMALL_MESSAGES.ALARM_MESSAGE;
          this.messageBody = Constants.LONG_MESSAGES.ALARM_MESSAGES[code];
          break;
      }

      this.debuggerStore.addLog(
        new Date(),
        Constants.MACHINE_STATUS_DATA_TYPE,
        this.messageTitle,
        this.messageBody
      );
    },

    /**
     * Creates and displays appropriate dialog boxes based on the message type.
     * Handles user interactions with dialogs, including opening the debugger or reloading.
     * @param type - Type of message (ERROR, ALARM, DISCONNECTED)
     * @param code - Optional error or alarm code associated with the message
     */
    showDialog(type: string, code = 0) {
      if (type === Constants.ERROR) {
        createDialogComponent(type, 'Open Debugger', 'OK', code).onOk(() => {
          this.debuggerStore.showDebuggerDialog();
        });
      } else if (type === Constants.ALARM) {
        this.isAlarmDialogShown = true;
        createDialogComponent(type, 'Open Debugger', 'OK', code)
          .onOk(() => {
            this.debuggerStore.showDebuggerDialog();
          })
          .onCancel(() => {
            this.isAlarmDialogShown = false;
          });
      } else if (type === Constants.DISCONNECTED) {
        this.isDisconnectDialogShown = true;
        createDialogComponent(type, 'Retry').onOk(() => {
          location.reload();
        });
      }
    },
  },
});
