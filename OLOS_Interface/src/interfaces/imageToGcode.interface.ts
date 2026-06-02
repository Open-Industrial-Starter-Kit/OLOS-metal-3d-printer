import Konva from 'konva';
import { QTableProps } from 'quasar';
import { INode } from 'svgson';

/**
 * @interface GcodeGeneratorImageData
 * @description Represents all relevant data for an image used in G-code generation.
 */
export interface GcodeGeneratorImageData {
  /** Unique identifier for the image. */
  imageId: string;
  /** Human-readable image name. */
  imageName: string;
  /** File object of the image (if uploaded). */
  imageFile: File | null;
  /** Base64 or URI string content of the image. */
  imageContent: string;
  /** Konva configuration for the image. */
  imageConfig: Konva.ImageConfig;
  /** Konva Image node for rendering. */
  imageNode: Konva.Image | null;
  /** Current image transformation metrics. */
  imageMetrics: ImageMetrics;
  /** Original image metrics before modifications. */
  originalImageConfig: ImageMetrics | null;
  /** Konva transformer group for manipulating the image. */
  imageKonvaTransformerGroup: Konva.Group | null;

  /** Active tab in the UI for this image's settings. */
  activeTab: string;
  /** List of SVG elements selected for modification. */
  svgElementsToModify: Array<DrawElement>;
  /** G-code file generation settings for this image. */
  gcodeSettings: GcodeFileSettings;
  /** Modified SVG for cutting operation. */
  modifiedSVGCutting: SVGGraphicsElement | null;
  /** Modified SVG for marking operation. */
  modifiedSVGMarking: SVGGraphicsElement | null;
  /** Modified engraving image. */
  modifiedEngravingImage: HTMLImageElement | null;

  // Table state management
  /** Active filter type for the UI table. */
  tableFilterType: string;
  /** Selected table elements. */
  tableSelectedElements: QTableProps['selected'];
  /** Profile settings mapped to model identifiers. */
  tableProfileModels: Record<string, string>;
  /** All available profile models combined in a single string. */
  tableProfileAllModels: string;
  /** Available options for a single profile. */
  singleProfileOptions: Array<string>;
  /** Available options for all profiles. */
  allProfileOptions: Array<string>;
  /** Elements filtered by shape type. */
  filteredElementsByShape: Array<IShapeElement>;
  /** Elements filtered by color type. */
  filteredElementsByColor: Array<IColorElement>;
  /** Attributes of SVG elements mapped by their identifiers. */
  svgElementAttributes: Record<string, string>;
}

/**
 * @interface GcodeFileData
 * @description Represents a G-code file and its associated modified image data.
 */
export interface GcodeFileData {
  /** Name of the G-code file. */
  name: string;
  /** Modified image data associated with this file. */
  modifiedImagesData: Array<ModifiedImageData>;
}

/**
 * @interface ModifiedImageData
 * @description Stores image modifications for different laser operations.
 */
export interface ModifiedImageData {
  /** SVG for cutting operation, stored as string. */
  modifiedSVGCutting: string | null;
  /** SVG for marking operation, stored as string. */
  modifiedSVGMarking: string | null;
  /** Image for engraving operation, stored as string. */
  modifiedEngravingImage: string | null;
  /** G-code settings applied to this modified image. */
  gcodeSettings: GcodeFileSettings;
}

/**
 * @interface DitheringSettings
 * @description Settings for dithering in engraving operations.
 */
export interface DitheringSettings {
  /** Dithering algorithm name. */
  algorithm: string;
  /** Gray shift adjustment. */
  grayShift: number;
  /** Output resolution in DPI or pixels. */
  resolution: number;
  /** Block size for grid algorithms. */
  blockSize: number;
  /** Distance between blocks in grid dithering. */
  blockDistance: number;
}

/**
 * @interface TransformData
 * @description Stores transformation values applied to an image or element.
 */
export interface TransformData {
  [key: string]: number | number[];
}

/**
 * @interface IColorElement
 * @description Represents SVG elements grouped by their fill or stroke color.
 */
export interface IColorElement {
  /** Color value (HEX, RGB, etc.). */
  color: string;
  /** Array of SVG elements with the given color. */
  elements: INode[];
}

