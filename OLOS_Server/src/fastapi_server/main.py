from multiprocessing import Process
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from uvicorn import run
from .constants import FastAPIServerConstants as constants
from .api.jobs_manager_api import router as jobs_manager_router
from .api.media_manager_api import router as media_manager_router
from .api.ai_api import router as ai_router
from .api.material_library_api import router as material_library_router
from .api.slice_api import router as slice_router
from .api.documentation_api import router as documentation_router
import os
from dotenv import load_dotenv

load_dotenv()


class FastApiServer(Process):
    """FastAPI server process for handling REST API requests.

    This class runs the FastAPI application in a separate process, providing REST API
    endpoints for job management, media handling, AI image generation, material
    library management, slicing operations and the complete documentation for the source code. It integrates with the main
    server core via shared data.

    Args:
        shared_core_data (obj): Shared data object for communication between the
            FastAPI server and the core server components.

    Attributes:
        app (FastAPI): The FastAPI application instance.
        shared_core_data (obj): Reference to the shared core data for accessing
            and manipulating system state across processes.
    """

    def __init__(self, shared_core_data):
        super(FastApiServer, self).__init__()

        # FastAPi instance
        self.app = None

        # shared data with the core
        self.shared_core_data = shared_core_data

    def run(self):
        """Run the FastAPI server.

        Initializes the FastAPI application, attaches shared data to the app,
        configures middleware, registers API routers, and starts the Uvicorn server.
        """

        # share file manager service
        self.app = FastAPI(title="OLOS API", docs_url="/swagger")

        # add shared data to the application request
        self.app.shared_core_data = self.shared_core_data

        self._create_app()

        self._start_server()

    def _create_app(self):
        """Configure the FastAPI application.

        Adds middleware (including CORS) and registers all API routers with their
        respective route prefixes:

        - Jobs Manager API
        - Media Manager API
        - AI API
        - Material Library API
        - Slice API
        - Documentation API
        """

        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # serve documentation static files
        DOCS_PATH = os.path.abspath(
            os.path.join(__file__, "../../../docs/build/html")
        )

        self.app.mount(
            "/docs/_static",
            StaticFiles(directory=f"{DOCS_PATH}/_static"),
            name="documentation_static",
        )

        # Include routers
        self.app.include_router(
            jobs_manager_router, prefix=constants.JOBS_MANAGER_ROUTE)
        self.app.include_router(
            media_manager_router, prefix=constants.MEDIA_MANAGER_ROUTE)
        self.app.include_router(
            ai_router, prefix=constants.AI_ROUTE)
        self.app.include_router(
            material_library_router, prefix=constants.MATERIAL_LIBRARY_ROUTE)
        self.app.include_router(
            slice_router, prefix=constants.SLICE_ROUTE)
        self.app.include_router(
            documentation_router, prefix=constants.DOCUMENTATION_ROUTE)

    def _start_server(self):
        """Start the FastAPI application using Uvicorn.

        Uses configuration from environment variables:

        - ``HOST``: Host address to bind the server.
        - ``FASTAPI_PORT``: Port number for the server.
        - ``ENV``: Environment type (``development`` enables debug logs).

        The server runs with logging adjusted based on the environment.
        """

        run(
            self.app,
            host=os.getenv('HOST'),
            port=int(os.getenv('FASTAPI_PORT')),
            log_level="debug" if os.getenv(
                'ENV') == 'development' else "warning",
        )
