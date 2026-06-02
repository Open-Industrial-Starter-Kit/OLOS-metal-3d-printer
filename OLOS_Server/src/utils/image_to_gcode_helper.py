import io
import logging
import re
import warnings
from svg2gcode.svg_to_gcode.svg_parser import parse_file
from svg2gcode.svg_to_gcode.compiler import Compiler, interfaces
from core.constants import CoreConstants as constants
from utils.image_to_gcode_lib import Image2gcodeLib
import numpy as np
from PIL import Image, ImageOps
from utils.tmp_files_manager import TempFilesManager


class ImageToGcodeHelper:
    """
    A helper class for converting image and SVG file contents into G-code, transforming images,
    and modifying the resulting G-code for laser cutters machines.

    Attributes:
        _svg_tmp_file_path (str): Temporary file path for storing SVG file.
        _gcode_tmp_file_path (str): Temporary file path for storing generated G-code.
    """

    def __init__(self):
        # create helpers tmp files
        tmp_files_manager = TempFilesManager()

        self._svg_tmp_file_path = tmp_files_manager.create_temp_file('.svg')
        self._gcode_tmp_file_path = tmp_files_manager.create_temp_file(
            '.gcode')

    def generate_gcode_for_image(self, image_file_content, raster_settings):
        """
        Generate G-code for a raster image.

        Args:
            image_file_content (bytes): Binary content of the image file.
            raster_settings (dict): Settings for rasterization.

        Returns:
            str: Generated G-code content.
        """

        main_gcode_content = Image2gcodeLib.image_to_gcode(
            image_file_content, raster_settings)
        return main_gcode_content

    def generate_gcode_for_svg(self, svg_file_content, svg_settings):
        """
        Generate G-code from SVG content using svg2gcode.

        Args:
            svg_file_content (bytes): Binary content of the SVG file.
            svg_settings (dict): Dictionary containing SVG rendering parameters.

        Returns:
            str: Generated G-code content.
        """

        # save svg content into tmp svg file
        open(self._svg_tmp_file_path, 'wb').write(svg_file_content)

        # disable logging for the compiler function
        logging.disable()
        warnings.simplefilter("ignore")

        compiler = Compiler(interfaces.Gcode, params={
            'maximum_image_laser_power': svg_settings.get('power'),
            'image_movement_speed': svg_settings.get('speed'),
            'rapid_move': svg_settings.get('speedmoves'),
            'color_coded': 'black',
            'laser_mode': "constant",
            'pixel_size': float(100),
            'nofill': True
        })
        compiler.compile_to_file(
            self._gcode_tmp_file_path, self._svg_tmp_file_path, parse_file(self._svg_tmp_file_path,
                                                                           delta_origin=svg_settings.get(
                                                                               'origin'),
                                                                           scale_factor=svg_settings.get(
                                                                               'scale'),
                                                                           rotate_deg=svg_settings.get('rotate')))
        gcode_content = open(self._gcode_tmp_file_path, 'r').read()

        return gcode_content

    def modify_gcode_content(self, gcode_content):
        """
        Modify G-code by removing comments, unnecessary commands, scientific notation, and
        S1 commands.

        Args:
            gcode_content (str): Original G-code string.

        Returns:
            str: Cleaned and modified G-code.
        """

        # remove comments
        modified_gcode_content = self._remove_comments(
            gcode_content)

        # remove M2 and M9 from the gcode to prevent stopping the machine
        modified_gcode_content = self._remove_unnecessary_commands(
            modified_gcode_content)

        # replace eular numbers to decimal (because previewer can't recognize numbers that contains characters)
        modified_gcode_content = self._convert_scientific_notation_to_decimal(
            modified_gcode_content)

        # remove all the commands that contains S1 (not necessary commands)
        modified_gcode_content = self._remove_lines_containing_S1(
            modified_gcode_content)

        return modified_gcode_content

    def add_end_of_job_commands(self):
        """
        Add end-of-job commands to the G-code.

        Returns:
            str: G-code end commands.
        """

        return constants.NEW_LINE + \
            constants.GRBL_COOLANT_OFF + constants.NEW_LINE + constants.GRBL_END_PROGRAM

    def _remove_comments(self, gcode_content):
        """
        Remove comments (lines starting with ;) from G-code.

        Args:
            gcode_content (str): G-code string.

        Returns:
            str: G-code without comments.
        """

        pattern = r';.*?\n'
        # Replace all occurrences of the pattern with an empty string
        gcode_content = re.sub(pattern, '', gcode_content)

        return gcode_content

    def _remove_lines_containing_S1(self, gcode_content):
        """
        Remove lines containing standalone 'S1' from G-code.

        Args:
            gcode_content (str): G-code string.

        Returns:
            str: G-code without S1 commands.
        """

        # Split the input string into lines
        lines = gcode_content.split('\n')

        # Filter out lines that contain the specific substring "S1" but not "S10", "S11", etc.
        filtered_lines = [
            line for line in lines if not re.search(r'S1(?!\d)', line)]

        # Join the remaining lines back into a single string
        result_string = '\n'.join(filtered_lines)

        return result_string

    def _remove_unnecessary_commands(self, gcode_content):
        """
        Remove M2, M9, and other specific end commands from G-code.

        Args:
            gcode_content (str): G-code string.

        Returns:
            str: Cleaned G-code.
        """

        gcode_content = gcode_content.replace(
            constants.GCODE_GENERATOR_FILE_INITIAL_COMMANDS, '')
        gcode_content = gcode_content.replace(
            constants.GRBL_END_PROGRAM, '')
        gcode_content = gcode_content.replace(
            constants.GRBL_COOLANT_OFF, '')
        return gcode_content

    def _convert_scientific_notation_to_decimal(self, content):
        """
        Convert numbers in scientific notation in the G-code to standard decimal format.

        Args:
            content (str): G-code string.

        Returns:
            str: Modified G-code with decimal values.
        """

        # Regular expression to find numbers in scientific notation
        scientific_notation_pattern = re.compile(
            r'([-+]?\d*\.?\d+[eE][-+]?\d+)(?![\d])')

        # Function to convert a match to its decimal representation
        def convert_match(match):
            scientific_notation = match.group(1)
            decimal_representation = format(
                float(scientific_notation), '.15f').rstrip('0').rstrip('.')
            return decimal_representation

        # Substitute all scientific notation numbers with their decimal representation
        result_string = scientific_notation_pattern.sub(
            convert_match, content)

        return result_string

    def calculate_shift_and_scale(self, svg_file_content, user_scale_x=1, user_scale_y=1, user_shift_x=0, user_shift_y=0, rotation=0):
        """
        Calculate scaling and shifting transformations based on the SVG viewBox and user inputs.

        Args:
            svg_file_content (str): SVG file content as string.
            user_scale_x (float): User-defined scale on X-axis.
            user_scale_y (float): User-defined scale on Y-axis.
            user_shift_x (float): User-defined shift on X-axis.
            user_shift_y (float): User-defined shift on Y-axis.
            rotation (float): Rotation in degrees.

        Returns:
            tuple: (scale_x, scale_y, shift_x, shift_y)
        """

        # Extract viewBox and width/height attributes from the SVG string
        viewbox_match = re.search(r'viewBox="([^"]+)"', svg_file_content)
        width_match = re.search(r'width="([^"]+)"', svg_file_content)
        height_match = re.search(r'height="([^"]+)"', svg_file_content)

        if viewbox_match and width_match and height_match:
            # Parse viewBox, width, and height values
            viewbox_values = list(map(float, viewbox_match.group(1).split()))
            width, width_unit = self._extract_value_with_unit(width_match)
            height, height_unit = self._extract_value_with_unit(height_match)

            # Convert width and height to pixels
            width_px = self._convert_to_pixels(
                width, width_unit, reference=viewbox_values[2])
            height_px = self._convert_to_pixels(
                height, height_unit, reference=viewbox_values[3])

            # Adjust viewBox if units are not pixels
            if width_unit != 'px':
                viewbox_values[2] = width_px
            if height_unit != 'px':
                viewbox_values[3] = height_px

            # Calculate initial scale and shift factors
            scale_x = (width_px / viewbox_values[2]) * user_scale_x
            scale_y = (height_px / viewbox_values[3]) * user_scale_y
            shift_x = user_shift_x - viewbox_values[0]
            shift_y = user_shift_y - viewbox_values[1]

            # Apply rotation and find shifts
            if rotation != 0:
                shift_x_rot, shift_y_rot = self._apply_rotation_and_find_shift(
                    viewbox_values[2] * scale_x, viewbox_values[3] * scale_y, rotation)

                return scale_x, scale_y, shift_x + shift_x_rot, shift_y + shift_y_rot

            else:
                # no rotation
                return scale_x, scale_y, shift_x, shift_y
        else:
            # Apply rotation and find shifts
            if rotation != 0:
                width, width_unit = self._extract_value_with_unit(width_match)
                height, height_unit = self._extract_value_with_unit(
                    height_match)

                # Convert width and height to pixels
                width_px = self._convert_to_pixels(
                    width, width_unit)
                height_px = self._convert_to_pixels(
                    height, height_unit)

                if width_px and height_px:
                    shift_x_rot, shift_y_rot = self._apply_rotation_and_find_shift(
                        width_px * user_scale_x, height_px * user_scale_y, rotation)

                    return user_scale_x, user_scale_y, shift_x_rot, shift_y_rot
                else:
                    return user_scale_x, user_scale_y, user_shift_x, user_shift_y

            else:
                return user_scale_x, user_scale_y, 0, 0

    def _apply_rotation_and_find_shift(self, width, height, rotation):
        """
        Apply rotation and compute necessary shift to keep geometry in positive quadrant.

        Args:
            width (float): Width of the object.
            height (float): Height of the object.
            rotation (float): Rotation angle in degrees.

        Returns:
            tuple: (shift_x, shift_y)
        """

        theta = np.radians(rotation)

        # Define original corners of the bounding box (before any transformations)
        corners = np.array([
            [0, height],
            [width, height],
            [0, 0],
            [width, 0]
        ])

        # Rotation matrix
        rotation_matrix = np.array([
            [np.cos(theta), -np.sin(theta)],
            [np.sin(theta), np.cos(theta)]
        ])

        # Rotate corners
        rotated_corners = np.dot(corners, rotation_matrix.T)

        # Find minimum x and y values after rotation
        min_x = np.min(rotated_corners[:, 0])
        min_y = np.min(rotated_corners[:, 1])

        # Calculate the shifts to move the shape to the positive quadrant
        shift_x = -min_x if min_x < 0 else 0
        shift_y = -min_y if min_y < 0 else 0

        return shift_x, shift_y

    def _extract_value_with_unit(self, match, default_unit='px'):
        """
        Extract numerical value and unit from matched SVG attribute.

        Args:
            match (re.Match): Regex match object for width/height.
            default_unit (str): Default unit if none is found.

        Returns:
            tuple: (value as float, unit as str)
        """

        if match:
            value_with_unit = match.group(1)
            value, unit = re.match(r'([\d.]+)(\D+)?', value_with_unit).groups()
            if unit:
                return float(value), unit
            else:
                return float(value), default_unit
        else:
            return None, default_unit

    def _convert_to_pixels(self, value, unit, reference=None, dpi=96):
        """
        Convert various SVG units to pixels.

        Args:
            value (float): The numerical value.
            unit (str): Unit of the value.
            reference (float, optional): Reference size for percentage units.
            dpi (int): Dots per inch for conversion.

        Returns:
            float: Converted value in pixels.
        """

        if unit == 'px':
            return value
        elif unit == 'in':
            return value * dpi
        elif unit == 'cm':
            return value * dpi / 2.54
        elif unit == 'mm':
            return value * dpi / 25.4
        elif unit == 'pt':
            return value * dpi / 72
        elif unit == '%':
            if reference is not None:
                return value * reference / 100
            else:
                return None  # Return None if no reference is available
        else:
            raise ValueError(f"Unsupported unit: {unit}")

    def apply_transformation_on_image(self, image_file_content, image_settings):
        """
        Apply scaling and rotation transformations on an image.

        Args:
            image_file_content (bytes): Original image binary data.
            image_settings (dict): Transformation parameters.

        Returns:
            bytes: Transformed image binary content.
        """

        # Open the image using PIL
        image = Image.open(io.BytesIO(image_file_content))
        # Scale the image
        scaled_image = self._apply_scaling_on_image(image, image_settings)

        # Rotate the image
        rotated_scaled_image = self._apply_rotation_on_image(
            scaled_image, image_settings)

        # Convert the rotated, scaled, and cropped image back to binary data
        image_with_transformation = io.BytesIO()
        rotated_scaled_image.save(image_with_transformation, format='PNG')

        # Update the image content
        return image_with_transformation.getvalue()

    def _apply_rotation_on_image(self, image, image_settings):
        """
        Apply rotation to the image using PIL.

        Args:
            image (PIL.Image.Image): Input image.
            image_settings (dict): Dictionary containing rotation info.

        Returns:
            PIL.Image.Image: Rotated image.
        """

        rotation_angle = image_settings.get(
            'metrics').rotation
        # Rotate using PIL's rotate (expand=True to prevent cropping)
        rotated_image = image.rotate(
            rotation_angle, expand=True, fillcolor=(255, 255, 255))

        return rotated_image

    def _apply_scaling_on_image(self, image, image_settings):
        """
        Apply scaling on the image based on user settings and resolution.

        Args:
            image (PIL.Image.Image): Input image.
            image_settings (dict): Dictionary with metrics and resolution.

        Returns:
            PIL.Image.Image: Scaled image.
        """

        # get resolution value
        resolution = image_settings.get('dithering').resolution

        # Scale the image based on the image settings
        user_scale_x = image_settings.get('metrics').scaleX * resolution / 100
        user_scale_y = image_settings.get('metrics').scaleY * resolution / 100

        # If scale_y is negative, flip the image vertically
        if user_scale_y < 0:
            image = ImageOps.flip(image)
            # Make scale_y positive after flipping
            user_scale_y = abs(user_scale_y)

        # Get the original width and height
        original_width, original_height = image_settings.get(
            'metrics').width, image_settings.get('metrics').height

        # Scale the image while maintaining aspect ratio if only one scale is provided
        new_width = round(original_width * user_scale_x)
        new_height = round(original_height * user_scale_y)

        # Resize the image using the new dimensions
        scaled_image = image.resize(
            (new_width, new_height), Image.Resampling.LANCZOS)

        return scaled_image
