import { api } from 'src/boot/axios';
import { Constants } from 'src/constants';
import {
  SlicingData,
  SlicingSettings,
} from 'src/interfaces/3D.slicing.interface';
import {
  AiGeneratorSettingsData,
  AISetting,
} from 'src/interfaces/aiGeneratorImage.interface';
import {
  AIApiResponse,
  JobApiResponse,
  MaterialLibraryApiResponse,
  AIGeneratorApiResponse,
  MediaApiResponse,
  SlicingApiResponse,
} from 'src/interfaces/API.interface';
import {
  GcodeFileData,
  MaterialData,
} from 'src/interfaces/imageToGcode.interface';

/**
 * @description Utility function to construct a complete API URL with optional parameters.
 * @param {string} endpoint - Base API endpoint.
 * @param {string} [params] - Optional path or query parameters to append.
 * @returns {string} The full constructed URL.
 */
const getUrl: (endpoint: string, params?: string) => string = (
  endpoint,
  params
) => (params ? `${endpoint}${params}` : endpoint);

const API = {
  /**
   * @description Opens a job file on the server.
   * @param {string} filename - Name of the file to open.
   * @returns {Promise<import('axios').AxiosResponse<JobApiResponse>>}
   */
  openFile: (filename: string) =>
    api.post<JobApiResponse>(
      getUrl(Constants.API_URI.JOBS_MANAGER, `open/${filename}`)
    ),

  /**
   * @description Deletes a job file from the server.
   * @param {string} filename - Name of the file to delete.
   * @returns {Promise<import('axios').AxiosResponse<JobApiResponse>>}
   */
  deleteFile: (filename: string) =>
    api.delete<JobApiResponse>(
      getUrl(Constants.API_URI.JOBS_MANAGER, `delete/${filename}`)
    ),

  /**
   * @description Renames a job file on the server.
   * @param {string} oldFilename - Current file name.
   * @param {string} newFilename - New file name.
   * @returns {Promise<import('axios').AxiosResponse<JobApiResponse>>}
   */
  renameFile: (oldFilename: string, newFilename: string) => {
    const json_data = {
      old_filename: oldFilename,
      new_filename: newFilename,
    };
    return api.put<JobApiResponse>(
      getUrl(Constants.API_URI.JOBS_MANAGER, 'rename'),
      json_data,
      { headers: { 'Content-Type': 'application/json' } }
    );
  },

  /**
   * @description Uploads a job file from USB storage to the server.
   * @param {string} filePath - Path of the file on the USB device.
   * @returns {Promise<import('axios').AxiosResponse<JobApiResponse>>}
   */
  uploadJobFileFromUSB: (filePath: string) => {
    const json_data = { file_path: filePath };
    return api.post<JobApiResponse>(
      getUrl(Constants.API_URI.JOBS_MANAGER, 'upload_usb_job_file'),
      json_data,
      { headers: { 'Content-Type': 'application/json' } }
    );
  },

  /** @description Closes the currently open job file. */
  closeFile: () =>
    api.post<JobApiResponse>(getUrl(Constants.API_URI.JOBS_MANAGER, 'close')),

  /** @description Starts execution of the currently open job file. */
  startFile: () =>
    api.post<JobApiResponse>(getUrl(Constants.API_URI.JOBS_MANAGER, 'start')),

  /** @description Checks if a job file is currently open on the server. */
  checkOpenFile: () =>
    api.get<JobApiResponse>(getUrl(Constants.API_URI.JOBS_MANAGER, 'check')),

  /**
   * @description Generates a G-code file based on provided data.
   * @param {GcodeFileData} gcodeFileData - Data for generating the G-code file.
   */
  generateGcodeFile: (gcodeFileData: GcodeFileData) =>
    api.post<JobApiResponse>(
      getUrl(Constants.API_URI.JOBS_MANAGER, 'generate'),
      gcodeFileData,
      { headers: { 'Content-Type': 'application/json' } }
    ),

  /** @description Cancels ongoing G-code generation process. */
  cancelGenerateGcodeFile: () =>
    api.post(getUrl(Constants.API_URI.JOBS_MANAGER, 'cancel')),

  /**
   * @description Downloads a job file from the server.
   * @param {string} filename - Name of the file to download.
   */
  downloadFile: (filename: string) =>
    api.post(getUrl(Constants.API_URI.JOBS_MANAGER, `download/${filename}`)),

  // ---------------- Media Manager ----------------

  /**
   * @description Uploads a media file to the server.
   * @param {File} mediaFile - Media file to upload.
   */
  uploadMedia: (mediaFile: File) => {
    const formData = new FormData();
    formData.append('file', mediaFile);
    return api.post<MediaApiResponse>(
      getUrl(Constants.API_URI.MEDIA_MANAGER, 'upload'),
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  /**
   * @description Fetches media metadata from the server.
   * @param {string} mediaName - Name of the media to fetch.
   */
  fetchMediaData: (mediaName: string) =>
    api.get<MediaApiResponse>(
      getUrl(Constants.API_URI.MEDIA_MANAGER, `fetch/${mediaName}`)
    ),

  /** @description Deletes a media file from the server. */
  deleteMedia: (mediaName: string) =>
    api.delete<MediaApiResponse>(
      getUrl(Constants.API_URI.MEDIA_MANAGER, `delete/${mediaName}`)
    ),

  /** @description Renames a media file on the server. */
  renameMedia: (oldMediaName: string, newMediaName: string) => {
    const json_data = {
      old_media_name: oldMediaName,
      new_media_name: newMediaName,
    };
    return api.put<MediaApiResponse>(
      getUrl(Constants.API_URI.MEDIA_MANAGER, 'rename'),
      json_data,
      { headers: { 'Content-Type': 'application/json' } }
    );
  },

  /** @description Uploads a media file from USB storage to the server. */
  uploadMediaFileFromUSB: (mediaPath: string) => {
    const json_data = { media_path: mediaPath };
    return api.post<MediaApiResponse>(
      getUrl(Constants.API_URI.MEDIA_MANAGER, 'upload_usb_media_file'),
      json_data,
      { headers: { 'Content-Type': 'application/json' } }
    );
  },

  /** @description Lists all media files available on the server. */
  listMediaData: () =>
    api.get<MediaApiResponse>(getUrl(Constants.API_URI.MEDIA_MANAGER, 'list')),

  // ---------------- AI API ----------------

  /** @description Retrieves AI configuration data. */
  getAIConfigData: () =>
    api.get<AIApiResponse>(getUrl(Constants.API_URI.AI, 'config')),

  /** @description Generates an AI image from a given prompt. */
  generateImageAI: (prompt: string) =>
    api.post<AIApiResponse>(getUrl(Constants.API_URI.AI, `generate/${prompt}`)),

  /** @description Adds a new AI settings profile. */
  addNewAISettings: (aiSettings: AISetting) =>
    api.post<AIApiResponse>(getUrl(Constants.API_URI.AI, 'add'), aiSettings, {
      headers: { 'Content-Type': 'application/json' },
    }),

  /** @description Deletes an AI settings profile by ID. */
  deleteAISetting: (aiSettingId: number) =>
    api.delete<AIApiResponse>(
      getUrl(Constants.API_URI.AI, `delete/${aiSettingId}`)
    ),

  /** @description Updates an existing AI settings profile. */
  updateAISetting: (aiSettings: AISetting) =>
    api.put<AIApiResponse>(getUrl(Constants.API_URI.AI, 'update'), aiSettings, {
      headers: { 'Content-Type': 'application/json' },
    }),

  /** @description Generates AI images based on given settings. */
  generateAIImages: (aiGeneratorSettingsData: AiGeneratorSettingsData) =>
    api.post<AIGeneratorApiResponse>(
      getUrl(Constants.API_URI.AI, 'generate'),
      aiGeneratorSettingsData,
      { headers: { 'Content-Type': 'application/json' } }
    ),

  /** @description Cancels ongoing AI image generation. */
  cancelGeneratingImages: () =>
    api.post(getUrl(Constants.API_URI.AI, 'cancel')),

  // ---------------- Materials Library ----------------

  /** @description Retrieves the list of materials from the server. */
  getMaterialsList: () =>
    api.get<MaterialLibraryApiResponse>(
      getUrl(Constants.API_URI.MATERIAL_LIBRARY, 'list')
    ),

  /** @description Adds a new material to the library. */
  addNewMaterial: (materialData: MaterialData) =>
    api.post<MaterialLibraryApiResponse>(
      getUrl(Constants.API_URI.MATERIAL_LIBRARY, 'add'),
      materialData,
      { headers: { 'Content-Type': 'application/json' } }
    ),

  /** @description Updates an existing material in the library. */
  updateMaterial: (materialData: MaterialData) =>
    api.put<MaterialLibraryApiResponse>(
      getUrl(Constants.API_URI.MATERIAL_LIBRARY, 'update'),
      materialData,
      { headers: { 'Content-Type': 'application/json' } }
    ),

  /** @description Deletes a material by ID. */
  deleteMaterial: (materialId: number) =>
    api.delete<MaterialLibraryApiResponse>(
      getUrl(Constants.API_URI.MATERIAL_LIBRARY, `delete/${materialId}`)
    ),

  // ---------------- Slicing ----------------

  /** @description Initiates a slicing process with the provided model data and settings. */
  sliceModels: (slicingData: SlicingData) =>
    api.post<SlicingApiResponse>(
      getUrl(Constants.API_URI.SLICE, 'slice'),
      slicingData,
      { headers: { 'Content-Type': 'application/json' } }
    ),

  /** @description Cancels an ongoing slicing process. */
  cancelSlicingProcess: () =>
    api.post<SlicingApiResponse>(getUrl(Constants.API_URI.SLICE, 'cancel')),

  /** @description Saves a slicing result to a file. */
  saveSlicingFile: (filename: string) =>
    api.post<SlicingApiResponse>(
      getUrl(Constants.API_URI.SLICE, `save/${filename}`)
    ),

  /** @description Retrieves a preview of the slicing process. */
  previewSlicingProcess: () =>
    api.get<SlicingApiResponse>(getUrl(Constants.API_URI.SLICE, 'preview')),

  /** @description Lists all saved slicing profiles. */
  listSlicingProfiles: () =>
    api.get<SlicingApiResponse>(getUrl(Constants.API_URI.SLICE, 'list')),

  /** @description Adds a new slicing profile. */
  addNewSlicingProfile: (slicingSettings: SlicingSettings) =>
    api.post<SlicingApiResponse>(
      getUrl(Constants.API_URI.SLICE, 'add'),
      slicingSettings,
      { headers: { 'Content-Type': 'application/json' } }
    ),

  /** @description Deletes a slicing profile by ID. */
  deleteSlicingProfile: (slicingProfileId: number) =>
    api.delete<SlicingApiResponse>(
      getUrl(Constants.API_URI.SLICE, `delete/${slicingProfileId}`)
    ),

  /** @description Updates an existing slicing profile. */
  updateSlicingSetting: (sliceSettings: SlicingSettings) =>
    api.put<SlicingApiResponse>(
      getUrl(Constants.API_URI.SLICE, 'update'),
      sliceSettings,
      { headers: { 'Content-Type': 'application/json' } }
    ),
};

export default API;
