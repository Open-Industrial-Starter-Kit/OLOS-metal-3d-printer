import datetime
import math
import os
from utils.media_convertor_helper import MediaConvertorHelper
from .constants import FilesManagerConstants as constants
import shutil

# This module is to handle all the functions related to media management


class MediaManager:
    """
    Handles operations related to media file management, such as listing, renaming, copying,
    deleting, and converting media files to base64.

    This class operates within a predefined media directory and supports file metadata
    retrieval like creation time and file size.

    Attributes:
        _media_base_directory (str): Path to stored media folder.
    """

    def __init__(self):
        self._media_base_directory = constants.MEDIA_BASE_DIR

    def get_media_list(self):
        """
        Converts a given media file to a base64-encoded string.

        Args:
            media_name (str): Name of the media file.

        Returns:
            str: Base64-encoded representation of the media file.
        """

        if not os.path.exists(self._media_base_directory):
            os.makedirs(self._media_base_directory)

        # Get the list of media with their info
        media_list_with_info = []
        for media_name in os.listdir(self._media_base_directory):
            if any(media_name.lower().endswith(ext) for ext in constants.MEDIA_FILES_EXTENSIONS):
                media_path = self.get_media_full_path(media_name)

                # fetching file info
                media_creation_time = self.get_media_creation_time(media_path)
                media_size = self.get_media_size(media_path)

                media_info = {"file": media_name,
                              "date": media_creation_time,
                              "size": media_size}

                # add to media list
                media_list_with_info.append(media_info)

        return media_list_with_info

    def get_media_source_string(self, media_name):
        """
        Converts a given media file to a base64-encoded string.

        Args:
            media_name (str): Name of the media file.

        Returns:
            str: Base64-encoded representation of the media file.
        """

        media_path = self.get_media_full_path(media_name)
        media_source_str = MediaConvertorHelper.convert_media_to_base64([media_path])[
            0]

        return media_source_str

    def get_media_creation_time(self, media_path):
        """
        Gets the formatted creation time of a media file.

        Args:
            media_path (str): Full path to the media file.

        Returns:
            str or None: Human-readable timestamp (e.g., '24 July 2025 12:30:45') or None if file not found.
        """

        try:
            creation_time = os.path.getctime(media_path)

            creation_time_formatted = datetime.datetime.fromtimestamp(
                creation_time)
            creation_time_formatted_str = creation_time_formatted.strftime(
                '%d %B %Y %H:%M:%S')

            return creation_time_formatted_str

        except FileNotFoundError:
            print(f"Image not found: {media_path}")
            return None

    def get_media_size(self, media_path):
        """
        Calculates the size of a media file in kilobytes.

        Args:
            media_path (str): Full path to the media file.

        Returns:
            int or None: File size in KB, rounded up, or None if file not found.
        """

        try:
            # Get the creation time of the file in seconds since the epoch
            file_size_bytes = os.path.getsize(media_path)

            # Convert the file size from bytes to megabytes
            file_size_kb = math.ceil(
                file_size_bytes / constants.BYTES_TO_KILOBYTES)

            return file_size_kb

        except FileNotFoundError:
            print(f"Image not found: {media_path}")
            return None

    def rename_media(self, old_media_name, new_media_name):
        """
        Renames an existing media file in the media directory.

        Args:
            old_media_name (str): Current name of the media file.
            new_media_name (str): New name for the media file.
        """

        old_file = os.path.join(self._media_base_directory, old_media_name)
        new_file = os.path.join(self._media_base_directory, new_media_name)

        stat = os.stat(old_file)
        os.utime(old_file, (stat.st_atime, stat.st_mtime))
        os.rename(old_file, new_file)

    # when the user upload a media create a new file in specific directory

    def write_media_file(self, media_name, media_content):
        """
        Writes media content to a file in the media directory.

        Args:
            media_name (str): Name of the file to create.
            media_content (bytes): Binary content to write into the file.
        """

        media_path = self.get_media_full_path(media_name)
        # Save the media to a file
        with open(media_path, "wb") as file:
            file.write(media_content)

    def copy_media_file(self, media_path):
        """
        Copies a media file from USB to the media base directory.

        Args:
            media_path (str): Full path to the usb media file.
        """

        shutil.copy(media_path, constants.MEDIA_BASE_DIR)

    def delete_media(self, media_name):
        """
        Deletes a media file from the media directory.

        Args:
            media_name (str): Name of the file to delete.
        """

        media_path = self.get_media_full_path(media_name)
        os.remove(media_path)

    def get_media_full_path(self, media_name):
        """
        Constructs the full path to a media file in the media directory.

        Args:
            media_name (str): Name of the media file.

        Returns:
            str: Full path to the media file.
        """

        return os.path.join(self._media_base_directory, media_name)
