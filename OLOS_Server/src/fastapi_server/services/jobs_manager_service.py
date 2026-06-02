from ..constants import FastAPIServerConstants as constants


class JobsManagerService:
    """Service class for managing job-related file operations via shared queues with the core."""

    @staticmethod
    def _check_response(response, error_msg=''):
        """Check the response for success status and raise an exception if failed.

        Args:
            response (dict): The response dictionary expected to contain 'data' with 'success' key.
            error_msg (str): The error message to raise if response indicates failure.

        Raises:
            Exception: If the response indicates failure.

        Returns:
            dict: The original response if successful.
        """

        if isinstance(response, dict) and not response.get('data').get('success'):
            raise Exception(error_msg)
        return response

    @classmethod
    def open_file(cls, shared_core_data, filename):
        """Request to open a job file by filename.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            filename (str): The name of the job file to open.

        Returns:
            dict: Response from the open job process.

        Raises:
            Exception: If opening the file fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.JOBS_MANAGER_DATA_TYPE,
                {
                    'process': constants.OPEN_JOB_PROCESS,
                    'filename': filename,
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_OPEN_JOB_PROCESS)

    @classmethod
    def delete_file(cls, shared_core_data, filename):
        """Request to delete a job file by filename.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            filename (str): The name of the job file to delete.

        Returns:
            dict: Response from the delete job process.

        Raises:
            Exception: If deleting the file fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.JOBS_MANAGER_DATA_TYPE,
                {
                    'process': constants.DELETE_JOB_PROCESS,
                    'filename': filename,
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_DELETE_JOB_PROCESS)

    @classmethod
    def download_file(cls, shared_core_data, filename):
        """Request to download a job file by filename.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            filename (str): The name of the job file to download.

        Returns:
            dict: Response from the download job process.

        Raises:
            Exception: If downloading the file fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.JOBS_MANAGER_DATA_TYPE,
                {
                    'process': constants.DOWNLOAD_JOB_PROCESS,
                    'filename': filename,
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_DOWNLOAD_JOB_PROCESS)

    @classmethod
    def rename_file(cls, shared_core_data, old_filename, new_filename):
        """Request to rename a job file.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            old_filename (str): Current name of the file.
            new_filename (str): New desired name for the file.

        Returns:
            dict: Response from the rename job process.

        Raises:
            Exception: If renaming the file fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.JOBS_MANAGER_DATA_TYPE,
                {
                    'process': constants.RENAME_JOB_PROCESS,
                    'old_filename': old_filename,
                    'new_filename': new_filename
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_RENAME_JOB_PROCESS)

    @classmethod
    def start_file(cls, shared_core_data):
        """Request to start processing the current job file.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.

        Returns:
            dict: Response from the start job process.

        Raises:
            Exception: If starting the job fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.JOBS_MANAGER_DATA_TYPE,
                {
                    'process': constants.START_JOB_PROCESS,
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_START_JOB_PROCESS)

    @classmethod
    def upload_file(cls, shared_core_data, file):
        """Request to upload a job file.

        Args:
            shared_core_data (object): Shared object containing inter-process communication queues.
            file (UploadFile): File object containing the file to upload; must have 'filename' and 'file.read()' method.

        Returns:
            dict: Response from the upload job process.

        Raises:
            Exception: If uploading the file fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.JOBS_MANAGER_DATA_TYPE,
                {
                    'process': constants.UPLOAD_JOB_PROCESS,
                    'filename': file.filename,
                    'file_content': file.file.read()
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_UPLOAD_JOB_PROCESS)

    @classmethod
    def check_opened_file(cls, shared_core_data):
        """Check the status of the currently opened job file.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.

        Returns:
            dict: Response from the check job process.

        Raises:
            Exception: If checking the opened job file fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.JOBS_MANAGER_DATA_TYPE,
                {
                    'process': constants.CHECK_JOB_PROCESS,
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_CHECK_JOB_PROCESS)

    @classmethod
    def generate_file(cls, shared_core_data, gcode_file_data):
        """Request to generate a job file with given G-code data.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            gcode_file_data (GcodeFileData): Data related to the G-code file generation.

        Returns:
            dict: Response from the generate job process.

        Raises:
            Exception: If generating the job file fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.JOBS_MANAGER_DATA_TYPE,
                {
                    'process': constants.GENERATE_JOB_PROCESS,
                    'gcode_file_data': gcode_file_data
                }])

        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_GENERATE_JOB_PROCESS)

    @classmethod
    def cancel_generate_file(cls, shared_core_data):
        """Request to cancel an ongoing job file generation.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.JOBS_MANAGER_DATA_TYPE,
                {
                    'process': constants.CANCEL_GENERATE_JOB_PROCESS,
                }])

    @classmethod
    def upload_usb_job_file(cls, shared_core_data, file_path):
        """Request to upload a job file from a USB device.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            file_path (str): The path to the USB job file to upload.

        Returns:
            dict: Response from the upload USB job file process.

        Raises:
            Exception: If uploading the USB job file fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.JOBS_MANAGER_DATA_TYPE,
                {
                    'process': constants.UPLOAD_USB_JOB_FILE_PROCESS,
                    'file_path': file_path,
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_UPLOAD_USB_JOB_FILE_PROCESS)
