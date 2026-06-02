from ..constants import FastAPIServerConstants as constants


class AIService:
    """Service class for interacting with AI-related processes via shared queues with the core."""

    @staticmethod
    def _check_response(response, error_msg=''):
        """Check the response dictionary for success status and raise an exception if failed.

        Args:
            response (dict): The response to check, expected to contain a 'data' dict with 'success' key.
            error_msg (str): The error message to raise in case of failure.

        Raises:
            Exception: If the response indicates failure.

        Returns:
            dict: The original response if successful.
        """

        if isinstance(response, dict) and not response.get('data').get('success'):
            raise Exception(error_msg)
        return response

    @classmethod
    def ai_generate_images(cls, shared_core_data, ai_generator_settings):
        """Request AI image generation with given settings.

        Sends a request via the read queue to core and waits for the response from the write queue.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            ai_generator_settings (AIGeneratorSettingsData): Settings/configuration for AI image generation.

        Returns:
            dict: The response data from the AI generation process.

        Raises:
            Exception: If the AI generation process fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.AI_DATA_TYPE,
             {
                 'process': constants.AI_GENERATE_IMAGES_PROCESS,
                 "ai_generator_settings":  ai_generator_settings
             }])

        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_AI_GENERATE_IMAGES_PROCESS)

    @classmethod
    def cancel_generate_images(cls, shared_core_data,):
        """Send a cancel request to stop ongoing AI image generation.

        The cancel request is sent only if the write queue is currently empty to avoid race conditions.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
        """

        # prevent both generate and cancel from writing data in the queue at the same time
        if shared_core_data.fastapi_write_queue.empty():
            shared_core_data.fastapi_read_queue.put(
                [constants.AI_DATA_TYPE,
                 {
                     'process': constants.AI_CANCEL_GENERATE_IMAGES_PROCESS,
                 }])

    @classmethod
    def add_new_ai_settings(cls, shared_core_data, ai_settings):
        """Add new AI settings via the shared queues.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            ai_settings (AISettings): New AI settings data to add.

        Returns:
            dict: The response confirming the addition of AI settings.

        Raises:
            Exception: If adding AI settings fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.AI_DATA_TYPE,
             {
                 'process': constants.ADD_AI_SETTING_PROCESS,
                 "ai_settings": ai_settings,
             }])

        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_ADD_AI_SETTING_PROCESS)

    @classmethod
    def get_ai_config_data(cls, shared_core_data):
        """Retrieve current AI configuration data.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.

        Returns:
            dict: The current AI configuration data.

        Raises:
            Exception: If retrieving the AI config data fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.AI_DATA_TYPE,
             {
                 'process': constants.CONFIG_AI_SETTINGS_PROCESS,
             }])

        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_CONFIG_AI_SETTINGS_PROCESS)

    @classmethod
    def delete_ai_setting(cls, shared_core_data, ai_setting_id):
        """Delete an AI setting by its ID.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            ai_setting_id (int): Identifier of the AI setting to delete.

        Returns:
            dict: The response confirming deletion.

        Raises:
            Exception: If deletion of the AI setting fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.AI_DATA_TYPE,
             {
                 'process': constants.DELETE_AI_SETTING_PROCESS,
                 'ai_setting_id': ai_setting_id
             }])

        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_DELETE_AI_SETTING_PROCESS)

    @classmethod
    def update_ai_settings(cls, shared_core_data, ai_settings):
        """Update existing AI settings.

        Args:
            shared_core_data (obj): Shared object containing inter-process communication queues.
            ai_settings (AISettings): AI settings data to update.

        Returns:
            dict: The response confirming the update.

        Raises:
            Exception: If updating AI settings fails.
        """

        shared_core_data.fastapi_read_queue.put(
            [constants.AI_DATA_TYPE,
             {
                 'process': constants.UPDATE_AI_SETTING_PROCESS,
                 "ai_settings": ai_settings,
             }])

        response = shared_core_data.fastapi_write_queue.get()
        return cls._check_response(response, constants.ERROR_UPDATE_AI_SETTING_PROCESS)
