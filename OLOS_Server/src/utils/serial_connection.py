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
                else:
                    ser.close()

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
                    break
                ser.close()

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

        # Opening the port can trigger a DTR reset on some boards (e.g. Arduino).
        # Even on boards that don't reset, USB-serial enumeration adds latency.
        # Wait long enough for the controller to boot and flush any startup noise.
        time.sleep(2)
        ser.flushInput()

        # GRBL status is a real-time single-byte command. Appending a newline
        # differs from UGS and can inject an unintended empty command.
        ser.write(constants.GRBL_COMMAND_STATUS.encode())

        # Use a generous timeout for the handshake — the normal 10 ms config
        # value is designed for the tight polling loop, not for first connect.
        original_timeout = ser.timeout
        ser.timeout = 3
        data_from_serial = ser.readline().decode("utf-8").strip()
        ser.timeout = original_timeout

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

    def write_to_serial(self, data, append_newline=True):
        """
        Sends a command to the GRBL controller over serial.

        Args:
            data (str): The command to send.

        Raises:
            serial.SerialTimeoutException: If the write operation times out.
        """

        try:
            if self._serial_connection is None:
                return False
            payload = data + constants.NEWLINE if append_newline else data
            self._serial_connection.write(payload.encode())
            return True
        except (serial.SerialTimeoutException, serial.SerialException, OSError) as error:
            print("Serial write failed:", error)
            self.disconnect_serial()
            return False

    def read_from_serial(self):
        """
        Reads a line of data from the serial connection if available.

        Returns:
            str or None: The decoded string if data is available, otherwise None.
        """

        try:
            if self._serial_connection is None:
                return None
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

        if self._serial_connection is not None:
            self._serial_connection.close()
            self._serial_connection = None
            self._is_connected = False
            print("Serial is disconnected")

        else:
            self._is_connected = False
            print("Serial is already disconnected")
