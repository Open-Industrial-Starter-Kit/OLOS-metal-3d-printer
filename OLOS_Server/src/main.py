"""
Main entry point for starting the machine control server.

This script initializes the core server logic and starts all necessary subsystems
such as machine communication, WebSocket server, REST API, job/media managers, slicing,
and AI processing if configured.

It uses `multiprocessing.freeze_support()` to ensure compatibility with frozen executables
(e.g., when packaged with PyInstaller on Windows).
"""

from multiprocessing import freeze_support
from core.server_core import ServerCore

if __name__ == "__main__":
    # Required for Windows support when the application is frozen into an executable.
    freeze_support()

    # Initialize and start the main server controller which orchestrates all subsystems.
    server_core = ServerCore()
    server_core.start()
