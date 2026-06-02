/**
 * @interface USBJobMonitorData
 * @description Represents the monitoring data for a USB-connected device, including job and media files.
 */
export interface USBJobMonitorData {
  /** Websocket message type */
  type: string;

  /** Name of the connected USB device. */
  device_name: string;

  /** List of job files available on the USB device. */
  job_files_data: USBFileData[];

  /** List of media files available on the USB device. */
  media_files_data: USBFileData[];

  /** Whether the USB device is currently connected. */
  is_connected: boolean;

  /** Timestamp of when the data was captured (ISO string or formatted date). */
  time: string;
}

/**
 * @interface USBFileData
 * @description Represents metadata about a single file stored on a USB device.
 */
export interface USBFileData {
  /** Unique identifier for the file. */
  id: number;

  /** File name (with extension). */
  file: string;

  /** Full file path on the USB device. */
  path: string;

  /** Mount point where the USB device is attached in the system. */
  mountPoint: string;

  /** File size in bytes. */
  size: number;

  /** Timestamp of when the file metadata was retrieved or file was last modified. */
  time: string;

  /** Whether the file is currently loading (optional). */
  loading?: boolean;

  /** Whether the file has been successfully uploaded (optional). */
  uploaded?: boolean;
}
