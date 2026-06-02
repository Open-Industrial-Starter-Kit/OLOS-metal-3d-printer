import base64
import os
from PIL import Image
import numpy as np
from autotrace import Bitmap, VectorFormat
from core.constants import CoreConstants as constants


class MediaConvertorHelper:
    """
    A utility class for converting media files between formats and encoding types.

    This class includes methods for:

    - Converting PNG images to SVG vector format.
    - Encoding media files to base64-encoded data URLs.
    - Decoding base64 data URLs back to binary data.
    """

    @staticmethod
    def convert_from_png_to_svg(media_paths):
        """
        Converts a list of PNG image file paths to SVG vector format.

        This function uses the `autotrace` library to trace each image and generate
        an SVG file with the same base name as the input image.

        Args:
            media_paths (list[str]): A list of paths to PNG image files.

        Returns:
            list[str]: A list of file paths to the newly created SVG files.
        """

        svg_media_paths = []
        for img_path in media_paths:
            with Image.open(img_path) as img:
                filename = os.path.splitext(img_path)[0].lower()
                # Convert image to RGB numpy array and create a Bitmap
                bitmap = Bitmap(np.asarray(img.convert("RGB")))

                # Trace bitmap into a vector
                vector = bitmap.trace(
                    despeckle_level=20,
                    despeckle_tightness=2,
                    error_threshold=0.1,
                    filter_iterations=0,
                    remove_adjacent_corners=True,
                    tangent_surround=0,
                    noise_removal=1,
                    color_count=16
                )

                # Save vector as SVG
                with open(filename + '.svg', mode='wb') as img:
                    img.write(vector.encode(VectorFormat.SVG))
                    svg_media_paths.append(img.name)

        return svg_media_paths

    @staticmethod
    def convert_media_to_base64(media_paths):
        """
        Converts a list of media files to base64-encoded strings with MIME type prefixes.

        Args:
            media_paths (list[str]): List of file paths to media files (e.g., .png, .jpg).

        Raises:
            ValueError: If a file extension is not supported.

        Returns:
            list[str]: A list of base64-encoded data URL strings (e.g., `data:image/png;base64,...`).
        """

        media_base64 = []

        for img_path in media_paths:
            # Determine file extension
            file_extension = os.path.splitext(img_path)[1].lower()

            # Get MIME type from extension
            mime_type = constants.ACCEPTED_MEDIA_FILES_EXTENSIONS.get(
                file_extension)
            if not mime_type:
                raise ValueError(
                    f"Unsupported file extension: {file_extension}")

            # Prepare data URL prefix
            data_url_prefix = f"data:{mime_type};base64,"

            # Read file and encode to base64
            with open(img_path, "rb") as file:
                file_content = file.read()
            base64_content = base64.b64encode(file_content).decode("utf-8")
            media_base64.append(data_url_prefix + base64_content)

        return media_base64

    @staticmethod
    def decode_base64_to_binary(base64_string):
        """
        Decodes a base64-encoded data URL into binary content.

        Args:
            base64_string (str): A base64-encoded string, optionally prefixed with a data URL header.

        Returns:
            bytes or None: The decoded binary content, or None if input is invalid.
        """

        decoded_data = None
        if base64_string and "," in base64_string:
            _, base64_data = base64_string.split(",", 1)
            decoded_data = base64.b64decode(base64_data)

        return decoded_data
