"""
    Camera Stream module's constants.
"""


class CameraConstants:
    """
    A class to hold constant values used across the camera_stream module.

    Attributes:
        TIMEOUT (float): Time (in seconds) to wait between frame reads from the camera system.
                         Used to control the frame rate or reduce CPU usage.

        START_CAMERAS_STREAM (str): start cameras stream system
        STOP_CAMERAS_STREAM (str): stop cameras stream system
    """

    TIMEOUT = 0.01

    # cameras stream system commands
    START_CAMERAS_STREAM = 'START_STREAM'
    STOP_CAMERAS_STREAM = 'STOP_STREAM'
