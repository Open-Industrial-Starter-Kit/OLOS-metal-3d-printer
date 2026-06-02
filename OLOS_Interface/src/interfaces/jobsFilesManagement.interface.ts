/**
 * @interface JobsManagerWebsocketData
 * @description Represents metadata for the job manager websocket data.
 */
export interface JobsManagerWebsocketData {
  /** Websocket message type */
  type: string;

  /** Name of the opened file in the system*/
  opened_file: string;

  /** opened file content in one string */
  file_content: string;

  /** List of all the job files stored in the system */
  files_list: JobFileData[];

  /** Timestamp for the sent message */
  time: string;
}

/**
 * @interface OpenedJobFileData
 * @description Represents metadata for opened file data in the system.
 */
export interface OpenedJobFileData {
  /** Name of the opened file */
  fileName: string;

  /** opened file content */
  fileContent: string;

  /** Material name (for laser cutters) extracted from the opened file meta data */
  materialName: string;

  /** Material image (for laser cutters) extracted from the opened file meta data */

  materialImage: string;

  /** Material thickness (for laser cutters) extracted from the opened file meta data */
  materialThickness: string;
}

/**
 * @interface JobFileData
 * @description Represents metadata about a single job file stored in the system.
 */
export interface JobFileData {
  /** File name (with extension). */
  file: string;

  /** Date of when the file metadata was retrieved or file was last modified. */
  date: string;

  /** File size in bytes. */
  size: number;
}
