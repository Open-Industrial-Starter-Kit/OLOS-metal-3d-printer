"""
This module manages shared memory structures across multiple processes using Python's
`multiprocessing.managers.SyncManager`. It defines classes to initialize and access shared
queues, flags, and counters for use between core services such as serial control,
websocket communication, FastAPI, and camera systems.

It ensures safe inter-process communication using manager-backed data types like
queues and shared values.

Classes:
    - SharedDataManager: Starts the shared manager and registers custom types.
    - SharedMachineData: Stores shared queues and flags for machine connection process.
    - SharedWebsocketData: Manages shared queues and execution flags for WebSocket connection process.
    - SharedFastApiData: Provides read/write queues for FastAPI communication.
    - SharedCamerasSystemData: Provides read/write queues for camera stream data handling.
"""

from multiprocessing.managers import SyncManager
from utils.priority_queue_with_counter import PriorityQueueWithCounter


class SharedDataManager:
    """
    Initializes and manages a `SyncManager` instance with registered shared resources.

    Registers the custom `PriorityQueueWithCounter` to be used in multiprocessing contexts.
    """

    def __init__(self):
        """
        Starts the SyncManager and registers the custom priority queue.
        """

        SyncManager.register("PriorityQueueWithCounter",
                             PriorityQueueWithCounter)
        self.manager = SyncManager()
        self.manager.start()

    def get_manager(self):
        """
        Returns:
            SyncManager: A started SyncManager instance with registered shared types.
        """

        return self.manager


class SharedMachineData:
    """
    Holds shared data used by the machine control processes.

    Includes:

    - Serial read/write queues

    - OK message counters

    - Flags for tool change, machine pause, and job execution
    """

    def __init__(self):
        manager = SharedDataManager().get_manager()
        self._data = {
            'serial_read_queue': manager.PriorityQueueWithCounter(),
            'serial_write_queue': manager.PriorityQueueWithCounter(),
            'ok_messages_counter': manager.Value('i', 0),
            'is_serial_connected': manager.Value('b', False),
            'is_tool_change_process': manager.Value('b', False),
            'is_machine_pause': manager.Value('b', False),
            'has_command_error': manager.Value('b', False),
            'is_job_execute_process': manager.Value('b', False)
        }

    @property
    def serial_read_queue(self):
        """PriorityQueueWithCounter: Priority queue for serial data read."""
        return self._data['serial_read_queue']

    @property
    def serial_write_queue(self):
        """PriorityQueueWithCounter: Priority queue for serial data write."""
        return self._data['serial_write_queue']

    @property
    def ok_messages_counter(self):
        """int: Counter for OK messages from the machine."""
        return self._data['ok_messages_counter'].value

    @ok_messages_counter.setter
    def ok_messages_counter(self, value):
        self._data['ok_messages_counter'].value = value

    @property
    def is_serial_connected(self):
        """bool: True only while the controller serial port is usable."""
        return self._data['is_serial_connected'].value

    @is_serial_connected.setter
    def is_serial_connected(self, value):
        self._data['is_serial_connected'].value = value

    @property
    def is_tool_change_process(self):
        """bool: Flag indicating if a tool change is in progress."""
        return self._data['is_tool_change_process'].value

    @is_tool_change_process.setter
    def is_tool_change_process(self, value):
        self._data['is_tool_change_process'].value = value

    @property
    def is_machine_pause(self):
        """bool: Flag indicating if the machine is paused."""
        return self._data['is_machine_pause'].value

    @is_machine_pause.setter
    def is_machine_pause(self, value):
        self._data['is_machine_pause'].value = value

    @property
    def has_command_error(self):
        """bool: True when GRBL rejected the current streamed command."""
        return self._data['has_command_error'].value

    @has_command_error.setter
    def has_command_error(self, value):
        self._data['has_command_error'].value = value

    @property
    def is_job_execute_process(self):
        """bool: Flag indicating if a job is currently executing."""
        return self._data['is_job_execute_process'].value

    @is_job_execute_process.setter
    def is_job_execute_process(self, value):
        self._data['is_job_execute_process'].value = value


class SharedWebsocketData:
    """
    Holds shared data for WebSocket communication processes.

    Includes:

    - Priority queues for read/write

    - Job execution flag
    """

    def __init__(self):
        manager = SharedDataManager().get_manager()
        self._data = {
            'websocket_read_queue': manager.PriorityQueueWithCounter(),
            'websocket_write_queue': manager.PriorityQueueWithCounter(),
            'is_job_execute_process': manager.Value('b', False)
        }

    @property
    def websocket_read_queue(self):
        """PriorityQueueWithCounter: Priority queue for WebSocket reads."""
        return self._data['websocket_read_queue']

    @property
    def websocket_write_queue(self):
        """PriorityQueueWithCounter: Priority queue for WebSocket writes."""
        return self._data['websocket_write_queue']

    @property
    def is_job_execute_process(self):
        """bool: Flag indicating if a WebSocket-triggered job is executing."""
        return self._data['is_job_execute_process'].value

    @is_job_execute_process.setter
    def is_job_execute_process(self, value):
        self._data['is_job_execute_process'].value = value


class SharedFastApiData:
    """
    Holds shared data for FastAPI communication.

    Includes:

    - Simple queues for read/write operations.
    """

    def __init__(self):
        manager = SharedDataManager().get_manager()
        self._data = {
            'fastapi_read_queue': manager.Queue(),
            'fastapi_write_queue': manager.Queue(),
        }

    @property
    def fastapi_read_queue(self):
        """multiprocess.Queue: Standard queue for FastAPI reads."""
        return self._data['fastapi_read_queue']

    @property
    def fastapi_write_queue(self):
        """multiprocess.Queue: Standard queue for FastAPI writes."""
        return self._data['fastapi_write_queue']


class SharedCamerasSystemData:
    """
    Holds shared data for camera system processes.

    Includes:

    - Standard read/write queues for inter-process communication.
    """

    def __init__(self):
        manager = SharedDataManager().get_manager()
        self._data = {
            'cameras_read_queue': manager.Queue(),
            'cameras_write_queue': manager.Queue(),
        }

    @property
    def cameras_read_queue(self):
        """multiprocess.Queue: Standard queue for camera data reads."""
        return self._data['cameras_read_queue']

    @property
    def cameras_write_queue(self):
        """multiprocess.Queue: Standard queue for camera data writes."""
        return self._data['cameras_write_queue']
