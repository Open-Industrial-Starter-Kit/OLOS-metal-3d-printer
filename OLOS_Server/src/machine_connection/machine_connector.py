"""
This module defines the MachineConnector class which manages low-level communication
between server and physical machine (e.g., CNC, 3D printer) using a serial connection.

It uses multiprocessing to run independently, queues to coordinate commands, and handles
machine state logic such as pausing, homing, unlocking, and error handling.

Features:

- Reads/writes G-code commands via serial

- Tracks tool changes, door status, and machine readiness

- Auto-homing, pausing, resuming, and resetting

- Interacts with the core module using shared queues
"""

import time
from multiprocessing import Process
from utils.configuration_loader import ConfigurationLoader
from utils.joystick_handler import JoystickHandler
from utils.serial_connection import SerialConnection
from .constants import MachineConstants as constants
import os
from dotenv import load_dotenv

load_dotenv()


class MachineConnector(Process):
    """
    A multiprocessing process that handles serial communication with a machine controller (GRBL-based).

    Responsibilities include:

    - Establishing and managing serial connection
    - Reading and writing G-code commands
    - Tracking machine status
    - Handling control commands like pause, stop, resume, homing, unlock, etc.

    Attributes:
        machine_connector_data (obj): Shared data object with queues and control flags.
        _serial_connection (SerialConnection): Manages the serial port communication.
        _current_refresh_status_time (float): Timestamp for last machine status refresh.
        _is_machine_door_open_on_start (bool): Indicates if the machine door was open during startup.
        _config (ConfigurationLoader): Loaded machine configuration from YAML.

    Args:
        machine_connector_data (obj): Shared data object with queues and control flags.
    """

    def __init__(self, machine_connector_data):
        super(MachineConnector, self).__init__()

        # shared objects dictionary with the core
        self.machine_connector_data = machine_connector_data

        # helper instances
        self._serial_connection = SerialConnection()

        # Get the current time seconds
        self._current_refresh_status_time = time.time()

        # flag for machine door status used at the start of the machine to check if the door is open or not for the homing process
        self._is_machine_door_open_on_start = True

        # configuration settings
        self._config = None

    def run(self):
        """
        Entry point of the process. Initializes the serial connection and starts the machine communication loop.
        Handles reconnection and error reporting.
        """

        disconnected_notified = False
        last_configured_port = None

        while True:
            try:
                # Reload the machine settings before every reconnect attempt.
                # This lets a corrected COM port take effect without leaving a
                # stale value cached in the long-running connector process.
                self._config = ConfigurationLoader.from_yaml()
                controller_required = (
                    self._config.serial_connection.controller_required
                    is not False
                )
                retry_interval = 1 if controller_required else 5
                configured_port = self._config.serial_connection.port

                if configured_port != last_configured_port:
                    print(
                        "Machine controller serial port configured as:",
                        configured_port,
                    )
                    last_configured_port = configured_port

                self._serial_connection.connect_to_serial(
                    configured_port,
                    self._config.serial_connection.baudrate,
                    self._config.serial_connection.timeout,
                )

                if self._serial_connection.is_serial_connected():
                    self.machine_connector_data.is_serial_connected = True
                    self.add_to_serial_read_queue(
                        constants.MACHINE_CONNECTION_DATA_TYPE,
                        constants.HIGH_PRIORITY_COMMAND,
                        True,
                    )
                    disconnected_notified = False
                    self._start_machine_communication()

                if not disconnected_notified:
                    self.machine_connector_data.is_serial_connected = False
                    message = (
                        "Controller is unavailable; server is running in offline mode."
                        if not controller_required
                        else "There is no serial connection"
                    )
                    print(message)
                    self.add_to_serial_read_queue(
                        constants.MACHINE_CONNECTION_DATA_TYPE,
                        constants.HIGH_PRIORITY_COMMAND,
                        False,
                    )
                    disconnected_notified = True

            except Exception as error:
                print("Serial Connection Error:", error)
                retry_interval = 5
                self.machine_connector_data.is_serial_connected = False
                self._serial_connection.disconnect_serial()

                if not disconnected_notified:
                    self.add_to_serial_read_queue(
                        constants.MACHINE_CONNECTION_DATA_TYPE,
                        constants.HIGH_PRIORITY_COMMAND,
                        False,
                    )
                    disconnected_notified = True

            time.sleep(retry_interval)

    def add_to_serial_write_queue(self, type, priority, command):
        """
        Adds a command to the serial write queue.

        Args:
            type (str): Type/category of the command.
            priority (int): Command priority.
            command (str): The G-code command to send.
        """

        requires_ack = type not in {
            constants.REAL_TIME_COMMAND_DATA_TYPE,
            constants.MACHINE_STATUS_DATA_TYPE,
        }
        if requires_ack:
            # Reserve the acknowledgement before queueing. Without this, the
            # core can observe the machine as ready again and advance through
            # many file lines before this process writes the first command.
            self.machine_connector_data.ok_messages_counter += 1

        self.machine_connector_data.serial_write_queue.put(
            type, priority, command)

    def add_to_serial_read_queue(self, type, priority, message=None):
        """
        Adds a message to the serial read queue.

        Args:
            type (str): Type/category of the message.
            priority (int): Priority of the message.
            message (str, optional): The message content.
        """

        self.machine_connector_data.serial_read_queue.put(
            type, priority, message)

    def homing_machine(self):
        """
        Sends a homing command to the machine and updates the system state to reflect homing status.
        """

        self._reset_the_machine_system()

        # notify the core that the machine is homing
        self.add_to_serial_read_queue(constants.MACHINE_STATUS_DATA_TYPE,
                                      constants.MIDDLE_PRIORITY_COMMAND,
                                      constants.GRBL_COMMAND_DUMMY_STATUS_HOMING)

        # add stop command to the queue so that the serial will get notified
        self.add_to_serial_write_queue(constants.NORMAL_COMMAND_DATA_TYPE, constants.MIDDLE_PRIORITY_COMMAND,
                                       constants.GRBL_COMMAND_HOMING)

    def unlock_machine(self):
        """
        Sends a GRBL unlock command to the machine.
        """

        self._reset_the_machine_system()

        # add stop command to the queue so that the serial will get notified
        self.add_to_serial_write_queue(constants.NORMAL_COMMAND_DATA_TYPE, constants.MIDDLE_PRIORITY_COMMAND,
                                       constants.GRBL_COMMAND_UNLOCK)

    def pause_machine(self):
        """
        Sends a pause command and immediately requests machine status to reflect the paused state.
        """

        self.machine_connector_data.is_machine_pause = True
        # add pause command to the queue so that the serial will get notified
        self.add_to_serial_write_queue(constants.REAL_TIME_COMMAND_DATA_TYPE, constants.HIGH_PRIORITY_COMMAND,
                                       constants.GRBL_COMMAND_PAUSE)

        # update the status directly to prevent the delay in the interface (1 second while pause)
        self.add_to_serial_write_queue(constants.REAL_TIME_COMMAND_DATA_TYPE, constants.MIDDLE_PRIORITY_COMMAND,
                                       constants.GRBL_COMMAND_STATUS)

    def stop_machine(self):
        """
        Sends a stop command and resets internal state flags and queues.
        """

        # reset the system
        self._reset_the_machine_system()

        # add stop command to the queue so that the serial will get notified
        self.add_to_serial_write_queue(constants.REAL_TIME_COMMAND_DATA_TYPE, constants.HIGH_PRIORITY_COMMAND,
                                       constants.GRBL_COMMAND_STOP)

    def resume_machine(self):
        """
        Sends a resume command and clears the pause flag.
        """

        self.machine_connector_data.is_machine_pause = False
        # add resume command to the queue so that the serial will get notified
        self.add_to_serial_write_queue(constants.REAL_TIME_COMMAND_DATA_TYPE, constants.HIGH_PRIORITY_COMMAND,
                                       constants.GRBL_COMMAND_RESUME)

    def return_to_zero(self):
        """
        Sends a command to return the machine to its zero position.
        """

        self.add_to_serial_write_queue(constants.NORMAL_COMMAND_DATA_TYPE,
                                       constants.MIDDLE_PRIORITY_COMMAND, constants.GRBL_COMMAND_RETURN_TO_ZERO)

    def reset_zero(self):
        """
        Sends a command to reset the machine's current position as the new zero.
        """

        self.reset_counter()
        # add reset zero command to the queue so that the serial will get notified
        self.add_to_serial_write_queue(constants.NORMAL_COMMAND_DATA_TYPE, constants.MIDDLE_PRIORITY_COMMAND,
                                       constants.GRBL_COMMAND_RESET_ZERO)

    def reset_counter(self):
        """
        Resets the number of commands awaiting controller acknowledgement.
        """

        self.machine_connector_data.ok_messages_counter = 0

    def clear_error_state(self):
        """
        Clears the GRBL error and pause flags before a new job begins.

        reset_counter() only zeros ok_messages_counter — if a previous run
        ended with a GRBL error: response, has_command_error and is_machine_pause
        stay True, causing is_machine_ready() to always return False and the new
        job to silently send nothing to the machine.  Call this alongside
        reset_counter() whenever a fresh job is started.
        """

        self.machine_connector_data.has_command_error = False
        self.machine_connector_data.is_machine_pause = False

    def is_machine_ready(self):
        """
        Checks if the machine is ready to receive the next command.

        Returns:
            bool: True if ready (no pending acknowledgments, not paused, not changing tools), else False.
        """

        if (self.machine_connector_data.ok_messages_counter <= 0 and
            not self.machine_connector_data.is_tool_change_process and
            not self.machine_connector_data.has_command_error and
                not self.machine_connector_data.is_machine_pause):
            return True

        return False

    def _start_machine_communication(self):
        """
        Continuously reads from and writes to the serial port, and refreshes the machine status.
        """
        self.reset_counter()
        while self._serial_connection.is_serial_connected():
            self._handle_reading_from_serial()
            self._handle_writing_to_serial()
            self._fetch_machine_status()

            if not self.machine_connector_data.is_job_execute_process:
                time.sleep(constants.TIMEOUT)

    # Writing data to the serial port

    def _handle_writing_to_serial(self):
        """
        Sends G-code commands from the write queue to the machine via serial, if the queue is not empty.
        Increments the 'ok' counter to await acknowledgment.
        """

        if not self.machine_connector_data.serial_write_queue.empty():
            type, gcode_command = self.machine_connector_data.serial_write_queue.get()
            if gcode_command:
                is_real_time = type in {
                    constants.REAL_TIME_COMMAND_DATA_TYPE,
                    constants.MACHINE_STATUS_DATA_TYPE,
                }
                write_succeeded = self._serial_connection.write_to_serial(
                    gcode_command,
                    append_newline=not is_real_time,
                )
                if not write_succeeded:
                    self.machine_connector_data.is_serial_connected = False
                    self.reset_counter()

    def _handle_reading_from_serial(self):
        """
        Reads incoming data from the serial connection, interprets machine status or replies,
        and dispatches responses to the appropriate read queue (core). Handles tool change and error feedback.
        """
        # read incoming bytes from serial and convert it to string
        data_to_fetch = self._serial_connection.read_from_serial()
        if data_to_fetch:
            if constants.GRBL_ANSWER_OK in data_to_fetch:
                # decrease the counter because the machine replied
                # with an ok message after sending a command to the machine
                if self.machine_connector_data.ok_messages_counter > 0:
                    self.machine_connector_data.ok_messages_counter -= 1

            elif data_to_fetch.lower().startswith("error"):
                # GRBL errors acknowledge/reject the current line just like an
                # "ok" response. Release that pending acknowledgement, then
                # pause file streaming so the next line is never sent
                # automatically. This mirrors UGS pausing on a rejected line.
                if self.machine_connector_data.ok_messages_counter > 0:
                    self.machine_connector_data.ok_messages_counter -= 1
                self.machine_connector_data.is_machine_pause = True
                self.machine_connector_data.has_command_error = True
                self.add_to_serial_read_queue(
                    constants.SERIAL_COMMAND_DATA_TYPE,
                    constants.HIGH_PRIORITY_COMMAND,
                    data_to_fetch,
                )

            elif data_to_fetch.lower().startswith("alarm"):
                # GRBL entered alarm state (hard limit, spindle fault, etc.).
                # Unlike error:, ALARM is an asynchronous event — it is not a
                # direct reply to the last queued command. Clear the entire
                # counter (not just decrement) so the execution loop doesn't
                # wait indefinitely for an ok that will never arrive. Then halt
                # streaming; GRBL in alarm ignores all motion commands until $X.
                self.machine_connector_data.ok_messages_counter = 0
                self.machine_connector_data.is_machine_pause = True
                self.machine_connector_data.has_command_error = True
                self.add_to_serial_read_queue(
                    constants.SERIAL_COMMAND_DATA_TYPE,
                    constants.HIGH_PRIORITY_COMMAND,
                    data_to_fetch,
                )

            # check if the machine's door is open (for the homing the machine process)
            elif self._is_machine_door_open_on_start and data_to_fetch.startswith('<Idle'):
                self._is_machine_door_open_on_start = False

                if self._config.home_machine_on_start:
                    self.homing_machine()

            # machine status reply
            elif data_to_fetch.startswith('<') and data_to_fetch.endswith('>'):
                self.add_to_serial_read_queue(constants.MACHINE_STATUS_DATA_TYPE,
                                              constants.MIDDLE_PRIORITY_COMMAND,
                                              data_to_fetch)

            # ignore gcode parser state
            elif data_to_fetch.startswith('[') and data_to_fetch.endswith(']'):
                pass

            # rest of commands
            else:
                if constants.TOOL_CHANGER_SUCCESS in data_to_fetch:
                    # check if the machine finished changing the tool
                    # it will reply with TOCK message
                    self.machine_connector_data.is_tool_change_process = False
                    # reset the counter after tool change because the pico will
                    # execute different commands where the server will not count
                    self.reset_counter()

                elif constants.TOOL_CHANGER_ERROR in data_to_fetch:
                    # Error happened during changing the tool
                    if os.getenv('ENV') == 'development':
                        print('Error happened during changing the tool')
                    self.stop_machine()

                elif constants.SOFT_LIMITS_TRIGGER == data_to_fetch:
                    # RP2040 firmware rejected the move because it hit a soft
                    # limit. Reset the counter so the ack loop doesn't stall,
                    # then halt execution. Continuing from an unexpected position
                    # would cause every subsequent move to go to the wrong
                    # coordinate, making the head veer off during a layer scan.
                    self.reset_counter()
                    self.machine_connector_data.is_machine_pause = True
                    self.machine_connector_data.has_command_error = True

                self.add_to_serial_read_queue(constants.SERIAL_COMMAND_DATA_TYPE,
                                              constants.LOW_PRIORITY_COMMAND,
                                              data_to_fetch)

    def _fetch_machine_status(self):
        """
        Triggers a machine status update based on a time interval, which varies depending on whether the machine is paused.
        """

        # Refresh every specific time interval while the machine in pause/run status
        time_interval = constants.STATUS_REFRESH_INTERVAL_PAUSE if self.machine_connector_data.is_machine_pause else constants.STATUS_REFRESH_INTERVAL_RUN
        if time.time() - self._current_refresh_status_time > time_interval:
            self._update_machine_status()

    def _update_machine_status(self):
        """
        Sends a status request ("?") to the machine if the acknowledgment counter is below threshold.
        """
        # Update the time
        self._current_refresh_status_time = time.time()

        # Stop asking the status after a specific value
        if self.machine_connector_data.ok_messages_counter <= constants.MAX_COUNTER_VALUE:
            # Send a status command to the machine
            self.add_to_serial_write_queue(constants.MACHINE_STATUS_DATA_TYPE,
                                           constants.MIDDLE_PRIORITY_COMMAND, constants.GRBL_COMMAND_STATUS)

    def _reset_the_machine_system(self):
        """
        Resets internal process flags and clears both the write and read queues.
        """

        self.machine_connector_data.is_tool_change_process = False
        self.machine_connector_data.is_machine_pause = False
        self.machine_connector_data.has_command_error = False
        self._flush_write_queue()
        self._flush_read_queue()
        self.reset_counter()

    def _flush_write_queue(self):
        """
        Clears all pending commands from the serial write queue.
        """

        # clear the write queue
        while not self.machine_connector_data.serial_write_queue.empty():
            self.machine_connector_data.serial_write_queue.get()

    def _flush_read_queue(self):
        """
        Clears all pending messages from the serial read queue.
        """

        # clear the write queue
        while not self.machine_connector_data.serial_read_queue.empty():
            self.machine_connector_data.serial_read_queue.get()
