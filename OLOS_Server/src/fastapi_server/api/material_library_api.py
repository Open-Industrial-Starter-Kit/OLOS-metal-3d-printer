"""
Material Library API Endpoints
==============================

This module provides REST API endpoints for managing the material library.
It supports listing, adding, updating, and deleting materials that can be used
with the machine (e.g., Laser Cutter, 3D Printer).

Endpoints:
    GET /list
        Retrieve the list of all available materials.
    POST /add
        Add a new material to the library.
    PUT /update
        Update an existing material's details.
    DELETE /delete/{material_id}
        Remove a material from the library by its ID.
"""

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from ..models.material_library_model import MaterialData, MaterialLibraryResponse
from ..services.material_library_service import MaterialLibraryService

router = APIRouter()


@router.get("/list", response_model=MaterialLibraryResponse)
def get_materials_list(request: Request):
    """Retrieve the list of available materials.

    Args:
        request (Request): FastAPI request object containing shared core data.

    Returns:
        JSONResponse: List of materials with their details.

    Raises:
        HTTPException: If retrieval fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data

        core_response = MaterialLibraryService.get_materials_list(
            shared_core_data)

        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.post("/add", response_model=MaterialLibraryResponse)
def add_new_material(request: Request, material_data: MaterialData):
    """Add a new material to the library.

    Args:
        request (Request): FastAPI request object containing shared core data.
        material_data (MaterialData): Data for the new material.

    Returns:
        JSONResponse: Confirmation of the material addition.

    Raises:
        HTTPException: If adding fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = MaterialLibraryService.add_new_material(
            shared_core_data, material_data)

        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.put("/update", response_model=MaterialLibraryResponse)
def update_material(request: Request, material_data: MaterialData):
    """Update the details of an existing material.

    Args:
        request (Request): FastAPI request object containing shared core data.
        material_data (MaterialData): Updated data for the material.

    Returns:
        JSONResponse: Confirmation of the update.

    Raises:
        HTTPException: If updating fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = MaterialLibraryService.update_material(
            shared_core_data, material_data)

        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.delete("/delete/{material_id}", response_model=MaterialLibraryResponse)
def delete_material(request: Request, material_id: int):
    """Delete a material from the library.

    Args:
        request (Request): FastAPI request object containing shared core data.
        material_id (int): ID of the material to delete.

    Returns:
        JSONResponse: Confirmation of deletion.

    Raises:
        HTTPException: If deletion fails (500).
    """

    try:
        shared_core_data = request.app.shared_core_data
        core_response = MaterialLibraryService.delete_material(
            shared_core_data, material_id)
        return JSONResponse(core_response, status_code=200)

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
