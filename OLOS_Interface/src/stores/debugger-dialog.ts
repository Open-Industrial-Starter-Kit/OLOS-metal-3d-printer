import { defineStore } from 'pinia';
import { LogMessage } from 'src/interfaces/debuggerDialog.interface';

/**
 * Pinia store for managing the debugger dialog state and log entries.
 */
export const useDebuggerDialogStore = defineStore('debuggerDialog', {
  state: () => ({
    /** Whether the debugger dialog is visible. */
    isDialogShown: false as boolean,

    /** Whether to display serial command logs. */
    showSerialCommands: true as boolean,

    /** Whether to display connection-related messages. */
    showConnectionMessages: true as boolean,

    /** Whether to display file execution logs. */
    showFileExecution: true as boolean,

    /** Whether to display file manager logs. */
    showFileManager: true as boolean,

    /** Whether to display machine status logs. */
    showMachineStatus: true as boolean,

    /** Whether to display timestamps alongside log entries. */
    showTimeStamp: true as boolean,

    /** Whether to display slice command logs. */
    showSliceCommands: true as boolean,

    /** Array of all debugger logs. */
    logs: [] as LogMessage[],
  }),

  actions: {
    /**
     * Shows the debugger dialog.
     */
    showDebuggerDialog() {
      this.isDialogShown = true;
    },

    /**
     * Hides the debugger dialog.
     */
    closeDebuggerDialog() {
      this.isDialogShown = false;
    },

    /**
     * Adds a new log entry to the debugger logs.
     * @param {Date} time - The timestamp for the log entry.
     * @param {string} type - The category/type of the log.
     * @param {string} title - A short title or label for the log entry.
     * @param {string | unknown} body - The main body text of the log entry.
     */
    addLog(time: Date, type: string, title: string, body: string | unknown) {
      this.logs.push({
        id: this.logs.length,
        time: this.formatTimestamp(time),
        type,
        text: `${title}: ${body}`,
      });
    },

    /**
     * Formats a date into a `DD-MM-YYYY HH:mm:ss` string.
     * @param {Date} time - Date object to format.
     * @returns {string} The formatted timestamp.
     */
    formatTimestamp(time: Date) {
      const hours = String(time.getHours()).padStart(2, '0');
      const minutes = String(time.getMinutes()).padStart(2, '0');
      const seconds = String(time.getSeconds()).padStart(2, '0');
      const day = String(time.getDate()).padStart(2, '0');
      const month = String(time.getMonth() + 1).padStart(2, '0');
      const year = time.getFullYear();

      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    },

    /**
     * Downloads the debugger logs as a `.txt` file.
     */
    downloadLogs() {
      const logsText = this.logs
        .map((log) => `${log?.time} [${log?.type}] ${log?.text}`)
        .join('\n');
      const filename = 'olos_logs.txt';
      const blob = new Blob([logsText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },

    /**
     * Clears all logs from the debugger.
     */
    clearDebuggerLogs() {
      this.logs = [];
    },
  },
});
