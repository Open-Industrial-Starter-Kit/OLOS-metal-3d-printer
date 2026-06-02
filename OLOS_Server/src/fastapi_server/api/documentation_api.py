"""
Documentation Server API
========================

This module provides a FastAPI endpoint to serve pre-built HTML documentation
(e.g., Sphinx-generated documentation) from the `docs/build/html` directory.
It supports serving any requested documentation file path, falling back to the
main `index.html` if the requested file is not found.

The endpoint is primarily intended for exposing project documentation through
the REST API so that it can be accessed from the web interface.

Constants:
    DOCS_PATH (str): Absolute path to the built documentation's `html` directory.

Routes:
    GET /{path:path}
        Serves the requested documentation file from the HTML build directory.
"""

import os
from fastapi import APIRouter
from fastapi.responses import FileResponse

# Absolute path to the built documentation folder
DOCS_PATH = os.path.abspath(
    os.path.join(__file__, "../../../../docs/build/html")
)

router = APIRouter()


@router.get("/{path:path}")
async def serve_documentation(path: str):
    """Serve a documentation file from the built HTML documentation directory.

    If the requested path is a directory or ends with a slash, `index.html`
    is automatically appended. If the requested file is not found, the main
    documentation index page is returned as a fallback.

    Args:
        path (str): The relative path of the documentation file requested.

    Returns:
        FileResponse: The requested HTML documentation file, or the main
        index page if the file is not found.
    """

    if not path or path.endswith("/"):
        path = path + "index.html"

    file_path = os.path.join(DOCS_PATH, path)

    if os.path.isfile(file_path):
        return FileResponse(file_path)

    # If not found, return the main index
    return FileResponse(os.path.join(DOCS_PATH, "index.html"))
