import json
import threading
import time
from files_manager.jobs_manager import JobsManager
from machine_connection.machine_connector import MachineConnector
from fastapi_server.main import FastApiServer
from camera_stream.cameras_system import CamerasSystem
from files_manager.media_manager import MediaManager
from utils.threeD_slice_helper import SliceHelper
from utils.media_manager_helper import MediaManagerHelper
from utils.usb_storage_monitor import USBStorageMonitor
from utils.ai_helper import AIHelper
from utils.materials_library_helper import MaterialsLibraryHelper
from utils.database_connection import DataBaseConnections
from utils.job_manager_helper import JobsManagerHelper
from utils.configuration_loader import ConfigurationLoader
# from utils.joystick_handler import JoystickHandler
from utils.job_execution_timer import JobExecutionTimer
from utils.tmp_files_manager import TempFilesManager
from utils.websocket_json_data import WebsocketJsonData
from utils.shared_data import SharedCamerasSystemData, SharedFastApiData, SharedMachineData, SharedWebsocketData
from websocket_connection.websocket_connector import WebSocketConnector
from .constants import CoreConstants as constants
from dotenv import load_dotenv

load_dotenv()


class ServerCore:
    """
    Manages and orchestrates all core services of the machine server.

    This class initializes and coordinates components such as machine communication,
    WebSocket and REST APIs, media and job management, AI generation, slicing, and more.

    Attributes:
        _config (ConfigurationLoader): Loaded configuration for the current machine.
        _is_tool_changer_enabled (bool): Flag indicating whether tool changer is enabled.
        _machine_connector_shared_data (SharedMachineData): Shared state between server and machine communication thread.
        _websocket_connector_shared_data (SharedWebsocketData): Shared state for WebSocket communication.
        _fastapi_server_shared_data (SharedFastApiData): Shared state for REST API communication.
        _cameras_system_shared_data (SharedCamerasSystemData): Shared state for camera system.
        _machine_connector (MachineConnector): Manages serial communication with the machine.
        _websocket_connector (WebSocketConnector): Handles WebSocket connections with frontend clients.
        _fastapi_server (FastApiServer): Serves the REST API endpoints via FastAPI.
        _cameras_system (CamerasSystem | None): Initializes the camera system if enabled (laser cutter or CNC only).
        _jobs_manager (JobsManager): Handles all job file operations and G-code streaming logic.
        _media_manager (MediaManager): Handles media file operations (images, 3D models, etc.).
        _tmp_files_manager (TempFilesManager): Creates and manages temporary files (e.g., for slicing or previews).
        _usb_storage_monitor (USBStorageMonitor): Watches for connected USB devices and synchronizes their contents.
        _materials_library_helper (MaterialsLibraryHelper | None): Handles material presets and profiles for laser cutter.
        _ai_helper (AIHelper | None): Provides AI image generation utilities (if enabled in config).
        _media_manager_helper (MediaManagerHelper | None): Interfaces between the media manager and API requests.
        _slicing_helper (SliceHelper | None): Provides slicing utilities for 3D printing jobs.
        database_connection (DataBaseConnections): Centralized access to material, AI, and slice data via persistent storage.
        _jobs_manager_helper (JobsManagerHelper): Bridges job management with material libraries and shared state.
        _job_execution_timer (JobExecutionTimer): Tracks the time taken to execute a job.
        _is_job_execute_process (bool): Flag that indicates whether a job is currently being executed.
    """

    def __init__(self):
        # configuration settings
        self._config = ConfigurationLoader.from_yaml()
        # tool changer status
        self._is_tool_changer_enabled = False

        # shared data with processes
        self._machine_connector_shared_data = SharedMachineData()
        self._websocket_connector_shared_data = SharedWebsocketData()
        self._fastapi_server_shared_data = SharedFastApiData()
        self._cameras_system_shared_data = SharedCamerasSystemData()

        # instance for each process
        self._machine_connector = MachineConnector(
            self._machine_connector_shared_data)
        self._websocket_connector = WebSocketConnector(
            self._websocket_connector_shared_data)
        self._fastapi_server = FastApiServer(self._fastapi_server_shared_data)

        # start camera stream process if the machine is laser cutter or cnc
        if ((self._config.machine_type == constants.MACHINE_TYPES['LASER_CUTTER'] and
             self._config.laser_cutter_settings.cameras_enabled) or
                (self._config.machine_type == constants.MACHINE_TYPES['CNC'] and
                 self._config.cnc_settings.cameras_enabled)):
            self._cameras_system = CamerasSystem(
                self._cameras_system_shared_data)

        # helper instances (utils)
        self._jobs_manager = JobsManager()
        self._media_manager = MediaManager()
        self._tmp_files_manager = TempFilesManager()
        self._usb_storage_monitor = USBStorageMonitor(
            self._jobs_manager, self._media_manager, self._websocket_connector_shared_data.websocket_write_queue)

        # instances to help handling fast api different type of requests
        self._materials_library_helper = None
        self._ai_helper = None
        self._media_manager_helper = None
        self._slicing_helper = None

        # laser cutter uses Material Lib, Database (for material and ai config) and AI instances
        if (self._config.machine_type == constants.MACHINE_TYPES['LASER_CUTTER']):
            self._materials_library_helper = MaterialsLibraryHelper()

            # check if the user want to use ai image generator
            if self._config.ai_configuration.use_ai_image_generator:
                self._ai_helper = AIHelper()

        # 3D printer use 3D Slice instance
        if (self._config.machine_type == constants.MACHINE_TYPES['3D_PRINTER']):
            self._slicing_helper = SliceHelper(
                self._jobs_manager)

        self.database_connection = DataBaseConnections(
            self._materials_library_helper, self._ai_helper, self._slicing_helper)

        # both laser cutter and 3D printer have Media instance
        if (self._config.machine_type == constants.MACHINE_TYPES['LASER_CUTTER'] or
                self._config.machine_type == constants.MACHINE_TYPES['3D_PRINTER']):
            self._media_manager_helper = MediaManagerHelper(
                self._media_manager)

        self._jobs_manager_helper = JobsManagerHelper(
            self._jobs_manager, self._materials_library_helper)

        self._job_execution_timer = JobExecutionTimer()
        self._is_job_execute_process = False

    def start(self):
        """
        Starts all core server services and threads.
        """
        try:
            print("Server is running...")

            # Create a temporary folder to inform the interface that the server finished initializing
            self._tmp_files_manager.create_init_server_tmp_file()

            # Start all services
            self._start_machine_connector()
            self._start_websocket_connector()
            self._start_cameras_system()
            self._start_fastapi_server()
            self._start_job_execution()
            self._start_usb_monitor()

            # Join threads to wait for their completion
            self._join_threads()

        except Exception as e:
            print("Server core error:", e)

        finally:
            # Stop all services
            self._stop_machine_connector()
            self._stop_websocket_connector()
            self._stop_fastapi_server()
            self._stop_cameras_system()

    def _start_machine_connector(self):
        """
        Starts the machine connector process and its associated data handler thread.
        """
        self._machine_connector.start()
        self._machine_data_thread = threading.Thread(
            target=self._run_machine_data_handler)
        self._machine_data_thread.start()

    def _start_websocket_connector(self):
        """
        Starts the WebSocket connector process and its handler thread.
        """
        self._websocket_connector.start()
        self._websocket_thread = threading.Thread(
            target=self._run_websocket_handler)
        self._websocket_thread.start()

    def _start_fastapi_server(self):
        """
        Starts the FastAPI server process and its REST API handler thread.
        """
        self._fastapi_server.start()
        self._rest_api_thread = threading.Thread(
            target=self._run_rest_api_handler)
        self._rest_api_thread.start()

    def _start_cameras_system(self):
        """
        Starts the Cameras Stream process and its handler thread.
        """
        cameras_enabled = (
            (self._config.machine_type == constants.MACHINE_TYPES['LASER_CUTTER'] and
             self._config.laser_cutter_settings.cameras_enabled) or
            (self._config.machine_type == constants.MACHINE_TYPES['CNC'] and
             self._config.cnc_settings.cameras_enabled)
        )
        if cameras_enabled:
            self._cameras_system.start()
            self._cameras_system_thread = threading.Thread(
                target=self._run_cameras_handler)
            self._cameras_system_thread.start()

    def _start_job_execution(self):
        """
        Starts the job execution handler thread.
        """
        self._job_execution_thread = threading.Thread(
            target=self._run_job_execution_handler)
        self._job_execution_thread.start()

    def _start_usb_monitor(self):
        """
        Starts the USB storage monitor process.
        """
        self._usb_storage_monitor.start()

    def _join_threads(self):
        """
        Joins all running threads to wait for their completion.
        """
        self._machine_data_thread.join()
        self._websocket_thread.join()
        self._rest_api_thread.join()
        self._cameras_system_thread.join()
        self._job_execution_thread.join()

    def _stop_machine_connector(self):
        """
        Terminates and joins the machine connector process.
        """
        self._machine_connector.terminate()
        self._machine_connector.join()

    def _stop_websocket_connector(self):
        """
        Terminates and joins the WebSocket connector process.
        """
        self._websocket_connector.terminate()
        self._websocket_connector.join()

    def _stop_fastapi_server(self):
        """
        Terminates and joins the FastAPI server process.
        """
        self._fastapi_server.terminate()
        self._fastapi_server.join()

    def _stop_cameras_system(self):
        """
        Terminates and joins the camera system process if cameras are enabled.
        """
        cameras_enabled = (
            (self._config.machine_type == constants.MACHINE_TYPES['LASER_CUTTER'] and
             self._config.laser_cutter_settings.cameras_enabled) or
            (self._config.machine_type == constants.MACHINE_TYPES['CNC'] and
             self._config.cnc_settings.cameras_enabled)
        )
        if cameras_enabled:
            self._cameras_system.terminate()
            self._cameras_system.join()

    def _run_websocket_handler(self):
        """
        Continuously handles incoming WebSocket messages in a separate thread.
        """
        while self._websocket_connector.is_alive():
            self._handle_incoming_websocket_messages()
            # delay if it is not job execution process
            if not self._is_job_execute_process:
                time.sleep(constants.TIMEOUT)

    def _run_machine_data_handler(self):
        """
        Continuously handles incoming machine serial data in a separate thread.
        """

        # check if the tool changer is enabled from the configuration settings
        self._check_if_tool_changer_enabled()
        # disable the pico from fetching the status during the tool change
        # because the server will ask for it (prevent overflowing the buffer)
        if self._is_tool_changer_enabled:
            self._handle_tool_change_status(enabled=False)

        while self._machine_connector.is_alive():
            self._handle_incoming_machine_data()
            # delay if it is not job execution process
            if not self._is_job_execute_process:
                time.sleep(constants.TIMEOUT)

    def _run_job_execution_handler(self):
        """
        Monitors and executes jobs by sending one G-code command at a time in a thread.
        """

        while self._machine_connector.is_alive() and self._websocket_connector.is_alive():
            self._handle_job_execution()
            # delay if it is not job execution process
            if not self._is_job_execute_process:
                time.sleep(constants.TIMEOUT)

    def _run_cameras_handler(self):
        """
        Continuously processes camera frames and sends them via WebSocket.
        """

        while self._cameras_system.is_alive():
            self._handle_cameras_system()
            time.sleep(constants.TIMEOUT)

    def _run_rest_api_handler(self):
        """
        Continuously handles incoming FastAPI requests in a thread.
        """

        while self._fastapi_server.is_alive():
            self._handle_rest_api_calls()
            time.sleep(constants.TIMEOUT)

    def _check_if_tool_changer_enabled(self):
        """
        Checks the configuration to determine if the tool changer is enabled.
        """
        self._is_tool_changer_enabled = ((self._config.machine_type == constants.MACHINE_TYPES['LASER_CUTTER'] and
                                          self._config.laser_cutter_settings.tool_changer) or
                                         (self._config.machine_type == constants.MACHINE_TYPES['CNC'] and
                                          self._config.cnc_settings.tool_changer))

    def _handle_tool_change_status(self, enabled):
        """
        Enables or disables the Pico controller from fetching machine status.

        Args:
            enabled (bool): True to enable status fetching, False to disable.
        """

        if enabled:
            self._machine_connector.add_to_serial_write_queue(constants.REAL_TIME_COMMANDS,
                                                              constants.HIGH_PRIORITY_COMMAND,
                                                              constants.PICO_ENABLE_STATUS)
        else:
            self._machine_connector.add_to_serial_write_queue(constants.REAL_TIME_COMMANDS,
                                                              constants.HIGH_PRIORITY_COMMAND,
                                                              constants.PICO_DISABLE_STATUS)

    def _handle_incoming_websocket_messages(self):
        """
        Retrieves and processes user interface messages from the WebSocket read queue.
        """

        # add data coming from user interface to serial write queue
        if not self._websocket_connector_shared_data.websocket_read_queue.empty():
            type, data = self._websocket_connector_shared_data.websocket_read_queue.get()

            # handle different type of data sent from user
            self._analyze_websocket_messages(type, data)

    def _analyze_websocket_messages(self, type, data):
        """
        Analyzes and routes incoming WebSocket messages to appropriate handlers.

        Args:
            type (str): The type of message.
            data (dict): The payload received.
        """

        # handle data send to serial
        command = data.get("command")
        if constants.REAL_TIME_COMMAND_DATA_TYPE == type:
            self._handle_real_time_commands(command)
        elif constants.NORMAL_COMMAND_DATA_TYPE == type:
            self._handle_normal_commands(command)
        elif constants.SERIAL_COMMAND_DATA_TYPE == type:
            self._handle_serial_commands(type, command)
        elif constants.CAMERAS_SYSTEM_STREAM_DATA_TYPE == type:
            self._handle_cameras_stream_commands(command)

    def _handle_real_time_commands(self, command):
        """
        Processes real-time machine commands such as stop, pause, and resume.

        Args:
            command (str): The real-time GRBL command string.
        """

        # received stop command from user
        if command == constants.GRBL_COMMAND_STOP:
            self._machine_connector.stop_machine()
            self._reset_the_core_system()
            self._job_execution_timer.stop()

        # received pause command from user
        elif command == constants.GRBL_COMMAND_PAUSE:
            self._machine_connector.pause_machine()
            self._job_execution_timer.pause()

        # received resume command from user
        elif command == constants.GRBL_COMMAND_RESUME:
            self._machine_connector.resume_machine()
            self._job_execution_timer.resume()

        else:
            self._machine_connector.add_to_serial_write_queue(constants.REAL_TIME_COMMANDS,
                                                              constants.HIGH_PRIORITY_COMMAND,
                                                              command)

        # convert response to json data
        res = WebsocketJsonData.parse_serial_command_to_json(command)
        self._send_to_interface_via_websocket(constants.SERIAL_COMMAND_DATA_TYPE,
                                              constants.HIGH_PRIORITY_COMMAND,
                                              res)

    def _handle_normal_commands(self, command):
        """
        Processes normal GRBL commands like homing, reset zero, unlock, etc.

        Args:
            command (str): The GRBL command string.
        """

        # received a homing command
        if command == constants.GRBL_COMMAND_HOMING:
            self._machine_connector.homing_machine()
            self._reset_the_core_system()

        # received a rest zero command
        elif command == constants.GRBL_COMMAND_RESET_ZERO:
            self._machine_connector.reset_zero()

        # received an unlock command
        elif command == constants.GRBL_COMMAND_UNLOCK:
            self._machine_connector.unlock_machine()
            self._reset_the_core_system()

        # received a soft reset command
        elif command == constants.GRBL_COMMAND_SOFT_RESET:
            self._machine_connector.stop_machine()
            self._reset_the_core_system()

        # rest of commands (jogging)
        else:
            self._machine_connector.add_to_serial_write_queue(
                constants.NORMAL_COMMAND_DATA_TYPE, constants.MIDDLE_PRIORITY_COMMAND, command)

        # convert response to json data
        res = WebsocketJsonData.parse_serial_command_to_json(command)
        self._send_to_interface_via_websocket(constants.NORMAL_COMMAND_DATA_TYPE,
                                              constants.MIDDLE_PRIORITY_COMMAND,
                                              res)

    def _handle_serial_commands(self, type, command):
        """
        Processes commands that should be sent directly to the serial port.

        Args:
            type (str): Data type for categorization.
            command (str): The GRBL command string.
        """

        if command == constants.REAL_TIME_COMMANDS:
            self._handle_real_time_commands(command)
        # rest of commands
        # add them to serial write and websocket queues
        else:
            self._send_to_machine_serial(type,
                                         constants.MIDDLE_PRIORITY_COMMAND,
                                         command)
            # convert to json data
            res = WebsocketJsonData.parse_serial_command_to_json(command)
            self._send_to_interface_via_websocket(constants.SERIAL_COMMAND_DATA_TYPE,
                                                  constants.MIDDLE_PRIORITY_COMMAND,
                                                  res)

    def _handle_cameras_stream_commands(self, command):
        """
        Processes commands that should be sent directly to the camera stream process.

        Args:
            type (str): Data type for categorization.
            command (str): the type of command the system should take an action for.
        """
        self._cameras_system.add_to_cameras_system_write_queue(command)

    def _handle_rest_api_calls(self):
        """
        Retrieves and processes incoming requests from the FastAPI read queue.
        """

        if not self._fastapi_server_shared_data.fastapi_read_queue.empty():
            type, data = self._fastapi_server_shared_data.fastapi_read_queue.get()
            self._analyze_fastapi_requests(type, data)

    def _analyze_fastapi_requests(self, type, data):
        """
        Routes FastAPI requests to the appropriate manager helper.

        Args:
            type (str): Type of the FastAPI request.
            data (dict): Request payload.
        """

        if self._jobs_manager_helper and type == constants.JOBS_MANAGER_DATA_TYPE:
            self._handle_jobs_management_requests(data)
        if self._media_manager_helper and type == constants.MEDIA_MANAGER_DATA_TYPE:
            self._handle_media_management_requests(data)
        elif self._ai_helper and type == constants.AI_DATA_TYPE:
            self._handle_ai_requests(data)
        elif self._materials_library_helper and type == constants.MATERIALS_LIBRARY_DATA_TYPE:
            self._handle_materials_library_requests(data)
        elif self._slicing_helper and type == constants.SLICE_DATA_TYPE:
            self._handle_slice_requests(data)

    def _handle_jobs_management_requests(self, data):
        """
        Handles FastAPI requests related to job file operations like upload, open, delete, etc.

        Args:
            data (dict): The job-related payload.
        """

        try:
            process = data.get("process")
            # Flag to check if the data need to be distributed to all the client connected to the server
            is_distributed_info = False
            # handle uploading file
            if constants.UPLOAD_JOB_PROCESS == process:
                filename = data.get("filename")
                file_content = data.get("file_content")
                is_distributed_info = True

                response = self._jobs_manager_helper.handle_upload_file(
                    filename, file_content)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # handle open file
            elif constants.OPEN_JOB_PROCESS == process:
                filename = data.get("filename")
                is_distributed_info = True

                response = self._jobs_manager_helper.handle_open_file(filename)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # handle start file
            elif constants.START_JOB_PROCESS == process:
                response = self._jobs_manager_helper.handle_start_file(
                    self._machine_connector, self._job_execution_timer)
                # change the flags to true while executing a file
                self._set_job_execution_flags()
                is_distributed_info = True

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # handle rename file
            elif constants.RENAME_JOB_PROCESS == process:
                old_filename = data.get("old_filename")
                new_filename = data.get("new_filename")
                is_distributed_info = True

                response = self._jobs_manager_helper.handle_rename_file(
                    old_filename, new_filename)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # handle deleting file
            elif constants.DELETE_JOB_PROCESS == process:
                filename = data.get("filename")
                is_distributed_info = True

                response = self._jobs_manager_helper.handle_delete_file(
                    filename)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # handle downloading file
            elif constants.DOWNLOAD_JOB_PROCESS == process:
                filename = data.get("filename")
                file_path = self._jobs_manager_helper.handle_download_file(
                    filename)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    file_path)

            # handle generating files only for laser cutters
            elif (constants.GENERATE_JOB_PROCESS == process and
                  self._config.machine_type == constants.MACHINE_TYPES['LASER_CUTTER']):

                gcode_file_data = data.get("gcode_file_data")
                is_distributed_info = True

                self._jobs_manager_helper.handle_generate_gcode_file(
                    gcode_file_data, self._fastapi_server_shared_data.fastapi_write_queue)

            elif (process == constants.CANCEL_GENERATE_JOB_PROCESS and
                  self._config.machine_type == constants.MACHINE_TYPES['LASER_CUTTER']):
                response = self._jobs_manager_helper.handle_cancel_generate_file()
                # This response message will be fetch by the generate service to send an empty file response
                # whereas the cancel response will be empty body response
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # handle check opened file
            elif constants.CHECK_JOB_PROCESS == process:
                is_distributed_info = True

                response = self._jobs_manager_helper.handle_check_opened_file()
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

             # handle copy job file from usb to jobs manager storage
            elif constants.UPLOAD_USB_JOB_FILE_PROCESS == process:
                file_path = data.get("file_path")
                is_distributed_info = True

                response = self._jobs_manager_helper.handle_copy_file_to_system(
                    file_path)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # unknown request
            else:
                raise Exception('Unknown type of request')

        # incase of any error in the system
        except Exception as error:
            print("FastAPI Jobs Manager Response Error: ", error)
            process = data.get("process")
            response = self._jobs_manager_helper.handle_error_requests(
                process)
            self._fastapi_server_shared_data.fastapi_write_queue.put(response)

        finally:
            if is_distributed_info:
                # update the status of the file manager to all connected clients
                self._distribute_job_manager_message_to_all_clients()

    def _handle_job_execution(self):
        """
        Executes one line of G-code at a time when job execution is active.
        """

        '''
        incase the user is starting a file, execute a single line in every loop
        to make sure always checking the status of the machine after executing the command
        Also, when the machine is ready to receive new command
        to prevent sending all the commands at once and fill the machine
        buffer to max
        '''
        if (self._is_job_execute_process and
                self._machine_connector.is_machine_ready()):

            self._execute_line()

    def _execute_line(self):
        """
        Sends the next line of G-code to the machine, updates progress, and sends status to UI.
        """
        # get the next command in the file
        line = self._jobs_manager.get_next_line()

        # The system did not finish executing the file
        if line is not None:
            # check if the command is already a tool changing command
            self._is_tool_changing_command(line)

            self._send_to_machine_serial(constants.SERIAL_COMMAND_DATA_TYPE,
                                         constants.LOW_PRIORITY_COMMAND,
                                         line)

            # Add the command that is sent to machine to websocket, so that it will be shown to user being executed
            line_index = self._jobs_manager.get_line_index()
            total_lines = self._jobs_manager.get_total_lines()
            file_timer = self._job_execution_timer.get_elapsed_time()
            res = WebsocketJsonData.parse_job_execution_command_to_json(
                line, line_index, total_lines, file_timer)

            self._send_to_interface_via_websocket(constants.JOB_EXECUTION_DATA_TYPE,
                                                  constants.MIDDLE_PRIORITY_COMMAND,
                                                  res)

        # no remaining lines
        else:
            # reset
            self._reset_job_execution_flags()
            self._machine_connector.reset_counter()
            self._job_execution_timer.stop()

    def _handle_media_management_requests(self, data):
        """
        Handles FastAPI requests related to media files: upload, rename, delete, list, etc.

        Args:
            data (dict): The media-related request payload.
        """

        try:
            process = data.get("process")

            # handle list media data
            if constants.LIST_MEDIA_DATA_PROCESS == process:
                response = self._media_manager_helper.handle_list_media_data()
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # handle uploading media
            elif constants.UPLOAD_MEDIA_PROCESS == process:
                media_name = data.get("media_name")
                media_content = data.get("media_content")
                response = self._media_manager_helper.handle_upload_media(
                    media_name, media_content)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # handle fetch media data
            elif constants.FETCH_MEDIA_DATA_PROCESS == process:
                media_name = data.get("media_name")
                response = self._media_manager_helper.handle_fetch_media_data(
                    media_name)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # handle rename media
            elif constants.RENAME_MEDIA_PROCESS == process:
                old_media_name = data.get("old_media_name")
                new_media_name = data.get("new_media_name")
                response = self._media_manager_helper.handle_rename_file(
                    old_media_name, new_media_name)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # handle deleting media
            elif constants.DELETE_MEDIA_PROCESS == process:
                media_name = data.get("media_name")
                response = self._media_manager_helper.handle_delete_media(
                    media_name)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # handle check opened file
            elif constants.FETCH_MEDIA_DATA_PROCESS == process:
                media_name = data.get("media_name")
                response = self._media_manager_helper.handle_fetch_media_data(
                    media_name)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

             # handle copy media file from usb to media manager storage
            elif constants.UPLOAD_USB_MEDIA_FILE_PROCESS == process:
                media_path = data.get("media_path")
                response = self._media_manager_helper.handle_copy_media_to_system(
                    media_path)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # unknown request
            else:
                raise Exception('Unknown type of request')

        # incase of any error in the system
        except Exception as error:
            print("FastAPI Media Manager Response Error: ", error)
            process = data.get("process")
            response = self._media_manager_helper.handle_error_requests(
                process)
            self._fastapi_server_shared_data.fastapi_write_queue.put(response)

    def _handle_ai_requests(self, data):
        """
        Handles AI-related FastAPI requests including image generation and AI setting management.

        Args:
            data (dict): The AI-related request payload.
        """

        try:
            process = data.get("process")
            if process == constants.AI_GENERATE_IMAGES_PROCESS:
                ai_generator_setting_data = data.get("ai_generator_settings")
                # passing the queue because it will run on seperate process
                self._ai_helper.handle_generate_ai_images(
                    ai_generator_setting_data, self._fastapi_server_shared_data.fastapi_write_queue)

            elif process == constants.AI_CANCEL_GENERATE_IMAGES_PROCESS:
                response = self._ai_helper.handle_cancel_generate_images()
                # This response message will be fetch by the generate service to send an empty images response
                # whereas the cancel response will be empty body response
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif process == constants.CONFIG_AI_SETTINGS_PROCESS:
                response = self._ai_helper.handle_get_ai_config_data()
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif process == constants.ADD_AI_SETTING_PROCESS:
                ai_setting_data = data.get("ai_settings")
                response = self._ai_helper.handle_add_new_ai_setting(
                    ai_setting_data)
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif process == constants.DELETE_AI_SETTING_PROCESS:
                ai_setting_id = data.get("ai_setting_id")
                response = self._ai_helper.handle_delete_ai_setting(
                    ai_setting_id)
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif process == constants.UPDATE_AI_SETTING_PROCESS:
                ai_setting_data = data.get("ai_settings")
                response = self._ai_helper.handle_update_ai_setting(
                    ai_setting_data)
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # unknown request
            else:
                raise Exception('Unknown type of request')

        except Exception as error:
            print("FastAPI AI Manager Response Error: ", error)
            process = data.get("process")
            response = self._ai_helper.handle_error_requests(process)

            self._fastapi_server_shared_data.fastapi_write_queue.put(response)

    def _handle_materials_library_requests(self, data):
        """
        Handles materials library requests such as adding, updating, and deleting materials.

        Args:
            data (dict): The materials-related request payload.
        """

        try:
            process = data.get("process")
            if process == constants.LIST_MATERIAL_PROCESS:
                response = self._materials_library_helper.handle_get_materials_list()

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif process == constants.ADD_MATERIAL_PROCESS:
                material_data = data.get("material_data")
                response = self._materials_library_helper.handle_add_new_material(
                    material_data)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif process == constants.UPDATE_MATERIAL_PROCESS:
                material_data = data.get("material_data")
                response = self._materials_library_helper.handle_update_material(
                    material_data)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif process == constants.DELETE_MATERIAL_PROCESS:
                material_id = data.get("material_id")
                response = self._materials_library_helper.handle_delete_material(
                    material_id)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # unknown request
            else:
                raise Exception('Unknown type of request')

        except Exception as error:
            print("FastAPI Material Library Manager Response Error: ", error)
            process = data.get("process")
            response = self._materials_library_helper.handle_error_requests(
                process)

            self._fastapi_server_shared_data.fastapi_write_queue.put(response)

    def _handle_slice_requests(self, data):
        """
        Handles slicing-related requests for metal 3D printer such as slice, preview, save, etc.

        Args:
            data (dict): The slicing-related request payload.
        """

        try:
            process = data.get("process")
            # handle slicing process requests
            if constants.SLICE_PROCESS == process:
                slice_data = data.get("slice_data")
                self._slicing_helper.handle_slice_models(
                    slice_data,
                    self._fastapi_server_shared_data.fastapi_write_queue,
                    self._websocket_connector_shared_data.websocket_write_queue)

            elif constants.SAVE_SLICE_PROCESS == process:
                filename = data.get("filename")
                response = self._slicing_helper.handle_save_slicing_result_locally(
                    filename)

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif constants.PREVIEW_SLICE_PROCESS == process:
                response = self._slicing_helper.handle_preview_slicing_result()

                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif process == constants.CANCEL_SLICE_PROCESS:
                response = self._slicing_helper.handle_cancel_slice_models()
                # whereas the cancel response will be empty body response
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif process == constants.LIST_SLICING_PROFILES:
                response = self._slicing_helper.handle_list_slicing_profiles()
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif process == constants.ADD_SLICING_PROFILE_PROCESS:
                slicing_settings_data = data.get("slicing_settings")
                response = self._slicing_helper.handle_add_new_slicing_profile(
                    slicing_settings_data)
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif process == constants.DELETE_SLICING_PROFILE_PROCESS:
                slicing_profile_id = data.get("slicing_profile_id")
                response = self._slicing_helper.handle_delete_slicing_profile(
                    slicing_profile_id)
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            elif process == constants.UPDATE_SLICING_PROFILE_PROCESS:
                slicing_settings_data = data.get("slicing_settings")
                response = self._slicing_helper.handle_update_slicing_profile(
                    slicing_settings_data)
                self._fastapi_server_shared_data.fastapi_write_queue.put(
                    response)

            # unknown request
            else:
                raise Exception('Unknown type of request')

        # incase of any error in the system
        except Exception as error:
            print("FastAPI Slice Response Error: ", error)
            process = data.get("process")
            response = self._slicing_helper.handle_error_requests(
                process)
            self._fastapi_server_shared_data.fastapi_write_queue.put(response)

    def _distribute_job_manager_message_to_all_clients(self):
        """
        Sends updated job manager state to all connected WebSocket clients.
        """

        opened_filename = self._jobs_manager.get_open_filename()
        files_list = self._jobs_manager.get_files_list()
        file_content = self._jobs_manager.get_opened_file_content()
        res = WebsocketJsonData.parse_file_manager_message_to_json(
            opened_filename, file_content, files_list)
        self._send_to_interface_via_websocket(
            constants.JOBS_MANAGER_DATA_TYPE, constants.LOW_PRIORITY_COMMAND, res)

    def _handle_incoming_machine_data(self):
        """
        Processes incoming serial data from the machine and converts it to UI messages.
        """

        # The serial read queue is not empty
        if not self._machine_connector_shared_data.serial_read_queue.empty():
            type, data = self._machine_connector_shared_data.serial_read_queue.get()

            # initial json data
            res = json.dumps({})

            if type == constants.MACHINE_STATUS_DATA_TYPE:
                res = WebsocketJsonData.parse_grbl_status_to_json(data)

            elif type == constants.SERIAL_COMMAND_DATA_TYPE:
                res = WebsocketJsonData.parse_serial_command_to_json(data)

            elif type == constants.MACHINE_CONNECTION_DATA_TYPE:
                res = WebsocketJsonData.parse_connection_status_to_json(
                    data)

            # elif type == constants.JOYSTICK_STATUS_DATA_TYPE:
            #     res = WebsocketJsonData.parse_joystick_status_to_json(data)

            if res:
                self._send_to_interface_via_websocket(
                    type,
                    constants.MIDDLE_PRIORITY_COMMAND,
                    res)

    def _handle_cameras_system(self):
        """
        Processes the camera system output and sends data to the frontend via WebSocket.
        """

        if not self._cameras_system_shared_data.cameras_read_queue.empty():
            cameras_frame = self._cameras_system_shared_data.cameras_read_queue.get()

            res = WebsocketJsonData.parse_cameras_frame_to_json(
                cameras_frame)

            self._send_to_interface_via_websocket(constants.CAMERAS_SYSTEM_STREAM_DATA_TYPE,
                                                  constants.MIDDLE_PRIORITY_COMMAND,
                                                  res)

    def _send_to_machine_serial(self, type, priority, data):
        """
        Sends data to the machine serial write queue.

        Args:
            type (str): Type of the command.
            priority (str): Priority level of the command.
            data (str): The actual command to send.
        """

        self._machine_connector.add_to_serial_write_queue(type,
                                                          priority,
                                                          data)

    def _send_to_interface_via_websocket(self, type, priority, data):
        """
        Sends data to the WebSocket write queue for frontend communication.

        Args:
            type (str): Type of the WebSocket message.
            priority (str): Priority level of the message.
            data (str): JSON-encoded data string.
        """

        self._websocket_connector.add_to_websocket_write_queue(
            type, priority, data)

    def _reset_the_core_system(self):
        """
        Resets internal flags and file indices to prepare for a new job execution.
        """

        self._reset_job_execution_flags()
        # reset the line index to the begging of the file
        self._jobs_manager.reset_open_file_indexes()

    def _is_tool_changing_command(self, command):
        """
        Checks if a command involves a tool change and updates the flag accordingly.

        Args:
            command (str): The G-code command.
        """

        if constants.GRBL_TOOL_CHANGE in command:
            self._machine_connector_shared_data.is_tool_change_process = True

    def _set_job_execution_flags(self):
        """
        Enables job execution flags for internal and shared data handlers.
        """

        self._is_job_execute_process = True
        self._machine_connector_shared_data.is_job_execute_process = True
        self._websocket_connector_shared_data.is_job_execute_process = True

    def _reset_job_execution_flags(self):
        """
        Disables job execution flags and stops execution-related services.
        """

        self._is_job_execute_process = False
        self._machine_connector_shared_data.is_job_execute_process = False
        self._websocket_connector_shared_data.is_job_execute_process = False
