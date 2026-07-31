"""
This module handles 3D model slicing, slicing profile management, and communication
with FastAPI and WebSocket queues in a multiprocessing-safe manner.

It manages slicing operations using external slicers (like Slic3r, PrusaSlicer, or PySLM),
executes slicing in a separate process, and provides CRUD operations for slicing profiles
stored in a SQLite database.

Classes:
    SliceHelper: Main helper class to manage slicing workflows.
Functions:
    start_slicing_process: Worker function executed in a separate process to perform slicing.
"""

import json
import multiprocessing
import math
import re
import traceback
from utils.tmp_files_manager import TempFilesManager
from utils.threeD_slice import ThreeDSlice
from core.constants import CoreConstants as constants


def start_slicing_process(threeD_slice,
                          model_tmp_file,
                          slice_result_tmp_file,
                          slice_data,
                          fastAPI_queue,
                          websocket_queue):
    """
    Worker function that slices the 3D model in a separate process.

    Args:
        threeD_slice (ThreeDSlice): Instance of the slicing interface.
        model_tmp_file (str): Path to the temporary 3D model file.
        slice_result_tmp_file (str): Path to save the resulting G-code.
        slice_data (obj): Configuration data for slicing.
        fastAPI_queue (PriorityQueueWithCounter): Queue to send responses to FastAPI.
        websocket_queue (PriorityQueueWithCounter): Queue to send updates via WebSocket.
    """
    try:
        # slice the model sent
        threeD_slice.slice_models(
            model_tmp_file, slice_result_tmp_file, slice_data, websocket_queue)
        slicing_settings = getattr(slice_data, 'slicingSettings', None)
        acceleration_settings = None
        if slicing_settings is not None:
            slicing_lib = getattr(slicing_settings, 'slicingLib', None)
            if slicing_lib == constants.SLICING_LIBRARIES['PRUSA_SLICER']:
                active_settings = getattr(
                    slicing_settings, 'prusaSettings', None)
                acceleration_settings = getattr(
                    active_settings, 'engravingAcceleration', None)
            elif slicing_lib == constants.SLICING_LIBRARIES['PYSLM']:
                active_settings = getattr(
                    slicing_settings, 'pyslmSettings', None)
                acceleration_settings = getattr(
                    active_settings, 'engravingAcceleration', None)
        estimated_print_time_seconds = SliceHelper.estimate_gcode_print_time(
            slice_result_tmp_file, acceleration_settings)

        result = SliceHelper._fastapi_3d_slice_response(
            type=constants.SLICE_DATA_TYPE,
            process=constants.SLICE_PROCESS,
            result='',
            files_list=[],
            slicing_profiles=[],
            success=True,
            estimated_print_time_seconds=estimated_print_time_seconds
        )

    except Exception as e:
        error_details = traceback.format_exc()
        print("Error:", e)
        print(error_details)
        result = SliceHelper._fastapi_3d_slice_response(
            type=constants.SLICE_DATA_TYPE,
            process=constants.SLICE_PROCESS,
            result=error_details,
            files_list=[],
            slicing_profiles=[],
            success=False)

    finally:
        # check if result is empty dict
        if result:
            fastAPI_queue.put(result)


