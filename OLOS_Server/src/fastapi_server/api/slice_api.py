"""
Slicing API Endpoints
=====================

This module provides REST API endpoints for handling 3D model slicing operations.
It allows initiating a slice process, cancelling it, saving slicing results,
previewing generated slices, and managing slicing profiles.

Endpoints:
    POST /slice
        Perform slicing on uploaded 3D models based on provided parameters.
    POST /cancel
        Cancel an ongoing slicing process.
    POST /save/{filename}
        Save the slicing result locally on the server.
    GET /preview
        Retrieve a preview of the slicing result.
    GET /list
        List all available slicing profiles.
    POST /add
        Add a new slicing profile.
    DELETE /delete/{slicing_profile_id}
        Delete an existing slicing profile.
    PUT /update
        Update the settings of an existing slicing profile.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from ..constants import FastAPIServerConstants as constants
from ..models.slice_model import SlicingData, SlicingResponse, SlicingSettings
from ..services.slice_service import SliceService

router = APIRouter()


@router.post("/slice", response_model=SlicingResponse)
def slice_models(request: Request, slicing_data: SlicingData):
    """Start the slicing process for 3D models.

    Args:
        request (Request): FastAPI request containing shared core data.
        slicing_data (SlicingData): Parameters and settings for slicing.

    Returns:
        JSONResponse: Result of the slicing process.

    Raises:
        HTTPException: If the slicing process fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data

        core_response = SliceService.slice_models(
            shared_core_data, slicing_data)

        # client cancel slicing process
        if core_response.get('data').get('process') == constants.CANCEL_SLICE_PROCESS:
            return JSONResponse(core_response, status_code=499)

        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/cancel", response_model=SlicingResponse)
def cancel_slice_models(request: Request):
    """Cancel an ongoing slicing process.

    Args:
        request (Request): FastAPI request containing shared core data.

    Returns:
        JSONResponse: Confirmation message of cancellation.

    Raises:
        HTTPException: If cancellation fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        SliceService.cancel_slice_models(
            shared_core_data)

        return JSONResponse({"message": "Cancellation successful"}, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/save/{filename}", response_model=SlicingResponse)
def slice_models(request: Request, filename: str):
    """Save the slicing result locally.

    Args:
        request (Request): FastAPI request containing shared core data.
        filename (str): Name to save the sliced file as.

    Returns:
        JSONResponse: Confirmation of saving result.

    Raises:
        HTTPException: If saving fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data

        core_response = SliceService.save_slicing_result_locally(
            shared_core_data, filename)

        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/preview", response_model=SlicingResponse)
def preview_slicing_result(request: Request):
    """Preview the generated slicing result.

    Args:
        request (Request): FastAPI request containing shared core data.

    Returns:
        JSONResponse: Preview data of the slicing result.

    Raises:
        HTTPException: If preview generation fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data

        core_response = SliceService.preview_slicing_result(
            shared_core_data)

        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/list", response_model=SlicingResponse)
def list_slicing_profiles(request: Request):
    """Retrieve all saved slicing profiles.

    Args:
        request (Request): FastAPI request containing shared core data.

    Returns:
        JSONResponse: List of slicing profiles.

    Raises:
        HTTPException: If listing fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data

        core_response = SliceService.list_slicing_profiles(
            shared_core_data)

        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/add", response_model=SlicingResponse)
def add_new_slicing_profile(request: Request, slicing_settings: SlicingSettings):
    """Add a new slicing profile.

    Args:
        request (Request): FastAPI request containing shared core data.
        slicing_settings (SlicingSettings): New profile configuration.

    Returns:
        JSONResponse: Confirmation of profile creation.

    Raises:
        HTTPException: If creation fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = SliceService.add_new_slicing_profile(
            shared_core_data, slicing_settings)
        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.delete("/delete/{slicing_profile_id}", response_model=SlicingResponse)
def delete_slicing_profile(request: Request, slicing_profile_id: int):
    """Delete an existing slicing profile.

    Args:
        request (Request): FastAPI request containing shared core data.
        slicing_profile_id (int): ID of the slicing profile to delete.

    Returns:
        JSONResponse: Confirmation of profile deletion.

    Raises:
        HTTPException: If deletion fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = SliceService.delete_slicing_profile(
            shared_core_data, slicing_profile_id)
        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.put("/update", response_model=SlicingResponse)
def update_slicing_profile(request: Request, slicing_settings: SlicingSettings):
    """Update an existing slicing profile.

    Args:
        request (Request): FastAPI request containing shared core data.
        slicing_settings (SlicingSettings): Updated slicing profile settings.

    Returns:
        JSONResponse: Confirmation of profile update.

    Raises:
        HTTPException: If update fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = SliceService.update_slicing_profile(
            shared_core_data, slicing_settings)
        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
