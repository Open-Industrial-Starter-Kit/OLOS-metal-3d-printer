import Konva from 'konva';
import {
  PrusaSettings,
  PyslmSettings,
  Slic3rSettings,
} from 'src/interfaces/3D.slicing.interface';
import {
  AiGeneratorSettingsData,
  AIModelData,
} from 'src/interfaces/aiGeneratorImage.interface';
import {
  DitheringSettings,
  EngravingSettings,
  ImageMetrics,
  MainSettings,
  MaterialThickness,
  ThicknessOperation,
} from 'src/interfaces/imageToGcode.interface';

/**
 * @description A comprehensive, read-only object containing shared constants used throughout the application.
 * This includes machine types, API endpoints, error messages, GRBL commands, default settings, and UI-related values.
 *
 * @property {object} MACHINE_TYPE - Defines string constants for different machine types.
 * @property {string} ..._DATA_TYPE - String identifiers for various data types used in WebSocket and API communication.
 * @property {object} SMALL_MESSAGES - Short, user-facing messages for different machine states.
 * @property {object} LONG_MESSAGES - Detailed, user-facing messages for machine states, alarms, and errors.
 * @property {object} UPLOAD_FILES_ERRORS - Standardized error messages for file uploads.
 * @property {object} API_ERROR_MESSAGES - Standardized error messages for various API operations.
 * @property {object} API_SUCCESS_MESSAGES - Standardized success messages for API operations.
 * @property {object} JOBS_MANAGER_ERRORS - Error messages specific to the Jobs Manager module.
 * @property {object} MEDIA_MANAGER_ERRORS - Error messages specific to the Media Manager module.
 * @property {object} SLICE_ERRORS - Error messages specific to the 3D Slicing module.
 * @property {string} GRBL_COMMAND_... - String constants for specific GRBL commands (real-time, essential, jogging).
 * @property {string} ..._CAMERAS_STREAM - Commands for controlling the camera stream.
 * @property {string} ..._STATE - String constants for various machine states (e.g., 'Idle', 'Run', 'Alarm').
 * @property {object} API_URI - Relative paths for the application's API endpoints.
 * @property {object} IMAGE_DRAW_TYPE - Identifiers for different image processing operations.
 * @property {number} MAX_FILE_SIZE - Maximum allowed file size for job uploads (in bytes).
 * @property {number} MAX_MEDIA_FILE_SIZE - Maximum allowed file size for media uploads (in bytes).
 * @property {object} MEDIA_TYPES - Display names for different media categories.
 * @property {object} MEDIA_FILES_EXTENSIONS - Allowed file extensions for different media types.
 * @property {string} GCODE_COMMAND - A label for G-code commands.
 * @property {string} SOFT_LIMITS_TRIGGER - A string identifier for soft limit trigger messages from the machine.
 * @property {string} PREVIEWER_..._MESSAGE - Messages for the G-code previewer regarding file errors or size issues.
 * @property {object} SVG_ELEMENTS_FILTER - Constants for filtering SVG elements by shape or color.
 * @property {object} DITHERING_ALGORITHMS - Display names for supported dithering algorithms.
 * @property {object} PROFILE_OPTIONS - Options for profiling SVG elements (Cut, Mark, Engrave, etc.).
 * @property {object} PROFILE_ALL_OPTIONS - Options for applying a single profile to an entire image.
 * @property {string[]} SVG_ALLOWED_ELEMENTS - A list of SVG element types that are processed by the application.
 * @property {number} SVG_DIMENSION_DEFAULT_VALUE - A fallback dimension for SVG files.
 * @property {object} FALLBACK_GCODE_GENERATOR_STAGE_METRICS - Default dimensions for the Konva stage.
 * @property {number[]} SLIDER_LABELS_VALUES - Values for UI sliders.
 * @property {object} SPEED_CHOICES - Predefined speed settings.
 * @property {object} RGB_COLOR - Standard RGB color string constants.
 * @property {number} MAX_IMAGE_HEIGHT_SIZE - Maximum image height for processing.
 * @property {number} PREVIEWER_WORKER_BATCH_SIZE - The number of G-code lines to process in each web worker batch.
 * @property {number} GCODE_PREVIEWER_RATIO - A scaling ratio for rendering G-code in the previewer.
 * @property {object} LASER_TOOLS_NAMES - Display names for different laser tools.
 * @property {object} DEFAULT_GCODE_GENERATOR_SETTINGS - Default configurations for the Image-to-G-code generator.
 * @property {number[]} AI_IMAGE_SIZE_OPTIONS - Supported image dimensions for the AI generator.
 * @property {object} AI_ASSISTANT_MESSAGES - UI messages and placeholders for the AI Image Generator.
 * @property {AIModelData[]} SUPPORTED_AI_MODELS - A list of supported AI models with their names and descriptions.
 * @property {object} THREE_D_PRINTER_PLATFORM_SHAPE - Constants for 3D printer platform shapes.
 * @property {object} SLICING_FILES_FORMATE - Supported file formats for 3D model slicing.
 * @property {object} SLICING_MESH_SHAPES - Primitive mesh shapes available in the 3D slicer.
 * @property {object} SLICING_LIBRARIES - Supported 3D slicing engines.
 * @property {string} DEFAULT_SLICING_PROFILE_NAME - The name of the default slicing profile.
 * @property {object} PRINTING_SETTINGS_ASSISTANT_MESSAGES - Tooltip messages for 3D printing settings.
 * @property {object} PYSLM_INFILL_TYPES - Supported infill patterns for the PySLM slicing engine.
 * @property {Slic3rSettings} DEFAULT_SLIC3r_SETTINGS - Default settings template for the Slic3r engine.
 * @property {PrusaSettings} DEFAULT_PRUSA_SLICER_SETTINGS - Default settings template for the PrusaSlicer engine.
 * @property {PyslmSettings} DEFAULT_PYSLM_SETTINGS - Default settings template for the PySLM engine.
 * @property {string} GCODE_..._COMMENT - Comment strings to identify contour and infill sections in generated G-code.
 * @property {AiGeneratorSettingsData} DEFAULT_AI_GENERATOR_SETTINGS - Default settings for the AI Image Generator.
 * @property {object} AI_SETTINGS_LIMITATION - Hard-coded limitations for AI generation parameters.
 * @property {number} VIRTUAL_KEYBOARD_DELAY - A delay (in ms) used for virtual keyboard animations and positioning.
 * @property {object} ALL_HEX_COLORS - A mapping of standard CSS color names to their hexadecimal values.
 */
