from typing import Optional
from pydantic import BaseModel


class AIConfigData(BaseModel):
    """
    Represents the configuration data for the AI system.

    Attributes:
        process (str): The current AI process identifier.
        ai_models_list (list[str]): List of available AI model names.
        ai_settings_list (list[str]): List of available AI settings names.
        success (bool): Indicates whether the configuration retrieval was successful.
    """

    process: str = ''
    ai_models_list: list[str] = []
    ai_settings_list: list[str] = []
    success: bool = False


class AIImageGeneratorData(BaseModel):
    """
    Represents the data returned from the AI image generation process.

    Attributes:
        process (str): The current AI process identifier.
        images (list[str]): List of generated image file paths or URLs.
        is_svg_images (bool): Indicates if the generated images are in SVG format.
        success (bool): Indicates whether the image generation was successful.
    """

    process: str = ''
    images: list[str] = []
    is_svg_images: bool = False
    success: bool = False


class AIImageGeneratorResponse(BaseModel):
    """
    Represents the API response for AI image generation.

    Attributes:
        type (str): The type of the response.
        data (AIImageGeneratorData): The data payload containing image generation details.
    """

    type: str
    data: AIImageGeneratorData


class AIConfigResponse(BaseModel):
    """
    Represents the API response for AI configuration retrieval.

    Attributes:
        type (str): The type of the response.
        data (AIConfigData): The data payload containing AI configuration details.
    """

    type: str
    data: AIConfigData


class MainAISetting(BaseModel):
    """
    Represents the detailed AI generation settings.

    Attributes:
        inferenceSteps (int): Number of inference steps for the AI model.
        numberOfImages (int): Number of images to generate.
        guidanceScale (float): Guidance scale for prompt adherence.
        isSeedsUsed (bool): Indicates if a specific seed value is used.
        seed (int): Seed value for reproducible results.
        imageWidth (int): Width of generated images in pixels.
        imageHeight (int): Height of generated images in pixels.
        imageForm (str): Image format (e.g., 'png', 'jpg', 'svg').
        model (str): Name of the AI model to be used.
    """

    inferenceSteps: int
    numberOfImages: int
    guidanceScale: float
    isSeedsUsed: bool
    seed: int
    imageWidth: int
    imageHeight: int
    imageForm: str
    model: str


class AISettings(BaseModel):
    """
    Represents a named set of AI settings.

    Attributes:
        settingsId (Optional[int]): Unique identifier for the settings (if any).
        name (str): Name of the AI settings configuration.
        settings (MainAISetting): The main AI settings.
    """

    settingsId: Optional[int] = None
    name: str
    settings: MainAISetting


class AIGeneratorSettingsData(BaseModel):
    """
    Represents the input data for generating images using AI.

    Attributes:
        mainPrompts (str): Primary text prompts for image generation.
        negativePrompts (str): Negative prompts to avoid unwanted elements.
        inferenceSteps (int): Number of inference steps.
        numberOfImages (int): Number of images to generate.
        guidanceScale (float): Guidance scale for prompt adherence.
        isSeedsUsed (bool): Indicates if a seed value should be used.
        seed (int): Seed value for reproducible results.
        imageWidth (int): Width of generated images in pixels.
        imageHeight (int): Height of generated images in pixels.
        imageForm (str): Image format (e.g., 'png', 'jpg', 'svg').
        model (str): Name of the AI model to be used.
    """

    mainPrompts: str
    negativePrompts: str
    inferenceSteps: int
    numberOfImages: int
    guidanceScale: float
    isSeedsUsed: bool
    seed: int
    imageWidth: int
    imageHeight: int
    imageForm: str
    model: str
