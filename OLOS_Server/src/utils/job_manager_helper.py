"""
This module handles all machine jobs manager functionalities and communication
with FastAPI and WebSocket queues in a multiprocessing-safe manner.

Classes:
    JobsManagerHelper: Main helper class to manage jobs manager workflows.
Functions:
    generate_file: Worker function executed in a separate process to perform generating gcode file from images.
"""

import multiprocessing
import re
from core.constants import CoreConstants as constants


def generate_file(jobs_manager, gcode_file_data, queue):
    """
    Generates a G-code file (from images data for laser cutters) using the given job manager and puts the result in a multiprocessing queue.

    This function is intended to run in a separate process.

    Args:
        jobs_manager (JobsManager): An instance of the job manager responsible for file operations.

        gcode_file_data (obj): An object containing data for generating the G-code file (usually includes name).

        queue (PriorityQueueWithCounter): A queue to return the result dictionary to the core.

    """
    try:
        # generate gcode for image file(s)
        jobs_manager.generate_gcode_file(
            gcode_file_data)

        filename = gcode_file_data.name

        result = JobsManagerHelper.fastapi_jobs_manager_response(
            type=constants.JOBS_MANAGER_DATA_TYPE,
            process=constants.GENERATE_JOB_PROCESS,
            file_data={
                'fileName': filename,
                'fileContent': '',
                'materialName': '-',
                'materialImage': '',
                'materialThickness': '-'
            },
            files_list=jobs_manager.get_files_list(),
            success=True
        )
    except Exception as e:
        print("Error:", e)
        result = JobsManagerHelper.fastapi_jobs_manager_response(
            type=constants.JOBS_MANAGER_DATA_TYPE,
            process=constants.GENERATE_JOB_PROCESS,
            file_data={
                'fileName': filename,
                'fileContent': '',
                'materialName': '-',
                'materialImage': '',
                'materialThickness': '-'
            },
            files_list='',
            success=False
        )

    finally:
        # check if result is empty dict
        if result:
            queue.put(result)


