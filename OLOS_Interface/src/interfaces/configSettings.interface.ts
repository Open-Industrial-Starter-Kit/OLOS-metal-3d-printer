import { Point } from './gcodePreivew.interface';

/**
 * @interface Config
 * @description Represents the complete machine configuration loaded from settings.
 */
export interface Config {
  /** Type of the machine (e.g., "Laser Cutter", "cnc"). */
  machine_type: string;
  /** Platform dimensions and start/end points. */
  machine_platform: MachinePlatform;
  /** Machine screen dimensions in pixels. */
  machine_screen: MachineScreen;
  /** Axis inversion settings. */
  axis_directions: AxisDirections;
  /** Whether remote file uploads are enabled. */
  remote_file_uploader: boolean;
  /** Settings specific to laser cutters. */
  laser_cutter_settings?: LaserCutterSettings;
  /** Settings specific to CNC machines. */
  cnc_settings?: CNCSettings;
  /** Settings specific to vinyl cutters. */
  vinyl_cutter_settings?: VinylCutterSettings;
  /** Settings specific to metal 3D printer. */
  printer_settings?: PrinterSettings;
}

/**
 * @interface Tool
 * @description Represents a single tool in a machine's tool library.
 */
export interface Tool {
  /** Name of the tool (e.g., "CO2", "Diode"). */
  name: string;
  /** Command used to select or activate the tool. */
  command: string;
}

/**
 * @interface JobPreviewer
 * @description Configuration for the machine's job previewer graph.
 */
interface JobPreviewer {
  /** Size of each step in the job preview grid. */
  graph_step_size: number;
  /** Parking position for the machine when checking the preview (only laser cutter)
   * and its related settings.
   */
  parking_settings?: {
    /** Whether parking is enabled. */
    parking_enabled: boolean;
    /** Coordinates for the parking point. */
    point: Point;
    /** Feed rate used for parking movements. */
    feed_rate: number;
  };
  /** Shape of the platform [circle, rectangle] (only for metal 3D printer) . */
  platform_shape: string;
}

/**
 * @interface LaserPower
 * @description Defines the allowable range for laser power.
 */
interface LaserPower {
  /** Minimum laser power value. */
  min: number;
  /** Maximum laser power value. */
  max: number;
}

/**
 * @interface MovementSpeed
 * @description Defines the allowable range for movement speed.
 */
interface MovementSpeed {
  /** Minimum movement speed value. */
  min: number;
  /** Maximum movement speed value. */
  max: number;
}

/**
 * @interface AxisDirections
 * @description Configuration for axis direction inversion.
 */
interface AxisDirections {
  /** Whether the X-axis is inverted. */
  xInvert: boolean;
  /** Whether the Y-axis is inverted. */
  yInvert: boolean;
  /** Whether the Z-axis is inverted. */
  zInvert: boolean;
}

/**
 * @interface MaterialThickness
 * @description Defines allowable material thickness settings.
 */
interface MaterialThickness {
  /** Unit of measurement for thickness (e.g., "mm"). */
  unit: string;
  /** Maximum allowable thickness. */
  max: number;
  /** Minimum allowable thickness. */
  min: number;
}

/**
 * @interface DitheringSettings
 * @description Configuration for dithering algorithm parameters in image engraving.
 */
interface DitheringSettings {
  /** Allowable resolution range. */
  resolution: {
    min: number;
    max: number;
  };
  /** Settings for the grid-based dithering algorithm. */
  grid_algorithm: {
    /** Block size range for grid dithering. */
    block_size: {
      min: number;
      max: number;
    };
    /** Block distance range for grid dithering. */
    block_distance: {
      min: number;
      max: number;
    };
  };
}

/**
 * @interface GcodeGenerator
 * @description Configuration for G-code generation parameters.
 */
interface GcodeGenerator {
  /** Laser power settings. */
  laser_power: LaserPower;
  /** Movement speed settings. */
  movement_speed: MovementSpeed;
  /** Material thickness settings. */
  material_thickness: MaterialThickness;
  /** Dithering settings for image engraving. */
  dithering_settings: DitheringSettings;
}

/**
 * @interface LaserCutterSettings
 * @description Machine-specific configuration for laser cutters.
 */
interface LaserCutterSettings {
  /** Whether cameras are enabled for the laser cutter. */
  cameras_enabled: boolean;
  /** Whether AI image generation is enabled. */
  ai_image_generator: boolean;
  /** Whether a tool changer is installed. */
  tool_changer: boolean;
  /** List of available tools for the laser cutter. */
  tools: Tool[];
  /** Job previewer configuration. */
  job_previewer: JobPreviewer;
  /** G-code generator configuration. */
  gcode_generator: GcodeGenerator;
}

/**
 * @interface CNCSettings
 * @description Machine-specific configuration for CNC machines.
 */
interface CNCSettings {
  /** Whether cameras are enabled for the CNC machine. */
  cameras_enabled: boolean;
  /** Whether a tool changer is installed. */
  tool_changer: boolean;
  /** List of available tools for the CNC machine. */
  tools: Tool[];
  /** Job previewer configuration. */
  job_previewer: JobPreviewer;
}

/**
 * @interface VinylCutterSettings
 * @description Machine-specific configuration for vinyl cutters.
 */
interface VinylCutterSettings {
  /** Job previewer configuration. */
  job_previewer: JobPreviewer;
}

/**
 * @interface PrinterSettings
 * @description Machine-specific configuration for metal 3D printers.
 */
interface PrinterSettings {
  /** Job previewer configuration. */
  job_previewer: JobPreviewer;
}

/**
 * @interface MachinePlatform
 * @description Physical work area coordinates for the machine.
 */
interface MachinePlatform {
  /** Start point of the platform in coordinates. */
  start_point: Point;
  /** End point of the platform in coordinates. */
  end_point: Point;
}

/**
 * @interface MachineScreen
 * @description Screen resolution or working display area dimensions.
 */
interface MachineScreen {
  /** Screen width in pixels. */
  width: number;
  /** Screen height in pixels. */
  height: number;
}
