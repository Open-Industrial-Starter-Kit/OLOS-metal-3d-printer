import {
  MediaFileData,
  UsedMediaData,
} from 'src/interfaces/mediaFilesManagement.interface';
import {
  JobFileData,
  OpenedJobFileData,
} from 'src/interfaces/jobsFilesManagement.interface';
import { SlicingSettings } from './3D.slicing.interface';

/**
 * @interface JobApiResponse
 * @description Represents the server's response to a job-related API request.
 */
export interface JobApiResponse {
  /** The type of API response Message. */
  type: string;
  /** The main payload of the response. */
  data: {
    /** Process name or identifier for the job operation performed. */
    process: string;
    /** Detailed information about the currently opened job file. */
    fileData: OpenedJobFileData;
    /** List of available job files. */
    filesListData: JobFileData[];
    /** Whether the request was successful. */
    success: boolean;
    /** Estimated print duration in seconds, based on generated G-code moves. */
    estimatedPrintTimeSeconds?: number | null;
  };
}

/**
 * @interface MediaApiResponse
 * @description Represents the server's response to a media-related API request.
 */
export interface MediaApiResponse {
  /** The type of API response. */
  type: string;
  /** The main payload of the response. */
  data: {
    /** Process name or identifier for the media operation performed. */
    process: string;
    /** Information about the currently used media. */
    mediaData: UsedMediaData;
    /** List of available media files. */
    mediaListData: MediaFileData[];
    /** Whether the request was successful. */
    success: boolean;
  };
}

/**
 * @interface AIGeneratorApiResponse
 * @description Represents the server's response for an AI-generated image request.
 */
export interface AIGeneratorApiResponse {
  /** The type of API response. */
  type: string;
  /** The main payload of the response. */
  data: {
    /** Process name or identifier for the AI generation request. */
    process: string;
    /** Base64 or URI string containing generated images. */
    images: string;
    /** Whether the generated images are in SVG format. */
    isSVGImages: boolean;
    /** Whether the request was successful. */
    success: boolean;
  };
}

/**
 * @interface AIApiResponse
 * @description Represents the server's response containing AI models and settings lists.
 */
export interface AIApiResponse {
  /** The type of API response. */
  type: string;
  /** The main payload of the response. */
  data: {
    /** Process name or identifier for the AI request. */
    process: string;
    /** List of available AI models in serialized format (string). */
    aiModelsList: string;
    /** List of saved AI settings in serialized format (string). */
    aiSettingsList: string;
    /** Whether the request was successful. */
    success: boolean;
  };
}

/**
 * @interface MaterialLibraryApiResponse
 * @description Represents the server's response containing the material library list.
 */
export interface MaterialLibraryApiResponse {
  /** The type of API response. */
  type: string;
  /** The main payload of the response. */
  data: {
    /** Process name or identifier for the material library request. */
    process: string;
    /** Serialized string containing the list of available materials. */
    materialsList: string;
    /** Whether the request was successful. */
    success: boolean;
  };
}

/**
 * @interface SlicingApiResponse
 * @description Represents the server's response for a slicing operation request.
 */
export interface SlicingApiResponse {
  /** The type of API response. */
  type: string;
  /** The main payload of the response. */
  data: {
    /** Process name or identifier for the slicing request. */
    process: string;
    /** Result of the slicing operation, typically a file path or identifier. */
    result: string;
    /** List of job files generated or affected by slicing. */
    filesListData: JobFileData[];
    /** List of available slicing profiles. */
    slicingProfiles: SlicingSettings[];
    /** Whether the request was successful. */
    success: boolean;
  };
}
