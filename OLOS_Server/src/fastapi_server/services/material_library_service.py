from ..constants import FastAPIServerConstants as constants


class MaterialLibraryService:
    """Service class for managing material library operations via shared queues with the core."""

    @staticmethod
    def _check_response(response, error_msg=''):
        """Check the response for success and raise an exception if failed.

        Args:
            response (dict): The response expected to have a 'data' dict with a 'success' flag.
            error_msg (str): Error message to raise if response indicates failure.

        Raises:
            Exception: If the response indicates failure.

        Returns:
            dict: The original response if successful.
        """

        if isinstance(response, dict) and not response.get('data').get('success'):
            raise Exception(error_msg)
        return response

    @classmethod
    def get_materials_list(cls, shared_core_data):
        """Retrieve the list of materials from the material library.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.

        Returns:
            dict: Response containing the list of materials.

        Raises:
            Exception: If the listing process fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.MATERIAL_LIBRARY_DATA_TYPE,
             {
                 'process': constants.LIST_MATERIAL_PROCESS,
             }])

        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_LIST_MATERIAL_PROCESS)

    @classmethod
    def add_new_material(cls, shared_core_data, material_data):
        """Add a new material to the library.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            material_data (MaterialData): Data representing the new material.

        Returns:
            dict: Response from the add material process.

        Raises:
            Exception: If adding the material fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.MATERIAL_LIBRARY_DATA_TYPE,
             {
                 'process': constants.ADD_MATERIAL_PROCESS,
                 'material_data': material_data,
             }])

        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_ADD_MATERIAL_PROCESS)

    @classmethod
    def update_material(cls, shared_core_data, material_data):
        """Update an existing material in the library.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            material_data (MaterialData): Updated data for the material.

        Returns:
            dict: Response from the update material process.

        Raises:
            Exception: If updating the material fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.MATERIAL_LIBRARY_DATA_TYPE,
             {
                 'process': constants.UPDATE_MATERIAL_PROCESS,
                 'material_data': material_data,
             }])

        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_UPDATE_MATERIAL_PROCESS)

    @classmethod
    def delete_material(cls, shared_core_data, material_id):
        """Delete a material from the library by ID.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            material_id (int): Identifier of the material to delete.

        Returns:
            dict: Response from the delete material process.

        Raises:
            Exception: If deleting the material fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.MATERIAL_LIBRARY_DATA_TYPE,
             {
                 'process': constants.DELETE_MATERIAL_PROCESS,
                 'material_id': material_id
             }])

        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_DELETE_MATERIAL_PROCESS)