class SliceHelper:
    """
    Helper class that handles slicing operations and profile management.

    Attributes:
        cursor (sqlite3.Cursor): Database cursor used for DB operations.
        _threeD_slice (ThreeDSlice): Interface for performing slicing.
        _model_tmp_file_path (str): Path to temporary STL file.
        _slice_result_tmp_file_path (str): Path to temporary G-code result.
        _jobs_manager (JobsManager): Manager for handling job output files.
    """

    def __init__(self, jobs_manager):
        self.cursor = None

        self._jobs_manager = jobs_manager
        self._threeD_slice = ThreeDSlice()

        # create helpers tmp files
        tmp_files_manager = TempFilesManager()
        self._model_tmp_file_path = tmp_files_manager.create_temp_file(
            suffix='.stl')
        self._slice_result_tmp_file_path = tmp_files_manager.create_temp_file(
            suffix='.gcode')

        # running slicing process on separate process
        self._slicing_models_process = None

    def set_database_cursor(self, db_cursor):
        """
        Set the SQLite cursor for database operations.

        Args:
            db_cursor (sqlite3.Cursor): Active database cursor.
        """

        self.cursor = db_cursor

    def create_slicing_profiles_table(self):
        """Creates the SLICING_PROFILES table if it doesn't exist."""

        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS SLICING_PROFILES (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slicingLib TEXT NOT NULL,
            slic3rSettings TEXT,
            prusaSettings TEXT,
            pyslmSettings TEXT
        )
        """)

    def handle_add_new_slicing_profile(self, data):
        """
        Add a new slicing profile to the database.

        Args:
            data (obj): Object with slicing profile information.

        Returns:
            dict: Response suitable for FastAPI.
        """

        profile_name = data.profileName.strip()
        slicing_lib = data.slicingLib
        print(profile_name)

        self.cursor.execute("""
            INSERT INTO SLICING_PROFILES (
                name, slicingLib, slic3rSettings, prusaSettings, pyslmSettings
            ) VALUES (?, ?, ?, ?, ?)
        """, (
            profile_name,
            slicing_lib,
            json.dumps(data.slic3rSettings.dict()),
            json.dumps(data.prusaSettings.dict()),
            json.dumps(data.pyslmSettings.dict())
        ))

        self.cursor.connection.commit()

        response = self._fastapi_3d_slice_response(
            type=constants.SLICE_DATA_TYPE,
            process=constants.ADD_SLICING_PROFILE_PROCESS,
            result='',
            files_list=[],
            slicing_profiles=self._list_slicing_profiles(),
            success=True
        )

        return response

    def handle_list_slicing_profiles(self):
        """
        List all slicing profiles from the database.

        Returns:
            dict: Response suitable for FastAPI.
        """

        response = self._fastapi_3d_slice_response(
            type=constants.SLICE_DATA_TYPE,
            process=constants.LIST_SLICING_PROFILES,
            result='',
            files_list=[],
            slicing_profiles=self._list_slicing_profiles(),
            success=True
        )

        return response

    def handle_update_slicing_profile(self, data):
        """
        Update an existing slicing profile.

        Args:
            data (obj): Updated slicing profile data.

        Returns:
            dict: Response suitable for FastAPI.
        """

        profile_name = data.profileName.strip()
        slicing_lib = data.slicingLib

        self.cursor.execute("""
            UPDATE SLICING_PROFILES
            SET slicingLib = ?,
                slic3rSettings = ?,
                prusaSettings = ?,
                pyslmSettings = ?
            WHERE name = ?
        """, (
            slicing_lib,
            json.dumps(data.slic3rSettings.dict()),
            json.dumps(data.prusaSettings.dict()),
            json.dumps(data.pyslmSettings.dict()),
            profile_name
        ))

        self.cursor.connection.commit()

        response = self._fastapi_3d_slice_response(
            type=constants.SLICE_DATA_TYPE,
            process=constants.UPDATE_SLICING_PROFILE_PROCESS,
            result='',
            files_list=[],
            slicing_profiles=self._list_slicing_profiles(),
            success=True
        )

        return response

    def handle_delete_slicing_profile(self, profile_id):
        """
        Delete a slicing profile by its ID.

        Args:
            profile_id (int): ID of the profile to delete.

        Returns:
            dict: Response suitable for FastAPI.
        """

        self.cursor.execute("""
        DELETE FROM SLICING_PROFILES WHERE id = ?
        """, (profile_id,))
        self.cursor.connection.commit()

        response = self._fastapi_3d_slice_response(
            type=constants.SLICE_DATA_TYPE,
            process=constants.DELETE_AI_SETTING_PROCESS,
            result='',
            files_list=[],
            slicing_profiles=self._list_slicing_profiles(),
            success=True
        )

        return response

    def handle_slice_models(self, slice_data, fastAPI_write_queue, websocket_write_queue):
        """
        Start slicing process in a separate subprocess.

        Args:
            slice_data (obj): Slicing settings and model data.
            fastAPI_write_queue (PriorityQueueWithCounter): Queue for FastAPI.
            websocket_write_queue (PriorityQueueWithCounter): Queue for WebSocket.
        """

        if (
            self._slicing_models_process is not None
            and self._slicing_models_process.is_alive()
        ):
            response = self.handle_error_requests(
                constants.SLICE_PROCESS,
                "A slicing process is already running. Wait for it to finish "
                "or cancel it before slicing again.")
            fastAPI_write_queue.put(response)
            return

        if self._slicing_models_process is not None:
            self._slicing_models_process.join()

        # Start the generate_images function in a separate process
        self._slicing_models_process = multiprocessing.Process(
            target=start_slicing_process, args=(self._threeD_slice,
                                                self._model_tmp_file_path,
                                                self._slice_result_tmp_file_path,
                                                slice_data,
                                                fastAPI_write_queue,
                                                websocket_write_queue))

        self._slicing_models_process.start()

    def handle_cancel_slice_models(self):
        """
        Cancel the running slicing process.

        Returns:
            dict: Response suitable for FastAPI.
        """

        # Signal the cancel event and terminate the process if it's running
        if self._slicing_models_process is not None:
            self._slicing_models_process.terminate()
            self._slicing_models_process.join()
            self._slicing_models_process = None

        response = self._fastapi_3d_slice_response(
            type=constants.SLICE_DATA_TYPE,
            process=constants.CANCEL_SLICE_PROCESS,
            result='',
            files_list=[],
            slicing_profiles=[],
            success=True
        )

        return response

    def handle_save_slicing_result_locally(self, filename):
        """
        Save the slicing result (G-code) to a local system.

        Args:
            filename (str): Target filename to store the result.

        Returns:
            dict: Response with updated file list.
        """

        file_content = open(self._slice_result_tmp_file_path,
                            mode='r').read().encode('utf-8')

        # save to jobs folder
        self._jobs_manager.write_gcode_file(filename, file_content)
        response = self._fastapi_3d_slice_response(
            type=constants.SLICE_DATA_TYPE,
            process=constants.SAVE_SLICE_PROCESS,
            result='',
            files_list=self._jobs_manager.get_files_list(),
            slicing_profiles=[],
            success=True,
        )

        return response

    def handle_preview_slicing_result(self):
        """
        Preview the G-code result of the slicing process.

        Returns:
            dict: Response containing the raw G-code string.
        """

        file_content = open(self._slice_result_tmp_file_path,
                            mode='r').read()
        estimated_print_time_seconds = self.estimate_gcode_print_time(
            self._slice_result_tmp_file_path)

        response = self._fastapi_3d_slice_response(
            type=constants.SLICE_DATA_TYPE,
            process=constants.PREVIEW_SLICE_PROCESS,
            result=file_content,
            files_list=[],
            slicing_profiles=[],
            success=True,
            estimated_print_time_seconds=estimated_print_time_seconds
        )

        return response

    def handle_error_requests(self, process, error=None):
        """
        Generic error response handler.

        Args:
            process (str): Process name that failed.
            error (Exception | str | None): Optional error details.

        Returns:
            dict: Standard error response.
        """

        return self._fastapi_3d_slice_response(
            type=constants.SLICE_DATA_TYPE,
            process=process,
            result='' if error is None else str(error),
            files_list=[],
            slicing_profiles=[],
            success=False,
        )

    def _list_slicing_profiles(self):
        """
        Internal method to fetch all slicing profiles.

        Returns:
            list: List of dicts representing slicing profiles.
        """

        self.cursor.execute("""
            SELECT id, name, slicingLib, slic3rSettings, prusaSettings, pyslmSettings
            FROM SLICING_PROFILES
        """)
        profiles = self.cursor.fetchall()

        result = []
        for profile in profiles:
            result.append({
                'profileId': profile[0],
                'profileName': profile[1],
                'slicingLib': profile[2],
                'slic3rSettings': json.loads(profile[3]),
                'prusaSettings': json.loads(profile[4]),
                'pyslmSettings': json.loads(profile[5])
            })

        return result

    @staticmethod
    def estimate_gcode_print_time(gcode_file_path, acceleration_mm_s2=None):
        """
        Estimate print duration from generated G-code motion commands.

        The estimate sums motion distances using modal feedrates in mm/min.
        It handles compact commands such as G1X10Y10S55F2000 and modal contour
        continuations where F is only present on the first powered move. For
        metal-printer routines it also tracks G92 work offsets plus G53
        machine-coordinate A/B/Z/XY moves, so recoater B-axis travel is counted
        from the generated G-code itself.
        """

        command_re = re.compile(
            r'^\s*(G0?0|G0?1|G53|G90|G91|G92)(?=\s|[XYZABFEPS]|$)',
            re.IGNORECASE)
        value_re = re.compile(
            r'([XYZABF])\s*(-?\d+(?:\.\d+)?)', re.IGNORECASE)
        dwell_re = re.compile(
            r'^\s*G0?4(?=\s|[PS]|$)', re.IGNORECASE)
        dwell_value_re = re.compile(r'([PS])\s*(-?\d+(?:\.\d+)?)', re.IGNORECASE)
        axes = ('X', 'Y', 'Z', 'A', 'B')
        machine_position = {axis: 0.0 for axis in axes}
        work_offset = {axis: 0.0 for axis in axes}
        feedrate = 0.0
        acceleration = 0.0
        if acceleration_mm_s2 is not None:
            parsed_acceleration = float(acceleration_mm_s2)
            if parsed_acceleration > 0:
                acceleration = parsed_acceleration
        absolute_positioning = True
        total_seconds = 0.0

        estimate_acceleration_re = re.compile(
            r';\s*ESTIMATE\s+ACCELERATION:\s*(-?\d+(?:\.\d+)?)',
            re.IGNORECASE)

        def work_position():
            return {
                axis: machine_position[axis] - work_offset[axis]
                for axis in axes
            }

        def motion_seconds(distance, feedrate_mm_min):
            if distance <= 0 or feedrate_mm_min <= 0:
                return 0.0
            velocity = feedrate_mm_min / 60.0
            if acceleration <= 0 or velocity <= 0:
                return (distance / feedrate_mm_min) * 60.0

            accel_distance = (velocity * velocity) / (2.0 * acceleration)
            if distance >= 2.0 * accel_distance:
                return (
                    2.0 * velocity / acceleration
                    + (distance - 2.0 * accel_distance) / velocity
                )
            return 2.0 * math.sqrt(distance / acceleration)

        with open(gcode_file_path, mode='r', errors='ignore') as gcode_file:
            for raw_line in gcode_file:
                acceleration_match = estimate_acceleration_re.search(raw_line)
                if acceleration_match:
                    parsed_acceleration = float(acceleration_match.group(1))
                    if parsed_acceleration > 0:
                        acceleration = parsed_acceleration

                line = raw_line.split(';', 1)[0].strip()
                if not line:
                    continue

                command_match = command_re.match(line)
                if command_match:
                    command = command_match.group(1).upper()
                    values = {
                        axis.upper(): float(value)
                        for axis, value in value_re.findall(line)
                    }
                    if 'F' in values:
                        feedrate = values['F']

                    if command == 'G90':
                        absolute_positioning = True
                        continue
                    if command == 'G91':
                        absolute_positioning = False
                        continue
                    if command == 'G92':
                        for axis in axes:
                            if axis in values:
                                work_offset[axis] = (
                                    machine_position[axis] - values[axis])
                        continue
                    if command not in {'G0', 'G00', 'G1', 'G01', 'G53'}:
                        continue

                    target = machine_position.copy()
                    if command == 'G53':
                        for axis in axes:
                            if axis in values:
                                target[axis] = values[axis]
                    else:
                        current_work_position = work_position()
                        for axis in axes:
                            if axis in values:
                                work_value = (
                                    values[axis]
                                    if absolute_positioning
                                    else current_work_position[axis] + values[axis]
                                )
                                target[axis] = work_value + work_offset[axis]

                    distance = math.sqrt(
                        sum((target[axis] - machine_position[axis]) ** 2
                            for axis in axes))
                    total_seconds += motion_seconds(distance, feedrate)
                    machine_position = target
                    continue

                if dwell_re.match(line):
                    dwell_values = {
                        axis.upper(): float(value)
                        for axis, value in dwell_value_re.findall(line)
                    }
                    if 'S' in dwell_values:
                        total_seconds += max(0.0, dwell_values['S'])
                    elif 'P' in dwell_values:
                        # GRBL defines G4 P in seconds.
                        total_seconds += max(0.0, dwell_values['P'])

        return round(total_seconds)

    @staticmethod
    def _fastapi_3d_slice_response(type, process, result, files_list,
                                   slicing_profiles, success,
                                   estimated_print_time_seconds=None):
        """
        Internal helper to standardize FastAPI responses.

        Args:
            type (str): Data type (SLICE_DATA_TYPE).
            process (str): Process name.
            result (str): Result data.
            files_list (list): System jobs files.
            slicing_profiles (list): Slicing profiles list.
            success (bool): Whether the operation succeeded.

        Returns:
            dict: Standardized response object.
        """

        return {
            'type': type,
            'data': {
                'process': process,
                'result': result,
                'filesListData': files_list,
                'slicingProfiles': slicing_profiles,
                'success': success,
                'estimatedPrintTimeSeconds': estimated_print_time_seconds,
            }
        }
