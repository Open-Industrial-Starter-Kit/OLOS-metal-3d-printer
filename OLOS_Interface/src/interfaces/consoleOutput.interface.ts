/**
 * @interface ScrollerData
 * @description Represents the state of a vertical scrollbar.
 */
export interface ScrollerData {
  /** Current vertical scroll position (in pixels). */
  verticalPosition: number;
  /** Height of the scrollable content (in pixels). */
  verticalSize: number;
  /** Height of the visible container (in pixels). */
  verticalContainerSize: number;
}

/**
 * @interface ConsoleTextData
 * @description Represents a single entry in the console output log.
 */
export interface ConsoleTextData {
  /** Websocket type message. */
  type: string;
  /** The actual text content of the console message. */
  text: string;
  /** Timestamp of when the message was created (ISO string format). */
  time: string;
}
