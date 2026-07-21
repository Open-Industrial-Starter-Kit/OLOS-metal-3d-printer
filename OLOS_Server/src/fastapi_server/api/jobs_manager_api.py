"""
Jobs Manager API Endpoints
==========================

This module defines REST API routes for managing G-code job files in the system.
It enables uploading, opening, renaming, deleting, generating, and downloading jobs,
as well as initiating job execution and handling cancellations.

Endpoints:
    POST /open/{filename}
        Open an existing job file.
    POST /upload
        Upload a new job file to the system.
    DELETE /delete/{filename}
        Delete a job file.
    POST /download/{filename}
        Download a job file.
    PUT /rename
        Rename an existing job file.
    POST /generate
        Generate a new G-code job from provided parameters.
    POST /cancel
        Cancel a running job generation process.
    POST /start
        Start execution of the opened job file.
    GET /check
        Check if a job is currently opened.
    POST /upload_usb_job_file
        Upload a job file from a connected USB device.
"""

import json
import os

from fastapi import APIRouter, UploadFile, HTTPException, File, Request
from fastapi.responses import JSONResponse, FileResponse

from ..models.jobs_manager_model import GcodeFileData, JobProjectData, JobsManagerResponse, RenameJobData, SaveJobData, USBJobFileData
from ..services.jobs_manager_service import JobsManagerService
from ..constants import FastAPIServerConstants as constants
from files_manager.constants import FilesManagerConstants

router = APIRouter()
PROJECT_SUFFIX = ".olos-project.json"


def _project_path(filename: str):
    if not filename or os.path.basename(filename) != filename:
        raise ValueError("Invalid job filename")
    return os.path.join(
        FilesManagerConstants.JOB_BASE_DIR, filename + PROJECT_SUFFIX)


@router.post("/project/{filename}")
def save_job_project(filename: str, project_data: JobProjectData):
    """Save internal model and slicer settings beside a G-code job."""
    try:
        os.makedirs(FilesManagerConstants.JOB_BASE_DIR, exist_ok=True)
        with open(_project_path(filename), "w", encoding="utf-8") as project_file:
            json.dump(project_data.dict(), project_file)
        return {"success": True}
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/project/{filename}")
def load_job_project(filename: str):
    """Load internal model and slicer settings for a G-code job."""
    try:
        path = _project_path(filename)
        if not os.path.exists(path):
            raise HTTPException(
                status_code=404,
                detail="This job has no saved slicer model or settings.")
        with open(path, "r", encoding="utf-8") as project_file:
            return json.load(project_file)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/open/{filename}", response_model=JobsManagerResponse)
def open_job(request: Request, filename: str):
    """Open an existing job file.

    Args:
        request (Request): FastAPI request object containing shared core data.
        filename (str): Name of the job file to open.

    Returns:
        JSONResponse: Core system response with job file content and status.

    Raises:
        HTTPException: If the file cannot be opened (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = JobsManagerService.open_file(
            shared_core_data, filename)

        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/upload", response_model=JobsManagerResponse)
def upload_job(request: Request, file: UploadFile = File(...)):
    """Upload a new job file.

    Args:
        request (Request): FastAPI request object containing shared core data.
        file (UploadFile): Uploaded G-code file.

    Returns:
        JSONResponse: Core system response confirming upload status.

    Raises:
        HTTPException: If the upload fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = JobsManagerService.upload_file(
            shared_core_data, file)

        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.delete("/delete/{filename}", response_model=JobsManagerResponse)
