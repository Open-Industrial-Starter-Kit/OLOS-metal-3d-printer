import os
import sqlite3


class DataBaseConnections:
    """
    Handles the database connection and delegates table creation and cursor setup
    to helper classes related to materials, AI settings, and slicing profiles.

    This class ensures all required tables are created and initialized upon instantiation.

    Attributes:
        _materials_library_helper(MaterialsLibraryHelper): Helper for managing material-related database operations.
        _ai_helper(AIHelper): Helper for managing AI settings in the database.
        _slice_helper(SliceHelper): Helper for managing slicing profile data.
        _connection (sqlite3.Connection): SQLite connection object to the database.

    Args:
        material_library_helper (MaterialsLibraryHelper): Object responsible for managing materials library data.
        ai_helper (AIHelper): Object responsible for managing AI configuration data.
        slicing_helper (SliceHelper): Object responsible for managing slicing profile data.
    """

    def __init__(self, material_library_helper, ai_helper, slice_helper):
        self._materials_library_helper = material_library_helper
        self._ai_helper = ai_helper
        self._slice_helper = slice_helper

        # Get the absolute path of the database file
        db_path = os.path.abspath(os.path.join(__file__, "../../olos.db"))

        # Connect to the database using the absolute path
        self._connection = sqlite3.connect(db_path, check_same_thread=False)
        cursor = self._connection.cursor()

        # set the cursor for helper classes to be able to modify on the database
        if self._materials_library_helper:
            self._materials_library_helper.set_database_cursor(cursor)

        if self._ai_helper:
            self._ai_helper.set_database_cursor(cursor)

        if self._slice_helper:
            self._slice_helper.set_database_cursor(cursor)

        self.create_all_necessary_tables()

    def create_all_necessary_tables(self):
        """
        Creates all required database tables using the helper classes.

        Also populates the materials library tables with default data if necessary.
        Commits the transaction after all operations.
        """

        if self._materials_library_helper:
            self._materials_library_helper.create_materials_library_tables()
            self._materials_library_helper.add_default_materials_data_to_materials_library_tables()

        if self._ai_helper:
            self._ai_helper.create_ai_settings_table()

        if self._slice_helper:
            self._slice_helper.create_slicing_profiles_table()

        # commit the transaction of data to the tables
        self._connection.commit()
