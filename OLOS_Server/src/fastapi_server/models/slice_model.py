from pydantic import BaseModel
from typing import Optional


class SlicingProfile(BaseModel):
    """
    Represents a stored slicing profile.

    Attributes:
        profileId (int): Unique identifier for the slicing profile.
        name (str): Name of the slicing profile.
        type (str): Type of slicing profile (e.g., 'Slic3r', 'PrusaSlicer', 'PySLM').
        settings (dict): Dictionary containing slicing settings parameters.
    """

    profileId: int
    name: str
    type: str
    settings: dict


class SlicingResponseData(BaseModel):
    """
    Represents the payload of a slicing-related API response.

    Attributes:
        process (str): The name or identifier of the executed process.
        result (str): Path or content of the slicing result.
        filesListData (list[str]): List of available sliced files.
        slicingProfiles (list[SlicingProfile]): List of available slicing profiles.
        success (bool): Whether the process completed successfully.
    """

    process: str = ''
    result: str = ''
    filesListData: list[str] = []
    slicingProfiles: list[SlicingProfile] = []
    success: bool = False


class SlicingResponse(BaseModel):
    """
    Represents the complete slicing API response.

    Attributes:
        type (str): Type of the response.
        data (SlicingResponseData): Payload containing slicing process details.
    """

    type: str
    data: SlicingResponseData


class InfillImageSettings(BaseModel):
    """
    Represents the infill image configuration for slicing.

    Attributes:
        x (float): X-coordinate of the infill image.
        y (float): Y-coordinate of the infill image.
        width (float): Width of the infill image.
        height (float): Height of the infill image.
        noise (float): Noise factor for the infill.
        isImageSizeSettings (bool): Whether image size settings are applied.
        resolution (Optional[float]): Optional resolution of the infill image.
    """

    x: float
    y: float
    width: float
    height: float
    noise: float
    isImageSizeSettings: bool
    resolution: Optional[float] = None


class ZoneExposureSettings(BaseModel):
    """
    Optional per-zone exposure and machine routine settings shared by slicers
    that generate laser layer G-code.
    """

    firstLayersCount: Optional[float] = None
    firstInfillPower: Optional[float] = None
    firstInfillSpeed: Optional[float] = None
    firstContourPower: Optional[float] = None
    firstContourSpeed: Optional[float] = None

    intermediateZoneEnabled: Optional[bool] = None
    intermediateLayersCount: Optional[float] = None
    intermediateInfillPower: Optional[float] = None
    intermediateInfillSpeed: Optional[float] = None
    intermediateContourPower: Optional[float] = None
    intermediateContourSpeed: Optional[float] = None

    noRoutineFirstLayers: Optional[float] = None
    reservoirLiftPerLayer: Optional[float] = None
    bedOffsetX: Optional[float] = None
    bedOffsetY: Optional[float] = None


class ThreeDModelSize(BaseModel):
    """
    Represents the dimensions of a 3D model.

    Attributes:
        x (float): Size along the X-axis.
        y (float): Size along the Y-axis.
        z (float): Size along the Z-axis.
    """

    x: float
    y: float
    z: float


class Slic3rSettings(BaseModel):
    """
    Represents slicing settings for Slic3r.

    Attributes:
        layerHeight (float): Layer height in millimeters.
        layerSpeed (float): Speed for layer printing.
        contourSpeed (float): Speed for contour printing.
        contourPower (float): Power setting for contours.
        infillPower (float): Power setting for infill.
        infillSpeed (float): Speed for infill.
        infillImageSettings (InfillImageSettings): Infill image configuration.
    """

    layerHeight: float
    layerSpeed: float
    contourSpeed: float
    contourPower: float
    infillPower: float
    infillSpeed: float
    infillImageSettings: InfillImageSettings


