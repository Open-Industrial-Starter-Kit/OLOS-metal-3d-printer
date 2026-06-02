"""
    Machine Connection module's constants.
"""


class MachineConstants:
    """
    A class to hold constant values used in machine_connections module.

    Attributes:
        MACHINE_TYPES (dict): Supported machine types mapped to human-readable names.
        TIMEOUT (float): Serial communication timeout in seconds (default 10 ms).
        STATUS_REFRESH_INTERVAL_RUN (float): Status refresh interval during machine activity (100 ms).
        STATUS_REFRESH_INTERVAL_PAUSE (float): Status refresh interval when paused (1 second).
        NEWLINE (str): Line delimiter for GRBL communication.

        GRBL_ANSWER_OK (str): Acknowledgement string from GRBL when a command succeeds.
        GRBL_ANSWER_ERROR (str): Error response from GRBL.

        GRBL_PAUSE_STATUS (str): Status string indicating GRBL is paused ("Hold").

        GRBL_COMMAND_STATUS (str): Request current machine status ("?").
        GRBL_COMMAND_PAUSE (str): Pause the machine ("!").
        GRBL_COMMAND_RESUME (str): Resume from pause ("~").
        GRBL_COMMAND_STOP (str): Soft reset command (Ctrl+X).
        GRBL_COMMAND_UNLOCK (str): Unlocks the GRBL machine from alarm state ("$X").
        GRBL_COMMAND_TOOL_CHANGE (str): Triggers a tool change ("M6").
        GRBL_COMMAND_RESET_ZERO (str): Resets machine origin to current position ("G92 X0 Y0 Z0").
        GRBL_COMMAND_HOMING (str): Starts the homing cycle ("$H").
        GRBL_COMMAND_RETURN_TO_ZERO (str): Sends machine to zero position ("G1 X0 Y0 F5000").
        GRBL_COMMAND_SOFT_RESET (str): Soft reset command (Ctrl+X).
        GRBL_COMMAND_DUMMY_STATUS_HOMING (str): Fake status response to simulate homing state.

        PICO_ENABLE_STATUS (str): Enable status feedback for a Pico controller ("GSE").
        PICO_DISABLE_STATUS (str): Disable status feedback for a Pico controller ("GSD").

        TOOL_CHANGER_SUCCESS (str): Tool change succeeded ("TCOK").
        TOOL_CHANGER_ERROR (str): Tool change failed ("TCSE").
        SOFT_LIMITS_TRIGGER (str): Soft limit switch triggered ("MPOUT").

        HIGH_PRIORITY_COMMAND (int): Priority level for urgent commands.
        MIDDLE_PRIORITY_COMMAND (int): Priority level for mid-importance commands.
        LOW_PRIORITY_COMMAND (int): Priority level for low-importance or bulk commands.

        MAX_COUNTER_VALUE (int): Maximum time counter value in seconds (default 900 = 15 mins).

        MACHINE_STATUS_DATA_TYPE (str): Data type identifier for machine status updates.
        SERIAL_COMMAND_DATA_TYPE (str): Data type identifier for serial commands.
        REAL_TIME_COMMAND_DATA_TYPE (str): Data type for real-time commands.
        NORMAL_COMMAND_DATA_TYPE (str): Standard serial commands.
        MACHINE_CONNECTION_DATA_TYPE (str): Used for connection state events.
        JOYSTICK_STATUS_DATA_TYPE (str): Used for joystick status updates.
    """

    MACHINE_TYPES = {
        'LASER_CUTTER': 'Laser Cutter',
        'CNC': 'cnc',
        'VINYL_CUTTER': 'Vinyl Cutter',
        '3D_SCANNER': '3D Scanner'
    }
    # Serial port settings
    TIMEOUT = 0.01  # 10 ms
    # refresh every 100 ms while the machine is running
    STATUS_REFRESH_INTERVAL_RUN = 0.1
    # refresh every 1 second while the machine is paused
    STATUS_REFRESH_INTERVAL_PAUSE = 1

    # delimiters
    NEWLINE = "\n"

    # GRBL answers
    GRBL_ANSWER_OK = "ok"
    GRBL_ANSWER_ERROR = "error"

    # GRBL status
    GRBL_PAUSE_STATUS = 'Hold'

    # GRBL commands
    GRBL_COMMAND_STATUS = '?'
    GRBL_COMMAND_PAUSE = '!'
    GRBL_COMMAND_RESUME = '~'
    GRBL_COMMAND_STOP = '\x18'
    GRBL_COMMAND_UNLOCK = '$X'
    GRBL_COMMAND_TOOL_CHANGE = 'M6'
    GRBL_COMMAND_RESET_ZERO = 'G92 X0 Y0 Z0'
    GRBL_COMMAND_HOMING = '$H'
    GRBL_COMMAND_RETURN_TO_ZERO = 'G1 X0 Y0 F5000'
    GRBL_COMMAND_SOFT_RESET = '\x18'
    GRBL_COMMAND_DUMMY_STATUS_HOMING = "<Home|MPos:0.000,0.000,0.000|FS:0.0,0>"

    # PICO commands
    PICO_ENABLE_STATUS = 'GSE'
    PICO_DISABLE_STATUS = 'GSD'

    # tool change reply messages
    TOOL_CHANGER_SUCCESS = 'TCOK'
    TOOL_CHANGER_ERROR = 'TCSE'
    # soft limits reply message
    SOFT_LIMITS_TRIGGER = 'MPOUT'

    # priority constants for the priority queue
    HIGH_PRIORITY_COMMAND = 1
    MIDDLE_PRIORITY_COMMAND = 2
    LOW_PRIORITY_COMMAND = 3

    MAX_COUNTER_VALUE = 900  # second => 15 mins

    # machine messages types
    MACHINE_STATUS_DATA_TYPE = 'MACHINE_STATUS'
    SERIAL_COMMAND_DATA_TYPE = 'SERIAL_COMMAND'
    REAL_TIME_COMMAND_DATA_TYPE = 'REAL_TIME_COMMAND'
    NORMAL_COMMAND_DATA_TYPE = 'NORMAL_COMMAND'
    MACHINE_CONNECTION_DATA_TYPE = 'MACHINE_CONNECTION'
    JOYSTICK_STATUS_DATA_TYPE = 'JOYSTICK_STATUS'
