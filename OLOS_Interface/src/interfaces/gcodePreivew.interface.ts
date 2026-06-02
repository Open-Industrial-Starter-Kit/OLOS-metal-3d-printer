import * as THREE from 'three';

/**
 * @interface Point
 * @description Represents a coordinate in 2D or 3D space.
 */
export interface Point {
  /** X coordinate. */
  x: number;
  /** Y coordinate. */
  y: number;
  /** Optional Z coordinate (for 3D positions). */
  z?: number;
}

/**
 * @interface BezierCurve
 * @description Represents a cubic Bezier curve used for G-code curved paths.
 */
export interface BezierCurve {
  /** Starting point of the curve. */
  p0: Point;
  /** First control point. */
  p1: Point;
  /** Second control point. */
  p2: Point;
  /** Ending point of the curve. */
  p3: Point;
}

/**
 * @interface Line
 * @description Represents a single line or movement segment in a G-code path.
 */
export interface Line {
  /** Starting coordinate of the line. */
  start: Point;
  /** Ending coordinate of the line. */
  end: Point;
  /** Feedrate (movement speed) for this line. */
  feedrate: number;
  /** The G-code line number in the file. */
  lineNumber: number;
  /** The movement speed (units per minute or mm/s). */
  speed: number;
  /** G-code command type (e.g., "G0", "G1", "G2", "G3"). */
  type: string;
  /** List of cubic Bezier curves for curved paths (G2/G3). */
  beziers: BezierCurve[];
}

/**
 * @interface SlicingLayers
 * @description Represents all lines in each Z-layer for a sliced 3D model.
 * @example
 * {
 *   0.2: [Line, Line],
 *   0.4: [Line, Line]
 * }
 */
export interface SlicingLayers {
  [z: number]: Line[];
}

/**
 * @interface GCodeColors
 * @description Color settings for rendering different G-code commands in the preview.
 */
export interface GCodeColors {
  /** Color for rapid moves (G0). */
  G0: string;
  /** Color for linear moves (G1). */
  G1: string;
  /** Color for clockwise arcs (G2). */
  G2: string;
  /** Color for counterclockwise arcs (G3). */
  G3: string;
  /** Color for the executed (current) line. */
  executedLine: string;
}

/**
 * @interface CameraData
 * @description Represents camera frame data for live or recorded streams.
 */
export interface CameraData {
  /** Camera type (e.g., "webcam", "usb"). */
  type: string;
  /** Base64-encoded image frame or video snapshot. */
  frame: string;
  /** Timestamp of the frame capture. */
  time: string;
}

/**
 * @interface GraphBoxMetrics
 * @description Dimensions of the graphical preview box.
 */
export interface GraphBoxMetrics {
  /** Width of the preview area. */
  width: number;
  /** Height of the preview area. */
  height: number;
}

/**
 * @interface Bounds
 * @description Minimum and maximum coordinates of a G-code job.
 */
export interface Bounds {
  /** Minimum X coordinate. */
  minX: number;
  /** Minimum Y coordinate. */
  minY: number;
  /** Maximum X coordinate. */
  maxX: number;
  /** Maximum Y coordinate. */
  maxY: number;
}

/**
 * @interface GCodeParserSettings
 * @description Stores the state of the G-code parser during parsing.
 */
export interface GCodeParserSettings {
  /** Current feedrate setting. */
  feedrate: number;
  /** Last movement command executed. */
  previousMoveCommand: string;
  /** Cross-axis movement type (if applicable). */
  crossAxe: string;
  /** Whether units are in millimeters (true) or inches (false). */
  inMm: boolean;
  /** Whether movements are relative (true) or absolute (false). */
  relative: boolean;
  /** Current tool position. */
  position: Point;
}

/**
 * @interface GCodeState
 * @description Represents the parsed G-code job state.
 */
export interface GCodeState {
  /** Job boundary dimensions. */
  bounds: Bounds;
  /** Current parser settings. */
  settings: GCodeParserSettings | null;
  /** Total job size in 3D space. */
  totalSize: TotalGCodeSize | null;
}

/**
 * @interface TotalGCodeSize
 * @description Minimum and maximum coordinates of the G-code job in 3D space.
 */
export interface TotalGCodeSize {
  /** Minimum coordinate point. */
  min: Point;
  /** Maximum coordinate point. */
  max: Point;
}

/**
 * @interface JobLayerElements
 * @description Stores rendered elements for a specific G-code layer in the 3D preview.
 */
export interface JobLayerElements {
  /** THREE.js group containing the layer geometry. */
  group: THREE.Group;
  /** Raw color buffer for the layer's lines. */
  colorsArray: Uint8Array;
  /** Index of the executed line within the layer. */
  executedLineIndex: number;
  /** Index of the line segments in the buffer geometry. */
  lineSegmentsIndex: number;
}
