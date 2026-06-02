"""
Media Manager API Endpoints
===========================

This module provides REST API endpoints for managing media files used in the system.
It supports listing available media, fetching specific files, uploading new files,
deleting, renaming, and uploading media from USB devices.

Endpoints:
    GET /list
        Retrieve the list of stored media files with details (name, date, size).
    GET /fetch/{media_name}
        Retrieve the base64 representation or metadata of a specific media file.
    POST /upload
        Upload a new media file to the system.
    DELETE /delete/{media_name}
        Delete a media file by its name.
    PUT /rename
        Rename an existing media file.
    POST /upload_usb_media_file
        Upload a media file from a connected USB device.
"""

from fastapi import APIRouter, UploadFile, HTTPException, File, Request
from fastapi.responses import JSONResponse

from ..models.media_manager_model import MediaManagerResponse, RenameMediaData, USBMediaFileData
from ..services.media_manager_service import MediaManagerService

router = APIRouter()


@router.get("/list", response_model=MediaManagerResponse)
def media_list_data(request: Request):
    """Retrieve the list of available media files.

    Args:
        request (Request): FastAPI request object containing shared core data.

    Returns:
        JSONResponse: List of media files with their details.

    Raises:
        HTTPException: If retrieval fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = MediaManagerService.media_list_data(shared_core_data)
        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/fetch/{media_name}", response_model=MediaManagerResponse)
def fetch_media_data(request: Request, media_name: str):
    """Fetch details or encoded data of a specific media file.

    Args:
        request (Request): FastAPI request object containing shared core data.
        media_name (str): Name of the media file to fetch.

    Returns:
        JSONResponse: Media file data or encoded content.

    Raises:
        HTTPException: If fetching fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = MediaManagerService.fetch_media_data(
            shared_core_data, media_name)
        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/upload", response_model=MediaManagerResponse)
def upload_media(request: Request, file: UploadFile = File(...)):
    """Upload a new media file.

    Args:
        request (Request): FastAPI request object containing shared core data.
        file (UploadFile): The uploaded media file.

    Returns:
        JSONResponse: Confirmation of the upload.

    Raises:
        HTTPException: If upload fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = MediaManagerService.upload_media(
            shared_core_data, file)
        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        print(error)
        raise HTTPException(status_code=500, detail=str(error))


@router.delete("/delete/{media_name}", response_model=MediaManagerResponse)
def delete_media(request: Request, media_name: str):
    """Delete a media file.

    Args:
        request (Request): FastAPI request object containing shared core data.
        media_name (str): Name of the media file to delete.

    Returns:
        JSONResponse: Confirmation of deletion.

    Raises:
        HTTPException: If deletion fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = MediaManagerService.delete_media(
            shared_core_data, media_name)
        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.put("/rename", response_model=MediaManagerResponse)
def rename_media(request: Request, rename_data: RenameMediaData):
    """Rename an existing media file.

    Args:
        request (Request): FastAPI request object containing shared core data.
        rename_data (RenameMediaData): Old and new media file names.

    Returns:
        JSONResponse: Confirmation of renaming.

    Raises:
        HTTPException: If renaming fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = MediaManagerService.rename_media(
            shared_core_data, rename_data.old_media_name, rename_data.new_media_name)
        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/upload_usb_media_file", response_model=MediaManagerResponse)
def upload_media_file_from_usb_device(request: Request, usb_media_data: USBMediaFileData):
    """Upload a media file from a USB device.

    Args:
        request (Request): FastAPI request object containing shared core data.
        usb_media_data (USBMediaFileData): Path and name of the media file on the USB device.

    Returns:
        JSONResponse: Confirmation of the upload.

    Raises:
        HTTPException: If USB upload fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = MediaManagerService.upload_usb_media_file(
            shared_core_data, usb_media_data.media_path)
        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
