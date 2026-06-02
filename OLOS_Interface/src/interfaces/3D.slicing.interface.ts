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
  firstInfillPower: number;
  firstInfillSpeed: number;
  firstContourPower: number;
  firstContourSpeed: number;

  // INTERMEDIATE zone — optional, gated by toggle
  intermediateZoneEnabled: boolean;
  intermediateLayersCount: number;
  intermediateInfillPower: number;
  intermediateInfillSpeed: number;
  intermediateContourPower: number;
  intermediateContourSpeed: number;

  // ROUTINE / machine settings
  noRoutineFirstLayers: number;
  reservoirLiftPerLayer: number;
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
  contourLineCount: number;
  infillAngle: number;
  hatchRotationPerLayer: number;
  infillLineCount: number;
  contourInfillOverlap: number;
  infillHatchSpacing: number;
  optimizeScanOrder: boolean;

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
  outerContour: number;
  innerContour: number;
  contourLineCount: number;
  infillType: string;
  infillLineCount: number;
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
