import glob
import sys
import time
import serial
import serial.tools.list_ports
from machine_connection.constants import MachineConstants as constants
import os
from dotenv import load_dotenv

load_dotenv()


class SerialConnection:
    """
    Manages serial communication with a GRBL-compatible controller.

    This class attempts to connect to the controller using a specified or available serial port,
    verifies the connection by sending a GRBL status command, and provides utility methods for
    serial read/write operations.

    Attributes:
        _is_connected (bool): Indicates if the serial connection is successfully established.
        _serial_connection (serial.Serial): The active serial connection instance.
    """

    def __init__(self):
        self._is_connected = False
        self._serial_connection = None

    def connect_to_serial(self, port, baudrate, timeout):
        """
        Attempts to establish a serial connection to a GRBL controller.

        If a port is specified, it tries to connect to that port.
        If no port is provided, it scans all available serial ports and tries each one.

        Args:
            port (str or None): The serial port to connect to (e.g., "COM3" or "/dev/ttyUSB0").
            baudrate (int): The baud rate for the connection (e.g., 115200).
            timeout (float): The timeout in seconds for the serial connection.
        """

        if port:
            try:
                ser = serial.Serial(port=port,
                                    baudrate=baudrate,
                                    timeout=timeout)

                if os.getenv('ENV') == 'development':
                    print(f"Serial connected")
                    print("Serial Settings:")
                    print("-> Port:", port)
                    print("-> Baudrate:", baudrate)

                # make sure we are connecting to the right controller by sending a command
                # and receive data from the controller
                if self.is_connected_to_controller(ser):
                    # set the serial connection
                    self._serial_connection = ser
                    self._is_connected = True

            except Exception as error:
                print("Custom serial port error:", error)
        else:
            # check available serial ports in the operation system
            available_ports = self.serial_ports()
            for port in available_ports:
                ser = serial.Serial(port=port,
                                    baudrate=baudrate,
                                    timeout=timeout)
                # make sure we are connecting to the right controller by sending a command
                # and receive data from the controller
                if self.is_connected_to_controller(ser):
                    # set the serial connection
                    self._serial_connection = ser
                    self._is_connected = True

            if os.getenv('ENV') == 'development':
                print(f"Serial connected")
                print("Serial Settings:")
                print("-> Port:", port)
                print("-> Baudrate:", baudrate)

            # stop when there is a connection available
            return

    def is_connected_to_controller(self, ser):
        """
        Sends a GRBL status command to verify if the connected device is a controller.

        Args:
            ser (serial.Serial): The serial connection to test.

        Returns:
            bool: True if the controller responds, False otherwise.
        """

        # Get the current position of the machine
        ser.write((constants.GRBL_COMMAND_STATUS + constants.NEWLINE).encode())
        # Reading data from the serial port
        data_from_serial = ser.readline().decode("utf-8").strip()

        if data_from_serial:
            if os.getenv('ENV') == 'development':
                print("====== Testing connection to controller ======")

            return True
        return False

    def serial_ports(self):
        """
        Lists all available serial ports on the host system.

        Returns:
            list[str]: A list of port names.

        Raises:
            EnvironmentError: If the platform is unsupported.
        """

        if sys.platform.startswith('win'):
            ports = ['COM%s' % (i + 1) for i in range(256)]
        elif sys.platform.startswith('linux') or sys.platform.startswith('cygwin'):
            # this excludes your current terminal "/dev/tty"
            ports = glob.glob('/dev/tty[A-Za-z]*')
        elif sys.platform.startswith('darwin'):
            ports = glob.glob('/dev/tty.*')
        else:
            raise EnvironmentError('Unsupported platform')

        result = []
        for port in ports:
            try:
                s = serial.Serial(port)
                s.close()
                result.append(port)
            except (OSError, serial.SerialException):
                pass
        return result

    def is_serial_connected(self):
        """
        Checks if a serial connection is currently active.

        Returns:
            bool: True if connected, False otherwise.
        """

        return self._is_connected

    def is_serial_waiting(self):
        """
        Checks if the serial connection has data waiting to be read.

        Returns:
            int: The number of bytes waiting in the input buffer.
        """

        return self._serial_connection.in_waiting

    def write_to_serial(self, data):
        """
        Sends a command to the GRBL controller over serial.

        Args:
            data (str): The command to send.

        Raises:
            serial.SerialTimeoutException: If the write operation times out.
        """

        try:
            self._serial_connection.write((data + constants.NEWLINE).encode())
        except serial.SerialTimeoutException:
            print("Write operation timed out")
            self.disconnect_serial()

    def read_from_serial(self):
        """
        Reads a line of data from the serial connection if available.

        Returns:
            str or None: The decoded string if data is available, otherwise None.
        """

        try:
            if self._serial_connection.in_waiting > 0:
                return self._serial_connection.readline().decode("utf-8").strip()
            else:
                return None  # No data available
        except Exception as e:
            print("Error reading from serial:", e)
            return None  # Handle the error gracefully

    def disconnect_serial(self):
        """
        Gracefully closes the active serial connection.
        """

        if self._is_connected:
            self._serial_connection.close()
            self._serial_connection = None
            self._is_connected = False
            print("Serial is disconnected")

        else:
            print("Serial is already disconnected")
