/**
 * @typedef AiGeneratorSettingsData
 * @description Represents the settings used for generating images with an AI model,
 * combining prompt fields with the base AI generation parameters.
 * @property {string} mainPrompts - The main text prompt(s) used to guide image generation.
 * @property {string} negativePrompts - Prompts specifying elements or styles to avoid.
 * @extends AISetting['settings'] - Inherits all properties from the AISetting `settings` object.
 */
export type AiGeneratorSettingsData = {
  mainPrompts: string;
  negativePrompts: string;
} & AISetting['settings'];

/**
 * @interface AISetting
 * @description Defines the structure for storing AI model generation settings and metadata.
 */
export interface AISetting {
  /** Optional unique identifier for the settings record. */
  settingsId?: number;

  /** Name or label for this set of AI generation settings. */
  name: string;

  /** Core AI image generation settings. */
  settings: {
    /** Number of inference steps to run during image generation (higher = more detail). */
    inferenceSteps: number;
    /** Number of images to generate in one request. */
    numberOfImages: number;
    /** Guidance scale controlling adherence to the text prompt (higher = closer to prompt). */
    guidanceScale: number;
    /** Whether to use a fixed seed for reproducible results. */
    isSeedsUsed: boolean;
    /** Seed value used when `isSeedsUsed` is true. */
    seed: number;
    /** Output image width in pixels. */
    imageWidth: number;
    /** Output image height in pixels. */
    imageHeight: number;
    /** Image format ('png', 'svg'). */
    imageForm: string;
    /** Name of the AI model to use for generation. */
    model: string;
  };
}

/**
 * @interface AIModelData
 * @description Represents metadata about an available AI model for image generation.
 */
export interface AIModelData {
  /** Name of the AI model. */
  name: string;
  /** Short description of the model’s purpose or capabilities. */
  description: string;
}
