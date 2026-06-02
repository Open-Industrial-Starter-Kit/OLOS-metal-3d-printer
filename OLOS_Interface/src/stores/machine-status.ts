import { defineStore } from 'pinia';
import { Constants } from 'src/constants';
import {
  JobPosition,
  MachineConnectionData,
  StatusData,
} from 'src/interfaces/machineStatus.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';

const config = await configurationSettings();

const statusInitialValue: StatusData = {
  type: Constants.MACHINE_STATUS_DATA_TYPE,
  state: Constants.CONNECTING,
  machine_position: {
    x: 0,
    y: 0,
    z: 0,
  },
  work_coordinate_offset: {
    x: 0,
    y: 0,
    z: 0,
  },
  buffer_state: {
    commands_queued: 0,
    buffer_length: 0,
  },
  feed_and_speed: {
    feed_rate: 0,
    speed: 0,
  },
  overrides: {
    feed: 0,
    rapids: 0,
    spindle: 0,
  },
  machine_tool: 0,
};

const jobPositionInitialValue = (() => {
  // No z axis in vinyl cutter machines
  if (config.machine_type === Constants.MACHINE_TYPE.VINYL_CUTTER) {
    return {
      x: 0,
      y: 0,
    };
  } else {
    return {
      x: 0,
      y: 0,
      z: 0,
    };
  }
})();

/**
 * Pinia store to manage machine status and job position data.
 */
export const useMachineStatusStore = defineStore('status', {
  state: () => ({
    /**
     * Current status data of the machine.
     * @type {StatusData}
     */
    status: statusInitialValue as StatusData,

    /**
     * Current job position relative to the work coordinate offset.
     * @type {JobPosition}
     */
    job_position: jobPositionInitialValue as JobPosition,
  }),

  getters: {
    /**
     * Returns the current machine state.
     * @param {object} state - Store state
     * @returns {string}
     */
    machineState: (state) => state.status.state,

    /**
     * Returns the machine's current absolute position.
     * @param {object} state - Store state
     * @returns {{x: number, y: number, z?: number}}
     */
    machinePosition: (state) => state.status.machine_position,

    /**
     * Calculates and returns the job position relative to the work coordinate offset.
     * Formats the values as strings with 2 decimals.
     * @param {object} state - Store state
     * @returns {object} Job position with x, y, and optionally z as fixed strings.
     */
    jobPosition: (state) => {
      state.job_position.x =
        state.status.machine_position.x - state.status.work_coordinate_offset.x;

      state.job_position.y =
        state.status.machine_position.y - state.status.work_coordinate_offset.y;

      if (
        state.status.machine_position.z !== undefined &&
        state.status.work_coordinate_offset.z !== undefined
      ) {
        state.job_position.z =
          state.status.machine_position.z -
          state.status.work_coordinate_offset.z;
      }

      if (state.job_position.z !== undefined) {
        return {
          x: state.job_position.x.toFixed(2),
          y: state.job_position.y.toFixed(2),
          z: state.job_position.z.toFixed(2),
        };
      } else {
        return {
          x: state.job_position.x.toFixed(2),
          y: state.job_position.y.toFixed(2),
        };
      }
    },

    /**
     * Returns the current buffer state of the machine.
     * @param {object} state - Store state
     * @returns {object}
     */
    bufferState: (state) => state.status.buffer_state,

    /**
     * Returns the current feed and speed data.
     * @param {object} state - Store state
     * @returns {object}
     */
    feedAndSpeed: (state) => state.status.feed_and_speed,

    /**
     * Returns the current overrides applied to the machine.
     * @param {object} state - Store state
     * @returns {object}
     */
    overrides: (state) => state.status.overrides,

    /**
     * Returns the current active machine tool number.
     * @param {object} state - Store state
     * @returns {number}
     */
    machineTool: (state) => state.status.machine_tool,
  },

  actions: {
    /**
     * Updates connection status based on connection data.
     * Resets status to initial value if connection is unsuccessful.
     * @param {MachineConnectionData} connect - Connection result data
     * @returns {void}
     */
    updateConnectionStatus(connect: MachineConnectionData) {
      if (!connect.success) {
        this.status = statusInitialValue;
      }
    },

    /**
     * Updates the machine status.
     * Preserves existing work coordinate offset if missing in the new status.
     * @param {StatusData} status - New status data
     * @returns {void}
     */
    updateStatus(status: StatusData) {
      if (
        status.work_coordinate_offset &&
        status.work_coordinate_offset.x !== null &&
        status.work_coordinate_offset.y !== null
      ) {
        this.status = status;
      } else {
        const pre_work_coordinate_offset = this.status.work_coordinate_offset;
        this.status = {
          ...status,
          work_coordinate_offset: pre_work_coordinate_offset,
        };
      }
    },

    /**
     * Resets the X axis job position to zero relative to current machine position.
     * @returns {void}
     */
    resetXJobPosition() {
      this.status.work_coordinate_offset.x = this.machinePosition.x;
      this.job_position.x = 0;
    },

    /**
     * Resets the Y axis job position to zero relative to current machine position.
     * @returns {void}
     */
    resetYJobPosition() {
      this.status.work_coordinate_offset.y = this.machinePosition.y;
      this.job_position.y = 0;
    },

    /**
     * Resets the Z axis job position to zero relative to current machine position.
     * @returns {void}
     */
    resetZJobPosition() {
      this.status.work_coordinate_offset.z = this.machinePosition.z;
      this.job_position.z = 0;
    },

    /**
     * Resets both X and Y job positions to zero relative to current machine position.
     * @returns {void}
     */
    resetXYJobPosition() {
      this.status.work_coordinate_offset.x = this.machinePosition.x;
      this.job_position.x = 0;
      this.status.work_coordinate_offset.y = this.machinePosition.y;
      this.job_position.y = 0;
    },

    /**
     * Resets X, Y, and Z job positions to zero relative to current machine position.
     * @returns {void}
     */
    resetXYZJobPosition() {
      this.status.work_coordinate_offset.x = this.machinePosition.x;
      this.job_position.x = 0;
      this.status.work_coordinate_offset.y = this.machinePosition.y;
      this.job_position.y = 0;
      this.status.work_coordinate_offset.z = this.machinePosition.z;
      this.job_position.z = 0;
    },

    /**
     * Sets the X axis job position and updates the corresponding work coordinate offset.
     * @param {number} value - New X job position value
     * @returns {void}
     */
    setXJobPosition(value: number) {
      this.status.work_coordinate_offset.x = this.machinePosition.x
        ? this.machinePosition.x - value
        : value;
      this.job_position.x = value;
    },

    /**
     * Sets the Y axis job position and updates the corresponding work coordinate offset.
     * @param {number} value - New Y job position value
     * @returns {void}
     */
    setYJobPosition(value: number) {
      this.status.work_coordinate_offset.y = this.machinePosition.y
        ? this.machinePosition.y - value
        : value;
      this.job_position.y = value;
    },

    /**
     * Sets the Z axis job position and updates the corresponding work coordinate offset.
     * @param {number} value - New Z job position value
     * @returns {void}
     */
    setZJobPosition(value: number) {
      this.status.work_coordinate_offset.z = this.machinePosition.z
        ? this.machinePosition.z - value
        : value;
      this.job_position.z = value;
    },
  },
});
