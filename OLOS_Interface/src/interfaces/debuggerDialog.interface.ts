/**
 * @interface LogMessage
 * @description Represents metadata for the debugger log data.
 */
export interface LogMessage {
  /** ID of the log message */
  id: number;

  /** Timestamp when the log message got created */
  time: string;

  /** Log Type (e.g. Serial command, Websocket Connection ..etc) */
  type: string;

  /** Log message content */
  text: string | unknown;
}
