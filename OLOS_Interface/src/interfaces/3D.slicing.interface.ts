import * as THREE from 'three';

export interface ModelData {
  object: THREE.Mesh | null;
  helperBox: THREE.BoxHelper | null;
  preTransform: TransformSnapshot | null;
  isTransforming: boolean;
}

/**
 * @interface ZoneExposureSettings
 * @description Reusable shape for per-zone exposure fields injected into
 * the slicer settings interfaces.
 */
interface ZoneExposureSettings {
  // FIRST zone
  firstLayersCount: number;
  firstZoneEngravingEnabled: boolean;
  firstInfillPower: number;
  firstInfillSpeed: number;
  firstEngravingHatchSpacing: number;
  firstContourPower: number;
  firstContourSpeed: number;

  // INTERMEDIATE zone — optional, gated by toggle
  intermediateZoneEnabled: boolean;
  intermediateZoneEngravingEnabled: boolean;
  intermediateLayersCount: number;
  intermediateInfillPower: number;
  intermediateInfillSpeed: number;
  intermediateEngravingHatchSpacing: number;
  intermediateContourPower: number;
  intermediateContourSpeed: number;

  // ROUTINE / machine settings
  noRoutineFirstLayers: number;
  reservoirLiftPerLayer: number;
  recoaterFeedRate: number;
  recoaterReturnBedDropEnabled: boolean;
  recoaterReturnBedDropDistance: number;
  recoaterReturnBedFeedRate: number;
  bedOffsetX: number;
  bedOffsetY: number;
}

export interface Slic3rSettings {
  layerHeight: number;
  layerSpeed: number;
  contourSpeed: number;
  contourPower: number;
  infillPower: number;
  infillSpeed: number;
  infillImageSettings: InfillImageSettings;
}