/**
 * @interface IShapeElement
 * @description Represents SVG elements grouped by their shape type.
 */
export interface IShapeElement {
  /** Shape type (e.g., "rect", "circle", "path"). */
  shape: string;
  /** Array of SVG elements with the given shape. */
  elements: INode[];
}

/**
 * @interface SelectedElementType
 * @description Represents an SVG element selection in the editor.
 */
export interface SelectedElementType {
  /** Unique identifier for the selected element group. */
  identifier: string;
  /** The actual SVG elements. */
  elements: INode[];
  /** Profile type linked to the selection. */
  profileType: string;
  /** Whether this selection has been added to the current job. */
  added: boolean;
}

/**
 * @interface DrawElement
 * @description Represents a drawable SVG element and its associated metadata.
 */
export interface DrawElement {
  /** Unique identifier for the element. */
  identifier: string;
  /** Array of SVG elements. */
  elements: INode[];
  /** Element type ("cutting", "marking", "engraving", etc.). */
  type: string;
}

/**
 * @interface KonvaImageResult
 * @description Holds a Konva image node and its configuration.
 */
export interface KonvaImageResult {
  /** Konva Image node. */
  imageNode: Konva.Image;
  /** Konva image configuration object. */
  imageConfig: Konva.ImageConfig;
}

/**
 * @interface ImageMetrics
 * @description Represents geometric transformations applied to an image.
 */
export interface ImageMetrics {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

/**
 * @interface MainSettings
 * @description Base settings for an operation on a material.
 */
export interface MainSettings {
  /** Material name (e.g., "Plywood", "Acrylic"). */
  material: string;
  /** Material thickness in mm. */
  thickness: number;
  /** Image transformation metrics. */
  metrics: ImageMetrics;
}

/**
 * @interface EngravingSettings
 * @extends OperationMainSettings
 * @description Settings for engraving operations.
 */
export interface EngravingSettings extends OperationMainSettings {
  /** Dithering settings for engraving. */
  dithering: DitheringSettings;
}

/**
 * @interface GcodeFileSettings
 * @description Stores settings for generating a G-code file from images.
 */
export interface GcodeFileSettings {
  /** Main operation settings. */
  mainSettings: MainSettings;
  /** Cutting operation settings. */
  cuttingSettings: ThicknessOperation;
  /** Marking operation settings. */
  markingSettings: ThicknessOperation;
  /** Engraving operation settings. */
  engravingSettings: EngravingSettings;
}

/**
 * @interface RejectedFileEntry
 * @description Represents a file that failed validation.
 */
export interface RejectedFileEntry {
  /** The property that caused the validation to fail. */
  failedPropValidation: string;
  /** The rejected file. */
  file: File;
}

/**
 * @interface MaterialData
 * @description Represents a material and its available thickness options.
 */
export interface MaterialData {
  /** Unique ID for the material. */
  materialId: number;
  /** Name of the material. */
  materialName: string;
  /** Image of the material, if available. */
  materialImage: string | null;
  /** Available thicknesses for the material. */
  materialThicknesses: Array<MaterialThickness>;
  /** Whether the material is user-editable. */
  isEditable?: boolean;
}

/**
 * @interface MaterialThickness
 * @description Represents a thickness option for a material.
 */
export interface MaterialThickness {
  /** Unique ID for the thickness option. */
  thicknessId: number;
  /** Thickness value in mm. */
  thicknessValue: number;
  /** List of operations available for this thickness. */
  thicknessOperations: Array<ThicknessOperation>;
}

/**
 * @interface ThicknessOperation
 * @extends OperationMainSettings
 * @description Represents a specific laser operation for a material thickness.
 */
export interface ThicknessOperation extends OperationMainSettings {
  /** Optional unique ID for the operation. */
  operationId?: number;
  /** Type of operation (e.g., "cutting", "engraving"). */
  operationType?: string;
  /** Optional dithering settings (engraving only). */
  dithering?: DitheringSettings;
}

/**
 * @interface OperationMainSettings
 * @description Basic settings for a laser operation.
 */
export interface OperationMainSettings {
  /** Laser power percentage. */
  power: number;
  /** Movement speed in mm/s. */
  speed: number;
  /** Tool name or ID used for the operation. */
  tool: string;
}
