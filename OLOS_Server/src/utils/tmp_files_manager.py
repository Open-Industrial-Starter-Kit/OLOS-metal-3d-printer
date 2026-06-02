import tempfile
import os
import atexit
import signal
import sys
from core.constants import CoreConstants as constants


class TempFilesManager:
    """
    Singleton class for managing temporary files throughout the application lifecycle.

    It handles the creation of temp files (including a specific server readiness file)
    and ensures cleanup upon application exit or termination.

    This is especially useful for coordinating server readiness signals with external scripts
    (e.g., launching a frontend interface after confirming the backend is running).

    Attributes:
        _tmp_files (List[str]): List of temporary file paths to be deleted on exit.
    """

    _instance = None
    """
    _instance (TempFilesManager): Singleton instance of the manager.
    """

    def __new__(cls):
        """
        Ensures only one instance of TempFilesManager exists (Singleton pattern).

        Returns:
            TempFilesManager: The single instance of the manager.
        """

        if not cls._instance:
            cls._instance = super().__new__(cls)
            cls._instance._tmp_files = []
            cls._instance._setup_cleanup_hooks()
        return cls._instance

    def create_init_server_tmp_file(self):
        """
        Creates a predefined temp file used to indicate server readiness.

        This file is stored in the system temp directory and contains a fixed message.
        It is useful for scripts that wait for the server to be ready before launching other components 
        (bash script to run the system).
        """

        # Get the system's temporary directory
        temp_dir = tempfile.gettempdir()

        # Construct the full file path
        temp_file_path = os.path.join(
            temp_dir, constants.SERVER_READY_FILE_NAME)

        # add to tmp files list
        self._tmp_files.append(constants.SERVER_READY_FILE_NAME)

        # Create and write to the temporary file
        with open(temp_file_path, 'w') as ready_file:
            ready_file.write("Server is ready")

    def create_temp_file(self, suffix=''):
        """
        Creates a new temporary file with an optional suffix.

        The file is not deleted on close and is automatically cleaned up at exit.

        Args:
            suffix (str): Optional suffix for the file name (e.g., ".txt").

        Returns:
            str: Full path to the created temporary file.
        """

        tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        self._tmp_files.append(tmp_file.name)
        return tmp_file.name

    def _cleanup(self):
        """
        Internal method to delete all tracked temporary files.

        This method is triggered on application exit or when a termination signal is received.
        """

        for path in self._tmp_files:
            try:
                os.unlink(path)
                if os.getenv("ENV") == 'development':
                    print(f"[TempFileManager] Deleted temp file: {path}")
            except FileNotFoundError:
                pass
            except Exception as e:
                print(f"Error: {e}")

        self._tmp_files.clear()

    def _setup_cleanup_hooks(self):
        """
        Internal method to set up cleanup logic via atexit and signal handlers.

        Registers the `_cleanup()` function to be called on process exit or termination (SIGINT/SIGTERM).
        """

        atexit.register(self._cleanup)

        def _signal_handler(sig, frame):
            self._cleanup()
            sys.exit(0)

        signal.signal(signal.SIGINT, _signal_handler)
        signal.signal(signal.SIGTERM, _signal_handler)
