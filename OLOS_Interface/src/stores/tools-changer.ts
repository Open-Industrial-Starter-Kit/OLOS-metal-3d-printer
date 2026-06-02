import { defineStore } from 'pinia';
import { Tool } from 'src/interfaces/configSettings.interface';
import { executeNormalGCommands } from 'src/services/execute.commands.service';

/**
 * Pinia store responsible for handling machine tool changes
 * by executing the associated G-code commands for a given tool.
 */
export const useToolsChangerStore = defineStore('toolsChanger', {
  actions: {
    /**
     * Executes the G-code command associated with the specified tool.
     *
     * @param {Tool} tool - The tool object containing the G-code command to execute.
     */
    useTool(tool: Tool) {
      executeNormalGCommands(tool.command);
    },
  },
});
