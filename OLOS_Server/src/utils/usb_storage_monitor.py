"""
Monitors USB storage devices and sends relevant file data over a websocket.
"""

import os
import stat
import time
import platform
from usbmonitor import USBMonitor
from usbmonitor.attributes import ID_MODEL, DEVTYPE, DEVNAME
from core.constants import CoreConstants as constants

from utils.websocket_json_data import WebsocketJsonData


class USBStorageMonitor:
    """
    This class uses platform-specific logic to detect when USB storage devices
    are connected or disconnected. It collects file information for supported
    job and media file types and sends it through a websocket write queue.

    Args:
        jobs_manager (JobsManager): A manager responsible for handling job file operations.
        media_manager (MediaManager): A manager responsible for handling media file operations.
        core_websocket_write_queue (PriorityQueueWithCounter): The queue used to send websocket messages.

    Attributes:
        _jobs_manager (JobsManager): Internal reference to the jobs manager.
        _media_manager (MediaManager): Internal reference to the media manager.
        write_queue (PriorityQueueWithCounter): WebSocket write queue.
        _monitor (USBMonitor): USB monitoring instance.
    """

    def __init__(self, jobs_manager, media_manager, core_websocket_write_queue):
        self._jobs_manager = jobs_manager
        self._media_manager = media_manager
        self.write_queue = core_websocket_write_queue

        # Create and start the USB monitor
        self._monitor = USBMonitor()

    def start(self):
        """
        Starts USB monitoring with callbacks for connect and disconnect events.
        """

        self._monitor.start_monitoring(
            on_connect=self._on_connect, on_disconnect=self._on_disconnect)

    def _is_usb_storage(self, device_info):
        """
        Checks whether the connected device is a USB storage device.

        Args:
            device_info (dict): Dictionary with USB device attributes.

        Returns:
            bool: True if it's a USB storage device, False otherwise.
        """

        return device_info.get(DEVTYPE) in ['USBSTOR', 'usb_device']

    def _on_connect(self, device_id, device_info):
        """
        Callback triggered when a USB device is connected.

        Sends a JSON message containing the job and media files found on the device.

        Args:
            device_id (str): Unique ID of the device.
            device_info (dict): Dictionary containing device details.
        """

        if self._is_usb_storage(device_info):
            # Check if the device is ready for use
            mount_point = None
            while True:
                mount_point = self._resolve_mount_point(
                    device_info)
                if mount_point:
                    break
                time.sleep(0.5)

            if mount_point:
                files_data = self._get_usb_storage_files_data(mount_point)
                res = WebsocketJsonData.parse_usb_storage_monitor_data_to_json(
                    device_name=device_info[ID_MODEL],
                    job_files_data=files_data["job_files_list"],
                    media_files_data=files_data["media_files_list"],
                    is_connected=True
                )
                self.write_queue.put(constants.USB_STORAGE_MONITOR_DATA_TYPE,
                                     constants.MIDDLE_PRIORITY_COMMAND,
                                     res)

    def _on_disconnect(self, device_id, device_info):
        """
        Callback triggered when a USB device is disconnected.

        Sends a JSON message indicating the device is disconnected.

        Args:
            device_id (str): Unique ID of the device.
            device_info (dict): Dictionary containing device details.
        """

        if self._is_usb_storage(device_info):
            res = WebsocketJsonData.parse_usb_storage_monitor_data_to_json(
                device_name=device_info[ID_MODEL],
                job_files_data=[],
                media_files_data=[],
                is_connected=False)

            self.write_queue.put(constants.USB_STORAGE_MONITOR_DATA_TYPE,
                                 constants.MIDDLE_PRIORITY_COMMAND,
                                 res)

    def _resolve_mount_point(self, device_info):
        """
        Determines the mount point of the connected USB storage device.

        Args:
            device_info (dict): Dictionary containing device attributes.

        Returns:
            str or None: Mount path of the USB device, or None if not found.
        """

        system = platform.system()
        if system == "Windows":
            return self._get_windows_mount_point()

        elif system == "Linux":
            return self._get_linux_mount_point()

        elif system == "Darwin":
            return self._get_mac_mount_point()

        print(f"Could not resolve mount point for {device_info.get(DEVNAME)}.")
        return None

    def _get_windows_mount_point(self):
        """
        Gets the mount point of a USB device on Windows.

        Returns:
            str or None: The drive letter if found, else None.
        """

        import win32api
        import win32file

        # Wait for a few seconds to ensure the device is fully mounted
        time.sleep(5)
        drives = win32api.GetLogicalDriveStrings().split('\x00')
        for drive in drives:
            drive_type = win32file.GetDriveType(drive)
            if drive_type == win32file.DRIVE_REMOVABLE:
                return drive

    def _get_linux_mount_point(self):
        """
        Gets the mount point of a USB device on Linux.

        Returns:
            str or None: The mount point path, or None if not found.
        """

        import pyudev
        import psutil

        context = pyudev.Context()
        removable = [device for device in context.list_devices(
            subsystem='block', DEVTYPE='disk') if device.attributes.asstring('removable') == "1"]
        for device in removable:
            partitions = [device.device_node for device in context.list_devices(
                subsystem='block', DEVTYPE='partition', parent=device)]
            for p in psutil.disk_partitions():
                if p.device in partitions:
                    return p.mountpoint

        return None

    def _get_mac_mount_point(self):
        """
        Gets the mount point of a USB device on macOS.

        Returns:
            str or None: The mount point path, or None if not found.
        """

        volumes_dir = "/Volumes"
        for mount in os.listdir(volumes_dir):
            mount_path = os.path.join(volumes_dir, mount)
            if os.path.ismount(mount_path):
                return mount_path

    def _get_usb_storage_files_data(self, mount_point):
        """
        Scans the mount point and collects data for job and media files.

        Args:
            mount_point (str): The mount path of the USB storage device.

        Returns:
            dict: A dictionary containing job and media file lists.
        """

        if not os.path.isdir(mount_point):
            return {"job_files_list": [], "media_files_list": []}

        def is_file_hidden(filepath):
            # Check if file or directory is hidden (dotfile or hidden attribute)
            name = os.path.basename(os.path.abspath(filepath))
            return name.startswith('.') or has_hidden_attribute(filepath)

        def has_hidden_attribute(filepath):
            # Check if hidden attribute is set (for Windows)
            try:
                return bool(os.stat(filepath).st_file_attributes & stat.FILE_ATTRIBUTE_HIDDEN)
            except AttributeError:
                # If the attribute does not exist (non-Windows), return False
                return False

        def collect_file_data(file_id, filename, file_path, mount_point, file_type):
            if file_type == "job":
                return self._get_file_data(file_id, filename, file_path, mount_point)
            elif file_type == "media":
                return self._get_media_data(file_id, filename, file_path, mount_point)

        job_files_list = []
        media_files_list = []
        job_id = 0
        media_id = 0

        # Walk the directory
        for root, dirs, files in os.walk(mount_point):
            # Skip hidden directories
            dirs[:] = [d for d in dirs if not is_file_hidden(
                os.path.join(root, d))]

            for filename in files:
                file_path = os.path.join(root, filename)
                if not is_file_hidden(file_path):  # Skip hidden files
                    if filename.lower().endswith(constants.ACCEPTED_JOB_FILES_EXTENSIONS):
                        job_files_list.append(
                            collect_file_data(
                                job_id, filename, file_path, mount_point, "job")
                        )
                        job_id += 1
                    elif filename.lower().endswith(tuple(constants.ACCEPTED_MEDIA_FILES_EXTENSIONS.keys())):
                        media_files_list.append(
                            collect_file_data(
                                media_id, filename, file_path, mount_point, "media")
                        )
                        media_id += 1

        return {"job_files_list": job_files_list, "media_files_list": media_files_list}

    def _get_file_data(self, id, filename, file_path, mount_point):
        """
        Gathers metadata for a job file.

        Args:
            id (int): ID assigned to the file.
            filename (str): Name of the file.
            file_path (str): Full path to the file.
            mount_point (str): Mount point of the device.

        Returns:
            dict: Metadata for the job file.
        """

        file_size = self._jobs_manager.get_file_size(
            file_path)
        file_creation_time = self._jobs_manager.get_file_creation_time(
            file_path)
        return {'id': id, "file": filename, "path": file_path, "size": file_size, "date": file_creation_time, "mountPoint": mount_point}

    def _get_media_data(self, id, media_name, media_path, mount_point):
        """
        Gathers metadata for a media file.

        Args:
            id (int): ID assigned to the media file.
            media_name (str): Name of the media file.
            media_path (str): Full path to the media file.
            mount_point (str): Mount point of the device.

        Returns:
            dict: Metadata for the media file.
        """

        media_size = self._media_manager.get_media_size(
            media_path)
        media_creation_time = self._media_manager.get_media_creation_time(
            media_path)
        return {'id': id, "file": media_name, "path": media_path, "size": media_size, "date": media_creation_time, "mountPoint": mount_point}
