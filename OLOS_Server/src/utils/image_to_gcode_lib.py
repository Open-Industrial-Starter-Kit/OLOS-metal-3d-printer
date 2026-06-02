"""
A library for converting images into G-code commands suitable for laser engraving.
"""

import io
import math
import numpy as np
from PIL import Image, ImageOps


class Image2gcodeLib:
    """
    This class handles image preprocessing, pixel-based power mapping, coordinate transformations,
    and G-code generation using a scanline approach.

    Args:
        power_func (callable, optional): Function to map pixel intensity to power level.
        transformation_func (callable, optional): Function to transform (X, Y) coordinates.
    """

    def __init__(self, power_func=None, transformation_func=None):
        self._power = power_func if power_func is not None else self.linear_power
        self._transformation = transformation_func

    def _load_image(self, img_bytes, pixel_size_tuple, image_size=None, inverted=False):
        """
        Load and process the image from bytes.

        Args:
            img_bytes (bytes): The input image in bytes.
            pixel_size_tuple (tuple): Size of each pixel in logical units (x, y).
            image_size (tuple, optional): Desired physical size of the image.
            inverted (bool): If True, inverts the image colors.

        Returns:
            np.ndarray: Processed grayscale image as a 2D numpy array, flipped vertically.
        """

        img = Image.open(io.BytesIO(img_bytes))
        if inverted:
            # Invert: black (0) becomes white (255), white (255) becomes black (0)
            img = ImageOps.invert(img.convert('RGB'))

        # For engraving, black parts of original image should get power.
        # After invert, original black (strong) is 255, original white (weak) is 0.
        # The self._power function will treat smaller values as higher power.
        img = img.convert('RGBA')

        img_background = Image.new(
            mode="RGBA", size=img.size, color=(255, 255, 255, 255))
        img = Image.alpha_composite(img_background, img)

        # Calculate new dimensions for resizing
        # The image is resized so that each pixel in the new image corresponds to one G-code step
        if image_size:
            new_width = int(round(image_size[0] / pixel_size_tuple[0]))
            new_height = int(round(image_size[1] / pixel_size_tuple[1]))
        else:
            new_width = int(round(img.size[0]))
            new_height = int(round(img.size[1]))

        new_width = max(1, new_width)
        new_height = max(1, new_height)

        img_resized = img.resize(
            (new_width, new_height), Image.Resampling.LANCZOS).convert("L")

        img_arr = np.array(img_resized)
        # Flip for G-code coordinate system
        img_arr_flipped = np.flipud(img_arr)
        return img_arr_flipped

    def _calculate_precision(self, pixel_size_tuple):
        """
        Calculate decimal precision for X and Y coordinates.

        Args:
            pixel_size_tuple (tuple): Pixel size in logical units (x, y).

        Returns:
            tuple: Number of decimal places for X and Y coordinates.
        """

        x_str = str(pixel_size_tuple[0])
        y_str = str(pixel_size_tuple[1])
        X_prec = len(x_str.split('.')[1]) if '.' in x_str else 0
        Y_prec = len(y_str.split('.')[1]) if '.' in y_str else 0
        return max(X_prec, 4), max(Y_prec, 4)

    def _get_initial_logical_coordinates(self, offset_tuple, X_prec, Y_prec):
        """
        Get initial logical coordinates from offset, rounded to precision.

        Args:
            offset_tuple (tuple): Offset in logical units (x, y).
            X_prec (float): Decimal places for X.
            Y_prec (float): Decimal places for Y.

        Returns:
            tuple: Initial logical (X, Y) coordinates.
        """

        X = round(offset_tuple[0], X_prec)
        Y = round(offset_tuple[1], Y_prec)
        return X, Y

    def _apply_transformation(self, XY_tuple, X_prec, Y_prec):
        """
        Apply coordinate transformation with rounding.

        Args:
            XY_tuple (tuple): Input (X, Y) coordinates.
            X_prec (float): Decimal places for X.
            Y_prec (float): Decimal places for Y.

        Returns:
            tuple: Transformed (X, Y) coordinates.
        """

        if self._transformation is None:
            # No transformation, just ensure rounding to precision
            return round(XY_tuple[0], X_prec), round(XY_tuple[1], Y_prec)

        Xd, Yd = self._transformation(XY_tuple)
        return round(Xd, X_prec), round(Yd, Y_prec)

    @staticmethod
    def linear_power(pixel_value, max_power, power_offset=0):
        """
        Linear mapping from pixel intensity to laser power.

        Args:
            pixel_value (int): Pixel brightness (0-255).
            max_power (int): Maximum laser power.
            power_offset (int): Minimum laser power.

        Returns:
            int: Scaled power value.
        """

        return power_offset + round((1.0 - float(pixel_value/255)) * (max_power - power_offset))

    @staticmethod
    def distance(A_tuple, B_tuple):
        """
        Calculate Euclidean distance between two points.

        Args:
            A_tuple (tuple): First point (x1, y1).
            B_tuple (tuple): Second point (x2, y2).

        Returns:
            float: Distance between the two points.
        """

        return math.sqrt((A_tuple[0] - B_tuple[0])**2 + (A_tuple[1] - B_tuple[1])**2)

    def _add_initial_gcode_setup(self, gcode_commands_list, speed):
        """
        Add initial G-code setup commands.

        Args:
            gcode_commands_list (list): List to store G-code strings.
            speed (int): Feed rate for G1 movement.
        """

        gcode_commands_list.append(f"G0 F{speed}")

    def _ensure_head_at_position(self, target_logical_coord_tuple, current_head_logical_coord_tuple, args, X_prec, Y_prec):
        """
        Ensure G-code head is at the target position.

        Args:
            target_logical_coord_tuple (tuple): Target (X, Y) coordinate.
            current_head_logical_coord_tuple (tuple): Current (X, Y) position.
            args (dict): Settings for G-code generation.
            X_prec (float): Decimal places for X.
            Y_prec (float): Decimal places for Y.

        Returns:
            str: G-code command for move or empty string.
        """

        # Round logical coordinates for comparison to avoid floating point issues
        if round(target_logical_coord_tuple[0], X_prec) == round(current_head_logical_coord_tuple[0], X_prec) and \
           round(target_logical_coord_tuple[1], Y_prec) == round(current_head_logical_coord_tuple[1], Y_prec):
            return ""  # Head is already at the target logical position

        # Apply transformation for G-code output and distance calculation
        target_transformed_X, target_transformed_Y = self._apply_transformation(
            target_logical_coord_tuple, X_prec, Y_prec)
        current_head_transformed_X, current_head_transformed_Y = self._apply_transformation(
            current_head_logical_coord_tuple, X_prec, Y_prec)

        move_gcode = ""
        speedmoves_threshold = args.get("speedmoves")

        # Check if a fast move (G0) is warranted
        if speedmoves_threshold is not None and \
           self.distance((current_head_transformed_X, current_head_transformed_Y),
                         (target_transformed_X, target_transformed_Y)) > speedmoves_threshold:
            # G1 to ensure next move is controlled speed
            move_gcode = f"G0 X{target_transformed_X} Y{target_transformed_Y}\nG1"
        else:
            # Standard speed move with laser off (S0)
            move_gcode = f"G1 X{target_transformed_X} Y{target_transformed_Y} S0"

        return move_gcode

    # Processes a single scan line of pixels (including a terminator) and generates G-code segments.
    def _process_scan_line_pixels(
        self,
        line_pixel_data_terminated,
        line_processing_start_X_logical,
        current_Y_logical_for_line,
        initial_head_logical_on_line_entry,
        is_left_to_right_scan,
        args, X_prec, Y_prec
    ):
        """
        Process a scan line and generate G-code segments.

        Args:
            line_pixel_data_terminated (np.ndarray): Line pixel values + terminator.
            line_processing_start_X_logical (float): X start for this line.
            current_Y_logical_for_line (float): Y position for this line.
            initial_head_logical_on_line_entry (tuple): Head position on line entry.
            is_left_to_right_scan (bool): Scan direction.
            args (dict): Settings for G-code generation.
            X_prec (float): X coordinate precision.
            Y_prec (float): Y coordinate precision.

        Returns:
            tuple: (updated head position, list of G-code commands for the line)
        """

        pixel_width_logical = args["pixel_size"][0]
        powers = np.array([self._power(px, args["power"])
                          for px in line_pixel_data_terminated])

        # Indices where power changes
        change_indices = np.where(np.diff(powers) != 0)[0] + 1
        segment_starts = np.insert(change_indices, 0, 0)
        segment_ends = np.append(change_indices, len(powers) - 1)

        gcode_segments_for_this_line = []
        head_logical_tracker = initial_head_logical_on_line_entry

        for start_idx, end_idx in zip(segment_starts, segment_ends):
            segment_power = powers[start_idx]
            if segment_power <= args["noise"]:
                continue  # Skip noise

            segment_length = end_idx - start_idx
            x_step_logical = pixel_width_logical if is_left_to_right_scan else -pixel_width_logical
            segment_start_X = round(
                line_processing_start_X_logical + start_idx * x_step_logical, X_prec)
            segment_end_X = round(
                segment_start_X + segment_length * x_step_logical, X_prec)

            # Ensure head is at segment start
            move_gcode = self._ensure_head_at_position(
                (segment_start_X, current_Y_logical_for_line),
                head_logical_tracker, args, X_prec, Y_prec
            )
            if move_gcode:
                gcode_segments_for_this_line.append(move_gcode)

            # Create G1 draw command
            Xd, Yd = self._apply_transformation(
                (segment_end_X, current_Y_logical_for_line), X_prec, Y_prec
            )
            gcode = f"G1 X{Xd} Y{Yd} S{segment_power}F{int(args['speed'])}"
            gcode_segments_for_this_line.append(gcode)

            head_logical_tracker = (segment_end_X, current_Y_logical_for_line)

        return head_logical_tracker, gcode_segments_for_this_line

    @classmethod
    def image_to_gcode(cls, img_bytes, args):
        """
        Convert an image to G-code commands.

        Args:
            img_bytes (bytes): The input image.
            args (dict): Dictionary of required parameters:

                - pixel_size (tuple): Logical size per pixel (x, y).
                - size (tuple): Output image size (optional).
                - inverted (bool): Invert image colors.
                - offset (tuple): Initial G-code position (x, y).
                - speed (int): Feed rate.
                - power (int): Maximum laser power.
                - noise (int): Minimum threshold power.
                - speedmoves (float): Min distance for fast move (optional).

        Returns:
            str: G-code string.
        """

        convertor = cls()
        # Load and preprocess the image based on pixel size
        image_array = convertor._load_image(
            img_bytes, args["pixel_size"], args["size"], args["inverted"])
        X_prec, Y_prec = convertor._calculate_precision(args["pixel_size"])

        # Get initial logical G-code coordinates from offset
        initial_logical_X, initial_logical_Y = convertor._get_initial_logical_coordinates(
            args["offset"], X_prec, Y_prec)

        all_gcode_commands = []
        # Add G0 move to the (transformed) starting position and set G1 speed
        convertor._add_initial_gcode_setup(
            all_gcode_commands, args["speed"])

        # Head's logical G-code position, starts at the defined offset.
        current_head_logical = (initial_logical_X, initial_logical_Y)

        is_scan_left_to_right = True  # Start scanning from Left to Right
        num_pixel_columns_in_image = image_array.shape[1]
        pixel_width_gcode_units = args["pixel_size"][0]
        pixel_height_gcode_units = args["pixel_size"][1]

        # Iterate over each row of pixels in the (vertically flipped) image array
        for line_index, unprocessed_pixel_row in enumerate(image_array):
            # Draw on pixel centers so scanline pitch stays even after the
            # slicer applies an inward contour clearance.
            current_line_Y_logical = round(
                initial_logical_Y + (line_index + 0.5) * pixel_height_gcode_units,
                Y_prec)

            if is_scan_left_to_right:
                # Scanning L->R: The first pixel processed is at the leftmost X G-code coordinate for this line.
                line_scan_start_X_logical = initial_logical_X
                pixel_row_for_processing = unprocessed_pixel_row  # Use the row as is
            else:  # Scanning R->L
                # The first pixel processed is the rightmost image pixel for this line.
                # Its logical X G-code coordinate (left edge for drawing) is: offset_X + (num_columns - 1) * pixel_width
                line_scan_start_X_logical = round(initial_logical_X +
                                                  (num_pixel_columns_in_image - 1) * pixel_width_gcode_units, X_prec)
                # Flip the row for R->L processing
                pixel_row_for_processing = np.flip(unprocessed_pixel_row)

            # Add a terminator sentinel value (0) to the end of the pixel row data.
            # This helps finalize the last segment of pixels in _process_scan_line_pixels.
            pixel_row_terminated = np.append(pixel_row_for_processing, 0)

            # Process the current line of pixels to generate G-code segments
            head_after_line_proc, gcode_for_this_line = convertor._process_scan_line_pixels(
                pixel_row_terminated,
                line_scan_start_X_logical,
                current_line_Y_logical,
                current_head_logical,
                is_scan_left_to_right,
                args, X_prec, Y_prec
            )

            # Add generated G-code for the line
            all_gcode_commands.extend(gcode_for_this_line)
            # Update head's logical G-code position
            current_head_logical = head_after_line_proc

            # Alternate scan direction for the next line
            is_scan_left_to_right = not is_scan_left_to_right

        # Join all G-code commands, filtering out any potential empty strings from moves not taken
        return '\n'.join(filter(None, all_gcode_commands))
