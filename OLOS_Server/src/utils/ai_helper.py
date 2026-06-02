"""
This module handles all processes related to the image generating using different AI models.

It executes image generating in a separate process, and provides CRUD operations for AI Settings stored in a SQLite database.

Classes:
    AIHelper: Main helper class to manage AI image generation and settings workflows.
Functions:
    generate_images: Worker function executed in a separate process to perform the AI image generating procedure.
"""

import glob
import json
import multiprocessing
import os
import subprocess
import sys
import tempfile

from core.constants import CoreConstants as constants
from utils.media_convertor_helper import MediaConvertorHelper
from utils.configuration_loader import ConfigurationLoader


def generate_images(data, queue):
    """
    Runs an external image generation subprocess with provided AI settings.

    It sets up command-line arguments for the AI generation tool, executes it,
    converts the output images to the requested format (e.g., SVG), and sends the
    results back to the parent process via a multiprocessing queue.

    Args:
        data (dict): AI generation parameters, including prompt, model, resolution, etc.
        queue (PriorityQueueWithCounter): Queue used to return the result to the caller.
    """

    with tempfile.TemporaryDirectory() as temp_dir:
        command = [
            sys.executable, 'src/utils/fastsdcpu/src/app.py',
            '--results_directory', temp_dir
        ]

        model_path = os.path.join(
            os.path.abspath('./AI_models/'), data.model)

        if data.model in constants.AI_MODELS['openvino']:
            command.extend(['--use_openvino'])
            command.extend(['--openvino_lcm_model_id', model_path])
        else:
            command.extend(['--use_lcm_lora'])
            command.extend(['--base_model_id', model_path])
            command.extend(['--lcm_lora_id', model_path +
                           '/latent-consistency/lcm-lora-sdv1-5'])

            if 'v1-5' in data.model:
                command.extend(
                    ['--lcm_model_id', 'rupeshs/hypersd-sd1-5-1-step-lora'])
            elif 'xl' in data.model:
                command.extend(
                    ['--lcm_model_id', 'latent-consistency/lcm-lora-sdxl'])

        command.extend(['--prompt', data.mainPrompts])
        command.extend(['--negative_prompt', data.negativePrompts])
        command.extend(['--image_width', str(data.imageWidth)])
        command.extend(['--image_height', str(data.imageHeight)])
        command.extend(
            ['--inference_steps', str(data.inferenceSteps)])
        command.extend(
            ['--guidance_scale', str(data.guidanceScale)])
        command.extend(
            ['--number_of_images', str(data.numberOfImages)])
        command.extend(['--use_tiny_auto_encoder'])
        command.extend(['--use_safety_checker'])
        command.extend(['--use_offline_model'])
        if data.isSeedsUsed:
            command.extend(['--seed', str(data.seed)])

    result = {}
    try:
        # Start the process in the background
        subprocess.run(
            command, check=True, capture_output=True
        )

        images_paths = glob.glob(temp_dir + '/*.png')

        images = []
        is_svg_images = False

        # Convert the images to SVG
        if data.imageForm == "SVG":
            images_paths = MediaConvertorHelper.convert_from_png_to_svg(
                images_paths)
            is_svg_images = True

        images = MediaConvertorHelper.convert_media_to_base64(images_paths)

        json_result = json.dumps(images, indent=1)
        result = AIHelper._fastapi_ai_generator_response(
            constants.AI_DATA_TYPE, constants.AI_GENERATE_IMAGES_PROCESS, json_result, is_svg_images, True
        )

    except subprocess.CalledProcessError as e:
        print("Error:", e)
        result = AIHelper._fastapi_ai_service_response(
            type=constants.AI_DATA_TYPE,
            process=constants.AI_GENERATE_IMAGES_PROCESS,
            ai_models_list='',
            ai_settings_list='',
            success=False)

    finally:
        # check if result is empty dict
        if result:
            queue.put(result)