export interface PrusaSettings extends Slic3rSettings, ZoneExposureSettings {
  /** Replace normal body/infill processing with a dense line-filled solid path. */
  solidModeEnabled: boolean;
  /** Complete each shared layer across all disconnected solids before advancing Z. */
  solidMergeObjectsByLayer: boolean;
  /** Add engraved square layers below each disconnected solid footprint. */
  solidAnchorPadEnabled: boolean;
  solidAnchorPadLayers: number;
  /** Side length of each square sacrificial anchor pad. */
  solidAnchorPadSize: number;
  solidAnchorPadPower: number;
  solidAnchorPadSpeed: number;
  /** Percentage overlap between adjacent anchor-pad engraving tracks. */
  solidAnchorPadLineOverlap: number;
  /** Rotate the anchor-pad engraving direction after each pad layer. */
  solidAnchorPadRotateEachLayer: boolean;
  /** Degrees added to the anchor-pad engraving angle per layer. */
  solidAnchorPadRotationPerLayer: number;
  /** Add engraved line or grid layers between the anchor and model. */
  solidTransitionEnabled: boolean;
  /** Number of engraved transition layers below the model. */
  solidTransitionLayers: number;
  solidTransitionPattern: 'lines' | 'grid';
  solidTransitionPower: number;
  solidTransitionSpeed: number;
  /** Estimated physical width of one transition-layer track. */
  solidTransitionTrackWidth: number;
  /** Percentage overlap between adjacent lines inside a hatch bundle. */
  solidTransitionLineOverlap: number;
  /** Number of parallel lines in each transition hatch bundle. */
  solidTransitionLineCount: number;
  /** Center-to-center spacing between repeated line hatch bundles. */
  solidTransitionHatchSpacing: number;
  /** Center-to-center spacing between grid hatch bundles. */
  solidTransitionGridSpacing: number;
  /** Unpowered clearance left around crossings in a transition grid. */
  solidTransitionGridClearance: number;
  solidTransitionRasterDirection: 'x' | 'y' | 'diagonal';
  /** Rotate the transition pattern after each transition layer. */
  solidTransitionRotateEachLayer: boolean;
  /** Degrees added to the transition pattern angle per layer. */
  solidTransitionRotationPerLayer: number;
  /** Add a vectored perimeter around the transition pattern. */
  solidTransitionContourEnabled: boolean;
  solidTransitionContourPower: number;
  solidTransitionContourSpeed: number;
  solidTransitionContourLineCount: number;
  /** Percentage overlap between transition lines and its contour shell. */
  solidTransitionContourOverlap: number;
  /** Estimated physical width of one solid hatch track. */
  solidTrackWidth: number;
  /** Fill the first and final layers to the boundary without a contour. */
  solidCloseTopBottomEnabled: boolean;
  /** Number of line-only closure layers used at each end of the stack. */
  solidCloseTopBottomLayers: number;
  /** Laser power used by line-only top and bottom closure layers. */
  solidCloseTopBottomPower: number;
  /** Feed rate used by line-only top and bottom closure layers. */
  solidCloseTopBottomSpeed: number;
  /** Percentage overlap between adjacent closure-layer tracks. */
  solidCloseTopBottomLineOverlap: number;
  /** Optional first-layer exposure zone within the solid stack. */
  solidFirstZoneEnabled: boolean;
  solidFirstZoneEngravingEnabled: boolean;
  solidFirstLayersCount: number;
  solidFirstPower: number;
  solidFirstSpeed: number;
  solidFirstEngravingHatchSpacing: number;
  /** Optional intermediate exposure zone after the solid first layers. */
  solidIntermediateZoneEnabled: boolean;
  solidIntermediateZoneEngravingEnabled: boolean;
  solidIntermediateLayersCount: number;
  solidIntermediatePower: number;
  solidIntermediateSpeed: number;
  solidIntermediateEngravingHatchSpacing: number;
  /** Base axis for the solid roof-style hatch. */
  solidRasterDirection: 'x' | 'y' | 'diagonal';
  /** Alternate the solid hatch by 90 degrees on successive layers. */
  solidCrossHatch: boolean;
  /** Reorder solid engraving lines instead of scanning them sequentially. */
  solidAlternateLines: boolean;
  solidAlternateMode: 'two-pass' | 'edge-interleave';
  /** Complete the solid hatch in smaller spatial cells. */
  solidIslandScanningEnabled: boolean;
  /** Requested side length of one island before fitting whole cells. */
  solidIslandSize: number;
  solidIslandScanStrategy: 'normal' | 'two-pass' | 'edge-interleave';
  solidPower: number;
  solidSpeed: number;
  /** Percentage overlap between the solid hatch and contour shell. */
  solidContourOverlap: number;
  /** Percentage overlap between adjacent solid hatch tracks. */
  solidLineOverlap: number;
  /** Add a vectored perimeter around each solid hatch layer. */
  solidContourEnabled: boolean;
  solidContourPower: number;
  solidContourSpeed: number;
  solidContourLineCount: number;
  engravingMode?: 'vectoring' | 'engraving';
  /** Measured/configured XY gantry acceleration used for laser lead distance. */
  engravingAcceleration: number;
  /** Width of the perimeter band rastered on engraved layers. */
  engravingContourThickness: number;
  /** Calibrated physical width of one vector laser track. */
  nominalVectorTrackWidth: number;
  /** Center-to-center spacing between adjacent contour/vector bundle lines. */
  lineBundleSpacing: number;
  /** Use the calculated vector wall width for engraved contour shells. */
  matchEngravedShellToVectorWall: boolean;
  /** Axis followed by engraving scan moves. */
  engravingRasterDirection: 'x' | 'y';
  contourLineCount: number;
  autoContourLineCountEnabled: boolean;
  infillType: string;
  infillAngle: number;
  hatchRotationPerLayer: number;
  hatchRotationGroupingEnabled: boolean;
  hatchRotationGroupLayers: number;
  infillLineCount: number;
  /** Thickness of infill lines in mm (used in line-by-line engraving mode). */
  infillLineThickness: number;
  contourInfillOverlap: number;
  /** Vertical distance between horizontal engraving scanlines in mm. */
  scanlineSpacing: number;
  infillHatchSpacing: number;
  /** Add dense hatch on roof/deck surfaces detected from upper layers. */
  surfaceSkinEnabled: boolean;
  /** Number of layers below an exposed surface that receive skin hatch. */
  surfaceSkinLayers: number;
  /** Raster broad flat roof/deck skin patches using engraving moves. */
  surfaceSkinEngravingEnabled: boolean;
  /** Hatch pitch for generated roof/deck surface skin in mm. */
  surfaceSkinHatchSpacing: number;
  /** Laser power used only for generated roof/deck surface skin. */
  surfaceSkinPower: number;
  /** Feed rate used only for generated roof/deck surface skin. */
  surfaceSkinSpeed: number;
  /** Print odd roof skin lines first, then return for skipped adjacent lines. */
  surfaceSkinAlternateLines: boolean;
  surfaceSkinAlternateMode: 'two-pass' | 'edge-interleave';
  flatSurfaceSkinLayers: number;
  flatSurfaceSkinHatchSpacing: number;
  flatSurfaceSkinPower: number;
  flatSurfaceSkinSpeed: number;
  flatSurfaceSkinRasterDirection: 'x' | 'y' | 'diagonal';
  flatSurfaceSkinCrossHatch: boolean;
  flatSurfaceSkinPattern: 'hatch' | 'spiral';
  flatSurfaceSkinSpiralDirection: 'outside-in' | 'inside-out';
  flatSurfaceSkinBoundaryMode: 'engrave' | 'vector' | 'contour' | 'none';
  flatSurfaceSkinContourLineCount: number;
  flatSurfaceSkinContourOverlap: number;
  flatSurfaceSkinHatchOverlap: number;
  flatSurfaceSkinSecondPassEnabled: boolean;
  flatSurfaceSkinSecondPassPower: number;
  flatSurfaceSkinSecondPassSpeed: number;
  flatSurfaceSkinSecondPassHatchOverlap: number;
  flatSurfaceSkinSecondPassRasterDirection: 'x' | 'y' | 'diagonal';
  flatSurfaceSkinSecondPassCrossHatch: boolean;
  flatSurfaceSkinSecondPassBoundaryMode:
    | 'engrave'
    | 'vector'
    | 'contour'
    | 'none';
  flatSurfaceSkinSecondPassContourLineCount: number;
  flatSurfaceSkinSecondPassContourOverlap: number;
  roofHollowInfillEnabled: boolean;
  roofHollowInfillOverlap: number;
  /** Project newly detected internal floors through only the hollow below them. */
  internalFloorSupportEnabled: boolean;
  internalFloorSupportMode: 'vectoring' | 'engraving';
  internalFloorSupportType: 'Lines' | 'Grid';
  internalFloorSupportPower: number;
  internalFloorSupportSpeed: number;
  internalFloorSupportTrackWidth: number;
  internalFloorSupportLineOverlap: number;
  internalFloorSupportLineCount: number;
  internalFloorSupportHatchSpacing: number;
  internalFloorSupportGridSpacing: number;
  internalFloorSupportGridClearance: number;
  internalFloorSupportAngle: number;
  internalFloorSupportRotationPerLayer: number;
  internalFloorSupportGroupingEnabled: boolean;
  internalFloorSupportGroupLayers: number;
  internalFloorSupportBoundaryClearance: number;
  internalFloorSupportMinimumArea: number;
  internalFloorSupportOptimizeScanOrder: boolean;
  variableGridInfillEnabled: boolean;
  variableGridTarget: 'hollow' | 'both';
  variableGridInfillLayersBeforeRoof: number;
  variableGridSpacing: number;
  variableGridHatchSpacing: number;
  variableGridHatchRotationPerLayer: number;
  variableGridClearance: number;
  variableGridLineCount: number;
  variableEngravingGridSpacing: number;
  variableEngravingGridLineThickness: number;
  multiVariableGridEnabled: boolean;
  secondaryVariableGridLayersBeforeRoof: number;
  secondaryVariableGridSpacing: number;
  secondaryVariableGridHatchSpacing: number;
  secondaryVariableGridClearance: number;
  secondaryVariableGridLineCount: number;
  secondaryVariableEngravingGridSpacing: number;
  secondaryVariableEngravingGridLineThickness: number;
  tertiaryVariableGridEnabled: boolean;
  tertiaryVariableGridLayersBeforeRoof: number;
  tertiaryVariableGridSpacing: number;
  tertiaryVariableGridHatchSpacing: number;
  tertiaryVariableGridClearance: number;
  tertiaryVariableGridLineCount: number;
  tertiaryVariableEngravingGridSpacing: number;
  tertiaryVariableEngravingGridLineThickness: number;
  slantedSurfaceSkinEnabled: boolean;
  slantedSurfaceSkinLayers: number;
  slantedSurfaceSkinHatchSpacing: number;
  slantedSurfaceSkinPower: number;
  slantedSurfaceSkinSpeed: number;
  slantedSurfaceSkinRasterDirection: 'x' | 'y' | 'diagonal';
  slantedSurfaceSkinCrossHatch: boolean;
  gridSpacing: number;
  engravingGridSpacing: number;
  /** Rotation of the optional engraving grid inside the contour core. */
  engravingGridAngle: number;
  /** Finished width of each engraving-grid member in mm. */
  engravingGridLineThickness: number;
  useCustomGridClearance: boolean;
  gridClearance: number;
  optimizeScanOrder: boolean;
  /** Grid-fill the interior core left inside the engraved contour shell. */
  fillEnclosedHollows: boolean;

