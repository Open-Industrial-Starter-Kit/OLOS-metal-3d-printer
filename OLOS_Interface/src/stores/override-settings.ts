import { defineStore } from 'pinia';
import { Constants } from 'src/constants';
import { executeRealTimeGCommands } from 'src/services/execute.commands.service';

/**
 * Pinia store to manage real-time override settings for feed rate and tool power.
 *
 * This store is primarily used for controlling machine operations by sending
 * GRBL real-time override commands to adjust feed rate and tool power during a job.
 */
export const useOverrideSettingsStore = defineStore('overrideSettings', {
  state: () => ({
    /** Current feed rate percentage (default is 100%) */
    feedRate: 100 as number,

    /** Current tool power percentage (default is 100%) */
    toolPower: 100 as number,
  }),

  actions: {
    /**
     * Increase feed rate by 1% and send the corresponding GRBL real-time command.
     */
    increaseFeedRateOnePercent() {
      this.feedRate += 1;
      executeRealTimeGCommands(Constants.GRBL_COMMAND_INCREASE_FEED_RATE_1);
    },

    /**
     * Increase feed rate by 10% and send the corresponding GRBL real-time command.
     */
    increaseFeedRateTenPercent() {
      this.feedRate += 10;
      executeRealTimeGCommands(Constants.GRBL_COMMAND_INCREASE_FEED_RATE_10);
    },

    /**
     * Decrease feed rate by 1% and send the corresponding GRBL real-time command.
     */
    decreaseFeedRateOnePercent() {
      this.feedRate -= 1;
      executeRealTimeGCommands(Constants.GRBL_COMMAND_DECREASE_FEED_RATE_1);
    },

    /**
     * Decrease feed rate by 10% and send the corresponding GRBL real-time command.
     */
    decreaseFeedRateTenPercent() {
      this.feedRate -= 10;
      executeRealTimeGCommands(Constants.GRBL_COMMAND_DECREASE_FEED_RATE_10);
    },

    /**
     * Reset feed rate to 100% and send the GRBL default feed rate command.
     */
    defaultFeedRate() {
      this.feedRate = 100;
      executeRealTimeGCommands(Constants.GRBL_COMMAND_DEFAULT_FEED_RATE);
    },

    /**
     * Reset tool power to 100% and send the GRBL default tool speed command.
     */
    defaultToolPower() {
      this.toolPower = 100;
      executeRealTimeGCommands(Constants.GRBL_COMMAND_DEFAULT_TOOL_SPEED);
    },

    /**
     * Increase tool power by 1% and send the corresponding GRBL real-time command.
     */
    increaseToolPowerOnePercent() {
      this.toolPower += 1;
      executeRealTimeGCommands(Constants.GRBL_COMMAND_INCREASE_TOOL_SPEED_1);
    },

    /**
     * Increase tool power by 10% and send the corresponding GRBL real-time command.
     */
    increaseToolPowerTenPercent() {
      this.toolPower += 10;
      executeRealTimeGCommands(Constants.GRBL_COMMAND_INCREASE_TOOL_SPEED_10);
    },

    /**
     * Decrease tool power by 1% and send the corresponding GRBL real-time command.
     */
    decreaseToolPowerOnePercent() {
      this.toolPower -= 1;
      executeRealTimeGCommands(Constants.GRBL_COMMAND_DECREASE_TOOL_SPEED_1);
    },

    /**
     * Decrease tool power by 10% and send the corresponding GRBL real-time command.
     */
    decreaseToolPowerTenPercent() {
      this.toolPower -= 10;
      executeRealTimeGCommands(Constants.GRBL_COMMAND_DECREASE_TOOL_SPEED_10);
    },
  },
});
