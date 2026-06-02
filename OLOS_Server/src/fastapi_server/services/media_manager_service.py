from ..constants import FastAPIServerConstants as constants


class MediaManagerService:
    """Service class for managing media-related operations via shared queues with the core."""

    @staticmethod
    def _check_response(response, error_msg=''):
        """Check the response for success and raise an exception if failed.

        Args:
            response (dict): The response expected to have a 'data' dict with a 'success' flag.
            error_msg (str): Error message to raise if response indicates failure.

        Raises:
            Exception: If the response indicates failure.

        Returns:
            dict: The original response if successful.
        """

        if isinstance(response, dict) and not response.get('data').get('success'):
            raise Exception(error_msg)
        return response

    @classmethod
    def media_list_data(cls, shared_core_data):
        """Retrieve a list of media data available.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.

        Returns:
            dict: Response containing media list.

        Raises:
            Exception: If listing media data fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.MEDIA_MANAGER_DATA_TYPE,
                {
                    'process': constants.LIST_MEDIA_DATA_PROCESS,
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_LIST_MEDIA_DATA_PROCESS)

    @classmethod
    def fetch_media_data(cls, shared_core_data, media_name):
        """Fetch data for a specific media item by name.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            media_name (str): The name of the media item to fetch.

        Returns:
            dict: Response containing the requested media data.

        Raises:
            Exception: If fetching the media data fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.MEDIA_MANAGER_DATA_TYPE,
                {
                    'process': constants.FETCH_MEDIA_DATA_PROCESS,
                    'media_name': media_name,
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_FETCH_MEDIA_DATA_PROCESS)

    @classmethod
    def delete_media(cls, shared_core_data, media_name):
        """Delete a media item by name.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            media_name (str): The name of the media item to delete.

        Returns:
            dict: Response from the delete media process.

        Raises:
            Exception: If deleting the media item fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.MEDIA_MANAGER_DATA_TYPE,
                {
                    'process': constants.DELETE_MEDIA_PROCESS,
                    'media_name': media_name,
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_DELETE_MEDIA_PROCESS)

    @classmethod
    def rename_media(cls, shared_core_data, old_media_name, new_media_name):
        """Rename a media item.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            old_media_name (str): Current name of the media item.
            new_media_name (str): New name for the media item.

        Returns:
            dict: Response from the rename media process.

        Raises:
            Exception: If renaming the media item fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.MEDIA_MANAGER_DATA_TYPE,
                {
                    'process': constants.RENAME_MEDIA_PROCESS,
                    'old_media_name': old_media_name,
                    'new_media_name': new_media_name
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_RENAME_MEDIA_PROCESS)

    @classmethod
    def upload_media(cls, shared_core_data, file):
        """Upload a new media file.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            file (UploadFile): File object containing media file to upload.

        Returns:
            dict: Response from the upload media process.

        Raises:
            Exception: If uploading the media file fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.MEDIA_MANAGER_DATA_TYPE,
                {
                    'process': constants.UPLOAD_MEDIA_PROCESS,
                    'media_name': file.filename,
                    'media_content': file.file.read()
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_UPLOAD_MEDIA_PROCESS)

    @classmethod
    def upload_usb_media_file(cls, shared_core_data, media_path):
        """Upload a media file from a USB path.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            media_path (str): File system path to the USB media file.

        Returns:
            dict: Response from the upload USB media file process.

        Raises:
            Exception: If uploading the USB media file fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.MEDIA_MANAGER_DATA_TYPE,
                {
                    'process': constants.UPLOAD_USB_MEDIA_FILE_PROCESS,
                    'media_path': media_path,
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_UPLOAD_USB_MEDIA_FILE_PROCESS)
