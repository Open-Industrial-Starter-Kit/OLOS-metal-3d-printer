import jsyaml from 'js-yaml';
import { Config } from 'src/interfaces/configSettings.interface';

/**
 * @description Loads and parses the `config.yaml` file from the server, returning the configuration settings as a `Config` object.
 * @returns {Promise<Config>} A promise that resolves to the parsed configuration object.
 */
export const configurationSettings = async (): Promise<Config> => {
  return fetch('config.yaml')
    .then((res) => res.text())
    .then((content) => {
      // Parse the YAML file and cast it to the Config type
      const config = jsyaml.load(content) as Config;
      return config;
    });
};
