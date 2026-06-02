import os


class FilesManagerConstants:
    """
    Defines constant values used for managing files and directories in the system.

    This includes base directories for storing job and media files, supported file
    extensions, and limits related to file size.

    Attributes:
        JOB_BASE_DIR (str): Absolute path to the directory where G-code job files are stored.
        MEDIA_BASE_DIR (str): Absolute path to the directory where uploaded media files are stored.
        GCODE_FILE_EXTENSIONS (tuple): Allowed file extensions for G-code files (e.g., '.nc', '.cnc', 'gcode').
        MEDIA_FILES_EXTENSIONS (tuple): Allowed file extensions for media files (e.g., '.jpg', '.svg', '.stl').
        BYTES_TO_KILOBYTES (int): Conversion factor from bytes to kilobytes (1024).
        BYTES_TO_MEGABYTES (int): Conversion factor from bytes to megabytes (1,048,576).
        MAX_FILE_SIZE (int): Maximum allowed file size in bytes. Set to 50 MB.
    """

    JOB_BASE_DIR = os.path.join(os.path.dirname(
        os.path.abspath(__file__)), 'jobs_stored_files')
    MEDIA_BASE_DIR = os.path.join(os.path.dirname(
        os.path.abspath(__file__)), 'media_stored_files')
    GCODE_FILE_EXTENSIONS = (".nc", ".cnc", "gcode")
    MEDIA_FILES_EXTENSIONS = ('.jpg', '.jpeg', '.png',
                              '.svg', '.webp', '.dxf', '.stl', '.obj')
    BYTES_TO_KILOBYTES = 1024
    BYTES_TO_MEGABYTES = 1048576
    MAX_FILE_SIZE = 50 * BYTES_TO_MEGABYTES
