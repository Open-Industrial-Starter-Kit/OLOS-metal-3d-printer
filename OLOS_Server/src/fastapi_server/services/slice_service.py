from ..constants import FastAPIServerConstants as constants


class SliceService:
    """Service class to handle slicing operations and slicing profiles management."""

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
    def slice_models(cls, shared_core_data, slice_data):
        """Initiate slicing of 3D models with given slice parameters.

        Args:
            shared_core_data (obj): Shared object containing communication queues.
            slice_data (SlicingData): Data and parameters required for slicing.

        Returns:
            dict: Response from the slicing process.

        Raises:
            Exception: If slicing process fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.SLICE_DATA_TYPE,
                {
                    'process': constants.SLICE_PROCESS,
                    'slice_data': slice_data
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_SLICE_PROCESS)

    @classmethod
    def save_slicing_result_locally(cls, shared_core_data, filename):
        """Save the slicing result locally under the specified filename.

        Args:
            shared_core_data (obj): Shared object containing communication queues.
            filename (str): Filename to save the slicing result.

        Returns:
            dict: Response from the save slice process.

        Raises:
            Exception: If saving the slice result fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.SLICE_DATA_TYPE,
                {
                    'process': constants.SAVE_SLICE_PROCESS,
                    'filename': filename
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_SAVE_SLICE_PROCESS)

    @classmethod
    def preview_slicing_result(cls, shared_core_data):
        """Request a preview of the latest slicing result.

        Args:
            shared_core_data (obj): Shared object containing communication queues.

        Returns:
            dict: Response containing preview data.

        Raises:
            Exception: If previewing the slicing result fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.SLICE_DATA_TYPE,
                {
                    'process': constants.PREVIEW_SLICE_PROCESS,
                }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_PREVIEW_SLICE_PROCESS)

    @classmethod
    def cancel_slice_models(cls, shared_core_data):
        """Cancel the ongoing slicing process if any.

        Args:
            shared_core_data (obj): Shared object containing communication queues.

        Note:
            This method checks that the write queue is empty before sending the cancel process
            to prevent race conditions.
        """
        if shared_core_data.fastapi_write_queue.empty():
            shared_core_data.fastapi_read_queue.put(
                [constants.SLICE_DATA_TYPE,
                 {
                     'process': constants.CANCEL_SLICE_PROCESS,
                 }])

    @classmethod
    def add_new_slicing_profile(cls, shared_core_data, slicing_settings):
        """Add a new slicing profile with provided settings.

        Args:
            shared_core_data (obj): Shared object containing communication queues.
            slicing_settings (SlicingSettings): Settings for the new slicing profile.

        Returns:
            dict: Response from adding the slicing profile.

        Raises:
            Exception: If adding the slicing profile fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.SLICE_DATA_TYPE,
             {
                 'process': constants.ADD_SLICING_PROFILE_PROCESS,
                 "slicing_settings": slicing_settings,
             }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_ADD_SLICING_PROFILE_PROCESS)

    @classmethod
    def list_slicing_profiles(cls, shared_core_data):
        """List all existing slicing profiles.

        Args:
            shared_core_data (obj): Shared object containing communication queues.

        Returns:
            dict: Response containing slicing profiles list.

        Raises:
            Exception: If listing slicing profiles fails.
        """
        shared_core_data.fastapi_read_queue.put(
            [constants.SLICE_DATA_TYPE,
             {
                 'process': constants.LIST_SLICING_PROFILES,
             }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_LIST_SLICING_PROFILES_PROCESS)

    @classmethod
    def delete_slicing_profile(cls, shared_core_data, slicing_profile_id):
        """Delete a slicing profile by its ID.

        Args:
            shared_core_data (object): Shared object containing communication queues.
            slicing_profile_id (int): Identifier of the slicing profile to delete.

        Returns:
            dict: Response from the delete slicing profile process.

        Raises:
            Exception: If deleting the slicing profile fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.SLICE_DATA_TYPE,
             {
                 'process': constants.DELETE_SLICING_PROFILE_PROCESS,
                 'slicing_profile_id': slicing_profile_id
             }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_DELETE_SLICING_PROFILE_PROCESS)

    @classmethod
    def update_slicing_profile(cls, shared_core_data, slicing_settings):
        """Update an existing slicing profile with new settings.

        Args:
            shared_core_data (obj): Shared object containing communication queues.
            slicing_settings (SlicingSettings): Updated settings for the slicing profile.

        Returns:
            dict: Response from the update slicing profile process.

        Raises:
            Exception: If updating the slicing profile fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.SLICE_DATA_TYPE,
             {
                 'process': constants.UPDATE_SLICING_PROFILE_PROCESS,
                 "slicing_settings": slicing_settings,
             }])
        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_UPDATE_SLICING_PROFILE_PROCESS)
