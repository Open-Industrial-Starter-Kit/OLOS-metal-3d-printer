from pydantic import BaseModel, Field
from typing import List, Literal, Optional


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
    firstZoneEngravingEnabled: Optional[bool] = None
    firstInfillPower: Optional[float] = None
    firstInfillSpeed: Optional[float] = None
    firstEngravingHatchSpacing: Optional[float] = None
    firstContourPower: Optional[float] = None
    firstContourSpeed: Optional[float] = None

    intermediateZoneEnabled: Optional[bool] = None
    intermediateZoneEngravingEnabled: Optional[bool] = None
    intermediateLayersCount: Optional[float] = None
    intermediateInfillPower: Optional[float] = None
    intermediateInfillSpeed: Optional[float] = None
    intermediateEngravingHatchSpacing: Optional[float] = None
    intermediateContourPower: Optional[float] = None
    intermediateContourSpeed: Optional[float] = None

    noRoutineFirstLayers: Optional[float] = None
    reservoirLiftPerLayer: Optional[float] = None
    recoaterFeedRate: Optional[float] = 3000
    recoaterReturnBedDropEnabled: Optional[bool] = False
    recoaterReturnBedDropDistance: Optional[float] = Field(default=0.2, gt=0)
    recoaterReturnBedFeedRate: Optional[float] = Field(default=50, gt=0)
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

    solidModeEnabled: bool = False
    solidMergeObjectsByLayer: bool = True
    solidAnchorPadEnabled: bool = False
    solidAnchorPadLayers: int = Field(default=1, ge=1)
    solidAnchorPadSize: float = Field(default=20, gt=0)
    solidAnchorPadPower: float = Field(default=50, ge=0, le=100)
    solidAnchorPadSpeed: float = Field(default=3000, gt=0)
    solidAnchorPadLineOverlap: float = Field(
        default=0, ge=-100, le=95)
    solidAnchorPadRotateEachLayer: bool = False
    solidAnchorPadRotationPerLayer: float = Field(
        default=90, ge=-180, le=180)
    solidTransitionEnabled: bool = False
    solidTransitionLayers: int = Field(default=1, ge=1, le=1000)
    solidTransitionPattern: Literal["lines", "grid"] = "lines"
    solidTransitionPower: float = Field(default=50, ge=0, le=100)
    solidTransitionSpeed: float = Field(default=3000, gt=0)
    solidTransitionTrackWidth: float = Field(default=0.2, gt=0)
    solidTransitionLineOverlap: float = Field(
        default=0, ge=-100, le=95)
    solidTransitionLineCount: int = Field(default=1, ge=1, le=25)
    solidTransitionHatchSpacing: float = Field(default=1, gt=0)
    solidTransitionGridSpacing: float = Field(default=1, gt=0)
    solidTransitionGridClearance: float = Field(default=0.2, ge=0)
    solidTransitionRasterDirection: Literal[
        "x", "y", "diagonal"] = "x"
    solidTransitionRotateEachLayer: bool = False
    solidTransitionRotationPerLayer: float = Field(
        default=90, ge=-180, le=180)
    solidTransitionContourEnabled: bool = True
    solidTransitionContourPower: float = Field(default=50, ge=0, le=100)
    solidTransitionContourSpeed: float = Field(default=3000, gt=0)
    solidTransitionContourLineCount: int = Field(
        default=1, ge=1, le=25)
    solidTransitionContourOverlap: float = Field(
        default=0, ge=-100, le=100)
    solidTrackWidth: float = Field(default=0.2, gt=0)
    solidCloseTopBottomEnabled: bool = False
    solidCloseTopBottomLayers: int = Field(default=3, ge=1)
    solidCloseTopBottomPower: float = Field(default=50, ge=0, le=100)
    solidCloseTopBottomSpeed: float = Field(default=3000, gt=0)
    solidCloseTopBottomLineOverlap: float = Field(
        default=0, ge=-100, le=95)
    solidFirstZoneEnabled: bool = False
    solidFirstZoneEngravingEnabled: bool = True
    solidFirstLayersCount: int = Field(default=1, ge=1)
    solidFirstPower: float = Field(default=50, ge=0, le=100)
    solidFirstSpeed: float = Field(default=3000, gt=0)
    solidFirstEngravingHatchSpacing: float = Field(default=0.2, gt=0)
    solidIntermediateZoneEnabled: bool = False
    solidIntermediateZoneEngravingEnabled: bool = True
    solidIntermediateLayersCount: int = Field(default=1, ge=1)
    solidIntermediatePower: float = Field(default=50, ge=0, le=100)
    solidIntermediateSpeed: float = Field(default=3000, gt=0)
    solidIntermediateEngravingHatchSpacing: float = Field(
        default=0.2, gt=0)
    solidRasterDirection: Literal["x", "y", "diagonal"] = "x"
    solidCrossHatch: bool = False
    solidAlternateLines: bool = True
    solidAlternateMode: Literal[
        "two-pass", "edge-interleave"] = "edge-interleave"
    solidIslandScanningEnabled: bool = False
    solidIslandSize: float = Field(default=3, gt=0)
    solidIslandScanStrategy: Literal[
        "normal", "two-pass", "edge-interleave"] = "edge-interleave"
    solidPower: float = Field(default=50, ge=0, le=100)
    solidSpeed: float = Field(default=3000, gt=0)
    solidContourOverlap: float = Field(default=0, ge=-100, le=100)
    solidLineOverlap: float = Field(default=0, ge=-100, le=95)
    solidContourEnabled: bool = True
    solidContourPower: float = Field(default=50, ge=0, le=100)
    solidContourSpeed: float = Field(default=3000, gt=0)
    solidContourLineCount: int = Field(default=3, ge=1, le=25)

    engravingMode: Literal["vectoring", "engraving"] = "vectoring"
    engravingAcceleration: float = Field(default=500, gt=0)
    engravingContourThickness: float = Field(default=0.8, gt=0)
    nominalVectorTrackWidth: float = Field(default=0.2, gt=0)
    lineBundleSpacing: float = Field(default=0.2, gt=0)
    matchEngravedShellToVectorWall: bool = True
    engravingRasterDirection: Literal["x", "y"] = "x"
    layerHeight: float
    layerSpeed: float
    contourSpeed: float
    contourPower: float
    contourLineCount: Optional[float] = 1
    autoContourLineCountEnabled: Optional[bool] = False
    infillPower: float
    infillSpeed: float
    infillImageSettings: InfillImageSettings
    infillType: Optional[str] = "Lines"
    infillAngle: Optional[float] = 0
    hatchRotationPerLayer: Optional[float] = 67
    hatchRotationGroupingEnabled: Optional[bool] = False
    hatchRotationGroupLayers: Optional[float] = 5
    infillLineCount: Optional[float] = 1
    infillLineThickness: Optional[float] = 0.8
    contourInfillOverlap: Optional[float] = 15
    scanlineSpacing: Optional[float] = Field(default=0.2, gt=0)
    infillHatchSpacing: Optional[float] = 1
    surfaceSkinEnabled: Optional[bool] = True
    surfaceSkinLayers: Optional[int] = Field(default=3, ge=1)
    surfaceSkinEngravingEnabled: Optional[bool] = False
    surfaceSkinHatchSpacing: Optional[float] = Field(default=0.2, gt=0)
    surfaceSkinPower: Optional[float] = Field(default=50, ge=0, le=100)
    surfaceSkinSpeed: Optional[float] = Field(default=3000, gt=0)
    surfaceSkinAlternateLines: Optional[bool] = False
    surfaceSkinAlternateMode: Optional[str] = "two-pass"
    flatSurfaceSkinLayers: Optional[int] = Field(default=3, ge=1)
    flatSurfaceSkinHatchSpacing: Optional[float] = Field(default=0.2, gt=0)
    flatSurfaceSkinPower: Optional[float] = Field(default=50, ge=0, le=100)
    flatSurfaceSkinSpeed: Optional[float] = Field(default=3000, gt=0)
    flatSurfaceSkinRasterDirection: Optional[str] = "x"
    flatSurfaceSkinCrossHatch: Optional[bool] = False
    flatSurfaceSkinPattern: Optional[str] = "hatch"
    flatSurfaceSkinSpiralDirection: Optional[str] = "outside-in"
    flatSurfaceSkinBoundaryMode: Optional[str] = "engrave"
    flatSurfaceSkinContourLineCount: Optional[int] = Field(default=3, ge=1)
    flatSurfaceSkinContourOverlap: Optional[float] = Field(default=15, ge=-100, le=100)
    flatSurfaceSkinHatchOverlap: Optional[float] = Field(default=0, ge=-100, le=95)
    flatSurfaceSkinSecondPassEnabled: Optional[bool] = False
    flatSurfaceSkinSecondPassPower: Optional[float] = Field(default=50, ge=0, le=100)
    flatSurfaceSkinSecondPassSpeed: Optional[float] = Field(default=3000, gt=0)
    flatSurfaceSkinSecondPassHatchOverlap: Optional[float] = Field(default=0, ge=-100, le=95)
    flatSurfaceSkinSecondPassRasterDirection: Optional[str] = "x"
    flatSurfaceSkinSecondPassCrossHatch: Optional[bool] = False
    flatSurfaceSkinSecondPassBoundaryMode: Optional[str] = "engrave"
    flatSurfaceSkinSecondPassContourLineCount: Optional[int] = Field(default=3, ge=1)
    flatSurfaceSkinSecondPassContourOverlap: Optional[float] = Field(default=15, ge=-100, le=100)
    roofHollowInfillEnabled: Optional[bool] = False
    roofHollowInfillOverlap: Optional[float] = Field(default=15, ge=-100, le=100)
    internalFloorSupportEnabled: Optional[bool] = False
    internalFloorSupportMode: Optional[Literal["vectoring", "engraving"]] = "vectoring"
    internalFloorSupportType: Optional[Literal["Lines", "Grid"]] = "Lines"
    internalFloorSupportPower: Optional[float] = Field(default=50, ge=0, le=100)
    internalFloorSupportSpeed: Optional[float] = Field(default=3000, gt=0)
    internalFloorSupportTrackWidth: Optional[float] = Field(default=0.2, gt=0)
    internalFloorSupportLineOverlap: Optional[float] = Field(default=0, ge=-100, le=95)
    internalFloorSupportLineCount: Optional[int] = Field(default=3, ge=1)
    internalFloorSupportHatchSpacing: Optional[float] = Field(default=1, gt=0)
    internalFloorSupportGridSpacing: Optional[float] = Field(default=2, gt=0)
    internalFloorSupportGridClearance: Optional[float] = Field(default=0.2, ge=0)
    internalFloorSupportAngle: Optional[float] = 45
    internalFloorSupportRotationPerLayer: Optional[float] = 67
    internalFloorSupportGroupingEnabled: Optional[bool] = False
    internalFloorSupportGroupLayers: Optional[int] = Field(default=1, ge=1)
    internalFloorSupportBoundaryClearance: Optional[float] = Field(default=0, ge=0)
    internalFloorSupportMinimumArea: Optional[float] = Field(default=0.1, ge=0)
    internalFloorSupportOptimizeScanOrder: Optional[bool] = True
    variableGridInfillEnabled: Optional[bool] = False
    variableGridTarget: Optional[Literal["hollow", "both"]] = "hollow"
    variableGridInfillLayersBeforeRoof: Optional[int] = Field(default=3, ge=1)
    variableGridSpacing: Optional[float] = Field(default=1, gt=0)
    variableGridHatchSpacing: Optional[float] = Field(default=1, gt=0)
    variableGridHatchRotationPerLayer: Optional[float] = 67
    variableGridClearance: Optional[float] = Field(default=0.2, ge=0)
    variableGridLineCount: Optional[int] = Field(default=3, ge=1)
    variableEngravingGridSpacing: Optional[float] = Field(default=1, gt=0)
    variableEngravingGridLineThickness: Optional[float] = Field(default=0.8, gt=0)
    multiVariableGridEnabled: Optional[bool] = False
    secondaryVariableGridLayersBeforeRoof: Optional[int] = Field(default=6, ge=1)
    secondaryVariableGridSpacing: Optional[float] = Field(default=1, gt=0)
    secondaryVariableGridHatchSpacing: Optional[float] = Field(default=1, gt=0)
    secondaryVariableGridClearance: Optional[float] = Field(default=0.2, ge=0)
    secondaryVariableGridLineCount: Optional[int] = Field(default=3, ge=1)
    secondaryVariableEngravingGridSpacing: Optional[float] = Field(default=1, gt=0)
    secondaryVariableEngravingGridLineThickness: Optional[float] = Field(default=0.8, gt=0)
    tertiaryVariableGridEnabled: Optional[bool] = False
    tertiaryVariableGridLayersBeforeRoof: Optional[int] = Field(default=6, ge=1)
    tertiaryVariableGridSpacing: Optional[float] = Field(default=1, gt=0)
    tertiaryVariableGridHatchSpacing: Optional[float] = Field(default=1, gt=0)
    tertiaryVariableGridClearance: Optional[float] = Field(default=0.2, ge=0)
    tertiaryVariableGridLineCount: Optional[int] = Field(default=3, ge=1)
    tertiaryVariableEngravingGridSpacing: Optional[float] = Field(default=1, gt=0)
    tertiaryVariableEngravingGridLineThickness: Optional[float] = Field(default=0.8, gt=0)
    slantedSurfaceSkinEnabled: Optional[bool] = True
    slantedSurfaceSkinLayers: Optional[int] = Field(default=3, ge=1)
    slantedSurfaceSkinHatchSpacing: Optional[float] = Field(default=0.2, gt=0)
    slantedSurfaceSkinPower: Optional[float] = Field(default=50, ge=0, le=100)
    slantedSurfaceSkinSpeed: Optional[float] = Field(default=3000, gt=0)
    slantedSurfaceSkinRasterDirection: Optional[str] = "diagonal"
    slantedSurfaceSkinCrossHatch: Optional[bool] = False
    gridSpacing: Optional[float] = 2
    engravingGridSpacing: Optional[float] = 2
    engravingGridAngle: Optional[float] = 45
    engravingGridLineThickness: Optional[float] = Field(default=0.8, gt=0)
    useCustomGridClearance: Optional[bool] = False
    gridClearance: Optional[float] = 0.2
    optimizeScanOrder: Optional[bool] = True
    fillEnclosedHollows: Optional[bool] = False
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
    infillLineThickness: Optional[float] = 0.8
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
        engravingMode (str): Engraving mode: 'vectoring' for traditional hatching, 'engraving' for line-by-line.
    """

    profileName: str
    slicingLib: str
    slic3rSettings: Slic3rSettings
    prusaSettings: PrusaSlicerSettings
    pyslmSettings: PyslmSettings
    engravingMode: Optional[Literal["vectoring", "engraving"]] = None
    recoaterFeedRate: Optional[float] = None
    recoaterReturnBedDropEnabled: Optional[bool] = None
    recoaterReturnBedDropDistance: Optional[float] = None
    recoaterReturnBedFeedRate: Optional[float] = None


class SolidSlicingObject(BaseModel):
    """One independently configurable solid model in a shared build."""

    id: str
    name: str
    modelFile: str
    modelSize: ThreeDModelSize
    offsetX: float = 0
    offsetY: float = 0
    prusaSettings: PrusaSlicerSettings


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
    solidObjects: Optional[List[SolidSlicingObject]] = None
    printHeightLowerLimit: Optional[float] = None
    printHeightLimit: Optional[float] = None
    slicingSettings: SlicingSettings