def delete_job(request: Request, filename: str):
    """Delete a job file from the system.

    Args:
        request (Request): FastAPI request object containing shared core data.
        filename (str): Name of the job file to delete.

    Returns:
        JSONResponse: Core system response confirming deletion.

    Raises:
        HTTPException: If deletion fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = JobsManagerService.delete_file(
            shared_core_data, filename)
        project_path = _project_path(filename)
        if os.path.exists(project_path):
            os.remove(project_path)

        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/download/{filename}", response_model=JobsManagerResponse)
def download_job(request: Request, filename: str):
    """Download a job file.

    Args:
        request (Request): FastAPI request object containing shared core data.
        filename (str): Name of the job file to download.

    Returns:
        FileResponse: The requested job file as a binary stream.

    Raises:
        HTTPException: If the file cannot be downloaded (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = JobsManagerService.download_file(
            shared_core_data, filename)

        return FileResponse(core_response, media_type='application/octet-stream', filename=filename, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.put("/rename", response_model=JobsManagerResponse)
def rename_job(request: Request, rename_data: RenameJobData):
    """Rename an existing job file.

    Args:
        request (Request): FastAPI request object containing shared core data.
        rename_data (RenameJobData): Old and new filenames.

    Returns:
        JSONResponse: Core system response confirming rename.

    Raises:
        HTTPException: If renaming fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = JobsManagerService.rename_file(
            shared_core_data, rename_data.old_filename, rename_data.new_filename)
        old_project_path = _project_path(rename_data.old_filename)
        new_project_path = _project_path(rename_data.new_filename)
        if os.path.exists(old_project_path):
            os.replace(old_project_path, new_project_path)

        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.put("/save", response_model=JobsManagerResponse)
def save_job(request: Request, save_data: SaveJobData):
    """Save edited G-code content for an existing job file."""

    try:
        shared_core_data = request.app.shared_core_data
        core_response = JobsManagerService.save_file(
            shared_core_data, save_data.filename, save_data.file_content)

        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/generate", response_model=JobsManagerResponse)
def generate_job(request: Request, data: GcodeFileData):
    """Generate a G-code job file from provided parameters.

    Args:
        request (Request): FastAPI request object containing shared core data.
        data (GcodeFileData): Parameters for G-code generation.

    Returns:
        JSONResponse: Generated G-code file data.
                      Returns status 499 if generation was cancelled.

    Raises:
        HTTPException: If generation fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data

        core_response = JobsManagerService.generate_file(
            shared_core_data, data)

        # client cancel generating process
        if core_response.get('data').get('process') == constants.CANCEL_GENERATE_JOB_PROCESS:
            return JSONResponse(core_response, status_code=499)

        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/cancel")
def cancel_generate_job(request: Request):
    """Cancel an ongoing job generation process.

    Args:
        request (Request): FastAPI request object containing shared core data.

    Returns:
        JSONResponse: Confirmation message of cancellation.

    Raises:
        HTTPException: If cancellation fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        JobsManagerService.cancel_generate_file(
            shared_core_data)

        return JSONResponse({"message": "Cancellation successful"}, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/start", response_model=JobsManagerResponse)
def start_job(request: Request):
    """Start execution of the opened job file.

    Args:
        request (Request): FastAPI request object containing shared core data.

    Returns:
        JSONResponse: Core system response indicating job execution status.

    Raises:
        HTTPException: If execution fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = JobsManagerService.start_file(
            shared_core_data)

        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/check", response_model=JobsManagerResponse)
def check_opened_job(request: Request):
    """Check if there is a job file currently opened.

    Args:
        request (Request): FastAPI request object containing shared core data.

    Returns:
        JSONResponse: Core system response indicating opened job status.

    Raises:
        HTTPException: If checking fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = JobsManagerService.check_opened_file(shared_core_data)

        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/upload_usb_job_file", response_model=JobsManagerResponse)
def upload_job_file_from_usb_device(request: Request, usb_job_data: USBJobFileData):
    """Upload a job file from a connected USB device.

    Args:
        request (Request): FastAPI request object containing shared core data.
        usb_job_data (USBJobFileData): Path to the USB job file.

    Returns:
        JSONResponse: Core system response confirming upload status.

    Raises:
        HTTPException: If the upload fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = JobsManagerService.upload_usb_job_file(
            shared_core_data, usb_job_data.file_path)

        return JSONResponse(content=core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
