from typing import List, Optional
from pydantic import BaseModel


class MaterialResponseData(BaseModel):
    """
    Represents the data payload returned from Material Library operations.

    Attributes:
        process (str): Name or identifier of the current process.
        materials_list (list[str]): List of available material names.
        success (bool): Indicates whether the operation was successful.
    """

    process: str = ''
    materials_list: list[str] = []
    success: bool = False


class MaterialLibraryResponse(BaseModel):
    """
    Represents the full API response for Material Library requests.

    Attributes:
        type (str): Type of the response.
        data (MaterialResponseData): The data payload containing material information.
    """

    type: str
    data: MaterialResponseData


class DitheringSettings(BaseModel):
    """
    Represents dithering settings used in material processing operations.

    Attributes:
        algorithm (str): Dithering algorithm name.
        grayShift (float): Gray-level adjustment value.
        resolution (float): Dithering resolution.
        blockSize (float): Size of each dithering block.
        blockDistance (float): Distance between dithering blocks.
    """

    algorithm: str
    grayShift: float
    resolution: float
    blockSize: float
    blockDistance: float


class OperationMainSettings(BaseModel):
    """
    Base configuration for a material processing operation.

    Attributes:
        power (float): Power level used during the operation.
        speed (float): Movement speed for the operation.
        tool (str): Tool identifier or name used for the operation.
    """

    power: float
    speed: float
    tool: str


class ThicknessOperation(OperationMainSettings):
    """
    Represents a specific operation configuration for a given material thickness.

    Inherits:
        OperationMainSettings

    Attributes:
        operationId (Optional[int]): Unique ID of the operation.
        operationType (str): Type of operation (e.g., cutting, engraving).
        dithering (Optional[DitheringSettings]): Dithering configuration for the operation.
    """

    operationId: Optional[int] = None
    operationType: str
    dithering: Optional[DitheringSettings] = None


class MaterialThickness(BaseModel):
    """
    Represents a material thickness and its associated operations.

    Attributes:
        thicknessId (Optional[int]): Unique ID for the thickness record.
        thicknessValue (float | str): Thickness measurement (in mm or custom unit).
        thicknessOperations (List[ThicknessOperation]): List of operations available for this thickness.
    """

    thicknessId: Optional[int] = None
    thicknessValue: float | str
    thicknessOperations: List[ThicknessOperation] = []


class MaterialData(BaseModel):
    """
    Represents complete material details including available thicknesses and operations.

    Attributes:
        materialId (Optional[int]): Unique ID for the material.
        materialName (str): Name of the material.
        materialImage (Optional[str]): Path or URL to the material's image.
        materialThicknesses (List[MaterialThickness]): List of thickness configurations for the material.
        isEditable (Optional[bool]): Indicates whether the material can be edited.
    """

    materialId: Optional[int] = None
    materialName: str
    materialImage: str | None = None
    materialThicknesses: List[MaterialThickness] = []
    isEditable: Optional[bool] = True
