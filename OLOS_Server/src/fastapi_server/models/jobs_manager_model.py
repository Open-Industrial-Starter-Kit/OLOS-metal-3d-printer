from typing import Dict, List,  Optional
from pydantic import BaseModel


class JobsManagerData(BaseModel):
    """
    Represents job-related data for the Jobs Manager service.

    Attributes:
        process (str): The current process name or identifier.
        fileData (Dict[str, str]): Metadata about a single file, including:

            - fileName (str): Name of the file.
            - fileContent (str): Content of the file.
            - materialName (str): Name of the material.
            - materialImage (str): Path or URL to the material's image.
            - materialThickness (str): Material thickness.

        filesListData (list[str]): List of available job files.
        success (bool): Indicates if the operation was successful.
    """

    process: str = ''
    fileData: Dict[str, str] = {'fileName': '', 'fileContent': '',
                                'materialName': '', 'materialImage': '', 'materialThickness': ''}
    filesListData: list[str] = []
    success: bool = False


class JobsManagerResponse(BaseModel):
    """
    Represents the response structure for Jobs Manager operations.

    Attributes:
        type (str): The type of the response.
        data (JobsManagerData): The data payload containing job-related information.
    """

    type: str
    data: JobsManagerData


class RenameJobData(BaseModel):
    """
    Represents the data required to rename a job file.

    Attributes:
        old_filename (str): Current name of the file.
        new_filename (str): New name for the file.
    """

    old_filename: str = ''
    new_filename: str = ''


class USBJobFileData(BaseModel):
    """
    Represents a job file retrieved from a USB device.

    Attributes:
        filename (str): Name of the file.
        file_path (str): Absolute path to the file on the USB device.
    """

    filename: str = ''
    file_path: str = ''


class ImageMetrics(BaseModel):
    """
    Represents positioning, scaling, and rotation metrics for an image.

    Attributes:
        x (float): X-coordinate of the image position.
        y (float): Y-coordinate of the image position.
        width (float): Image width.
        height (float): Image height.
        rotation (float): Rotation angle in degrees.
        scaleX (float): Horizontal scaling factor.
        scaleY (float): Vertical scaling factor.
        offsetX (float): Horizontal offset from origin.
        offsetY (float): Vertical offset from origin.
    """

    x: float
    y: float
    width: float
    height: float
    rotation: float
    scaleX: float
    scaleY: float
    offsetX: float
    offsetY: float


class DitheringSettings(BaseModel):
    """
    Represents dithering settings for image processing.

    Attributes:
        algorithm (str): Dithering algorithm name.
        grayShift (float): Gray-level adjustment value.
        resolution (float): Dithering resolution.
        blockSize (float): Size of the dithering block.
        blockDistance (float): Distance between dithering blocks.
    """

    algorithm: str
    grayShift: float
    resolution: float
    blockSize: float
    blockDistance: float


class OperationMainSettings(BaseModel):
    """
    Represents base settings for a machine operation.

    Attributes:
        power (float): Power level for the operation.
        speed (float): Movement speed for the operation.
        tool (str): Tool identifier or name.
    """

    power: float
    speed: float
    tool: str


class ThicknessOperation(OperationMainSettings):
    """
    Represents an operation tied to a specific material thickness.

    Inherits:
        OperationMainSettings

    Attributes:
        operationId (Optional[int]): Unique identifier for the operation.
        operationType (Optional[str]): Type of operation (e.g., cutting, marking).
        dithering (Optional[DitheringSettings]): Optional dithering configuration.
    """

    operationId: Optional[int] = None
    operationType: Optional[str] = None
    dithering: Optional[DitheringSettings] = None


class EngravingSettings(OperationMainSettings):
    """
    Represents engraving operation settings.

    Inherits:
        OperationMainSettings

    Attributes:
        dithering (DitheringSettings): Dithering configuration for engraving.
    """

    dithering: DitheringSettings


class MainSettings(BaseModel):
    """
    Represents general settings for a G-code generation job.

    Attributes:
        material (str): Name of the material.
        thickness (float): Material thickness.
        metrics (ImageMetrics): Positioning and scaling metrics for the image.
        filename (str): File name associated with the job.
    """

    material: str
    thickness: float
    metrics: ImageMetrics
    filename: str


class GcodeFileSettings(BaseModel):
    """
    Represents all machine operation settings for a G-code file.

    Attributes:
        mainSettings (MainSettings): General job settings.
        cuttingSettings (ThicknessOperation): Cutting operation settings.
        markingSettings (ThicknessOperation): Marking operation settings.
        engravingSettings (EngravingSettings): Engraving operation settings.
    """

    mainSettings: MainSettings
    cuttingSettings: ThicknessOperation
    markingSettings: ThicknessOperation
    engravingSettings: EngravingSettings


class ModifiedImageData(BaseModel):
    """
    Represents modified image data and associated G-code settings.

    Attributes:
        modifiedSVGCutting (Optional[str]): Modified SVG data for cutting operations.
        modifiedSVGMarking (Optional[str]): Modified SVG data for marking operations.
        modifiedEngravingImage (Optional[str]): Modified raster data for engraving operations.
        gcodeSettings (GcodeFileSettings): Associated G-code generation settings.
    """

    modifiedSVGCutting: Optional[str] = None
    modifiedSVGMarking: Optional[str] = None
    modifiedEngravingImage: Optional[str] = None
    gcodeSettings: GcodeFileSettings


class GcodeFileData(BaseModel):
    """
    Represents a complete G-code generation request.

    Attributes:
        name (str): Name of the job.
        modifiedImagesData (List[ModifiedImageData]): List of modified image and settings data.
    """

    name: str
    modifiedImagesData: List[ModifiedImageData]
