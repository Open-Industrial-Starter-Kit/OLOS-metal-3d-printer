"""
This module defines the CamerasSystem class which handles video input from one or more cameras,
optionally performs stitching using calibration data, and sends the processed frames to a shared queue with the core module.

Main Features:

- Multi-camera support via multiprocessing
- Optional stitching with calibration and patterned strips
- Support for undistortion based on camera matrices
- Encodes frames as base64 JPEGs to be sent to interface
"""

import base64
import time
import cv2
from multiprocessing import Pipe, Process

import numpy as np

from utils.configuration_loader import ConfigurationLoader
from utils.camera_stream import CameraStream
from stitching import Stitcher
from .constants import CameraConstants as constants


class CamerasSystem(Process):
    """
    A multiprocessing camera system that captures video streams from multiple cameras, optionally stitches them,
    and sends encoded frames to a shared queue for further processing.

    Attributes:
        cameras_system_data (obj): A shared data object containing queues and other resources.

    Args:
        cameras_system_data (obj): A shared data object containing queues and other resources.
        _is_camera_stream_on (bool): A flag that indicate if the camera stream is on or off.
    """

    def __init__(self, cameras_system_data):
        super(CamerasSystem, self).__init__()

        # shared objects dictionary with the core
        self.cameras_system_data = cameras_system_data
        self._is_camera_stream_on = False

    def run(self):
        """
        Entry point for the multiprocessing Process.

        Loads configuration, starts camera streams, and routes processing to appropriate handler based on:

        - Number of cameras
        - Whether stitching is enabled
        """

        try:
            config = ConfigurationLoader.from_yaml()
            # Disable OpenCL in OpenCV
            cv2.ocl.setUseOpenCL(False)

            camera_pipes = []
            camera_streams = []

            for index in config.cameras_connection.cameras_port_index:
                first_end_pipe, second_end_pipe = Pipe()
                camera_pipes.append(first_end_pipe)
                camera_stream = CameraStream(
                    index=index, pipe_end=second_end_pipe)
                camera_streams.append(camera_stream)
                camera_stream.start()

            # use stitching incase of multiple cameras
            if (len(camera_streams) > 1 and
                    config.cameras_connection.stitching_settings.stitching_enabled):
                self._handle_cameras_using_stitching(camera_pipes, config)
            # incase of multiple cameras without stitching
            elif (len(camera_streams) > 1 and
                  not config.cameras_connection.stitching_settings.stitching_enabled):
                self._handle_cameras_without_stitching(camera_pipes)
            # one camera
            elif len(camera_streams) == 1:
                self._handle_one_camera(camera_pipes)

        except Exception as Error:
            print("Error in the camera system", Error)
            for stream in camera_streams:
                stream.terminate()
                stream.join()
            self._reconnect_cameras()

    def _handle_cameras_using_stitching(self, camera_pipes, config):
        """
        Handle multiple camera feeds using stitching logic.

        Args:
            camera_pipes (List[multiprocessing.Pipe]): List of pipe ends to receive frames.
            config (ConfigurationLoader): Loaded configuration with calibration and stitching settings.
        """

        algorithm_settings = config.get_dict(
            'cameras_connection.stitching_settings.algorithm_settings')

        stitcher = Stitcher(
            **algorithm_settings)

        while True:
            self._handle_incoming_core_data()
            if self._is_camera_stream_on:
                frames = [pipe.recv() for pipe in camera_pipes]

                if not all(frame.any() for frame in frames):
                    print("Error: Could not read frames from cameras")
                    break

                # calibrate frames
                adjusted_frames = []

                for i, frame in enumerate(frames):
                    adjusted_frame = cv2.undistort(frame,
                                                   np.array(
                                                       config.cameras_connection.stitching_settings.cameras_calibration_settings.cameras_matrix[i]),
                                                   np.array(
                                                       config.cameras_connection.stitching_settings.cameras_calibration_settings.cameras_coeffs[i]),
                                                   None,
                                                   np.array(config.cameras_connection.stitching_settings.cameras_calibration_settings.cameras_matrix[i]))
                    adjusted_frames.append(adjusted_frame)

                # Define the dimensions of the patterned strip

                strip_width = adjusted_frames[0].shape[1]

                # Create the patterned strip
                patterned_strip = self._create_patterned_strip(
                    strip_width, config.cameras_connection.stitching_settings.frames_strip_height)
                # Combine the patterned strip with the frame
                frames_with_strip = [
                    np.concatenate((patterned_strip, frame, patterned_strip), axis=0) for frame in adjusted_frames]

                # convert the frame to string to send to the interface
                stitched_frame = stitcher.stitch(frames_with_strip)
                stitched_frame = stitched_frame[config.cameras_connection.stitching_settings.frames_strip_height:-
                                                config.cameras_connection.stitching_settings.frames_strip_height]
                # Remove the unwanted edges from the frames
                stitched_frame = stitched_frame[:,
                                                config.cameras_connection.stitching_settings.start_strip_width:
                                                config.cameras_connection.stitching_settings.end_strip_width]

                frame_str = self._convert_frame_to_string(
                    stitched_frame)

                # add to the queue shared with the core
                self.add_to_cameras_system_read_queue(frame_str)
            time.sleep(constants.TIMEOUT)

    def _handle_cameras_without_stitching(self, camera_pips):
        """
        Handle multiple camera feeds without stitching by concatenating them horizontally.

        Args:
            camera_pipes (List[multiprocessing.Pipe]): List of pipe ends to receive frames.
        """

        while True:
            self._handle_incoming_core_data()
            if self._is_camera_stream_on:
                frames = [pipe.recv() for pipe in camera_pips]
                frame = np.concatenate(frames, axis=1)
                frame_str = self._convert_frame_to_string(frame)

                # add to the queue shared with the core
                self.add_to_cameras_system_read_queue(frame_str)
            time.sleep(constants.TIMEOUT)

    def _handle_one_camera(self, camera_pipes):
        """
        Handle a single camera feed.

        Args:
            camera_pipes (List[multiprocessing.Pipe]): List containing a single pipe end.
        """

        while True:
            self._handle_incoming_core_data()
            if self._is_camera_stream_on:
                frame = camera_pipes[0].recv()
                frame_str = self._convert_frame_to_string(frame)

                # add to the queue shared with the core
                self.add_to_cameras_system_read_queue(frame_str)
            time.sleep(constants.TIMEOUT)

    def _handle_incoming_core_data(self):
        """
        Handle camera data coming from core process.
        """
        if not self.cameras_system_data.cameras_write_queue.empty():
            camera_command = self.cameras_system_data.cameras_write_queue.get()
            if camera_command == constants.START_CAMERAS_STREAM:
                self._start_cameras_steam()
            elif camera_command == constants.STOP_CAMERAS_STREAM:
                self._stop_cameras_steam()

    def _start_cameras_steam(self):
        """
            Start Camera Stream
        """
        self._is_camera_stream_on = True

    def _stop_cameras_steam(self):
        """
            Stop Camera Stream
        """
        self._is_camera_stream_on = False

    def _create_patterned_strip(self, width, height, direction='left', dot_size=3, dot_spacing=10, ):
        """
        Create a patterned strip with black dots on a white background for visual calibration purposes.

        Args:
            width (int): Width of the strip.
            height (int): Height of the strip.
            direction (str, optional): Direction of the dots. Defaults to 'left'.
            dot_size (int, optional): Radius of each dot. Defaults to 3.
            dot_spacing (int, optional): Spacing between dots. Defaults to 10.

        Returns:
            np.ndarray: The generated patterned strip (RGB image).
        """

        strip = np.ones((height, width), dtype=np.uint8) * \
            255  # White background
        width_range = range(
            width-height, width, dot_spacing) if direction == 'left' else range(0, height + 180, dot_spacing)
        # Add black dots
        for y in range(0, height, dot_spacing):
            for x in width_range:
                cv2.circle(strip, (x, y), dot_size, (0, 0, 0), -1)

        strip = np.repeat(np.expand_dims(strip, axis=2), 3, axis=2)

        return strip

    def _convert_frame_to_string(self, frame):
        """
        Convert a video frame to a base64-encoded JPEG string.

        Args:
            frame (np.ndarray): Frame in OpenCV format.

        Returns:
            str: Base64-encoded string of the JPEG image.
        """

        # Convert frame to JPEG format
        _, buffer = cv2.imencode('.jpg', frame)
        # Convert the frame to base64 string
        frame_str = base64.b64encode(buffer).decode('utf-8')

        return frame_str

    def add_to_cameras_system_read_queue(self, frame):
        """
        Add a frame string to the shared read queue for consumption.

        Args:
            frame (str): Base64-encoded JPEG image string.
        """

        self.cameras_system_data.cameras_read_queue.put(frame)

    def add_to_cameras_system_write_queue(self, command):
        """
        Add a command to the shared write queue for consumption.

        Args:
            command (str): type of camera system command to be executed.
        """
        self.cameras_system_data.cameras_write_queue.put(command)

    def _reconnect_cameras(self):
        """
        Attempt to reconnect and restart the camera system in case of failure.
        """

        print('Trying to connect to cameras...')
        time.sleep(5)
        # retry to run the process again
        self.run()