class AIHelper:
    """
    A helper class for managing AI image generation settings and running
    AI model inference in a separate process.

    This class provides methods to interact with a local SQLite database
    for saving AI generation settings and managing communication with
    the image generation subprocess.

    Attributes:
        cursor (sqlite3.Cursor): Cursor for interacting with the database.
        _config (dict): Configuration loaded from YAML.
        _process (multiprocessing.Process): Process instance for image generation.
    """

    def __init__(self):
        self.cursor = None
        # configuration settings
        self._config = ConfigurationLoader.from_yaml()

        # generating image
        self._generate_image_process = None

    def set_database_cursor(self, db_cursor):
        """
        Sets the database cursor for performing queries.

        Args:
            db_cursor (sqlite3.Cursor): A valid SQLite cursor object.
        """

        self.cursor = db_cursor

    def create_ai_settings_table(self):
        """
        Creates the `AI` table in the database if it does not already exist.
        """

        # materials table
        self.cursor.execute("""
        CREATE TABLE IF NOT EXISTS AI (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            inferenceSteps INTEGER,
            numberOfImages INTEGER,
            guidanceScale INTEGER,
            imageWidth INTEGER,
            imageHeight INTEGER,
            isSeedsUsed BOOLEAN NOT NULL CHECK (isSeedsUsed IN (0, 1)),
            seed INTEGER,
            imageForm TEXT,
            model TEXT
        )
        """)

    def handle_get_ai_config_data(self):
        """
        Retrieves AI model configuration and saved settings.

        Returns:
            dict: A dictionary containing AI models and settings in FastAPI response format.
        """

        ai_settings_list = self._get_ai_settings_list()
        ai_models_list = self._get_ai_models_list()

        response = self._fastapi_ai_service_response(
            constants.AI_DATA_TYPE, constants.CONFIG_AI_SETTINGS_PROCESS, ai_models_list, ai_settings_list, True)

        return response

    def _get_ai_settings_list(self):
        """
        Fetches all saved AI generation settings from the database.

        Returns:
            str: A JSON string containing the list of saved AI configurations.
        """

        # Fetch all ai settings
        self.cursor.execute("""
        SELECT id, name, inferenceSteps, numberOfImages, guidanceScale ,imageWidth, imageHeight, isSeedsUsed, seed, imageForm, model FROM AI
        """)
        ai_settings_list = self.cursor.fetchall()

        result = []
        for setting in ai_settings_list:
            data = {
                'settingsId': setting[0],
                'name': setting[1],
                'settings': {
                    'inferenceSteps': setting[2],
                    'numberOfImages': setting[3],
                    'guidanceScale': setting[4],
                    'imageWidth': setting[5],
                    'imageHeight': setting[6],
                    'isSeedsUsed': True if setting[7] == 1 else False,
                    'seed': setting[8],
                    'imageForm': setting[9],
                    'model': setting[10],
                }
            }
            result.append(data)

        json_result = json.dumps(result, indent=2)

        return json_result

    def _get_ai_models_list(self):
        """
        Returns the list of available AI models from the configuration.

        Returns:
            str: A JSON string of available AI model identifiers.
        """

        return json.dumps(self._config.ai_configuration.ai_models_list, indent=1)

    def handle_add_new_ai_setting(self, data):
        """
        Adds a new AI configuration to the database.

        Args:
            data (obj): An object containing the new AI setting and metadata.

        Returns:
            dict: Updated configuration data.
        """

        # Insert the ai setting data into the ai settings table
        ai_setting_name = data.name.strip()
        ai_settings = data.settings
        self.cursor.execute("""
        INSERT INTO AI (name, inferenceSteps, numberOfImages, guidanceScale, imageWidth, imageHeight, isSeedsUsed, seed, imageForm, model) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (ai_setting_name, ai_settings.inferenceSteps,
              ai_settings.numberOfImages,
              ai_settings.guidanceScale,
              ai_settings.imageWidth,
              ai_settings.imageHeight,
              ai_settings.isSeedsUsed,
              ai_settings.seed,
              ai_settings.imageForm,
              ai_settings.model))

        # Commit the transaction to save changes
        self.cursor.connection.commit()

        # get configuration data after adding new setting
        result = self.handle_get_ai_config_data()
        return result

    def handle_delete_ai_setting(self, ai_setting_id):
        """
        Deletes an AI setting from the database.

        Args:
            ai_setting_id (int): The ID of the setting to delete.

        Returns:
            dict: Updated configuration data.
        """

        self.cursor.execute("""
        DELETE FROM AI WHERE id = ?
        """, (ai_setting_id,))

        # Commit the transaction to save changes
        self.cursor.connection.commit()

        # get configuration data after deleting new setting
        result = self.handle_get_ai_config_data()
        return result

    def handle_update_ai_setting(self, data):
        """
        Updates an existing AI setting in the database.

        Args:
            data (dict): Object containing updated values for the setting.

        Returns:
            dict: Updated configuration data.
        """

        ai_setting_name = data.name.strip()
        ai_settings = data.settings

        self.cursor.execute("""
        UPDATE AI 
        SET
            inferenceSteps = ?,
            numberOfImages = ?,
            guidanceScale = ?,
            imageWidth = ?,
            imageHeight = ?,
            isSeedsUsed = ?,
            seed = ?,
            imageForm = ?,
            model = ?
        WHERE name = ?
        """, (
            ai_settings.inferenceSteps,
            ai_settings.numberOfImages,
            ai_settings.guidanceScale,
            ai_settings.imageWidth,
            ai_settings.imageHeight,
            ai_settings.isSeedsUsed,
            ai_settings.seed,
            ai_settings.imageForm,
            ai_settings.model,
            ai_setting_name,
        ))

        # Commit the transaction to save changes
        self.cursor.connection.commit()

        # get configuration data after updating setting
        result = self.handle_get_ai_config_data()
        return result

    def handle_generate_ai_images(self, data, write_queue):
        """
        Starts a subprocess for generating images using AI models.

        Args:
            data (obj): AI generation settings.
            write_queue (PriorityQueueWithCounter): Queue used to communicate results.
        """

        self._process = multiprocessing.Process(
            target=generate_images, args=(data, write_queue))
        self._process.start()

    def handle_cancel_generate_images(self):
        """
        Cancels the current image generation process, if active.

        Returns:
            dict: FastAPI-compatible cancel response.
        """

        if self._process is not None:
            self._process.terminate()
            self._process.join()
        result = self._fastapi_ai_generator_response(
            constants.AI_DATA_TYPE, constants.AI_CANCEL_GENERATE_IMAGES_PROCESS, '', False, True
        )

        return result

    def handle_error_requests(self, process):
        """
        Returns a generic error response for failed AI processes.

        Args:
            process (str): Name of the process that failed.

        Returns:
            dict: Error response for the AI system.
        """

        return self._fastapi_ai_service_response(
            type=constants.AI_DATA_TYPE,
            process=process,
            ai_models_list='',
            ai_settings_list='',
            success=False
        )

    @staticmethod
    def _fastapi_ai_service_response(type, process, ai_models_list, ai_settings_list, success):
        """
        Helper to format response data for configuration-related requests.

        Args:
            type (str): Data type for the response.
            process (str): Name of the process.
            ai_models_list (str): JSON list of AI models.
            ai_settings_list (str): JSON list of AI settings.
            success (bool): Whether the operation succeeded.

        Returns:
            dict: Structured response dictionary.
        """

        return {
            'type': type,
            'data': {
                'process': process,
                'aiModelsList': ai_models_list,
                'aiSettingsList': ai_settings_list,
                'success': success
            }
        }

    @staticmethod
    def _fastapi_ai_generator_response(type, process, images, is_svg_images, success):
        """
        Helper to format image generation response.

        Args:
            type (str): Data type for the response.
            process (str): Name of the process.
            images (str): Base64-encoded images or converted results.
            is_svg_images (bool): True if SVG output is returned.
            success (bool): Whether the operation succeeded.

        Returns:
            dict: Structured response dictionary.
        """

        return {
            'type': type,
            'data': {
                'process': process,
                'images': images,
                'isSVGImages': is_svg_images,
                'success': success
            }
        }