class PrusaSlicerSettings(ZoneExposureSettings):
    """
    Represents slicing settings for PrusaSlicer.

    Attributes:
        layerHeight (float): Layer height in millimeters.
        layerSpeed (float): Speed for layer printing.
        contourSpeed (float): Speed for contour printing.
        contourPower (float): Power setting for contours.
        infillPower (float): Power setting for infill.
        infillSpeed (float): Speed for infill.
        infillImageSettings (InfillImageSettings): Infill image configuration.
        isHollowingEnabled (bool): Whether hollowing is enabled.
        hollowingWallThickness (float): Thickness of hollow walls.
        hollowingClosingDistance (float): Distance for closing hollow areas.
        hollowingQuality (float): Quality factor for hollowing.
        isSupportEnabled (bool): Whether support generation is enabled.
        isSupportEnforced (bool): Whether supports are enforced.
        supportPinheadWidth (float): Width of support pinheads.
        supportPinheadFrontDiameter (float): Front diameter of pinheads.
        supportPinheadPenetration (float): Depth of pinhead penetration.
        supportPillarDiameter (float): Diameter of support pillars.
        isSupportOnBuildPlate (bool): Whether supports are only on the build plate.
        supportBaseDiameter (float): Diameter of the support base.
        supportBaseHeight (float): Height of the support base.
        supportMaxBridgeLength (float): Maximum bridge length.
        supportMaxPillarDistance (float): Maximum distance between pillars.
        supportPointsDensity (float): Density of support points.
        supportPointsMinimalDistance (float): Minimum distance between support points.
        isPadEnabled (bool): Whether a pad is enabled.
        padWallThickness (float): Thickness of pad walls.
        padBrimSize (float): Brim size for pads.
        isPadAroundObject (bool): Whether the pad surrounds the object.
        isPadAroundObjectEverywhere (bool): Whether the pad surrounds the object everywhere.
    """

    layerHeight: float
    layerSpeed: float
    contourSpeed: float
    contourPower: float
    contourLineCount: Optional[float] = 1
    infillPower: float
    infillSpeed: float
    infillImageSettings: InfillImageSettings
    infillAngle: Optional[float] = 0
    hatchRotationPerLayer: Optional[float] = 67
    infillLineCount: Optional[float] = 1
    contourInfillOverlap: Optional[float] = 15
    infillHatchSpacing: Optional[float] = 1
    optimizeScanOrder: Optional[bool] = True
    isHollowingEnabled: bool
    hollowingWallThickness: float
    hollowingClosingDistance: float
    hollowingQuality: float
    isSupportEnabled: bool
    isSupportEnforced: bool
    supportPinheadWidth: float
    supportPinheadFrontDiameter: float
    supportPinheadPenetration: float
    supportPillarDiameter: float
    isSupportOnBuildPlate: bool
    supportBaseDiameter: float
    supportBaseHeight: float
    supportMaxBridgeLength: float
    supportMaxPillarDistance: float
    supportPointsDensity: float
    supportPointsMinimalDistance: float
    isPadEnabled: bool
    padWallThickness: float
    padBrimSize: float
    isPadAroundObject: bool
    isPadAroundObjectEverywhere: bool


class PyslmSettings(ZoneExposureSettings):
    """
    Represents slicing settings for PySLM.

    Attributes:
        layerHeight (float): Layer height in millimeters.
        layerSpeed (float): Speed for layer processing.
        contourSpeed (float): Speed for contour processing.
        contourPower (float): Power for contour processing.
        outerContour (float): Outer contour offset or power.
        innerContour (float): Inner contour offset or power.
        infillPower (float): Power setting for infill.
        infillSpeed (float): Speed for infill.
        infillImageSettings (InfillImageSettings): Infill image configuration.
        infillType (str): Type of infill pattern.
        infillStripWidth (float): Width of infill strips.
        infillIslandWidth (float): Width of infill islands.
        infillIslandOverlap (float): Overlap between infill islands.
        infillIslandOffset (float): Offset for infill islands.
        infillAngle (float): Angle of infill pattern.
        infillVolumeOffset (float): Volume offset for infill.
        infillSpotCompensation (float): Compensation for spot size in infill.
    """

    layerHeight: float
    layerSpeed: float
    contourSpeed: float
    contourPower: float
    outerContour: float
    innerContour: float
    contourLineCount: Optional[float] = 1
    infillPower: float
    infillSpeed: float
    infillImageSettings: InfillImageSettings
    infillType: str
    infillLineCount: Optional[float] = 1
    infillStripWidth: float
    infillIslandWidth: float
    infillIslandOverlap: float
    infillIslandOffset: float
    infillAngle: float
    infillVolumeOffset: float
    infillSpotCompensation: float


class SlicingSettings(BaseModel):
    """
    Represents the slicing configuration for a job.

    Attributes:
        profileName (str): Name of the slicing profile.
        slicingLib (str): Slicing library used ('Slic3r', 'PrusaSlicer', 'PySLM').
        slic3rSettings (Slic3rSettings): Slic3r configuration.
        prusaSettings (PrusaSlicerSettings): PrusaSlicer configuration.
        pyslmSettings (PyslmSettings): PySLM configuration.
    """

    profileName: str
    slicingLib: str
    slic3rSettings: Slic3rSettings
    prusaSettings: PrusaSlicerSettings
    pyslmSettings: PyslmSettings


class SlicingData(BaseModel):
    """
    Represents the request body for slicing a 3D model.

    Attributes:
        modelFile (str): Path or identifier of the 3D model file.
        modelSize (ThreeDModelSize): Size of the 3D model.
        slicingSettings (SlicingSettings): Slicing settings to apply.
    """

    modelFile: str
    modelSize: ThreeDModelSize
    slicingSettings: SlicingSettings