  isHollowingEnabled: boolean;
  hollowingWallThickness: number;
  hollowingClosingDistance: number;
  hollowingQuality: number;

  isSupportEnabled: boolean;
  isSupportEnforced: boolean;
  supportPinheadWidth: number;
  supportPinheadFrontDiameter: number;
  supportPinheadPenetration: number;
  supportPillarDiameter: number;
  isSupportOnBuildPlate: boolean;
  supportBaseDiameter: number;
  supportBaseHeight: number;
  supportMaxBridgeLength: number;
  supportMaxPillarDistance: number;
  supportPointsDensity: number;
  supportPointsMinimalDistance: number;

  isPadEnabled: boolean;
  padWallThickness: number;
  padBrimSize: number;
  isPadAroundObject: boolean;
  isPadAroundObjectEverywhere: boolean;
}

export interface PyslmSettings extends Slic3rSettings, ZoneExposureSettings {
  engravingMode?: 'vectoring' | 'engraving';
  engravingAcceleration: number;
  skipInfill: boolean;
  skipContour: boolean;
  outerContour: number;
  innerContour: number;
  contourLineCount: number;
  infillType: string;
  infillLineCount: number;
  /** Thickness of infill lines in mm (used in line-by-line engraving mode). */
  infillLineThickness: number;
  infillStripWidth: number;
  infillIslandWidth: number;
  infillIslandOverlap: number;
  infillIslandOffset: number;
  infillAngle: number;
  infillVolumeOffset: number;
  infillSpotCompensation: number;
}

