from typing import Dict
from pydantic import BaseModel


class MediaManagerData(BaseModel):
    """
    Represents the data payload for media management operations.

    Attributes:
        process (str): Name or identifier of the current process.
        mediaData (Dict[str, str]): Dictionary containing media details.

            - mediaName (str): Name of the media file.
            - mediaSource (str): Source path or URL of the media file.

        mediaListData (list[str]): List of available media file names.
        success (bool): Indicates whether the operation was successful.
    """

    process: str = ''
    mediaData: Dict[str, str] = {'mediaName': '', 'mediaSource': '', }
    mediaListData: list[str] = []
    success: bool = False


class MediaManagerResponse(BaseModel):
    """
    Represents the full API response for media management requests.

    Attributes:
        type (str): Type of the response.
        data (MediaManagerData): The data payload containing media information.
    """

    type: str
    data: MediaManagerData


class RenameMediaData(BaseModel):
    """
    Represents the request body for renaming a media file.

    Attributes:
        old_media_name (str): Current name of the media file.
        new_media_name (str): New name for the media file.
    """

    old_media_name: str = ''
    new_media_name: str = ''


class USBMediaFileData(BaseModel):
    """
    Represents the request body for uploading a media file from a USB device.

    Attributes:
        media_name (str): Name of the media file.
        media_path (str): Path to the media file on the USB device.
    """

    media_name: str = ''
    media_path: str = ''
