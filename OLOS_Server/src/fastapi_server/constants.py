class FastAPIServerConstants:
    """Constants for configuring and operating the FastAPI server module.

    These constants are used throughout the `fastapi_server` package for routing,
    validation, response generation, and error handling.

    Attributes:
        JOBS_MANAGER_ROUTE (str): API prefix for jobs manager endpoints.
        MEDIA_MANAGER_ROUTE (str): API prefix for media manager endpoints.
        AI_ROUTE (str): API prefix for AI-related endpoints.
        MATERIAL_LIBRARY_ROUTE (str): API prefix for material library endpoints.
        SLICE_ROUTE (str): API prefix for slicing-related endpoints.
        DOCUMENTATION_ROUTE (str): API prefix for documentation endpoint.

        MAX_JOB_SIZE (int): Maximum allowed job file size in bytes (50 MB).

        JOBS_MANAGER_DATA_TYPE (str): Identifier for jobs manager-related data.
        MEDIA_MANAGER_DATA_TYPE (str): Identifier for media manager-related data.
        AI_DATA_TYPE (str): Identifier for AI service-related data.
        MATERIAL_LIBRARY_DATA_TYPE (str): Identifier for material library-related data.
        SLICE_DATA_TYPE (str): Identifier for slicing-related data.

        UPLOAD_JOB_PROCESS (str): Process name for uploading a job.
        OPEN_JOB_PROCESS (str): Process name for opening a job.
        START_JOB_PROCESS (str): Process name for starting a job.
        DELETE_JOB_PROCESS (str): Process name for deleting a job.
        DOWNLOAD_JOB_PROCESS (str): Process name for downloading a job.
        RENAME_JOB_PROCESS (str): Process name for renaming a job.
        LIST_JOBS_PROCESS (str): Process name for listing jobs.
        CHECK_JOB_PROCESS (str): Process name for checking if a job is open.
        GENERATE_JOB_PROCESS (str): Process name for generating a G-code job.
        CANCEL_GENERATE_JOB_PROCESS (str): Process name for canceling G-code generation.
        UPLOAD_USB_JOB_FILE_PROCESS (str): Process name for uploading a job from USB.

        ERROR_UPLOAD_JOB_PROCESS (str): Error message for job upload failures.
        ERROR_OPEN_JOB_PROCESS (str): Error message for job open failures.
        ERROR_START_JOB_PROCESS (str): Error message for job start failures.
        ERROR_DELETE_JOB_PROCESS (str): Error message for job deletion failures.
        ERROR_DOWNLOAD_JOB_PROCESS (str): Error message for job download failures.
        ERROR_RENAME_JOB_PROCESS (str): Error message for job rename failures.
        ERROR_CHECK_JOB_PROCESS (str): Error message for job check failures.
        ERROR_GENERATE_JOB_PROCESS (str): Error message for G-code generation failures.
        ERROR_CANCEL_GENERATE_JOB_PROCESS (str): Error message for canceling G-code generation failures.
        ERROR_UPLOAD_USB_JOB_FILE_PROCESS (str): Error message for USB job upload failures.

        UPLOAD_MEDIA_PROCESS (str): Process name for uploading media.
        DELETE_MEDIA_PROCESS (str): Process name for deleting media.
        RENAME_MEDIA_PROCESS (str): Process name for renaming media.
        FETCH_MEDIA_DATA_PROCESS (str): Process name for fetching media data.
        LIST_MEDIA_DATA_PROCESS (str): Process name for listing media files.
        UPLOAD_USB_MEDIA_FILE_PROCESS (str): Process name for uploading media from USB.

        ERROR_UPLOAD_MEDIA_PROCESS (str): Error message for media upload failures.
        ERROR_DELETE_MEDIA_PROCESS (str): Error message for media deletion failures.
        ERROR_RENAME_MEDIA_PROCESS (str): Error message for media rename failures.
        ERROR_FETCH_MEDIA_DATA_PROCESS (str): Error message for media fetch failures.
        ERROR_LIST_MEDIA_DATA_PROCESS (str): Error message for media listing failures.
        ERROR_UPLOAD_USB_MEDIA_FILE_PROCESS (str): Error message for USB media upload failures.

        AI_GENERATE_IMAGES_PROCESS (str): Process name for AI image generation.
        AI_CANCEL_GENERATE_IMAGES_PROCESS (str): Process name for canceling AI image generation.
        CONFIG_AI_SETTINGS_PROCESS (str): Process name for configuring AI settings.
        ADD_AI_SETTING_PROCESS (str): Process name for adding AI settings.
        DELETE_AI_SETTING_PROCESS (str): Process name for deleting AI settings.
        UPDATE_AI_SETTING_PROCESS (str): Process name for updating AI settings.

        ERROR_AI_GENERATE_IMAGES_PROCESS (str): Error message for AI image generation failures.
        ERROR_AI_CANCEL_GENERATE_IMAGES_PROCESS (str): Error message for canceling AI generation failures.
        ERROR_CONFIG_AI_SETTINGS_PROCESS (str): Error message for AI config fetch failures.
        ERROR_ADD_AI_SETTING_PROCESS (str): Error message for adding AI settings failures.
        ERROR_DELETE_AI_SETTING_PROCESS (str): Error message for deleting AI settings failures.
        ERROR_UPDATE_AI_SETTING_PROCESS (str): Error message for updating AI settings failures.

        LIST_MATERIAL_PROCESS (str): Process name for listing materials.
        ADD_MATERIAL_PROCESS (str): Process name for adding a material.
        UPDATE_MATERIAL_PROCESS (str): Process name for updating a material.
        DELETE_MATERIAL_PROCESS (str): Process name for deleting a material.

        ERROR_LIST_MATERIAL_PROCESS (str): Error message for listing materials failures.
        ERROR_ADD_MATERIAL_PROCESS (str): Error message for adding materials failures.
        ERROR_UPDATE_MATERIAL_PROCESS (str): Error message for updating materials failures.
        ERROR_DELETE_MATERIAL_PROCESS (str): Error message for deleting materials failures.

        SLICE_PROCESS (str): Process name for slicing a model.
        CANCEL_SLICE_PROCESS (str): Process name for canceling slicing.
        SAVE_SLICE_PROCESS (str): Process name for saving a sliced model.
        PREVIEW_SLICE_PROCESS (str): Process name for previewing a sliced model.
        LIST_SLICING_PROFILES (str): Process name for listing slicing profiles.
        ADD_SLICING_PROFILE_PROCESS (str): Process name for adding slicing profiles.
        DELETE_SLICING_PROFILE_PROCESS (str): Process name for deleting slicing profiles.
        UPDATE_SLICING_PROFILE_PROCESS (str): Process name for updating slicing profiles.

        ERROR_SLICE_PROCESS (str): Error message for slicing failures.
        ERROR_CANCEL_SLICE_PROCESS (str): Error message for canceling slicing failures.
        ERROR_SAVE_SLICE_PROCESS (str): Error message for saving sliced models failures.
        ERROR_PREVIEW_SLICE_PROCESS (str): Error message for previewing sliced models failures.
        ERROR_LIST_SLICING_PROFILES_PROCESS (str): Error message for listing slicing profiles failures.
        ERROR_ADD_SLICING_PROFILE_PROCESS (str): Error message for adding slicing profiles failures.
        ERROR_DELETE_SLICING_PROFILE_PROCESS (str): Error message for deleting slicing profiles failures.
        ERROR_UPDATE_SLICING_PROFILE_PROCESS (str): Error message for updating slicing profiles failures.
    """

    # server routers
    JOBS_MANAGER_ROUTE = "/api/jobs_manager"
    MEDIA_MANAGER_ROUTE = "/api/media_manager"
    AI_ROUTE = "/api/ai"
    MATERIAL_LIBRARY_ROUTE = "/api/material_library"
    SLICE_ROUTE = "/api/slice"
    DOCUMENTATION_ROUTE = "/docs"

    # job limit size in bytes, in this case 50MB;
    MAX_JOB_SIZE = 52428800

    # Fast API types
    JOBS_MANAGER_DATA_TYPE = 'JOBS_MANAGER'
    MEDIA_MANAGER_DATA_TYPE = 'MEDIA_MANAGER'
    AI_DATA_TYPE = 'AI_SERVICE'
    MATERIAL_LIBRARY_DATA_TYPE = 'MATERIALS_LIBRARY'
    SLICE_DATA_TYPE = 'SLICE'

    # job manager processes
    UPLOAD_JOB_PROCESS = "Upload"
    OPEN_JOB_PROCESS = "Open"
    START_JOB_PROCESS = "Start"
    DELETE_JOB_PROCESS = "Delete"
    DOWNLOAD_JOB_PROCESS = "Download"
    RENAME_JOB_PROCESS = "Rename"
    SAVE_JOB_PROCESS = "Save"
    LIST_JOBS_PROCESS = "List"
    CHECK_JOB_PROCESS = "Check"
    GENERATE_JOB_PROCESS = "Generate"
    CANCEL_GENERATE_JOB_PROCESS = "Cancel"
    UPLOAD_USB_JOB_FILE_PROCESS = "Upload_USB_Job_File"

    ERROR_UPLOAD_JOB_PROCESS = "Problem ocurred while uploading the job process"
    ERROR_OPEN_JOB_PROCESS = "Problem ocurred while opening the job process"
    ERROR_START_JOB_PROCESS = "Problem ocurred while starting the job process"
    ERROR_DELETE_JOB_PROCESS = "Problem ocurred while deleting the job process"
    ERROR_DOWNLOAD_JOB_PROCESS = "Problem ocurred while downloading the job process"
    ERROR_RENAME_JOB_PROCESS = "Problem ocurred while renaming the job process"
    ERROR_SAVE_JOB_PROCESS = "Problem ocurred while saving the job process"
    ERROR_CHECK_JOB_PROCESS = "Problem ocurred while checking if there is an opened job process"
    ERROR_GENERATE_JOB_PROCESS = "Problem ocurred while generating gcode job process"
    ERROR_CANCEL_GENERATE_JOB_PROCESS = "Problem ocurred while canceling generating a job process"
    ERROR_UPLOAD_USB_JOB_FILE_PROCESS = "Problem ocurred while uploading job from usb process"

    # media manager processes
    UPLOAD_MEDIA_PROCESS = "Upload"
    DELETE_MEDIA_PROCESS = "Delete"
    RENAME_MEDIA_PROCESS = "Rename"
    FETCH_MEDIA_DATA_PROCESS = "Fetch"
    LIST_MEDIA_DATA_PROCESS = "List"
    UPLOAD_USB_MEDIA_FILE_PROCESS = "Upload_USB_Media_File"

    ERROR_UPLOAD_MEDIA_PROCESS = "Problem ocurred while uploading the media process"
    ERROR_DELETE_MEDIA_PROCESS = "Problem ocurred while deleting the media process"
    ERROR_RENAME_MEDIA_PROCESS = "Problem ocurred while renaming the media process"
    ERROR_FETCH_MEDIA_DATA_PROCESS = "Problem ocurred while fetching media data process"
    ERROR_LIST_MEDIA_DATA_PROCESS = "Problem ocurred while list media data process"
    ERROR_UPLOAD_USB_MEDIA_FILE_PROCESS = "Problem ocurred while uploading media from usb process"

    # AI Processes
    AI_GENERATE_IMAGES_PROCESS = "Generate"
    AI_CANCEL_GENERATE_IMAGES_PROCESS = "Cancel"
    CONFIG_AI_SETTINGS_PROCESS = "Config"
    ADD_AI_SETTING_PROCESS = "Add"
    DELETE_AI_SETTING_PROCESS = "Delete"
    UPDATE_AI_SETTING_PROCESS = "Update"

    ERROR_AI_GENERATE_IMAGES_PROCESS = "Problem occurred while generating images process"
    ERROR_AI_CANCEL_GENERATE_IMAGES_PROCESS = "Problem occurred while canceling generating images process"
    ERROR_CONFIG_AI_SETTINGS_PROCESS = "Problem occurred while fetching AI settings infos process"
    ERROR_ADD_AI_SETTING_PROCESS = "Problem occurred while adding AI setting process"
    ERROR_DELETE_AI_SETTING_PROCESS = "Problem occurred while deleting AI setting process"
    ERROR_UPDATE_AI_SETTING_PROCESS = "Problem occurred while updating AI setting process"

    # Material Library Processes
    LIST_MATERIAL_PROCESS = "List"
    ADD_MATERIAL_PROCESS = "Add"
    UPDATE_MATERIAL_PROCESS = "Update"
    DELETE_MATERIAL_PROCESS = "Delete"

    ERROR_LIST_MATERIAL_PROCESS = "Problem occurred while fetching materials infos process"
    ERROR_ADD_MATERIAL_PROCESS = "Problem occurred while adding new material process"
    ERROR_UPDATE_MATERIAL_PROCESS = "Problem occurred while updating a material process"
    ERROR_DELETE_MATERIAL_PROCESS = "Problem occurred while deleting a material process"

    # Slicing Processes
    SLICE_PROCESS = "Slice"
    CANCEL_SLICE_PROCESS = "Cancel"
    SAVE_SLICE_PROCESS = "Save"
    PREVIEW_SLICE_PROCESS = "Preview"
    LIST_SLICING_PROFILES = 'List'
    ADD_SLICING_PROFILE_PROCESS = 'Add'
    DELETE_SLICING_PROFILE_PROCESS = 'Delete'
    UPDATE_SLICING_PROFILE_PROCESS = 'Update'

    ERROR_SLICE_PROCESS = "Problem occurred during the slicing process"
    ERROR_CANCEL_SLICE_PROCESS = "Problem occurred while canceling the slicing process"
    ERROR_SAVE_SLICE_PROCESS = "Problem occurred while saving sliced file locally"
    ERROR_PREVIEW_SLICE_PROCESS = "Problem occurred while trying to preview sliced models"
    ERROR_LIST_SLICING_PROFILES_PROCESS = "Problem occurred while fetching slicing profiles process"
    ERROR_ADD_SLICING_PROFILE_PROCESS = "Problem occurred while adding new slicing profile process"
    ERROR_DELETE_SLICING_PROFILE_PROCESS = "Problem occurred while deleting a slicing profile process"
    ERROR_UPDATE_SLICING_PROFILE_PROCESS = "Problem occurred while updating a slicing profile process"