class JobsManagerHelper:
    """
    Helper class to manage file-based G-code jobs and provide responses
    for FastAPI endpoints (interface).

    This class abstracts file operations like open, delete, rename, upload, etc.,
    and supports G-code generation in a background process.

    Attributes:
        _jobs_manager(JobsManager): The jobs manager instance responsible for file handling.
        _material_library_helper(MaterialsLibraryHelper): Optional helper for file material data.
        _generate_file_process (multiprocessing.Process | None): Represent the gcode generator process. 

    Args:
        jobs_manager(JobsManager): The jobs manager instance responsible for file handling.
        material_library_helper(MaterialsLibraryHelper, optional): Optional helper for file material data.
    """

    def __init__(self, jobs_manager, material_library_helper=None):
        self._jobs_manager = jobs_manager
        self._material_library_helper = material_library_helper

        # running generating process on separate process
        self._generate_file_process = None

    def handle_upload_file(self, filename, file_content):
        """
        Uploads and writes a file to the system using the jobs manager.

        Args:
            filename (str): Name of the uploaded file.
            file_content (str): The content of the G-code file.

        Returns:
            dict: A standard response dict for the frontend.
        """

        # Create a new file with the same name of the file uploaded
        self._jobs_manager.write_gcode_file(filename, file_content)
        response = self.fastapi_jobs_manager_response(
            type=constants.JOBS_MANAGER_DATA_TYPE,
            process=constants.UPLOAD_JOB_PROCESS,
            file_data={
                'fileName': '-',
                'fileContent': '',
                'materialName': '-',
                'materialImage': '',
                'materialThickness': '-'
            },
            files_list=self._jobs_manager.get_files_list(),
            success=True,
        )

        return response

    # open selected file by user

    def handle_open_file(self, filename):
        """
        Opens a file, reads its content, and returns metadata and content.

        Args:
            filename (str): File to open.

        Returns:
            dict: A standard response including file metadata and contents.
        """

        self._jobs_manager.open_file(filename)

        material_name, material_image, material_thickness = self._get_opened_file_material_settings()
        file_content = self._jobs_manager.get_opened_file_content()

        response = self.fastapi_jobs_manager_response(
            type=constants.JOBS_MANAGER_DATA_TYPE,
            process=constants.OPEN_JOB_PROCESS,
            file_data={
                'fileName': filename,
                'fileContent': file_content if file_content else '',
                'materialName': material_name if material_name else '-',
                'materialImage': material_image if material_image else '',
                'materialThickness': material_thickness if material_thickness else '-'
            },
            files_list=self._jobs_manager.get_files_list(),
            success=True,
        )

        return response

    def handle_start_file(self, machine_connector, job_execution_timer):
        """
        Starts execution of the currently opened file.

        Args:
            machine_connector(MachineConnector): The interface to the machine hardware.
            job_execution_timer(JobExecutionTimer): Timer used to measure job duration.

        Returns:
            dict: A standard response containing the opened file's data or error.
        """

        opened_file = self._jobs_manager.get_open_filename()
        # make sure the file is open
        if opened_file is not None:
            # reopen in case of restarting the file again
            self._jobs_manager.open_file(opened_file)

            # when start executing file reset the counter
            machine_connector.reset_counter()

            # reset the job execution timer and start new one
            job_execution_timer.reset()
            job_execution_timer.start()

            material_name, material_image, material_thickness = self._get_opened_file_material_settings()
            file_content = self._jobs_manager.get_opened_file_content()

            # get opened file
            response = self.fastapi_jobs_manager_response(
                type=constants.JOBS_MANAGER_DATA_TYPE,
                process=constants.START_JOB_PROCESS,
                file_data={
                    'fileName': opened_file,
                    'fileContent': file_content,
                    'materialName': material_name,
                    'materialImage': material_image,
                    'materialThickness': material_thickness
                },
                files_list=self._jobs_manager.get_files_list(),
                success=True,
            )

        else:
            print('There is no file open in the system')
            # get opened file
            response = self.fastapi_jobs_manager_response(
                type=constants.JOBS_MANAGER_DATA_TYPE,
                process=constants.START_JOB_PROCESS,
                file_data={
                    'fileName': '-',
                    'fileContent': '',
                    'materialName': '-',
                    'materialImage': '',
                    'materialThickness': '-'
                },
                files_list=self._jobs_manager.get_files_list(),
                success=False,
            )

        return response

    def handle_delete_file(self, filename):
        """
        Deletes the given file from the system.

        Args:
            filename (str): The name of the file to delete.

        Returns:
            dict: A response containing updated file list.
        """

        # delete the file from the system
        self._jobs_manager.delete_file(filename)

        response = self.fastapi_jobs_manager_response(
            type=constants.JOBS_MANAGER_DATA_TYPE,
            process=constants.DELETE_JOB_PROCESS,
            file_data={
                'fileName': '-',
                'fileContent': '',
                'materialName': '-',
                'materialImage': '',
                'materialThickness': '-'
            },
            files_list=self._jobs_manager.get_files_list(),
            success=True,
        )

        return response

    def handle_download_file(self, filename):
        """
        Returns the file path for downloading the specified file.

        Args:
            filename (str): The name of the file to download.

        Returns:
            str: The full path to the file.
        """

        # download the file from the system
        file_path = self._jobs_manager.get_file_path(filename)
        return file_path

    def handle_generate_gcode_file(self, gcode_file_data, write_queue):
        """
        Starts G-code file generation in a new process.

        Args:
            gcode_file_data(obj): Data used for G-code generation.
            write_queue (PriorityQueueWithCounter): Queue to return the result.
        """

        # Start the generate_images function in a separate process
        self._generate_file_process = multiprocessing.Process(
            target=generate_file, args=(
                self._jobs_manager,
                gcode_file_data,
                write_queue))

        self._generate_file_process.start()

    def handle_cancel_generate_file(self):
        """
        Cancels an ongoing G-code generation process if it exists.

        Returns:
            dict: Standard cancellation response.
        """

        # Signal the cancel event and terminate the process if it's running
        if self._generate_file_process is not None:
            self._generate_file_process.terminate()
            self._generate_file_process.join()

        files_list = self._jobs_manager.get_files_list(),
        result = self.fastapi_jobs_manager_response(
            constants.JOBS_MANAGER_DATA_TYPE, constants.CANCEL_GENERATE_JOB_PROCESS, '', files_list, True
        )

        return result

    def handle_rename_file(self, old_filename, new_filename):
        """
        Renames a file from old to new.

        Args:
            old_filename (str): Current name.
            new_filename (str): New name.

        Returns:
            dict: A response including updated file list.
        """

        self._jobs_manager.rename_file(old_filename, new_filename)

        response = self.fastapi_jobs_manager_response(
            type=constants.JOBS_MANAGER_DATA_TYPE,
            process=constants.RENAME_JOB_PROCESS,
            file_data={
                'fileName': new_filename,
                'fileContent': '',
                'materialName': '-',
                'materialImage': '',
                'materialThickness': '-'
            },
            files_list=self._jobs_manager.get_files_list(),
            success=True,
        )

        return response

    def handle_check_opened_file(self):
        """
        Checks which file is currently open and retrieves its data.

        Returns:
            dict: A response including file content and material settings.
        """

        file_name = self._jobs_manager.get_open_filename()
        material_name, material_image, material_thickness = self._get_opened_file_material_settings()
        file_content = self._jobs_manager.get_opened_file_content()

        response = self.fastapi_jobs_manager_response(
            type=constants.JOBS_MANAGER_DATA_TYPE,
            process=constants.CHECK_JOB_PROCESS,
            file_data={
                'fileName': file_name if file_name else '-',
                'fileContent': file_content if file_content else '',
                'materialName': material_name if material_name else '-',
                'materialImage': material_image if material_image else '',
                'materialThickness': material_thickness if material_thickness else '-'
            },
            files_list=self._jobs_manager.get_files_list(),
            success=True,
        )
        return response

    def handle_copy_file_to_system(self, file_path):
        """
        Copies a G-code file from USB into the system.

        Args:
            file_path(str): Path of the file to copy.

        Returns:
            dict: Upload response with updated file list.
        """

        self._jobs_manager.copy_gcode_file(file_path)

        response = self.fastapi_jobs_manager_response(
            type=constants.JOBS_MANAGER_DATA_TYPE,
            process=constants.UPLOAD_USB_JOB_FILE_PROCESS,
            file_data={
                'fileName': '-',
                'fileContent': '',
                'materialName': '-',
                'materialImage':  '',
                'materialThickness': '-'
            },
            files_list=self._jobs_manager.get_files_list(),
            success=True,
        )

        return response

    def _get_opened_file_material_settings(self):
        """
        Extracts material name, image, and thickness from the opened file.

        Returns:
            tuple:(material_name, material_image, material_thickness)
        """

        file_content = self._jobs_manager.get_opened_file_content()
        # Extracting material settings values from file content
        material_name_match = re.search(
            f"{constants.MATERIAL_NAME_SEARCH_KEYWORD}\s*(.*)", file_content)
        material_thickness_match = re.search(
            f"{constants.MATERIAL_THICKNESS_SEARCH_KEYWORD}\s*(.*)", file_content)

        material_name = material_name_match.group(
            1) if material_name_match else ''
        material_thickness = material_thickness_match.group(
            1) if material_thickness_match else ''

        # fetch material image from the database if any
        material_image = ''
        if self._material_library_helper:
            material_image = self._material_library_helper.handle_fetch_material_image(
                material_name)

        return material_name, material_image, material_thickness

    def handle_error_requests(self, process):
        """
        Returns a failure response for a given process.

        Args:
            process (str): The process name or ID.

        Returns:
            dict: A failed standard response.
        """

        return self.fastapi_jobs_manager_response(
            type=constants.JOBS_MANAGER_DATA_TYPE,
            process=process,
            file_data={
                'fileName': '-',
                'fileContent': '',
                'materialName': '-',
                'materialImage': '',
                'materialThickness': '-'
            },
            files_list='',
            success=False,
        )

    @staticmethod
    def fastapi_jobs_manager_response(type, process, file_data, files_list, success):
        """
        Generates a standardized response object.

        Args:
            type (str): Type of data (usually from constants).
            process (str): Process being executed.
            file_data (dict or str): Metadata for the involved file.
            files_list (list or str): Current list of available files.
            success (bool): Whether the operation was successful.

        Returns:
            dict: Response structure for the frontend.
        """

        return {
            'type': type,
            'data': {
                'process': process,
                'fileData': file_data,
                'filesListData': files_list,
                'success': success,
            }
        }
