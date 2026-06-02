"""
This module provides static methods to convert various machine-related
data (status updates, command messages, file operations, etc.) into
structured JSON strings for WebSocket communication between the server and interface.
"""

import datetime
import json
import re
from core.constants import CoreConstants as constants


class WebsocketJsonData:
    """
    A utility class for converting various types of machine control and
    communication data into JSON format suitable for WebSocket transmission.

    This class is stateless and all methods are static.
    """

    @staticmethod
    def parse_grbl_status_to_json(machine_status):
        """
        Parses a raw GRBL status string into structured JSON.

        Args:
            machine_status (str): A raw GRBL status string (e.g., "<Idle|MPos:...|...>").

        Returns:
            str: A JSON-formatted string with machine state, position, buffers, overrides, and more.
        """

        # Define regular expressions to extract values
        state_pattern = re.compile(r'<(\w+)|')
        machine_position_pattern = re.compile(
            r'MPos:([-\d.]+),([-\d.]+),([-\d.]+)')
        work_coordinate_offset_pattern = re.compile(
            r'WCO:([-\d.]+),([-\d.]+),([-\d.]+)')
        buffer_pattern = re.compile(r'Bf:(\d+),(\d+)')
        feed_speed_pattern = re.compile(r'FS:(\d+),(\d+)')
        override_pattern = re.compile(r'Ov:(\d+),(\d+),(\d+)')
        machine_tool_pattern = re.compile(r'T:(\d+)')

        # Extract values using regular expressions
        state_match = state_pattern.search(machine_status)
        machine_position_match = machine_position_pattern.search(
            machine_status)
        work_coordinate_offset_match = work_coordinate_offset_pattern.search(
            machine_status)
        buffer_match = buffer_pattern.search(machine_status)
        feed_speed_match = feed_speed_pattern.search(machine_status)
        override_match = override_pattern.search(machine_status)
        machine_tool_match = machine_tool_pattern.search(machine_status)

        # Create a dictionary with extracted values
        status_dict = {
            "type": constants.MACHINE_STATUS_DATA_TYPE,
            "state": state_match.group(1) if state_match else None,
            "machine_position": {
                "x": float(machine_position_match.group(1)) if machine_position_match else None,
                "y": float(machine_position_match.group(2)) if machine_position_match else None,
                "z": float(machine_position_match.group(3)) if machine_position_match else None,
            },
            "work_coordinate_offset": {
                "x": float(work_coordinate_offset_match.group(1)) if work_coordinate_offset_match else None,
                "y": float(work_coordinate_offset_match.group(2)) if work_coordinate_offset_match else None,
                "z": float(work_coordinate_offset_match.group(3)) if work_coordinate_offset_match else None,
            },
            "buffer_state": {
                "commands_queued": float(buffer_match.group(1)) if buffer_match else None,
                "buffer_length": float(buffer_match.group(2)) if buffer_match else None,
            },
            "feed_and_speed": {
                "feed_rate": float(feed_speed_match.group(1)) if feed_speed_match else None,
                "speed": float(feed_speed_match.group(2)) if feed_speed_match else None,
            },
            "overrides": {
                "feed": float(override_match.group(1)) if override_match else None,
                "rapids": float(override_match.group(2)) if override_match else None,
                "spindle": float(override_match.group(3)) if override_match else None,
            },
            "machine_tool": float(machine_tool_match.group(1)) if machine_tool_match else None
        }

        return json.dumps(status_dict, indent=2)

    @staticmethod
    def parse_serial_command_to_json(command):
        """
        Wraps a raw serial command string into a JSON object (to show executed GRBL commands on interface's console).

        Args:
            command (str): The serial command to be sent to the machine.

        Returns:
            str: A JSON-formatted string with the command and timestamp.
        """

        dict = {"type": constants.SERIAL_COMMAND_DATA_TYPE,
                "text": command,
                "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

        return json.dumps(dict, indent=2)

    @staticmethod
    def parse_job_execution_command_to_json(command, line_index, total_lines, file_timer):
        """
        Converts job execution command data into JSON (progress of executing a job).

        Args:
            command (str): The G-code line or job command.
            line_index (int): Current line index in execution.
            total_lines (int): Total number of lines in the job.
            file_timer (float): Elapsed execution time.

        Returns:
            str: A JSON string representing job progress.
        """

        dict = {"type": constants.JOB_EXECUTION_DATA_TYPE,
                "text": command,
                "line_index": line_index,
                "total_lines": total_lines,
                "file_timer": file_timer,
                "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

        return json.dumps(dict, indent=2)

    @staticmethod
    def parse_file_manager_message_to_json(opened_filename, file_content, files_list):
        """
        Converts file manager state into JSON to distribute it to all connected clients.

        Args:
            opened_filename (str): Currently opened file name.
            file_content (str): Contents of the opened file.
            files_list (List[str]): List of available files.

        Returns:
            str: A JSON-formatted string with file manager data.
        """

        dict = {"type": constants.JOBS_MANAGER_DATA_TYPE,
                "opened_file": opened_filename,
                "file_content": file_content,
                "files_list": files_list,
                "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

        return json.dumps(dict, indent=2)

    @staticmethod
    def parse_connection_status_to_json(success):
        """
        Reports connection with machine status to the client.

        Args:
            success (bool): Whether the machine connection was successful.

        Returns:
            str: A JSON string indicating the connection status.
        """

        dict = {"type": constants.MACHINE_CONNECTION_DATA_TYPE,
                "success": success,
                "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

        return json.dumps(dict, indent=2)

    @staticmethod
    def parse_cameras_frame_to_json(frameStr):
        """
        Packages a camera frame string for WebSocket transmission.

        Args:
            frameStr (str): Base64-encoded image/frame string.

        Returns:
            str: A JSON string with frame data.
        """

        dict = {"type": constants.CAMERAS_SYSTEM_STREAM_DATA_TYPE,
                "frame": frameStr,
                "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

        return json.dumps(dict, indent=2)

    @staticmethod
    def parse_usb_storage_monitor_data_to_json(device_name, job_files_data, media_files_data, is_connected):
        """
        Packages USB storage information into a JSON structure.

        Args:
            device_name (str): Name of the connected USB device.
            job_files_data (List[dict]): Metadata about job files (gcode files) on the usb device.
            media_files_data (List[dict]): Metadata about media files (images - 3D models) on the device.
            is_connected (bool): True if USB device is connected.

        Returns:
            str: A JSON string with USB monitoring data.
        """

        dict = {"type": constants.USB_STORAGE_MONITOR_DATA_TYPE,
                "device_name": device_name,
                "job_files_data": job_files_data,
                "media_files_data": media_files_data,
                "is_connected": is_connected,
                "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        return json.dumps(dict, indent=2)

    @staticmethod
    def parse_slicing_progress_to_json(layer_index, total_layers):
        """
        Reports the progress of a slicing operation.

        Args:
            layer_index (int): Current sliced layer index.
            total_layers (int): Total number of layers to slice.

        Returns:
            str: A JSON string with slicing progress.
        """

        dict = {"type": constants.SLICE_DATA_TYPE,
                "layer_index": layer_index,
                "total_layers": total_layers,
                "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

        return json.dumps(dict, indent=2)
