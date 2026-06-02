from multiprocessing import Process, Pipe
import platform
import cv2


class CameraStream(Process):
    """
    A multiprocessing class to handle video streaming from a camera device.

    Inherits from:
        multiprocessing.Process: Enables running camera capture in a separate process.

    Attributes:
        index (int): The index of the camera device (e.g., 0 for default webcam).
        pipe_end (multiprocessing.PipeConnection): One end of a multiprocessing pipe used to send frames.

    Args:
        _index (int): The index of the camera device (e.g., 0 for default webcam).
        _pipe_end (multiprocessing.PipeConnection): One end of a multiprocessing pipe used to send frames.
    """

    def __init__(self, index, pipe_end):
        super(CameraStream, self).__init__()
        self._index = index
        self._pip_end = pipe_end

    def run(self):
        """
        Runs the camera capture loop.

        Continuously captures frames from the camera and sends them through the pipe
        until an error occurs or the process is interrupted.
        """

        camera = self.open_camera()
        try:
            if camera:
                while True:
                    ret, frame = camera.read()
                    if ret:
                        self._pip_end.send(frame)

        except Exception as Error:
            print(Error)
            pass
        except KeyboardInterrupt:
            camera.release()

    def open_camera(self):
        """
        Opens the camera based on the operating system.

        Uses `cv2.CAP_DSHOW` on Windows and default capture on other platforms.

        Returns:
            cv2.VideoCapture or None: The opened camera object or None if it fails.
        """

        system = platform.system()

        # Use cv2.CAP_DSHOW only for Windows
        capture_flag = cv2.CAP_DSHOW if system == "Windows" else 0
        camera = cv2.VideoCapture(self._index, capture_flag)

        # Check if the camera opened successfully
        if not camera.isOpened():
            print('Camera with index number:', self._index, 'is not connected')
            return None

        return camera