export const Constants = {
  MACHINE_TYPE: {
    LASER_CUTTER: 'Laser Cutter',
    CNC: 'cnc',
    VINYL_CUTTER: 'Vinyl Cutter',
    THREE_D_PRINTER: '3D Printer',
  } as Record<string, string>,

  // data types for websocket and api messages
  MACHINE_STATUS_DATA_TYPE: 'MACHINE_STATUS' as string,
  SERIAL_COMMAND_DATA_TYPE: 'SERIAL_COMMAND' as string,
  JOB_EXECUTION_DATA_TYPE: 'JOB_EXECUTION' as string,
  REAL_TIME_COMMAND_DATA_TYPE: 'REAL_TIME_COMMAND' as string,
  NORMAL_COMMAND_DATA_TYPE: 'NORMAL_COMMAND' as string,
  MACHINE_CONNECTION_DATA_TYPE: 'MACHINE_CONNECTION' as string,
  JOBS_MANAGER_DATA_TYPE: 'JOBS_MANAGER' as string,
  SLICE_DATA_TYPE: 'SLICE' as string,
  MEDIA_MANAGER_DATA_TYPE: 'MEDIA_MANAGER' as string,
  CONNECTION_DATA_TYPE: 'CONNECTION' as string,
  CAMERAS_SYSTEM_DATA_TYPE: 'CAMERAS_STREAM' as string,
  JOYSTICK_STATUS_DATA_TYPE: 'JOYSTICK_STATUS' as string,
  USB_STORAGE_MONITOR_DATA_TYPE: 'USB_STORAGE_MONITOR' as string,

  // small notes/messages
  SMALL_MESSAGES: {
    CONNECTING_MESSAGE: 'Please wait until the machine is ready',
    DISCONNECTED_MESSAGE: 'Server/Machine is disconnected',
    ALARM_MESSAGE: 'Alarm detected on the machine',
    HOLD_MESSAGE: 'Machine on hold/pause',
    HOMING_MESSAGE: 'Wait until the machine finishes homing',
    RUN_MESSAGE: 'Machine is running',
    IDLE_MESSAGE: 'Machine is ready to start',
    DOOR_MESSAGE: "Machine's door is open. Close the door and click Soft Reset",
    ERROR_MESSAGE: 'Error detected during running the machine ',
  } as Record<string, string>,

  // rejected uploading files
  UPLOAD_FILES_ERRORS: {
    MAX_FILES: {
      NAME: 'max-files',
      MESSAGE: 'You have exceeded the maximum number of files allowed.',
    },
    MAX_FILE_SIZE: {
      NAME: 'max-file-size',
      MESSAGE: 'The file size exceeds the maximum allowed limit.',
    },
    ACCEPT: {
      NAME: 'accept',
      MESSAGE: 'Invalid file type. Please upload files with valid extensions.',
    },
    DUPLICATE: {
      NAME: 'duplicate',
      MESSAGE: 'You can not upload the same file twice',
    },
    DEFAULT: {
      NAME: 'default',
      MESSAGE: 'File upload failed for an unknown reason.',
    },
  } as Record<string, Record<string, string>>,

  // api error message
  API_ERROR_MESSAGES: {
    DELETE_MESSAGE: 'Error delete file: ',
    DOWNLOAD_MESSAGE: 'Error download file: ',
    OPEN_MESSAGE: 'Error open file: ',
    FETCH_MESSAGE: 'Error fetching file data: ',
    CHECK_OPEN_MESSAGE: 'Error check file: ',
    START_MESSAGE: 'Error start file: ',
    LIST_MESSAGE: 'Error list files: ',
    RENAME_MESSAGE: 'Error rename file: ',
    SAVE_MESSAGE: 'Error save file: ',
    UPLOAD_MESSAGE: 'Error upload file: ',
    GENERATE_MESSAGE: 'Error generate file: ',
    CANCEL_GENERATE_MESSAGE: 'Error cancel generating file: ',
    SLICING_MESSAGE: 'Error slicing models: ',
    CANCEL_SLICING_MESSAGE: 'Error cancel slicing models: ',
    PREVIEW_SLICING_MESSAGE: 'Error preview slicing models: ',
    SAVE_SLICED_FILE_MESSAGE: 'Error saving sliced file: ',
    LIST_SLICING_PROFILES_MESSAGE: 'Error listing slicing profiles: ',
    ADD_SLICING_PROFILE_MESSAGE: 'Error adding slicing profile: ',
    UPDATE_SLICING_PROFILE_MESSAGE: 'Error updating slicing profile: ',
    DELETE_SLICING_PROFILE_MESSAGE: 'Error deleting slicing profile: ',
  } as Record<string, string>,

  // api success message
  API_SUCCESS_MESSAGES: {
    DELETE_MESSAGE: 'File deleted successfully',
    DOWNLOAD_MESSAGE: 'File downloaded successfully',
    OPEN_MESSAGE: 'File opened successfully',
    FETCH_MESSAGE: 'File data fetched successfully',
    START_MESSAGE: 'File started successfully',
    RENAME_MESSAGE: 'File renamed successfully',
    SAVE_MESSAGE: 'File saved successfully',
    UPLOAD_MESSAGE: 'File uploaded to the system successfully',
    GENERATE_MESSAGE: 'File generated successfully',
    CANCEL_GENERATE_MESSAGE: 'Canceling File generating process',
    SLICING_MESSAGE: 'Models sliced successfully',
    SAVE_SLICED_FILE_MESSAGE: 'Sliced file saved successfully',
    ADD_SLICING_PROFILE: 'Slicing profile settings added successfuly',
    UPDATE_SLICING_PROFILE: 'Slicing profile settings updated successfuly',
    DELETE_SLICING_PROFILE: 'Slicing profile settings deleted successfuly',
  } as Record<string, string>,

  // long messages
  LONG_MESSAGES: {
    CONNECTING_MESSAGE:
      'The machine is currently connected. Wait until the machine start.',
    DISCONNECTED_MESSAGE:
      'The machine is currently disconnected. Check the server or network connection and ensure the machine is properly connected.',
    HOMING_MESSAGE: 'The machine is homing.',
    HOLD_MESSAGE:
      'The machine is on hold. Please review the status and take necessary actions to resume operation.',
    RUN_MESSAGE:
      'The machine is currently in operation. All systems are functioning normally.',
    IDLE_MESSAGE:
      'The machine is idle and waiting for the next job. All systems are ready for operation.',
    DOOR_MESSAGE:
      'Open door detected. Please check the door status of the machine and soft reset',
    ALARM_MESSAGES: [
      'Unknown alarm code. Check the machine and G-code for issues.',
      'Hard limit triggered. Position is likely lost due to a sudden and immediate halt. Re-homing is highly recommended before resuming.',
      'Soft limit alarm. Position is kept, and unlocking is safe. Review soft limit settings and program size.',
      'Reset while in motion. Position is lost. Investigate and resolve the cause before continuing.',
      'Probe fail. Probe is not in the expected initial state. Check probe wiring and connections.',
      'Probe fail. Probe did not contact the work. Check probe, wiring, and workpiece setup.',
      'Homing fail. The active homing cycle was reset. Investigate and resolve homing issues.',
      'Homing fail. Door opened during homing cycle. Ensure the door remains closed during homing.',
      'Homing fail. Pull off failed to clear limit switch. Check limit switch wiring and position.',
      'Homing fail. Could not find limit switch. Check limit switch wiring and position.',
    ],
    ERROR_MESSAGES: [
      'Unknown error code. Check the machine and G-code for issues.',
      'GCode Command letter was not found. Check the GCode command for typos or missing letters.',
      'GCode Command value invalid or missing. Ensure that the GCode command includes a valid value.',
      "Grbl '$' not recognized or supported. Check the GCode program for unsupported commands.",
      'Negative value for an expected positive value. Ensure that all values in the GCode command are positive.',
      'Homing fail. Homing is not enabled in settings. Enable homing in Grbl settings.',
      'Min step pulse must be greater than 3usec. Adjust the step pulse duration in Grbl settings.',
      'EEPROM read failed. Default values used. Check the EEPROM and ensure it is functioning correctly.',
      "Grbl '$' command Only valid when Idle. Ensure that the Grbl machine is in an idle state before using '$' commands.",
      'GCode commands invalid in alarm or jog state. Check the machine state and send GCode commands when the machine is not in an alarm or jog state.',
      'Soft limits require homing to be enabled. Enable homing in Grbl settings to use soft limits.',
      'Max characters per line exceeded. Ignored. Check the GCode program for lines that exceed the maximum allowed length.',
      "Grbl '$' setting exceeds the maximum step rate. Adjust the step rate settings in Grbl.",
      'Safety door opened and door state initiated. Close the safety door to resume operation.',
      'Build info or start-up line > EEPROM line length. Check the EEPROM and ensure it can store the build information or start-up line.',
      'Jog target exceeds machine travel, ignored. Check the jog commands and ensure they are within the machine travel limits.',
      "Jog Cmd missing '=' or has prohibited GCode. Check the jog commands and correct any syntax errors.",
      'Laser mode requires PWM output. Ensure that the machine setup supports PWM output for laser mode.',
      '', // no code
      '', // no code
      'Unsupported or invalid GCode command. Check the GCode program for unsupported or invalid commands.',
      '> 1 GCode command in a modal group in block. Ensure that each GCode block contains only one command from a modal group.',
      'Feed rate has not yet been set or is undefined. Set the feed rate using the F command in the GCode program.',
      'GCode command requires an integer value. Check the GCode program and provide integer values where required.',
      '> 1 GCode command using axis words found. Each GCode block should contain only one GCode command using axis words.',
      'Repeated GCode word found in block. Check the GCode program for repeated words in the same block.',
      'No axis words found in command block. Provide axis words in the GCode command.',
      'Line number value is invalid. Check the GCode program for invalid line number values.',
      'GCode Cmd missing a required value word. Check the GCode program for missing required value words in commands.',
      'G59.x WCS are not supported. Check the GCode program and use a supported WCS.',
      'G53 only valid with G0 and G1 motion modes. Use G53 only with G0 and G1 motion modes in the GCode program.',
      'Unneeded Axis words found in block. Remove unnecessary axis words from the GCode command block.',
      'G2/G3 arcs need >= 1 in-plane axis word. Provide at least one in-plane axis word for G2/G3 arcs in the GCode program.',
      'Motion command target is invalid. Check the motion command and provide a valid target.',
      'Arc radius value is invalid. Check the GCode program for invalid arc radius values.',
      'G2/G3 arcs need >= 1 in-plane offset word. Provide at least one in-plane offset word for G2/G3 arcs in the GCode program.',
      'Unused value words found in block. Remove unused value words from the GCode command block.',
      'G43.1 offset not assigned to tool length axis. Ensure that the G43.1 offset is assigned to the tool length axis.',
      'Tool number greater than max value. Check the tool number in the GCode program and ensure it is within the supported range.',
    ],
  } as Record<string, string | string[]>,

  JOBS_MANAGER_ERRORS: {
    CHECK_OPEN_FILE: 'Error Check Open File',
    OPEN_FILE: 'Error Open File',
    DELETE_FILE: 'Error Delete File',
    RENAME_FILE: 'Error Rename File',
    SAVE_FILE: 'Error Save File',
    START_FILE: 'Error Start File',
    PREVIEW_FILE: 'Error Preview File',
    GENERATE_FILE: 'Error Generate File',
    DOWNLOAD_FILE: 'Error Download File',
  } as Record<string, string>,

  MEDIA_MANAGER_ERRORS: {
    DELETE_MEDIA: 'Error Delete Media',
    RENAME_MEDIA: 'Error Rename Media',
    DOWNLOAD_MEDIA: 'Error Download Media',
    LIST_MEDIA_DATA: 'Error Listing Media Data',
  } as Record<string, string>,

  SLICE_ERRORS: {
    SLICE_MODEL: 'Error Slicing Model',
    SAVE_FILE: 'Error Saving Sliced File',
    LIST_SLICING_PROFILES: 'Error List slicing profiles',
    ADD_SLICING_PROFILE: 'Error Adding slicing profile',
    UPDATE_SLICING_PROFILE: 'Error Updating slicing profile',
    DELETE_SLICING_PROFILE: 'Error Deleting slicing profile',
  } as Record<string, string>,

  // Real time commands
  GRBL_COMMAND_STATUS: '?' as string,
  GRBL_COMMAND_PAUSE: '!' as string,
  GRBL_COMMAND_RESUME: '~' as string,
  GRBL_COMMAND_STOP: '\x18' as string,

  GRBL_COMMAND_INCREASE_FEED_RATE_1: '\x93' as string,
  GRBL_COMMAND_DECREASE_FEED_RATE_1: '\x94' as string,
  GRBL_COMMAND_INCREASE_FEED_RATE_10: '\x91' as string,
  GRBL_COMMAND_DECREASE_FEED_RATE_10: '\x92' as string,
  GRBL_COMMAND_DEFAULT_FEED_RATE: '\x90' as string,

  GRBL_COMMAND_INCREASE_TOOL_SPEED_1: '\x9C' as string,
  GRBL_COMMAND_DECREASE_TOOL_SPEED_1: '\x9D' as string,
  GRBL_COMMAND_INCREASE_TOOL_SPEED_10: '\x9A' as string,
  GRBL_COMMAND_DECREASE_TOOL_SPEED_10: '\x9B' as string,
  GRBL_COMMAND_DEFAULT_TOOL_SPEED: '\x99' as string,

  // essential commands
  GRBL_COMMAND_HOMING: '$H' as string,
  GRBL_COMMAND_HOMING_VINYL_CUTTER: '$HX' as string,
  GRBL_COMMAND_RESET_ZERO: 'G92 X0 Y0 Z0' as string,
  GRBL_COMMAND_UNLOCK: '$X' as string,
  GRBL_COMMAND_SOFT_RESET: '\x18' as string,

  // Jogging commands
  GRBL_COMMAND_RETURN_ZERO: 'G1 X0 Y0 F2000' as string,
  GRBL_COMMAND_RESET_ZERO_X: 'G92 X0' as string,
  GRBL_COMMAND_RESET_ZERO_Y: 'G92 Y0' as string,
  GRBL_COMMAND_RESET_ZERO_Z: 'G92 Z0' as string,
  GRBL_COMMAND_RESET_ZERO_XY: 'G92 X0 Y0' as string,
  GRBL_COMMAND_RESET_ZERO_XYZ: 'G92 X0 Y0 Z0' as string,
  GRBL_COMMAND_ABSOLUTE_POSITION: 'G90' as string,
  GRBL_COMMAND_RELATIVE_POSITION: 'G91' as string,

  // cameras system commands
  START_CAMERAS_STREAM: 'START_STREAM' as string,
  STOP_CAMERAS_STREAM: 'STOP_STREAM' as string,

  // machine states
  DISCONNECTED: 'Disconnected' as string,
  HOLD: 'Hold' as string,
  RUN: 'Run' as string,
  IDLE: 'Idle' as string,
  DOOR: 'Door' as string,
  HOMING: 'Home' as string,
  ALARM: 'Alarm' as string,
  ERROR: 'Error' as string,
  CONNECTING: 'Connecting' as string,

  API_URI: {
    // USER: `${API_VERSION.V1}/user`,
    JOBS_MANAGER: 'api/jobs_manager/',
    MEDIA_MANAGER: 'api/media_manager/',
    AI: 'api/ai/',
    MATERIAL_LIBRARY: 'api/material_library/',
    SLICE: 'api/slice/',
    // LOGOUT: `${API_VERSION.V1}/auth/logout`,
  } as Record<string, string>,

  // drawing on canvas functionalities
  IMAGE_DRAW_TYPE: {
    CUT_MARK: 'cut/mark',
    ENGRAVE: 'engrave',
  } as Record<string, string>,

  MAX_FILE_SIZE: 524288000 as number, // 500 MB
  MAX_MEDIA_FILE_SIZE: 52428800 as number, //50MB
  MEDIA_TYPES: {
    IMAGES: 'Images',
    THREE_D_MODELS: '3D Models',
  } as Record<string, string>,
  MEDIA_FILES_EXTENSIONS: {
    IMAGES: ['.jpg', '.jpeg', '.png', '.svg', '.webp', '.dxf'],
    THREE_D_MODELS: ['.stl', '.obj'],
  } as Record<string, Array<string>>,

  GCODE_COMMAND: 'Gcode Command' as string,

  // soft limits trigger
  SOFT_LIMITS_TRIGGER: 'MPOUT' as string,

  PREVIEWER_GCODE_ERROR_MESSAGE:
    'Syntax error detected in the G-code file. Please review the file for any formatting issues.' as string,
  PREVIEWER_BIG_GCODE_MESSAGE:
    'The job is beyond the machine platform range. Make sure the job stays inside the machine range' as string,

  // Gcode Generator
  SVG_ELEMENTS_FILTER: {
    SHAPE: 'shape',
    COLOR: 'color',
  } as Record<string, string>,

  DITHERING_ALGORITHMS: {
    HALFTONE: 'Halftone',
    FLOYDSTEINBERG: 'Floyd-Steinberg',
    ORDERED: 'Ordered',
    RANDOM: 'Random',
    AVERAGE: 'Average',
    GRID: 'Grid',
  } as Record<string, string>,

  PROFILE_OPTIONS: {
    NOTHING: '-----',
    CUT: 'Cut',
    MARK: 'Mark',
    ENGRAVE: 'Engrave',
  } as Record<string, string>,

  PROFILE_ALL_OPTIONS: {
    CUSTOM: 'Custom',
    CUT_EVERYTHING: 'Cut Everything',
    MARK_EVERYTHING: 'Mark Everything',
    ENGRAVE_EVERYTHING: 'Engrave Everything',
  } as Record<string, string>,

  SVG_ALLOWED_ELEMENTS: [
    'rect',
    'circle',
    'ellipse',
    'line',
    'polyine',
    'polygon',
    'path',
    'text',
  ] as string[],

  SVG_DIMENSION_DEFAULT_VALUE: 500 as number,

  FALLBACK_GCODE_GENERATOR_STAGE_METRICS: {
    width: 1000,
    height: 600,
  } as Record<string, number>,

  SLIDER_LABELS_VALUES: [0.1, 1, 10, 100] as Array<number>,
  SPEED_CHOICES: { slow: 10, normal: 50, fast: 200 } as Record<string, number>,

  RGB_COLOR: {
    BLACK: 'rgb(0, 0, 0)',
    WHITE: 'rgb(255, 255, 255)',
  } as Record<string, string>,

  MAX_IMAGE_HEIGHT_SIZE: 700 as number,

  PREVIEWER_WORKER_BATCH_SIZE: 20000 as number,

  GCODE_PREVIEWER_RATIO: 25 as number,

  // machine's tools
  LASER_TOOLS_NAMES: {
    DIODE_LASER: 'Diode',
    CO2_LASER: 'CO2',
    NO_LASER: '-',
  } as Record<string, string>,

  DEFAULT_GCODE_GENERATOR_SETTINGS: {
    MAIN_SETTINGS: {
      material: '',
      thickness: 1,
      metrics: {
        width: 0,
        height: 0,
        rotation: 0,
        scaleX: 0,
        scaleY: 0,
      } as ImageMetrics,
      filename: '',
    } as MainSettings,

    THICKNESS_SETTINGS: {
      thicknessOperations: [{}] as Array<ThicknessOperation>,
    } as MaterialThickness,

    CUTTING_SETTINGS: {
      speed: 3000,
      power: 50,
      tool: 'CO2',
    } as ThicknessOperation,

    MARKING_SETTINGS: {
      speed: 3000,
      power: 50,
      tool: 'CO2',
    } as ThicknessOperation,

    ENGRAVING_SETTINGS: {
      speed: 3000,
      power: 50,
      tool: 'Diode',
      dithering: {
        algorithm: 'Halftone',
        grayShift: 0,
        resolution: 1000,
        blockSize: 0.5,
        blockDistance: 0.1,
      } as DitheringSettings,
    } as EngravingSettings,

    IMAGE_CONFIGURATION: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      draggable: true,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
      image: undefined,
    } as Konva.ImageConfig,
  },

  AI_IMAGE_SIZE_OPTIONS: [128, 256, 512, 1024] as number[],

  AI_ASSISTANT_MESSAGES: {
    PROMPTS_PLACEHOLDER:
      'A realistic portrait of a young woman in a forest, soft lighting, high detail.',
    NEGATIVE_PROMPTS_PLACEHOLDER:
      'blurry, low detail, cartoonish, dark lighting.',
    NEGATIVE_PROMPTS_MESSAGE:
      'Tell the AI what you don’t want to appear in the generated image.',

    INFERENCE_STEPS_MESSAGE:
      'Inference steps control image quality. More steps refine details but take longer, while fewer steps are faster but may lack detail.',
    GUIDANCE_SCALE_MESSAGE:
      'Guidance scale adjusts prompt influence—higher values strengthen prompt effects, while lower values give more creative freedom.',
    SEEDS_MESSAGE:
      'Seeds determine the randomness of image generation. Using the same seed produces similar images, while different seeds yield unique variations for creativity.',
  },

  SUPPORTED_AI_MODELS: [
    {
      name: 'rupeshs--sd-turbo-openvino',
      description: 'Fast, high-quality images for general use.',
    },
    {
      name: 'rupeshs--sdxs-512-0.9-openvino',
      description: 'Detailed square images, ideal for portraits and logos.',
    },
    {
      name: 'rupeshs--hyper-sd-sdxl-1-step-openvino-int8',
      description: 'Quick, simplified images for previews.',
    },
    {
      name: 'rupeshs--sdxl-turbo-openvino-int8',
      description: 'Detailed scenes with good speed.',
    },
    {
      name: 'Disty0--LCM_SoteMix',
      description: 'Artistic images with mixed styles.',
    },
    {
      name: 'runwayml--stable-diffusion-v1-5',
      description: 'Versatile, realistic images for any style.',
    },
  ] as Array<AIModelData>,

  THREE_D_PRINTER_PLATFORM_SHAPE: {
    CIRCLE: 'circle',
    RECTANGLE: 'rectangle',
  } as Record<string, string>,

  SLICING_FILES_FORMATE: {
    OBJ: '.obj',
    STL: '.stl',
  } as Record<string, string>,

  SLICING_MESH_SHAPES: {
    BOX: 'box',
    CAPSULE: 'capsule',
    CYLINDER: 'cylinder',
    DODECAHEDRON: 'dodecahedron',
    ICOSAHEDRON: 'icosahedron',
    LATHE: 'lathe',
    OCTAHEDRON: 'octahedron',
    RING: 'ring',
    SPHERE: 'sphere',
    TETRAHEDRON: 'tetrahedron',
    TORUS: 'torus',
    TORUS_KNOT: 'torusKnot',
  } as Record<string, string>,

  SLICING_LIBRARIES: {
    SLIC3R: 'Slic3r',
    PRUSA_SLICER: 'PrusaSlicer',
    PYSLM: 'Pyslm',
  } as Record<string, string>,

  DEFAULT_SLICING_PROFILE_NAME: 'Default' as string,

  PRINTING_SETTINGS_ASSISTANT_MESSAGES: {
    SLICING_TYPE:
      'Pick the 3d printing slicing library to be use for slicing procedure',
    LAYER_HEIGHT: 'Layer height to slice the 3D model',
    LAYER_SPEED: 'Navigating feed rate/speed between layers',
    CONTOUR_SPEED:
      'The feed rate/speed for the machine to execute the contour/wall',
    CONTOUR_POWER: 'Laser power for the contour/wall',
    INFILL_IMAGE_PIXEL_SIZE:
      'Pixel size in mm (XY-axis): each image (layer) pixel is drawn (generating gcode) based on this size',
    INFILL_POWER: "Maximum laser power for layer's infill",
    INFILL_SPEED: 'The feed rate/speed for the machine to execute the infill',
    INFILL_NOISE:
      'Noise power level, do not burn pixels below this power level for each layer',
    INFILL_IMAGE_SIZE:
      ' target gcode width and height in mm (default: not set and determined by pixel size and image source resolution). Used only for single object (one single entity)',
    PYSLM_INFILL_TYPE:
      'The type of hatching (infill) you want to use (different patterns of infill)',
    PYSLM_OUTER_CONTOUR:
      'Number of Contours created outside the infill for a layer',
    PYSLM_INNER_CONTOUR:
      'Number of Contours created inside the infill for a layer',
    PYSLM_CONTOUR_LINE_COUNT:
      'Number of parallel laser lines to draw for each contour. Spacing is fixed at 0.2 mm',
    PYSLM_INFILL_STRIP_WIDTH:
      'Island Size - the length of each size of the square island ',
    PYSLM_INFILL_LINE_COUNT:
      'Number of parallel laser lines to draw for each hatch. Spacing is fixed at 0.2 mm',
    INFILL_LINE_THICKNESS:
      'Thickness of infill lines in mm (used in line-by-line engraving mode). Default: 0.8 mm for single thick line',
    PRUSA_HATCH_ROTATION_PER_LAYER:
      'Angle added to the infill hatch direction after each layer',
    PRUSA_INFILL_TYPE:
      'Lines creates one hatch direction. Grid adds a perpendicular direction and switches the laser off around every existing hatch crossing',
    PRUSA_CONTOUR_INFILL_OVERLAP:
      'How far the infill overlaps the innermost contour. Negative values create a gap between contour and infill',
    PRUSA_INFILL_HATCH_SPACING:
      'Distance between hatch bundles. Increase to lower infill density and heat, decrease for denser infill',
    PRUSA_GRID_SPACING:
      'Distance between adjacent grid bundles in both directions. Increase for larger cells and less scanning',
    PRUSA_GRID_CLEARANCE:
      'Laser-off distance around an existing grid member. In engraving mode the automatic value follows Vertical Scanline Spacing; enable custom clearance to override it',
    PRUSA_OPTIMIZE_SCAN_ORDER:
      'Alternate hatch scan direction to reduce long jumps and repeated heat direction',
    PRUSA_RESERVOIR_LIFT_PER_LAYER:
      'Reservoir movement per routine layer. A positive value is written as a negative A-axis move for the current machine setup',
    PYSLM_INFILL_ISLAND_WIDTH:
      'Island Size - the length of each size of the square island',
    PYSLM_INFILL_ISLAND_OVERLAP: 'The overlap between adjacent islands',
    PYSLM_INFILL_ISLAND_OFFSET:
      'The island offset is the relative distance(hatch spacing) to move the scan vectors between adjacent checkers',
    PYSLM_INFILL_ANGLE: 'Hatching (infill) angle',
    PYSLM_INFILL_VOLUME_OFFSET:
      'An additional offset may be added(positive or negative) between the contour and the internal hatching',
    PYSLM_INFILL_SPOT_COMPENSATION:
      'The spot (laser point) compensation factor is the distance to offset the outer-boundary and other internal hatch features in order to factor in the exposure radius of the laser',
    PYSLM_INFILL_IMAGE_RESOLUTION:
      'The quality of the generated infill (layers) images',
    HOLLOWING_WALL_THICKNESS: 'Minimum wall thickness of the hollowed model',
    HOLLOWING_CLOSING_DISTANCE: 'Interior rounding control. Higher = rounder',
    HOLLOWING_QUALITY: 'Accuracy vs performance tradeoff',
    SUPPORT_ENFORCED: 'Only create support if it lies in a support enforcer',
    SUPPORT_PINHEAD_WIDTH:
      'Width from the back sphere center to the front sphere center',
    SUPPORT_PINHEAD_FRONT_DIAMETER: 'Diameter of the pointing side of the head',
    SUPPORT_ON_BUILD_PLATE:
      "Only create support if it lies on a build plate. Don't create support on a print.",
    SUPPORT_PINHEAD_PENETRATION:
      'How much the pinhead has to penetrate the model surface',
    SUPPORT_PILLAR_DIAMETER: 'Diameter in mm of the support pillars',
    SUPPORT_BASE_DIAMETER: ' Diameter in mm of the pillar base',
    SUPPORT_BASE_HEIGHT: ' The height of the pillar base cone',
    SUPPORT_MAX_BRIDGE_LENGTH: 'The max length of a bridge',
    SUPPORT_MAX_PILLAR_LINK_DISTANCE:
      ' The max distance of two pillars to get linked with each other. A zero value will prohibit pillar cascading',
    SUPPORT_POINTS_DENSITY:
      'This is a relative measure of support points density',
    SUPPORT_POINTS_MINIMAL_DISTANCE:
      'No support points will be placed closer than this threshold',
    PAD_WALL_THICKNESS:
      'The thickness of the pad and its optional cavity walls',
    PAD_BRIM_SIZE:
      'How far should the pad extend around the contained geometry',
    PAD_AROUND_OBJECT:
      'Create pad around object and ignore the support elevation',
    PAD_AROUND_OBJECT_EVERYWHERE: 'Force pad around object everywhere',
  } as Record<string, string>,

  PYSLM_INFILL_TYPES: {
    BASIC: 'Basic',
    STRIP: 'Strip',
    ISLAND: 'Island',
  } as Record<string, string>,

  PRUSA_INFILL_TYPES: {
    LINES: 'Lines',
    GRID: 'Grid',
  } as Record<string, string>,

  DEFAULT_SLIC3r_SETTINGS: {
    layerHeight: 1,
    layerSpeed: 1000,
    contourSpeed: 3000,
    contourPower: 50,
    contourLineCount: 3,
    infillAngle: 45,
    infillLineCount: 3,
    infillPower: 50,
    infillSpeed: 3000,
    infillImageSettings: {
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      noise: 5,
      isImageSizeSettings: false,
    },
  } as Slic3rSettings,

  DEFAULT_PRUSA_SLICER_SETTINGS: {
    solidModeEnabled: false,
    solidTrackWidth: 0.2,
    solidCloseTopBottomEnabled: false,
    solidCloseTopBottomLayers: 3,
    solidCloseTopBottomPower: 50,
    solidCloseTopBottomSpeed: 3000,
    solidCloseTopBottomLineOverlap: 0,
    solidFirstZoneEnabled: false,
    solidFirstZoneEngravingEnabled: true,
    solidFirstLayersCount: 1,
    solidFirstPower: 50,
    solidFirstSpeed: 3000,
    solidFirstEngravingHatchSpacing: 0.2,
    solidIntermediateZoneEnabled: false,
    solidIntermediateZoneEngravingEnabled: true,
    solidIntermediateLayersCount: 1,
    solidIntermediatePower: 50,
    solidIntermediateSpeed: 3000,
    solidIntermediateEngravingHatchSpacing: 0.2,
    solidRasterDirection: 'x' as 'x' | 'y' | 'diagonal',
    solidCrossHatch: false,
    solidPower: 50,
    solidSpeed: 3000,
    solidContourOverlap: 0,
    solidLineOverlap: 0,
    solidContourEnabled: true,
    solidContourPower: 50,
    solidContourSpeed: 3000,
    solidContourLineCount: 3,
    engravingMode: 'vectoring' as 'vectoring' | 'engraving',
    engravingAcceleration: 500,
    engravingContourThickness: 0.8,
    nominalVectorTrackWidth: 0.2,
    lineBundleSpacing: 0.2,
    matchEngravedShellToVectorWall: true,
    engravingRasterDirection: 'x' as 'x' | 'y',
    layerHeight: 1,
    layerSpeed: 1000,
    contourSpeed: 3000,
    contourPower: 50,
    contourLineCount: 3,
    autoContourLineCountEnabled: false,
    infillType: 'Lines',
    infillAngle: 0,
    hatchRotationPerLayer: 67,
    hatchRotationGroupingEnabled: false,
    hatchRotationGroupLayers: 5,
    infillLineCount: 3,
    infillLineThickness: 0.8,
    contourInfillOverlap: 15,
    scanlineSpacing: 0.2,
    infillHatchSpacing: 1,
    surfaceSkinEnabled: true,
    surfaceSkinLayers: 3,
    surfaceSkinEngravingEnabled: false,
    surfaceSkinHatchSpacing: 0.2,
    surfaceSkinPower: 50,
    surfaceSkinSpeed: 3000,
    surfaceSkinAlternateLines: false,
    surfaceSkinAlternateMode: 'two-pass',
    flatSurfaceSkinLayers: 3,
    flatSurfaceSkinHatchSpacing: 0.2,
    flatSurfaceSkinPower: 50,
    flatSurfaceSkinSpeed: 3000,
    flatSurfaceSkinRasterDirection: 'x',
    flatSurfaceSkinCrossHatch: false,
    flatSurfaceSkinPattern: 'hatch',
    flatSurfaceSkinSpiralDirection: 'outside-in',
    flatSurfaceSkinBoundaryMode: 'engrave',
    flatSurfaceSkinContourLineCount: 3,
    flatSurfaceSkinContourOverlap: 15,
    flatSurfaceSkinHatchOverlap: 0,
    flatSurfaceSkinSecondPassEnabled: false,
    flatSurfaceSkinSecondPassPower: 50,
    flatSurfaceSkinSecondPassSpeed: 3000,
    flatSurfaceSkinSecondPassHatchOverlap: 0,
    flatSurfaceSkinSecondPassRasterDirection: 'x',
    flatSurfaceSkinSecondPassCrossHatch: false,
    flatSurfaceSkinSecondPassBoundaryMode: 'engrave',
    flatSurfaceSkinSecondPassContourLineCount: 3,
    flatSurfaceSkinSecondPassContourOverlap: 15,
    roofHollowInfillEnabled: false,
    roofHollowInfillOverlap: 15,
    variableGridInfillEnabled: false,
    variableGridTarget: 'hollow',
    variableGridInfillLayersBeforeRoof: 3,
    variableGridSpacing: 1,
    variableGridHatchSpacing: 1,
    variableGridHatchRotationPerLayer: 67,
    variableGridClearance: 0.2,
    variableGridLineCount: 3,
    variableEngravingGridSpacing: 1,
    variableEngravingGridLineThickness: 0.8,
    multiVariableGridEnabled: false,
    secondaryVariableGridLayersBeforeRoof: 6,
    secondaryVariableGridSpacing: 1,
    secondaryVariableGridHatchSpacing: 1,
    secondaryVariableGridClearance: 0.2,
    secondaryVariableGridLineCount: 3,
    secondaryVariableEngravingGridSpacing: 1,
    secondaryVariableEngravingGridLineThickness: 0.8,
    tertiaryVariableGridEnabled: false,
    tertiaryVariableGridLayersBeforeRoof: 6,
    tertiaryVariableGridSpacing: 1,
    tertiaryVariableGridHatchSpacing: 1,
    tertiaryVariableGridClearance: 0.2,
    tertiaryVariableGridLineCount: 3,
    tertiaryVariableEngravingGridSpacing: 1,
    tertiaryVariableEngravingGridLineThickness: 0.8,
    slantedSurfaceSkinEnabled: true,
    slantedSurfaceSkinLayers: 3,
    slantedSurfaceSkinHatchSpacing: 0.2,
    slantedSurfaceSkinPower: 50,
    slantedSurfaceSkinSpeed: 3000,
    slantedSurfaceSkinRasterDirection: 'diagonal',
    slantedSurfaceSkinCrossHatch: false,
    gridSpacing: 2,
    engravingGridSpacing: 2,
    engravingGridAngle: 45,
    engravingGridLineThickness: 0.8,
    useCustomGridClearance: false,
    gridClearance: 0.2,
    optimizeScanOrder: true,
    fillEnclosedHollows: false,
    infillPower: 50,
    infillSpeed: 3000,
    infillImageSettings: {
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      noise: 5,
      isImageSizeSettings: false,
    },
    isHollowingEnabled: false,
    hollowingWallThickness: 3,
    hollowingClosingDistance: 2,
    hollowingQuality: 0.5,
    isSupportEnabled: false,
    isSupportEnforced: false,
    supportPinheadWidth: 1,
    supportPinheadFrontDiameter: 0.4,
    supportPinheadPenetration: 0.2,
    supportPillarDiameter: 1,
    isSupportOnBuildPlate: true,
    supportBaseDiameter: 4,
    supportBaseHeight: 1,
    supportMaxBridgeLength: 15,
    supportMaxPillarDistance: 10,
    supportPointsDensity: 100,
    supportPointsMinimalDistance: 1,
    isPadEnabled: false,
    padWallThickness: 2,
    padBrimSize: 1.6,
    isPadAroundObject: false,
    isPadAroundObjectEverywhere: false,

  // FIRST zone (set firstLayersCount=0 to disable)
  firstLayersCount: 1,
  firstZoneEngravingEnabled: false,
  firstInfillPower: 55,
  firstInfillSpeed: 2000,
  firstEngravingHatchSpacing: 0.2,
  firstContourPower: 55,
  firstContourSpeed: 2000,

  // INTERMEDIATE zone (toggle off by default)
  intermediateZoneEnabled: false,
  intermediateZoneEngravingEnabled: false,
  intermediateLayersCount: 2,
  intermediateInfillPower: 45,
  intermediateInfillSpeed: 2500,
  intermediateEngravingHatchSpacing: 0.2,
  intermediateContourPower: 45,
  intermediateContourSpeed: 2500,

  // OLSK machine routine settings
  noRoutineFirstLayers: 0,
  reservoirLiftPerLayer: 0.3,
  recoaterFeedRate: 3000,
  bedOffsetX: -238.5,
  bedOffsetY: -158,


  } as PrusaSettings,

  DEFAULT_PYSLM_SETTINGS: {
    engravingMode: 'vectoring' as 'vectoring' | 'engraving',
    engravingAcceleration: 500,
    skipInfill: false,
    skipContour: false,
    layerHeight: 1,
    layerSpeed: 1000,
    contourSpeed: 3000,
    contourPower: 50,
    innerContour: 0,
    outerContour: 1,
    contourLineCount: 3,
    infillPower: 50,
    infillSpeed: 3000,
    infillImageSettings: {
      x: 1,
      y: 1,
      width: 1,
      height: 1,
      noise: 5,
      resolution: 50,
      isImageSizeSettings: false,
    },
    infillType: 'Basic',
    infillLineCount: 3,
    infillLineThickness: 0.8,
    infillStripWidth: 0.1,
    infillIslandWidth: 5,
    infillIslandOverlap: 0.1,
    infillIslandOffset: 0.5,
    infillAngle: 0,
    infillVolumeOffset: 0.1,
    infillSpotCompensation: 0.1,

  // FIRST zone (set firstLayersCount=0 to disable)
  firstLayersCount: 1,
  firstZoneEngravingEnabled: false,
  firstInfillPower: 55,
  firstInfillSpeed: 2000,
  firstEngravingHatchSpacing: 0.2,
  firstContourPower: 55,
  firstContourSpeed: 2000,

  // INTERMEDIATE zone (toggle off by default)
  intermediateZoneEnabled: false,
  intermediateZoneEngravingEnabled: false,
  intermediateLayersCount: 2,
  intermediateInfillPower: 45,
  intermediateInfillSpeed: 2500,
  intermediateEngravingHatchSpacing: 0.2,
  intermediateContourPower: 45,
  intermediateContourSpeed: 2500,

  // OLSK machine routine settings
  noRoutineFirstLayers: 0,
  reservoirLiftPerLayer: 0.3,
  recoaterFeedRate: 3000,
  bedOffsetX: -238.5,
  bedOffsetY: -158,


  } as PyslmSettings,

  GCODE_CONTOUR_COMMENT: '; contour' as string,
  GCODE_INFILL_COMMENT: '; infill' as string,

  DEFAULT_AI_GENERATOR_SETTINGS: {
    model: '',
    mainPrompts: '',
    negativePrompts: '',
    numberOfImages: 1,
    inferenceSteps: 1,
    guidanceScale: 1,
    seed: 0,
    isSeedsUsed: false,
    imageWidth: 512,
    imageHeight: 512,
    imageForm: 'PNG',
  } as AiGeneratorSettingsData,

  AI_SETTINGS_LIMITATION: {
    NUMBER_OF_IMAGES: 3,
    INFERENCE_STEPS: 5,
    IMAGE_WIDTH: 512,
    IMAGE_HEIGHT: 512,
  } as Record<string, number>,

  VIRTUAL_KEYBOARD_DELAY: 10 as number,

  ALL_HEX_COLORS: {
    ALICEBLUE: '#f0f8ff',
    ANTIQUEWHITE: '#faebd7',
    AQUA: '#00ffff',
    AQUAMARINE: '#7fffd4',
    AZURE: '#f0ffff',
    BEIGE: '#f5f5dc',
    BISQUE: '#ffe4c4',
    BLACK: '#000000',
    BLANCHEDALMOND: '#ffebcd',
    BLUE: '#0000ff',
    BLUEVIOLET: '#8a2be2',
    BROWN: '#a52a2a',
    BURLYWOOD: '#deb887',
    CADETBLUE: '#5f9ea0',
    CHARTREUSE: '#7fff00',
    CHOCOLATE: '#d2691e',
    CORAL: '#ff7f50',
    CORNFLOWERBLUE: '#6495ed',
    CORNSILK: '#fff8dc',
    CRIMSON: '#dc143c',
    CYAN: '#00ffff',
    DARKBLUE: '#00008b',
    DARKCYAN: '#008b8b',
    DARKGOLDENROD: '#b8860b',
    DARKGRAY: '#a9a9a9',
    DARKGREEN: '#006400',
    DARKKHAKI: '#bdb76b',
    DARKMAGENTA: '#8b008b',
    DARKOLIVEGREEN: '#556b2f',
    DARKORANGE: '#ff8c00',
    DARKORCHID: '#9932cc',
    DARKRED: '#8b0000',
    DARKSALMON: '#e9967a',
    DARKSEAGREEN: '#8fbc8f',
    DARKSLATEBLUE: '#483d8b',
    DARKSLATEGRAY: '#2f4f4f',
    DARKTURQUOISE: '#00ced1',
    DARKVIOLET: '#9400d3',
    DEEPPINK: '#ff1493',
    DEEPSKYBLUE: '#00bfff',
    DIMGRAY: '#696969',
    DODGERBLUE: '#1e90ff',
    FIREBRICK: '#b22222',
    FLORALWHITE: '#fffaf0',
    FORESTGREEN: '#228b22',
    FUCHSIA: '#ff00ff',
    GAINSBORO: '#dcdcdc',
    GHOSTWHITE: '#f8f8ff',
    GOLD: '#ffd700',
    GOLDENROD: '#daa520',
    GRAY: '#808080',
    GREEN: '#008000',
    GREENYELLOW: '#adff2f',
    HONEYDEW: '#f0fff0',
    HOTPINK: '#ff69b4',
    INDIANRED: '#cd5c5c',
    INDIGO: '#4b0082',
    IVORY: '#fffff0',
    KHAKI: '#f0e68c',
    LAVENDER: '#e6e6fa',
    LAVENDERBLUSH: '#fff0f5',
    LAWNGREEN: '#7cfc00',
    LEMONCHIFFON: '#fffacd',
    LIGHTBLUE: '#add8e6',
    LIGHTCORAL: '#f08080',
    LIGHTCYAN: '#e0ffff',
    LIGHTGOLDENRODYELLOW: '#fafad2',
    LIGHTGREY: '#d3d3d3',
    LIGHTGREEN: '#90ee90',
    LIGHTPINK: '#ffb6c1',
    LIGHTSALMON: '#ffa07a',
    LIGHTSEAGREEN: '#20b2aa',
    LIGHTSKYBLUE: '#87cefa',
    LIGHTSLATEGRAY: '#778899',
    LIGHTSTEELBLUE: '#b0c4de',
    LIGHTYELLOW: '#ffffe0',
    LIME: '#00ff00',
    LIMEGREEN: '#32cd32',
    LINEN: '#faf0e6',
    MAGENTA: '#ff00ff',
    MAROON: '#800000',
    MEDIUMAQUAMARINE: '#66cdaa',
    MEDIUMBLUE: '#0000cd',
    MEDIUMORCHID: '#ba55d3',
    MEDIUMPURPLE: '#9370d8',
    MEDIUMSEAGREEN: '#3cb371',
    MEDIUMSLATEBLUE: '#7b68ee',
    MEDIUMSPRINGGREEN: '#00fa9a',
    MEDIUMTURQUOISE: '#48d1cc',
    MEDIUMVIOLETRED: '#c71585',
    MIDNIGHTBLUE: '#191970',
    MINTCREAM: '#f5fffa',
    MISTYROSE: '#ffe4e1',
    MOCCASIN: '#ffe4b5',
    NAVAJOWHITE: '#ffdead',
    NAVY: '#000080',
    OLDLACE: '#fdf5e6',
    OLIVE: '#808000',
    OLIVEDRAB: '#6b8e23',
    ORANGE: '#ffa500',
    ORANGERED: '#ff4500',
    ORCHID: '#da70d6',
    PALEGOLDENROD: '#eee8aa',
    PALEGREEN: '#98fb98',
    PALETURQUOISE: '#afeeee',
    PALEVIOLETRED: '#d87093',
    PAPAYAWHIP: '#ffefd5',
    PEACHPUFF: '#ffdab9',
    PERU: '#cd853f',
    PINK: '#ffc0cb',
    PLUM: '#dda0dd',
    POWDERBLUE: '#b0e0e6',
    PURPLE: '#800080',
    REBECCAPURPLE: '#663399',
    RED: '#ff0000',
    ROSYBROWN: '#bc8f8f',
    ROYALBLUE: '#4169e1',
    SADDLEBROWN: '#8b4513',
    SALMON: '#fa8072',
    SANDYBROWN: '#f4a460',
    SEAGREEN: '#2e8b57',
    SEASHELL: '#fff5ee',
    SIENNA: '#a0522d',
    SILVER: '#c0c0c0',
    SKYBLUE: '#87ceeb',
    SLATEBLUE: '#6a5acd',
    SLATEGRAY: '#708090',
    SNOW: '#fffafa',
    SPRINGGREEN: '#00ff7f',
    STEELBLUE: '#4682b4',
    TAN: '#d2b48c',
    TEAL: '#008080',
    THISTLE: '#d8bfd8',
    TOMATO: '#ff6347',
    TURQUOISE: '#40e0d0',
    VIOLET: '#ee82ee',
    WHEAT: '#f5deb3',
    WHITE: '#ffffff',
    WHITESMOKE: '#f5f5f5',
    YELLOW: '#ffff00',
    YELLOWGREEN: '#9acd32',
  } as Record<string, string>,
} as const;

export type Constants = typeof Constants;
