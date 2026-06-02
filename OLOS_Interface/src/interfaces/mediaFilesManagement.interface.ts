/**
 * @interface UsedMediaData
 * @description Represents metadata for a media item that has been used.
 */
export interface UsedMediaData {
  /** The name of the media file. */
  mediaName: string;

  /** Source path or URL of the media file */
  mediaSource: string;
}

/**
 * @interface MediaFileData
 * @description Represents metadata about a media file stored in the system or on an external device.
 */
export interface MediaFileData {
  /** File name (with extension). */
  file: string;

  /** Date when the file was added or last modified (formatted string). */
  date: string;

  /** File size in KBytes. */
  size: number;

  /** Whether the file is currently loading (optional). */
  loading?: boolean;

  /** Whether the file has been successfully downloaded (optional). */
  downloaded?: boolean;
}
