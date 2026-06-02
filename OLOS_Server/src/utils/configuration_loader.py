import os
import yaml

# class to load config file values


class ConfigurationLoader:
    """
    A utility class to load and access values from a YAML configuration file.

    The class recursively converts nested dictionaries into ConfigurationLoader
    instances for easy dot notation access.

    Attributes:
        _original_dict (dict): Stores the raw dictionary loaded from the YAML file.

    Args:
        dictionary (dict): raw dictionary loaded from the YAML file
    """

    def __init__(self, dictionary):
        # Keep the original dictionary
        self._original_dict = dictionary
        for key, value in dictionary.items():
            if isinstance(value, dict):
                value = ConfigurationLoader(value)
            setattr(self, key, value)

    @classmethod
    def from_yaml(cls):
        """
        Loads configuration data from a YAML file.

        The YAML file is expected at the relative path: ../../../config.yaml.

        Returns:
            ConfigurationLoader: An instance with configuration values loaded.
        """

        # Absolute path of the current file
        file_path = os.path.abspath(os.path.join(__file__, "../../.."))

        config_file_path = os.path.join(file_path, 'config.yaml')

        with open(config_file_path, 'r') as file:
            config_dict = yaml.safe_load(file)

        return cls(config_dict)

    def __getattr__(self, item):
        """
        Fallback attribute access using the internal dictionary.

        Args:
            item (str): The attribute name.

        Returns:
            Any: The value of the attribute if found, else None.
        """

        return self.__dict__.get(item)

    def get_dict(self, path):
        """
        Retrieves a nested dictionary value using dot-separated keys.

        Example:
            config.get_dict("database.credentials.username")

        Args:
            path (str): Dot-separated key path (e.g., "parent.child.key").

        Returns:
            Any or None: The value found at the path, or None if not found.
        """

        keys = path.split('.')
        current_dict = self._original_dict
        for key in keys:
            current_dict = current_dict.get(key)
            if current_dict is None:
                return None
        return current_dict
