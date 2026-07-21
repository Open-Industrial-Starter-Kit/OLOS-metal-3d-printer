class CoreConstants:
    """
    Contains global constants used across the entire server core, machine control,
    WebSocket communication, job execution, AI integration, media handling, and slicing logic.

    This class is a centralized collection of string literals, numeric values,
    commands, and configuration keys for the machine control ecosystem.

    Attributes:
        MACHINE_TYPES (dict): Supported machine types (Laser Cutter, CNC, Vinyl Cutter, 3D Printer).
        SERVER_READY_FILE_NAME (str): Name of the server readiness marker file.

        *_DATA_TYPE (str): Constants representing the type of data being sent through WebSocket.

        NEW_LINE (str): Standard newline character.

        TIMEOUT (float): General timeout value for real-time polling (in seconds).

        JOYSTICK_STATUS_INTERVAL (float): Time interval between joystick state updates (in seconds).
        JOYSTICK_ERROR_THRESHOLD (int): Acceptable deviation from center before detecting movement.
        MAX_BIT_VALUE_JOYSTICK (int): Max analog reading value from joystick.
        LOW_SPEED_MOVEMENT (int): Low speed movement in mm/min.
        NORMAL_SPEED_MOVEMENT (int): Normal speed movement in mm/min.
        FAST_SPEED_MOVEMENT (int): Fast speed movement in mm/min.
        JOYSTICK_CENTER_POINT (list): Center analog reading for joystick [X, Y].

        GCODE_COMMENT_PARENTHESES (str): G-code comment symbol using parentheses.
        GCODE_COMMENT_SEMICOLON (str): G-code comment symbol using semicolon.

        GRBL_ANSWER_OK (str): Standard GRBL success response.
        GRBL_ANSWER_ERROR (str): Standard GRBL error response.
        GRBL_COMMAND_* (str): Various GRBL control commands (pause, resume, homing, etc.).
        GRBL_MATERIAL_THICKNESS_COMMENT (str): Comment tag indicating material thickness move.
        GRBL_END_PROGRAM (str): G-code end of job command.
        GRBL_COOLANT_OFF (str): Turns off coolant system.
        GRBL_TOOL_CHANGE (str): Initiates tool change.
        GRBL_NO_TOOL (str): No tool selected.
        GCODE_GENERATOR_FILE_INITIAL_COMMANDS (str): Initialization commands for G-code file.
        GCODE_INFILL_LAYER_COMMENT (str): Comment used to denote infill section in G-code.
        GCODE_CONTOUR_LAYER_COMMENT (str): Comment used to denote contour section in G-code.

        START_CAMERAS_STREAM (str): start cameras stream system
        STOP_CAMERAS_STREAM (str): stop cameras stream system

        PICO_ENABLE_STATUS (str): Command to enable PICO status communication.
        PICO_DISABLE_STATUS (str): Command to disable PICO status communication.

        REAL_TIME_COMMANDS (list): List of GRBL real-time control characters.

        GBRL_PAUSE_STATUS (str): GRBL status string for paused state.

        HIGH_PRIORITY_COMMAND (int)
        MIDDLE_PRIORITY_COMMAND (int)
        LOW_PRIORITY_COMMAND (int)

        *_JOB_PROCESS (str): Identifiers for various job-related actions (upload, rename, delete, etc.).

        *_MEDIA_PROCESS (str): Identifiers for media file actions (upload, rename, list, etc.).

        *_AI_PROCESS (str): Identifiers for AI image generation and configuration processes.

        *_MATERIAL_PROCESS (str): Identifiers for material management actions.

        *_SLICE_PROCESS (str): Identifiers for slicing jobs and profile management.

        MATERIAL_NAME_SEARCH_KEYWORD (str): Marker used in G-code to extract material name.
        MATERIAL_THICKNESS_SEARCH_KEYWORD (str): Marker used in G-code to extract material thickness.

        SLICING_LIBRARIES (dict): Supported slicing engines with human-readable labels.

        AI_MODELS (dict): List of AI models grouped by inference engine type.

        ACCEPTED_JOB_FILES_EXTENSIONS (tuple): File extensions allowed for job files.
        ACCEPTED_MEDIA_FILES_EXTENSIONS (dict): Supported media file types and their MIME types.

        IMAGE_GENERATOR_ENGRAVE_PROCESS (str)
        IMAGE_GENERATOR_MARK_PROCESS (str)
        IMAGE_GENERATOR_CUT_PROCESS (str)
    """

    MACHINE_TYPES = {
        'LASER_CUTTER': 'Laser Cutter',
        'CNC': 'cnc',
        'VINYL_CUTTER': 'Vinyl Cutter',
        '3D_PRINTER': '3D Printer'
    }

    SERVER_READY_FILE_NAME = 'server_ready'

    # Data types for websocket messages
    MACHINE_STATUS_DATA_TYPE = 'MACHINE_STATUS'
    SERIAL_COMMAND_DATA_TYPE = 'SERIAL_COMMAND'
    JOB_EXECUTION_DATA_TYPE = 'JOB_EXECUTION'
    REAL_TIME_COMMAND_DATA_TYPE = 'REAL_TIME_COMMAND'
    NORMAL_COMMAND_DATA_TYPE = 'NORMAL_COMMAND'
    MACHINE_CONNECTION_DATA_TYPE = 'MACHINE_CONNECTION'
    JOBS_MANAGER_DATA_TYPE = 'JOBS_MANAGER'
    MEDIA_MANAGER_DATA_TYPE = 'MEDIA_MANAGER'
    AI_DATA_TYPE = 'AI_SERVICE'
    MATERIALS_LIBRARY_DATA_TYPE = 'MATERIALS_LIBRARY'
    SLICE_DATA_TYPE = 'SLICE'
    CAMERAS_SYSTEM_STREAM_DATA_TYPE = 'CAMERAS_STREAM'
    JOYSTICK_STATUS_DATA_TYPE = 'JOYSTICK_STATUS'
    USB_STORAGE_MONITOR_DATA_TYPE = 'USB_STORAGE_MONITOR'

    NEW_LINE = '\n'

    TIMEOUT = 0.01  # 10 ms

    # make sure the joystick change its position to more than 500 ms to prevent any error movements
    JOYSTICK_STATUS_INTERVAL = 0.2
    # joystick error threshold
    JOYSTICK_ERROR_THRESHOLD = 10
    # max bit value for joystick
    MAX_BIT_VALUE_JOYSTICK = 1024

    # machine speed movement for the joystick
    LOW_SPEED_MOVEMENT = 10
    NORMAL_SPEED_MOVEMENT = 50
    FAST_SPEED_MOVEMENT = 200

    # center point where the initial point of joystick will start at
    JOYSTICK_CENTER_POINT = [512, 512]

    # Constants for G-code comments
    GCODE_COMMENT_PARENTHESES = '('
    GCODE_COMMENT_SEMICOLON = ';'

    # GBRL answers
    GRBL_ANSWER_OK = "ok"
    GRBL_ANSWER_ERROR = "error"

    # GBRL commands
    GRBL_COMMAND_STATUS = '?'
    GRBL_COMMAND_PAUSE = '!'
    GRBL_COMMAND_RESUME = '~'
    GRBL_COMMAND_STOP = '\x18'
    GRBL_COMMAND_HOMING = '$H'
    GRBL_COMMAND_RESET_ZERO = 'G92 X0 Y0 Z0'
    GRBL_COMMAND_MOVE_BED = 'G53 Z'
    GRBL_MATERIAL_THICKNESS_COMMENT = ' ;Move the bed based on the material thickness'
    GRBL_COMMAND_RELATIVE_POSITION = 'G90'
    GRBL_COMMAND_UNLOCK = '$X'
    GRBL_COMMAND_SOFT_RESET = '\x18'
    GRBL_END_PROGRAM = 'M2'
    GRBL_COOLANT_OFF = 'M9'
    GRBL_TOOL_CHANGE = 'M6'
    GRBL_NO_TOOL = 'T0'
    GCODE_GENERATOR_FILE_INITIAL_COMMANDS = "G0 G17 G40 G54 G94\n\nG21\nG90\n"
    GCODE_INFILL_LAYER_COMMENT = "; infill"
    GCODE_CONTOUR_LAYER_COMMENT = "; contour"

    # cameras stream system commands
    START_CAMERAS_STREAM = 'START_STREAM'
    STOP_CAMERAS_STREAM = 'STOP_STREAM'

    # PICO commands
    PICO_ENABLE_STATUS = 'GSE'
    PICO_DISABLE_STATUS = 'GSD'

    REAL_TIME_COMMANDS = [GRBL_COMMAND_PAUSE, GRBL_COMMAND_RESUME,
                          GRBL_COMMAND_STOP, GRBL_COMMAND_STATUS]

    # GRBL status
    GBRL_PAUSE_STATUS = 'Hold'

    # priority constants for the priority queue
    HIGH_PRIORITY_COMMAND = 1
    MIDDLE_PRIORITY_COMMAND = 2
    LOW_PRIORITY_COMMAND = 3

    # Jobs manager processes
    UPLOAD_JOB_PROCESS = "Upload"
    OPEN_JOB_PROCESS = "Open"
    START_JOB_PROCESS = "Start"
    DELETE_JOB_PROCESS = "Delete"
    DOWNLOAD_JOB_PROCESS = "Download"
    RENAME_JOB_PROCESS = "Rename"
    SAVE_JOB_PROCESS = "Save"
    CHECK_JOB_PROCESS = "Check"
    GENERATE_JOB_PROCESS = "Generate"
    CANCEL_GENERATE_JOB_PROCESS = "Cancel"
    UPLOAD_USB_JOB_FILE_PROCESS = "Upload_USB_Job_File"

    # Media manager processes
    UPLOAD_MEDIA_PROCESS = "Upload"
    DELETE_MEDIA_PROCESS = "Delete"
    RENAME_MEDIA_PROCESS = "Rename"
    FETCH_MEDIA_DATA_PROCESS = "Fetch"
    LIST_MEDIA_DATA_PROCESS = "List"
    UPLOAD_USB_MEDIA_FILE_PROCESS = "Upload_USB_Media_File"

    # AI processes
    AI_GENERATE_IMAGES_PROCESS = "Generate"
    AI_CANCEL_GENERATE_IMAGES_PROCESS = "Cancel"
    CONFIG_AI_SETTINGS_PROCESS = "Config"
    ADD_AI_SETTING_PROCESS = "Add"
    DELETE_AI_SETTING_PROCESS = "Delete"
    UPDATE_AI_SETTING_PROCESS = "Update"

    # Material Library Processes
    LIST_MATERIAL_PROCESS = "List"
    ADD_MATERIAL_PROCESS = "Add"
    UPDATE_MATERIAL_PROCESS = "Update"
    DELETE_MATERIAL_PROCESS = "Delete"

    # Slicing processes
    SLICE_PROCESS = 'Slice'
    CANCEL_SLICE_PROCESS = 'Cancel'
    SAVE_SLICE_PROCESS = 'Save'
    PREVIEW_SLICE_PROCESS = 'Preview'
    LIST_SLICING_PROFILES = 'List'
    ADD_SLICING_PROFILE_PROCESS = 'Add'
    DELETE_SLICING_PROFILE_PROCESS = 'Delete'
    UPDATE_SLICING_PROFILE_PROCESS = 'Update'

    MATERIAL_NAME_SEARCH_KEYWORD = ";Material Name: "
    MATERIAL_THICKNESS_SEARCH_KEYWORD = ";Material Thickness: "

    SLICING_LIBRARIES = {
        'SLIC3R': 'Slic3r',
        'PRUSA_SLICER': 'PrusaSlicer',
        'PYSLM': 'Pyslm'
    }

    AI_MODELS = {
        "openvino": [
            'rupeshs--sd-turbo-openvino',
            'rupeshs--sdxs-512-0.9-openvino',
            'rupeshs--hyper-sd-sdxl-1-step-openvino-int8',
            'rupeshs--sdxl-turbo-openvino-int8',
            'Disty0--LCM_SoteMix'
        ],
        "lcm_lora": [
            'runwayml--stable-diffusion-v1-5'
        ]
    }

    ACCEPTED_JOB_FILES_EXTENSIONS = ('.nc', '.cnc', '.gcode')
    ACCEPTED_MEDIA_FILES_EXTENSIONS = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.dxf': 'application/dxf',
        '.stl': 'application/sla',
        '.obj': 'text/plain',
    }

    # image to gcode generator processes
    IMAGE_GENERATOR_ENGRAVE_PROCESS = 'Engrave'
    IMAGE_GENERATOR_MARK_PROCESS = 'Mark'
    IMAGE_GENERATOR_CUT_PROCESS = 'Cut'