export interface SlicingData {
  modelFile: string;
  modelSize: THREE.Vector3;
  solidObjects?: SolidSlicingObject[];
  printHeightLowerLimit?: number;
  printHeightLimit?: number;
  slicingSettings: SlicingSettings;
}

export interface SolidSlicingObject {
  id: string;
  name: string;
  modelFile: string;
  modelSize: THREE.Vector3;
  offsetX: number;
  offsetY: number;
  prusaSettings: PrusaSettings;
}

export interface SlicerJobModel {
  name: string;
  modelFile: string;
  solidSettings: Partial<PrusaSettings>;
}

export interface SlicerJobProject {
  kind?: 'olos-slicer-project';
  version: number;
  /** Original model, project, or generated G-code name used for reports. */
  sourceFilename?: string;
  modelFile: string;
  models?: SlicerJobModel[];
  printHeightLowerLimit?: number;
  printHeightLimit?: number;
  slicingSettings: SlicingSettings;
}

export interface LayersRange {
  min: number;
  max: number;
}

export interface TransformSnapshot {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
}

export interface TransformCommand {
  execute: () => void;
  undo: () => void;
}

export interface SlicingSettings {
  profileId?: number;
  profileName: string;
  slicingLib: string;
  slic3rSettings: Slic3rSettings;
  prusaSettings: PrusaSettings;
  pyslmSettings: PyslmSettings;
  /** Engraving mode for laser: 'vectoring' for traditional hatching, 'engraving' for line-by-line. */
  engravingMode?: 'vectoring' | 'engraving';
  recoaterFeedRate?: number;
  recoaterReturnBedDropEnabled?: boolean;
  recoaterReturnBedDropDistance?: number;
  recoaterReturnBedFeedRate?: number;
}

interface InfillImageSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  noise: number;
  isImageSizeSettings: boolean;
  resolution?: number;
}
