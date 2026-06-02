"""
    Websocket Connection module's constants.
"""


class WebsocketConstants:
    """
    A class to hold constant values used in the websocket_connection module.

    Attributes:
        TIMEOUT (float): Time delay (in seconds) for polling and async operations. Used to control event loop timing.

        HIGH_PRIORITY_COMMAND (int): Priority level 1. For urgent or critical commands.
        MIDDLE_PRIORITY_COMMAND (int): Priority level 2. For normal command processing.
        LOW_PRIORITY_COMMAND (int): Priority level 3. For background or less important commands.

        MAX_FRAME_SIZE (int): Maximum size (in bytes) for incoming WebSocket frames. Set to 500 MB.
    """

    TIMEOUT = 0.01  # 10 ms delay between operations

    # Priority constants for use in priority queues
    HIGH_PRIORITY_COMMAND = 1
    MIDDLE_PRIORITY_COMMAND = 2
    LOW_PRIORITY_COMMAND = 3

    MAX_FRAME_SIZE = 1024 * 1024 * 500  # 500 MB
