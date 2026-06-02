import re
from PIL import Image

from core.constants import CoreConstants as constants
from utils.media_convertor_helper import MediaConvertorHelper
from utils.configuration_loader import ConfigurationLoader
from utils.image_to_gcode_helper import ImageToGcodeHelper

# handle all sizes of images
Image.MAX_IMAGE_PIXELS = None


class ImageToGcodeGenerator:
    """
    Converts raster images and SVGs into laser-compatible G-code for engraving, marking, and cutting operations.

    This class handles parsing settings, decoding images, applying transformations,
    and generating final G-code with material and tool configurations.

    Attributes:
        _config (ConfigurationLoader): Loaded machine configuration from YAML.
        _images_bounding_box (dict): The bounding box for all the images used for generating gcode (find the starting and end points)
        _image_to_gcode_helper (ImageToGcodeHelper): Helper for converting raster image and SVG file contents into G-code.

    """

    def __init__(self):
        self._config = ConfigurationLoader.from_yaml()
        self._images_bounding_box = None
        self._image_to_gcode_helper = ImageToGcodeHelper()

    @classmethod
    def generate_gcode(cls, gcode_file_data):
        """
        Generates G-code for a given set of modified images and G-code settings.

        Args:
            gcode_file_data (obj): An object containing `modifiedImagesData` and associated settings.

        Returns:
            bytes: The full G-code content encoded in UTF-8.
        """

        generator = cls()
        modified_images_data_list = gcode_file_data.modifiedImagesData

        # full gcode file content
        gcode_file_content = ''

        engraving_images_data, marking_images_data, cutting_images_data, materials_settings_list = \
            generator._classify_images_data(modified_images_data_list)

        if engraving_images_data:
            gcode_file_content += generator._generate_gcode_for_images_data(
                images_data=engraving_images_data, process=constants.IMAGE_GENERATOR_ENGRAVE_PROCESS)

        if marking_images_data:
            gcode_file_content += generator._generate_gcode_for_images_data(
                images_data=marking_images_data, process=constants.IMAGE_GENERATOR_MARK_PROCESS)

        if cutting_images_data:
            gcode_file_content += generator._generate_gcode_for_images_data(
                images_data=cutting_images_data, process=constants.IMAGE_GENERATOR_CUT_PROCESS)

        # Add some modification to the generated gcode
        gcode_file_content = generator._image_to_gcode_helper.modify_gcode_content(
            gcode_file_content)

        # add the material setting comment, job box metrics, and remove tool command
        gcode_file_content = \
            generator._add_material_settings_comment(
                materials_settings_list) \
            + generator._add_images_bounding_box_comment() \
            + constants.GCODE_GENERATOR_FILE_INITIAL_COMMANDS \
            + gcode_file_content \
            + generator._add_remove_tool_command_at_end(gcode_file_content)

        return gcode_file_content.encode('utf-8')

    def _classify_images_data(self, images_list):
        """
        Classifies and separates images by process type (engraving, marking, cutting)
        and collects material settings.

        Args:
            images_list (list): List of image data objects.

        Returns:
            tuple: Lists of engraving, marking, and cutting image data, along with material settings.
        """

        # list to group the images data based operation
        engraving_images_data = []
        marking_images_data = []
        cutting_images_data = []

        # list for material settings for all the images
        materials_settings_list = []

        for image_data in images_list:
            # Prepare images data based on image processing type
            if image_data.modifiedEngravingImage:
                engraving_image_data, engraving_image_settings = self._extract_image_data(
                    image=image_data.modifiedEngravingImage,
                    settings=image_data.gcodeSettings,
                    process=constants.IMAGE_GENERATOR_ENGRAVE_PROCESS)

                engraving_images_data.append({
                    'image': engraving_image_data,
                    'settings': engraving_image_settings
                })

            if image_data.modifiedSVGMarking:
                marking_image_data, marking_image_settings = self._extract_image_data(
                    image=image_data.modifiedSVGMarking,
                    settings=image_data.gcodeSettings,
                    process=constants.IMAGE_GENERATOR_MARK_PROCESS)

                marking_images_data.append({
                    'image': marking_image_data,
                    'settings': marking_image_settings
                })

            if image_data.modifiedSVGCutting:
                cutting_image_data, cutting_image_settings = self._extract_image_data(
                    image=image_data.modifiedSVGCutting,
                    settings=image_data.gcodeSettings,
                    process=constants.IMAGE_GENERATOR_CUT_PROCESS)

                cutting_images_data.append({
                    'image': cutting_image_data,
                    'settings': cutting_image_settings
                })

            material_settings, thickness_settings = \
                image_data.gcodeSettings.mainSettings.material, \
                image_data.gcodeSettings.mainSettings.thickness

            materials_settings_list.append({
                'material': material_settings,
                'thickness': thickness_settings
            })

        return engraving_images_data, marking_images_data, cutting_images_data, materials_settings_list

    def _extract_image_data(self, image, settings, process):
        """
        Extracts binary image data and relevant G-code settings for a specific process type.

        Args:
            image (str): Base64-encoded image string.
            settings (dict): Full settings object.
            process (str): One of the process types (engraving, marking, cutting).

        Returns:
            tuple: Decoded binary image content and associated image settings dictionary.
        """

        image_file_content = MediaConvertorHelper.decode_base64_to_binary(
            image)
        image_settings = {}

        if process == constants.IMAGE_GENERATOR_ENGRAVE_PROCESS:
            image_settings = self._fetch_specific_settings(
                settings, ['mainSettings', 'engravingSettings'])
        elif process == constants.IMAGE_GENERATOR_MARK_PROCESS:
            image_settings = self._fetch_specific_settings(
                settings, ['mainSettings', 'markingSettings'])
        elif process == constants.IMAGE_GENERATOR_CUT_PROCESS:
            image_settings = self._fetch_specific_settings(
                settings, ['mainSettings', 'cuttingSettings'])

        # find the min/max points for the images
        if image_settings:
            self._check_images_bounding_box_metrics(image_settings)

        return image_file_content, image_settings

    def _check_images_bounding_box_metrics(self, image_settings):
        """
        Updates the image bounding box dimensions based on image positioning and scaling.

        Args:
            image_settings (dict): Contains image positioning and scale metrics.
        """

        if self._images_bounding_box:
            # compare previous metrics
            if self._images_bounding_box['min_point']['x'] > image_settings.get('metrics').x:
                self._images_bounding_box['min_point']['x'] = image_settings.get(
                    'metrics').x
            else:
                self._images_bounding_box['max_point']['x'] = image_settings.get(
                    'metrics').x + (image_settings.get('metrics').width * image_settings.get('metrics').scaleX)

            if self._images_bounding_box['min_point']['y'] > image_settings.get('metrics').y:
                self._images_bounding_box['min_point']['y'] = image_settings.get(
                    'metrics').y
            else:
                self._images_bounding_box['max_point']['y'] = image_settings.get(
                    'metrics').y + (image_settings.get('metrics').height * image_settings.get('metrics').scaleY)
        else:
            # init metrics for the bounding box
            self._images_bounding_box = dict(
                min_point=dict(x=image_settings.get(
                    'metrics').x, y=image_settings.get(
                    'metrics').y),
                max_point=dict(x=image_settings.get(
                    'metrics').x + (image_settings.get('metrics').width * image_settings.get('metrics').scaleX),
                    y=image_settings.get(
                    'metrics').y + (image_settings.get('metrics').height * image_settings.get('metrics').scaleY)
                )
            )

    def _generate_gcode_for_images_data(self, images_data, process):
        """
        Generates G-code for a batch of images of the same process type.

        Args:
            images_data (list): List of image objects with binary data and settings.
            process (str): The process type (engraving, marking, or cutting).

        Returns:
            str: Concatenated G-code for the given image batch.
        """

        gcode_content = ''
        for image_data in images_data:
            image_file_content = image_data.get('image')
            image_settings = image_data.get('settings')

            if process == constants.IMAGE_GENERATOR_ENGRAVE_PROCESS:
                gcode_content += self._generate_gcode_for_image(
                    image_file_content, image_settings)
            else:
                gcode_content += self._generate_gcode_for_svg(
                    image_file_content, image_settings)

        # add end of job commands at the end of the file
        gcode_content += self._image_to_gcode_helper.add_end_of_job_commands()

        return gcode_content

    def _generate_gcode_for_svg(self, svg_file_content, image_settings):
        """
        Generates G-code for a single SVG image using settings.

        Args:
            svg_file_content (bytes): The SVG file content.
            image_settings (dict): Associated image settings.

        Returns:
            str or None: G-code string or None if generation fails.
        """

        try:
            svg_settings = self._prepare_svg_image_settings(
                svg_file_content, image_settings)
            main_gcode_content = self._image_to_gcode_helper.generate_gcode_for_svg(
                svg_file_content, svg_settings)

            # Add tool and material thickness to the generated gcode
            main_gcode_content = self._add_tool_and_thickness_commands(
                main_gcode_content, image_settings)

            return main_gcode_content

        except Exception as e:
            print("Error:", e)
            return None

    def _generate_gcode_for_image(self, image_file_content, image_settings):
        """
        Generates G-code for a raster image after applying transformations.

        Args:
            image_file_content (bytes): Image binary content.
            image_settings (dict): Associated settings for power, speed, and positioning.

        Returns:
            str or None: G-code string or None if generation fails.
        """

        try:
            # apply transformation on image (scale - rotate)
            image_file_content = self._image_to_gcode_helper.apply_transformation_on_image(
                image_file_content, image_settings)
            raster_settings = self._prepare_raster_image_settings(
                image_settings)

            main_gcode_content = self._image_to_gcode_helper.generate_gcode_for_image(
                image_file_content, raster_settings)

            # Add tool and material thickness to the generated gcode
            main_gcode_content = self._add_tool_and_thickness_commands(
                main_gcode_content, image_settings)

            return main_gcode_content

        except Exception as e:
            print("Error:", e)
            return None

    def _prepare_svg_image_settings(self, svg_file_content, svg_settings):
        """
        Prepares and transforms user-defined SVG image settings for G-code generation.

        Args:
            svg_file_content (bytes): SVG content.
            svg_settings (dict): Original SVG settings from the user.

        Returns:
            dict: Processed settings for SVG-based G-code generation.
        """

        # Apply user-provided scaling and rotation factors (scaleX, scaleY, rotation) and adjust the origin accordingly
        rotation = round(svg_settings.get('metrics').rotation)
        user_scale_x = svg_settings.get('metrics').scaleX
        user_scale_y = svg_settings.get('metrics').scaleY
        user_shift_x = svg_settings.get('metrics').x
        user_shift_y = svg_settings.get('metrics').y

        # Find the shift and scale for the SVG to match the image
        scale_x, scale_y, shift_x, shift_y = self._image_to_gcode_helper.calculate_shift_and_scale(
            svg_file_content.decode('utf-8'), user_scale_x, user_scale_y, user_shift_x, user_shift_y, rotation)

        svg_settings = {
            'power': int(svg_settings.get('power')),
            'speed': int(svg_settings.get('speed')),
            'speedmoves': 1000,
            'origin':    ((shift_x - self._images_bounding_box['min_point']['x']
                           if shift_x - self._images_bounding_box['min_point']['x'] >
                           0.000001 else 0),
                          (shift_y - self._images_bounding_box['min_point']['y']
                           if shift_y - self._images_bounding_box['min_point']['y'] >
                           0.000001 else 0)),
            'scale': (scale_x, scale_y),
            'rotate': rotation
        }

        return svg_settings

    def _prepare_raster_image_settings(self, image_settings):
        """
        Prepares raster image settings by applying pixel size, offset, and resolution.

        Args:
            image_settings (dict): Settings related to image scaling and dithering.

        Returns:
            dict: Settings dictionary suitable for raster-based G-code generation.
        """

        resolution = image_settings.get('dithering').resolution
        # prevent very small values from passing to the
        user_shift_x = image_settings.get('metrics').x if abs(
            image_settings.get('metrics').x) > 0.000001 else 0
        user_shift_y = image_settings.get('metrics').y if abs(
            image_settings.get('metrics').y) > 0.000001 else 0

        raster_settings = {
            'power': int(image_settings.get('power')),
            'speed': int(image_settings.get('speed')),
            'speedmoves': 1000,
            'pixel_size': ((100 / resolution),
                           (100 / resolution)),
            'size': None,
            'offset': (user_shift_x - self._images_bounding_box['min_point']['x'],
                       user_shift_y - self._images_bounding_box['min_point']['y']),
            'noise': 0,
            'inverted': False
        }
        return raster_settings

    def _add_tool_and_thickness_commands(self, gcode_content, image_settings):
        """
        Inserts tool change and material thickness commands to the G-code if required.

        Args:
            gcode_content (str): The generated G-code string.
            image_settings (dict): Settings containing tool and thickness info.

        Returns:
            str: Modified G-code with prepended tool and thickness commands.
        """

        # add tool command
        if self._config.laser_cutter_settings.tool_changer:
            tool = image_settings.get('tool')
            gcode_content_with_tool = self._add_tool_command(
                gcode_content, tool)

            # Adjust for material thickness and tool type
            material_thickness = image_settings.get('thickness')
            main_gcode_content = self._add_material_thickness_command(
                gcode_content_with_tool, material_thickness, tool)

        return main_gcode_content

    def _add_material_settings_comment(self, materials_settings_list):
        """
        Generates comment lines describing material type and thickness.

        Args:
            materials_settings_list (list): List of dictionaries containing material and thickness data.

        Returns:
            str: G-code comments with material metadata.
        """

        material_comment = ''
        is_multi_material = False
        is_multi_thickness = False
        # materials settings list is not empty
        if materials_settings_list:
            # use the first material settings as a reference
            material, thickness = materials_settings_list[0].get(
                'material'), materials_settings_list[0].get('thickness')
            # check if all materials settings are the same or are different
            for material_setting in materials_settings_list[1:]:
                if material != material_setting.get('material'):
                    is_multi_material = True
                    material = 'Multi-Materials'
                if thickness != material_setting.get('thickness'):
                    is_multi_thickness = True
                    thickness = 'Multi-Thicknesses'
                # break when it is already known that the materials settings are different
                if is_multi_material and is_multi_thickness:
                    break

        material_comment = (f";Material Settings:\n;Material Name: {material}\n"
                            f";Material Thickness: {thickness} {'' if thickness == 'Multi-Thicknesses' else 'mm'}\n\n")
        return material_comment

    def _add_images_bounding_box_comment(self):
        """
        Appends bounding box coordinates for the image batch as a G-code comment.

        Returns:
            str: Bounding box comment or an empty string if no bounding box exists.
        """

        if self._images_bounding_box:
            return (
                f";ImagesBoundingBox: (X{self._images_bounding_box['min_point']['x']},"
                f"Y{self._images_bounding_box['min_point']['y']}:"
                f"X{self._images_bounding_box['max_point']['x']},"
                f"Y{self._images_bounding_box['max_point']['y']})\n\n"
            )
        return ''

    def _add_tool_command(self, gcode_content, tool):
        """
        Inserts a tool change command at the beginning of the G-code.

        Args:
            gcode_content (str): The G-code content to be modified.
            tool (str): Name of the selected tool.

        Returns:
            str: Modified G-code with tool change command prepended.
        """

        if tool:
            # Construct the tool command
            tool_command = self._generate_tool_command(tool)

            return constants.NEW_LINE + tool_command + gcode_content
        else:
            return gcode_content

    def _generate_tool_command(self, tool):
        """
        Generates the appropriate tool change command for a given tool.

        Args:
            tool (str): Tool name as defined in the configuration.

        Returns:
            str: The G-code tool change command.
        """

        tool_command = ''
        machines_tools = self._get_machine_tools()
        # get the tool settings for each tool in the configuration file
        for tool_settings in machines_tools.values():
            if tool == tool_settings['name']:
                tool_command += tool_settings['command']
        return tool_command

    def _get_machine_tools(self):
        return self._config.get_dict(
            'laser_cutter_settings.tools')

    def _add_material_thickness_command(self, gcode_content, material_thickness, tool):
        """
        Inserts Z-axis move command based on material thickness and tool configuration.

        Args:
            gcode_content (str): Current G-code content.
            material_thickness (float): Thickness of the material in mm.
            tool (str): The selected tool name.

        Returns:
            str: Updated G-code with the material thickness Z-axis adjustment inserted.
        """

        # check the metrics for the bed based on the used tool
        min_z_axis_value = 0
        max_z_axis_value = 0

        # get the tool settings for each tool in the configuration file
        machines_tools = self._get_machine_tools()
        for tool_settings in machines_tools.values():
            if tool == tool_settings['name']:
                min_z_axis_value = tool_settings['z_axis']['min']
                max_z_axis_value = tool_settings['z_axis']['max']

        # Ensure the value stays inside the range of the bed
        if material_thickness + max_z_axis_value < min_z_axis_value:
            # Define regex pattern for tool changer commands
            pattern = rf'{re.escape(constants.GRBL_TOOL_CHANGE)}T\d+'
            # Compile the regular expression pattern
            regex_pattern = re.compile(pattern)
            # Search for the pattern in the gcode content
            match = regex_pattern.search(gcode_content)
            if match:
                tool_changer_index = match.end()
                # Construct the material thickness command
                material_thickness_command = constants.GRBL_COMMAND_MOVE_BED + str(max_z_axis_value + material_thickness) + \
                    constants.GRBL_MATERIAL_THICKNESS_COMMENT + \
                    constants.NEW_LINE

                # Insert the material thickness command into the G-code content
                modified_gcode_content = gcode_content[:tool_changer_index] + constants.NEW_LINE + \
                    material_thickness_command + \
                    gcode_content[tool_changer_index:]
                return modified_gcode_content
            else:
                # If the relative position command is not found, return the original G-code content
                return gcode_content

    def _add_remove_tool_command_at_end(self, gcode_content):
        """
        Adds a tool removal command to the end of the G-code content.

        Args:
            gcode_content (str): Final G-code string.

        Returns:
            str: G-code with tool removal command appended.
        """

        return gcode_content + constants.NEW_LINE + \
            constants.GRBL_TOOL_CHANGE + constants.GRBL_NO_TOOL

    def _fetch_specific_settings(self, gcode_settings, type_of_settings):
        """
        Extracts and merges specific sub-settings from a full G-code settings dictionary.

        Args:
            gcode_settings (dict): Full G-code settings object.
            type_of_settings (list): List of keys to extract.

        Returns:
            dict: Combined dictionary containing only the selected settings.
        """

        specific_settings = {}
        gcode_settings = dict(gcode_settings)
        for setting in type_of_settings:
            specific_settings.update(gcode_settings.get(setting))
        return specific_settings
