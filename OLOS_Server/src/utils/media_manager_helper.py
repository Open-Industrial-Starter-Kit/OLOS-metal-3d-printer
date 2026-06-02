from core.constants import CoreConstants as constants


class MediaManagerHelper:
    """
    A helper class that provides high-level operations for managing media files.

    This class acts as an interface between the FastAPI layer and the media manager backend,
    handling media-related tasks such as uploading, deleting, renaming, listing, and copying
    media files, as well as generating consistent API responses.

    Attributes:
        _media_manager(MediaManager): An instance of a MediaManager that performs the actual file operations.

    Args:
        media_manager(MediaManager): An instance of a MediaManager that performs the actual file operations.
    """

    def __init__(self, media_manager):
        self._media_manager = media_manager

    def handle_list_media_data(self):
        """
        Handle listing of all available media files.

        Returns:
            dict: FastAPI-compatible response containing a list of available media files.
        """

        response = self.fastapi_media_manager_response(
            type=constants.MEDIA_MANAGER_DATA_TYPE,
            process=constants.LIST_MEDIA_DATA_PROCESS,
            media_data={
                'mediaName': '',
                'mediaSource': '',
            },
            media_list=self._media_manager.get_media_list(),
            success=True,
        )
        return response

    def handle_upload_media(self, media_name, media_content):
        """
        Handle the uploading of a media file.

        Args:
            media_name (str): Name of the uploaded media file.
            media_content (bytes): Content of the media file.

        Returns:
            dict: FastAPI-compatible response confirming the upload.
        """

        self._media_manager.write_media_file(media_name, media_content)

        response = self.fastapi_media_manager_response(
            type=constants.MEDIA_MANAGER_DATA_TYPE,
            process=constants.UPLOAD_MEDIA_PROCESS,
            media_data={
                'mediaName': '',
                'mediaSource': '',
            },
            media_list=self._media_manager.get_media_list(),
            success=True,
        )
        return response

    def handle_delete_media(self, media_name):
        """
        Handle deletion of a specific media file.

        Args:
            media_name (str): Name of the media file to delete.

        Returns:
            dict: FastAPI-compatible response confirming the deletion.
        """

        self._media_manager.delete_media(media_name)

        response = self.fastapi_media_manager_response(
            type=constants.MEDIA_MANAGER_DATA_TYPE,
            process=constants.DELETE_MEDIA_PROCESS,
            media_data={
                'mediaName': '',
                'mediaSource': '',
            },
            media_list=self._media_manager.get_media_list(),
            success=True,
        )
        return response

    def handle_rename_file(self, old_media_name, new_media_name):
        """
        Handle renaming a media file.

        Args:
            old_media_name (str): Current name of the media file.
            new_media_name (str): New desired name for the media file.

        Returns:
            dict: FastAPI-compatible response confirming the rename.
        """

        self._media_manager.rename_media(old_media_name, new_media_name)

        response = self.fastapi_media_manager_response(
            type=constants.MEDIA_MANAGER_DATA_TYPE,
            process=constants.RENAME_MEDIA_PROCESS,
            media_data={
                'mediaName': new_media_name,
                'mediaSource': '',
            },
            media_list=self._media_manager.get_media_list(),
            success=True,
        )
        return response

    def handle_fetch_media_data(self, media_name):
        """
        Fetch the content or source string of a specific media file.

        Args:
            media_name (str): Name of the media file to fetch.

        Returns:
            dict: FastAPI-compatible response containing the media content.
        """

        media_source_str = self._media_manager.get_media_source_string(
            media_name)

        response = self.fastapi_media_manager_response(
            type=constants.MEDIA_MANAGER_DATA_TYPE,
            process=constants.FETCH_MEDIA_DATA_PROCESS,
            media_data={
                'mediaName': media_name,
                'mediaSource': media_source_str,
            },
            media_list=self._media_manager.get_media_list(),
            success=True,
        )
        return response

    def handle_copy_media_to_system(self, media_path):
        """
        Handle copying media from an external source (USB) into the system.

        Args:
            media_path (str): File path of the media to be copied.

        Returns:
            dict: FastAPI-compatible response confirming the copy operation.
        """

        self._media_manager.copy_media_file(media_path)

        response = self.fastapi_media_manager_response(
            type=constants.MEDIA_MANAGER_DATA_TYPE,
            process=constants.UPLOAD_USB_MEDIA_FILE_PROCESS,
            media_data={
                'mediaName': '',
                'mediaSource': '',
            },
            media_list=self._media_manager.get_media_list(),
            success=True,
        )
        return response

    def handle_error_requests(self, process):
        """
        Generate an error response for a failed or unrecognized media-related request.

        Args:
            process (str): Name of the failed process.

        Returns:
            dict: FastAPI-compatible response indicating failure.
        """

        return self.fastapi_media_manager_response(
            type=constants.MEDIA_MANAGER_DATA_TYPE,
            process=process,
            media_data={
                'mediaName': '',
                'mediaSource': '',
            },
            media_list='',
            success=False,
        )

    def fastapi_media_manager_response(self, type, process, media_data, media_list, success):
        """
        Utility method to build a consistent response object for the media manager endpoints.

        Args:
            type (str): Type of the data (e.g., MEDIA_MANAGER_DATA_TYPE).
            process (str): Identifier of the process being reported.
            media_data (dict): Specific media details such as name and source.
            media_list (list): List of all media entries.
            success (bool): Whether the operation succeeded.

        Returns:
            dict: A structured response dictionary.
        """

        return {
            'type': type,
            'data': {
                'process': process,
                'mediaData': media_data,
                'mediaListData': media_list,
                'success': success,
            }
        }
