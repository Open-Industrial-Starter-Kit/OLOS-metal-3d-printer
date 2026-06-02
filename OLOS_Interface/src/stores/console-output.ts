import { defineStore } from 'pinia';
import { Constants } from 'src/constants';
import { ConsoleTextData } from 'src/interfaces/consoleOutput.interface';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { useDebuggerDialogStore } from './debugger-dialog';

/**
 * Pinia store for managing console output logs and related UI state.
 */
export const useConsoleOutputStore = defineStore('consoleOutput', {
  state: () => ({
    /**
     * Instance of debugger dialog store for adding logs.
     * @type {ReturnType<typeof useDebuggerDialogStore>}
     */
    debuggerStore: useDebuggerDialogStore(),

    /**
     * Flag to toggle display of execution time in the console.
     * @type {boolean}
     */
    showExecutionTime: false as boolean,

    /**
     * List of console text entries.
     * @type {ConsoleTextData[]}
     */
    consoleTextList: [] as ConsoleTextData[],

    /**
     * Current index pointer in the console text list.
     * @type {number}
     */
    currentIndex: 0,
  }),

  actions: {
    /**
     * Adds a console text entry to the console output list.
     * If the text triggers soft limits, shows a notification error.
     * Automatically trims the list to 500 items to reduce memory usage.
     * Also logs the command to the debugger store.
     * @param {ConsoleTextData} command - Console text data to add.
     */
    addText(command: ConsoleTextData) {
      if (command.text === Constants.SOFT_LIMITS_TRIGGER) {
        showNotifyMessage().error('The command is outside of the machine bed.');
      }

      if (this.consoleTextList.length > 500) {
        this.consoleTextList.splice(0, 1);
      }

      this.consoleTextList.push(command);

      this.debuggerStore.addLog(
        new Date(),
        command.type,
        Constants.GCODE_COMMAND,
        command.text
      );
    },

    /**
     * Clears all console text entries.
     */
    clearExecutedCommandsList() {
      this.consoleTextList = [];
    },

    /**
     * Removes the first item from the console text list.
     */
    removeFirstItem() {
      this.consoleTextList.shift();
    },
  },
});
