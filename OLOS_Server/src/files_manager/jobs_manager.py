import datetime
import math
import os
import shutil

from utils.image_to_gcode_generator import ImageToGcodeGenerator
from .constants import FilesManagerConstants as constants


class JobsManager:
    """
    Handles management of G-code job files including reading, writing, renaming, deletion,
    and efficient access to file contents line-by-line for execution or simulation purposes.

    The manager also supports generation of new G-code files using the image-to-Gcode Generator module.

    Attributes:
        _job_base_directory (str): The directory where the gcode job files are stored.
        _open_file_path (str): The path for the opened job file.
        _file_content (str): The full content of job file stored in one string.
        _line_counter (int): An indicator which represent which line the system is processing
        _current_file_content_pos (int): Keep track of the line position in the job file content that is being executed. 
        _total_lines_number (int): Represent the total number of lines in the opened file
    """

    def __init__(self):
        self._job_base_directory = constants.JOB_BASE_DIR
        self._open_file_path = None
        # sum all the lines in the file in one string
        # the reason to use this method is to minimize the usage of memory in the system
        self._file_content = ''
        self._line_counter = -1
        self._current_file_content_pos = 0
        self._total_lines_number = 0

    def get_files_list(self):
        """
        Retrieves a list of G-code files in the job directory along with metadata.

        Returns:
            list: A list of dictionaries, each containing:
                - file (str): The file name.
                - date (str): File creation timestamp.
                - size (int): File size in kilobytes.
        """

        # Check if the base directory exists
        # if not create a directory
        if not os.path.exists(self._job_base_directory):
            os.makedirs(self._job_base_directory)

        # Get the list of files with their file info
        files_list_with_info = []
        for filename in os.listdir(self._job_base_directory):
            if any(filename.lower().endswith(ext) for ext in constants.GCODE_FILE_EXTENSIONS):
                file_path = os.path.join(self._job_base_directory, filename)

                # fetching file info
                file_creation_time = self.get_file_creation_time(file_path)
                file_size = self.get_file_size(file_path)

                file_info = {"file": filename,
                             "date": file_creation_time,
                             "size": file_size}

                # add to files list
                files_list_with_info.append(file_info)

        return files_list_with_info

    def get_file_creation_time(self, file_path):
        """
        Returns the formatted creation time of a file.

        Args:
            file_path (str): Full path to the file.

        Returns:
            str or None: Human-readable timestamp or None if file not found.
        """

        try:
            # Get the creation time of the file in seconds since the epoch
            creation_time = os.path.getctime(file_path)

            # Convert the timestamp to a human-readable format with the month's name
            creation_time_formatted = datetime.datetime.fromtimestamp(
                creation_time)
            creation_time_formatted_str = creation_time_formatted.strftime(
                '%d %B %Y %H:%M:%S')

            return creation_time_formatted_str

        except FileNotFoundError:
            print(f"File not found: {file_path}")
            return None

    def get_file_size(self, file_path):
        """
        Calculates the file size in kilobytes.

        Args:
            file_path (str): Full path to the file.

        Returns:
            int or None: File size in KB or None if file not found.
        """

        try:
            # Get the creation time of the file in seconds since the epoch
            file_size_bytes = os.path.getsize(file_path)

            # Convert the file size from bytes to megabytes
            file_size_kb = math.ceil(
                file_size_bytes / constants.BYTES_TO_KILOBYTES)

            return file_size_kb

        except FileNotFoundError:
            print(f"File not found: {file_path}")
            return None

    def open_file(self, filename):
        """
        Opens a G-code file for reading, storing its full content in memory as a string.
        Also initializes line counters for efficient per-line processing.

        Args:
            filename (str): The name of the file to open.
        """

        if self._open_file_path:
            self.close_file()

        self._open_file_path = os.path.join(self._job_base_directory, filename)
        open_file_content = open(self._open_file_path, 'r')

        # get the number of lines inside the file
        self._total_lines_number = sum(1 for _ in open_file_content) - 1

        # rewind the file cursor to the beginning
        open_file_content.seek(0)

        # put all the file content in one string
        self._file_content = open_file_content.read()

        # incase of restart procedure
        self.reset_open_file_indexes()

    def rename_file(self, old_filename, new_filename):
        """
        Renames an existing G-code file. If the file is currently open, it is closed and re-opened
        under the new name.

        Args:
            old_filename (str): Original name of the file.
            new_filename (str): New desired name for the file.
        """

        # check if the user renaming opened file
        opened_filename = self.get_open_filename()
        is_opened_file = old_filename == opened_filename
        # close the file before renaming it
        if is_opened_file:
            self.close_file()

        old_file = os.path.join(self._job_base_directory, old_filename)
        new_file = os.path.join(self._job_base_directory, new_filename)

        stat = os.stat(old_file)
        os.utime(old_file, (stat.st_atime, stat.st_mtime))
        os.rename(old_file, new_file)

        # reopen the new renamed file in case renaming an open file
        if is_opened_file:
            self.open_file(new_filename)

    def get_open_filename(self):
        """
        Returns the name of the currently opened file.

        Returns:
            str: Relative filename if a file is open, empty string otherwise.
        """

        if self._open_file_path:
            # remove the base_directory from the file name
            return os.path.relpath(self._open_file_path, self._job_base_directory)
        return ''

    def get_opened_file_content(self):
        """
        Returns the full content of the currently opened file.

        Returns:
            str: Full file content as a string.
        """

        return self._file_content

    def get_line_index(self):
        """
        Returns the current line index being processed in the file.

        Returns:
            int: The index of the current line (0-based).
        """

        return self._line_counter

    def get_total_lines(self):
        """
        Returns the total number of lines in the currently opened file.

        Returns:
            int: Total line count.
        """

        return self._total_lines_number

    def get_next_line(self):
        """
        Reads and returns the next line from the file content string, updating the internal pointer.

        Returns:
            str or None: The next line without newline characters, or None if end of file is reached.
        """

        # If we've reached the end of the string, return None
        if self._current_file_content_pos >= len(self._file_content):
            return None

        # Increase the lines counter
        self._line_counter += 1

        # Find the next newline character from the current position
        next_newline_pos = self._file_content.find(
            '\n', self._current_file_content_pos)

        # If no newline is found, we're at the last line
        if next_newline_pos == -1:
            line = self._file_content[self._current_file_content_pos:]
            # Move position to the end
            self._current_file_content_pos = len(self._file_content)
        else:
            # Extract the line from the current position to the newline
            line = self._file_content[self._current_file_content_pos:next_newline_pos]
            self._current_file_content_pos = next_newline_pos + \
                1  # Move position past the newline

        # Strip any trailing whitespace
        return line.strip()

    def reset_open_file_indexes(self):
        """
        Resets internal tracking of line position and counters for the opened file.
        Used during restarts or reinitialization.
        """

        # reset the index
        self._line_counter = -1
        self._current_file_content_pos = 0

    def write_gcode_file(self, filename, file_content):
        """
        Writes G-code content to a file. Ensures content is UTF-8 encoded and normalized for newlines.

        Args:
            filename (str): Target file name.
            file_content (bytes): G-code content in bytes (typically UTF-8).
        """

        file_path = os.path.join(self._job_base_directory, filename)

        if isinstance(file_content, bytes):
            file_content = file_content.decode('utf-8')

        # Split content into lines
        lines = file_content.splitlines()

        # Join the lines back together
        updated_content = '\n'.join(lines)

        # Write the modified content to the file
        with open(file_path, 'wb') as gcode_file:
            gcode_file.write(updated_content.encode('utf-8'))

            # incase the user uploaded the file that has the name similar to opened file
            if filename == self.get_open_filename():
                self._file_content = updated_content

    def copy_gcode_file(self, file_path):
        """
        Copies an external G-code file into the job directory.

        Args:
            file_path (str): Full path to the source file.
        """

        shutil.copy(file_path, constants.JOB_BASE_DIR)

    def delete_file(self, filename):
        """
        Deletes a specified G-code file. If the file is currently open, it is closed first.

        Args:
            filename (str): Name of the file to delete.
        """

        # close the file if it is the same open file before delete
        opened_filename = self.get_open_filename()
        if opened_filename == filename:
            self.close_file()

        file_path = os.path.join(self._job_base_directory, filename)
        os.remove(file_path)

    def get_file_path(self, filename):
        """
        Returns the full path to a file in the job directory.

        Args:
            filename (str): Name of the file.

        Returns:
            str: Full path to the file, or empty string if no name is given.
        """

        if filename:
            file_path = os.path.join(self._job_base_directory, filename)
            return file_path
        return ''

    def generate_gcode_file(self, gcode_file_data):
        """
        Generates G-code from image data using the ImageToGcodeGenerator and writes it to disk.

        Args:
            gcode_file_data: An object containing the name and data needed for G-code generation.
        """

        gcode_file_content = ImageToGcodeGenerator.generate_gcode(
            gcode_file_data)
        # write the generated gcode in the file system
        filename = gcode_file_data.name
        self.write_gcode_file(filename, gcode_file_content)

    def close_file(self):
        """
        Closes the currently opened file and clears its cached content and tracking state.
        """

        self._open_file_path = None
        self._file_content = ''
