"""
AI API Endpoints
================

This module defines REST API routes for managing AI image generation settings
and triggering AI-based image generation processes.

Endpoints:
    POST /generate
        Generate images using AI with the provided generation settings.
    POST /cancel
        Cancel an ongoing AI image generation process.
    GET /config
        Retrieve current AI configuration data.
    POST /add
        Add new AI generation settings to the system.
    DELETE /delete/{ai_setting_id}
        Remove existing AI generation settings by ID.
    PUT /update
        Update existing AI generation settings.

All endpoints interact with the core system through the `AIService` class,
using shared application data passed from the main server process.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from ..models.ai_model import AIConfigResponse, AIImageGeneratorResponse, AISettings, AIGeneratorSettingsData
from ..services.ai_service import AIService
from ..constants import FastAPIServerConstants as constants

router = APIRouter()


@router.post("/generate", response_model=AIImageGeneratorResponse)
def generate_images(request: Request, ai_generator_settings_data: AIGeneratorSettingsData):
    """Generate AI images based on provided settings.

    Args:
        request (Request): The incoming FastAPI request object, containing shared core data.
        ai_generator_settings_data (AIGeneratorSettingsData): Parameters for image generation.

    Returns:
        JSONResponse: Core system response containing generated image data.
                      Returns status 499 if generation was cancelled by the client.

    Raises:
        HTTPException: If an unexpected error occurs during processing (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = AIService.ai_generate_images(
            shared_core_data, ai_generator_settings_data)

        # client cancel generating process
        if core_response.get('data').get('process') == constants.CANCEL_GENERATE_JOB_PROCESS:
            return JSONResponse(core_response, status_code=499)

        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/cancel", response_model=AIImageGeneratorResponse)
def cancel_generate_images(request: Request):
    """Cancel an ongoing AI image generation process.

    Args:
        request (Request): The incoming FastAPI request object, containing shared core data.

    Returns:
        JSONResponse: Confirmation message indicating successful cancellation.

    Raises:
        HTTPException: If an unexpected error occurs during cancellation (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        AIService.cancel_generate_images(
            shared_core_data)

        return JSONResponse({"message": "Cancellation successful"}, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/config", response_model=AIConfigResponse)
def get_ai_config_data(request: Request):
    """Retrieve AI configuration data.

    Args:
        request (Request): The incoming FastAPI request object, containing shared core data.

    Returns:
        JSONResponse: Current AI configuration details from the core system.

    Raises:
        HTTPException: If an unexpected error occurs while fetching configuration (500).
    """

    try:
        shared_core_data = request.app.shared_core_data

        core_response = AIService.get_ai_config_data(
            shared_core_data)

        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/add", response_model=AIConfigResponse)
def add_new_ai_settings(request: Request, ai_settings: AISettings):
    """Add new AI settings to the configuration.

    Args:
        request (Request): The incoming FastAPI request object, containing shared core data.
        ai_settings (AISettings): New AI settings to store in the system.

    Returns:
        JSONResponse: Updated AI configuration after adding new settings.

    Raises:
        HTTPException: If an unexpected error occurs while adding settings (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = AIService.add_new_ai_settings(
            shared_core_data, ai_settings)
        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.delete("/delete/{ai_setting_id}", response_model=AIConfigResponse)
def delete_ai_settings(request: Request, ai_setting_id: int):
    """Delete AI settings by ID.

    Args:
        request (Request): The incoming FastAPI request object, containing shared core data.
        ai_setting_id (int): Unique ID of the AI settings to delete.

    Returns:
        JSONResponse: Updated AI configuration after deletion.

    Raises:
        HTTPException: If an unexpected error occurs while deleting settings (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = AIService.delete_ai_setting(
            shared_core_data, ai_setting_id)
        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.put("/update", response_model=AIConfigResponse)
def update_ai_settings(request: Request, ai_settings: AISettings):
    """Update existing AI settings.

    Args:
        request (Request): The incoming FastAPI request object, containing shared core data.
        ai_settings (AISettings): Updated AI settings data.

    Returns:
        JSONResponse: Updated AI configuration after modification.

    Raises:
        HTTPException: If an unexpected error occurs while updating settings (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = AIService.update_ai_settings(
            shared_core_data, ai_settings)
        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
