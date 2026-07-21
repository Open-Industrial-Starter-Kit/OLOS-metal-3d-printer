import { defineStore } from 'pinia';
import { Constants } from 'src/constants';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { executeNormalGCommands } from 'src/services/execute.commands.service';

interface PowderRoutineSettings {
  reservoirLift: number;
  recoaterOut: number;
  recoaterHome: number;
  recoaterFeed: number;
}

/**
 * Pinia store managing jog control states and actions for machine movement.
 */
export const useJogControlsStore = defineStore('jogControls', {
  state: () => ({
    /** Progress of current job, from 0 to 100 */
    jobProgress: 0,

    /** Whether XY axis jogging is locked together */
    isXYLocked: true as boolean,

    /** Flags indicating if custom jog step values are used */
    isCustomXStepValue: false as boolean,
    isCustomYStepValue: false as boolean,
    isCustomZStepValue: false as boolean,

    /** Current slider index values controlling jog steps */
    xSliderValue: 0 as number,
    ySliderValue: 0 as number,
    zSliderValue: 0 as number,

    /** Jog step distances for each axis (units depend on machine config) */
    xJogStep: 0.1 as number,
    yJogStep: 0.1 as number,
    zJogStep: 0.1 as number,

    /** Flags indicating if custom speed values are used */
    isCustomXYSpeedValue: false as boolean,
    isCustomZSpeedValue: false as boolean,

    /** Jogging speeds (units per minute or similar) for XY and Z axes */
    xyJogSpeed: Constants.SPEED_CHOICES.slow as number,
    zJogSpeed: Constants.SPEED_CHOICES.slow as number,

    /** Currently selected speed label for display ('slow', 'normal', 'fast') */
    xyChosenSpeed: 'slow' as string,
    zChosenSpeed: 'slow' as string,
  }),

  actions: {
    /**
     * Toggles the XY lock status.
     * When locked, Y step size and slider value mirror X.
     */
    changeXYLockStatus() {
      this.isXYLocked = !this.isXYLocked;
      this.yJogStep = this.xJogStep;
      this.ySliderValue = this.xSliderValue;
    },

    /**
     * Sends jog commands to move the machine by specified distances on X, Y, Z axes.
     * Applies axis direction inversion based on machine configuration.
     * @param {number} x - Distance to jog on X axis.
     * @param {number} y - Distance to jog on Y axis.
     * @param {number} z - Distance to jog on Z axis.
     * @param {number} speed - Feedrate for jogging (units per minute).
     */
    async XYZJog(x: number, y: number, z: number, speed: number) {
      const config = await configurationSettings();

      // Set machine to relative positioning mode
      executeNormalGCommands(Constants.GRBL_COMMAND_RELATIVE_POSITION);

      // Compose G1 command with axis direction inversion and feedrate
      executeNormalGCommands(
        'G1 X' +
          (config?.axis_directions.xInvert ? -x : x) +
          'Y' +
          (config?.axis_directions.yInvert ? -y : y) +
          'Z' +
          (config?.axis_directions.zInvert ? -z : z) +
          'F' +
          speed * 60
      );

      // Return to absolute positioning mode
      executeNormalGCommands(Constants.GRBL_COMMAND_ABSOLUTE_POSITION);
    },

    /**
     * Moves one auxiliary machine axis in relative mode.
     * The speed is supplied directly in mm/min to match the machine routine.
     */
    auxiliaryAxisJog(axis: 'A' | 'B', distance: number, speed: number) {
      if (!Number.isFinite(distance) || !Number.isFinite(speed) || speed <= 0) {
        return;
      }

      executeNormalGCommands(Constants.GRBL_COMMAND_RELATIVE_POSITION);
      executeNormalGCommands(`G1 ${axis}${distance} F${speed}`);
      executeNormalGCommands(Constants.GRBL_COMMAND_ABSOLUTE_POSITION);
    },

    /**
     * Runs the metal-printer powder-feed and recoater routine used by the
     * slicer. A positive reservoir lift is converted to the machine's
     * negative A-axis direction.
     */
    runPowderRoutine(settings: PowderRoutineSettings) {
      if (
        !Number.isFinite(settings.reservoirLift) ||
        settings.reservoirLift <= 0 ||
        !Number.isFinite(settings.recoaterOut) ||
        !Number.isFinite(settings.recoaterHome) ||
        !Number.isFinite(settings.recoaterFeed) ||
        settings.recoaterFeed <= 0
      ) {
        return;
      }

      const commands = [
        'S0',
        'M5',
        'G92 A0',
        'G92 Z0',
        'G1 F10000 S0',
        'G53 X-395.5 Y-4.5 S0',
        `G1 A-${settings.reservoirLift} F50`,
        'G1 Z0.075 F50',
        `G1 F${settings.recoaterFeed} S0`,
        `G53 B${settings.recoaterOut} S0`,
        `G53 B${settings.recoaterHome} S0`,
        'G1 F10000 S0',
        'M5',
      ];

      commands.forEach(executeNormalGCommands);
    },

    /**
     * Sets the X jog step based on the current slider value index.
     */
    setXJogStepSlider() {
      this.xJogStep = Constants.SLIDER_LABELS_VALUES[this.xSliderValue];
    },

    /**
     * Sets the Y jog step based on the current slider value index.
     */
    setYJogStepSlider() {
      this.yJogStep = Constants.SLIDER_LABELS_VALUES[this.ySliderValue];
    },

    /**
     * Sets the Z jog step based on the current slider value index.
     */
    setZJogStepSlider() {
      this.zJogStep = Constants.SLIDER_LABELS_VALUES[this.zSliderValue];
    },

    /**
     * Sets a custom jog step value for X axis.
     * @param {number} value - Custom jog step size.
     */
    setCustomXStep(value: number) {
      this.xJogStep = value;
    },

    /**
     * Sets a custom jog step value for Y axis.
     * @param {number} value - Custom jog step size.
     */
    setCustomYStep(value: number) {
      this.yJogStep = value;
    },

    /**
     * Sets a custom jog step value for Z axis.
     * @param {number} value - Custom jog step size.
     */
    setCustomZStep(value: number) {
      this.zJogStep = value;
    },

    /**
     * Sets XY axis jog speed based on predefined choices.
     * @param {string} choice - One of 'slow', 'normal', or 'fast'.
     */
    setXYSpeedChoice(choice: string) {
      if (choice === 'slow') this.xyJogSpeed = Constants.SPEED_CHOICES.slow;
      else if (choice === 'normal')
        this.xyJogSpeed = Constants.SPEED_CHOICES.normal;
      else if (choice === 'fast')
        this.xyJogSpeed = Constants.SPEED_CHOICES.fast;

      this.xyChosenSpeed = choice;
    },

    /**
     * Sets Z axis jog speed based on predefined choices.
     * @param {string} choice - One of 'slow', 'normal', or 'fast'.
     */
    setZSpeedChoice(choice: string) {
      if (choice === 'slow') this.zJogSpeed = Constants.SPEED_CHOICES.slow;
      else if (choice === 'normal')
        this.zJogSpeed = Constants.SPEED_CHOICES.normal;
      else if (choice === 'fast') this.zJogSpeed = Constants.SPEED_CHOICES.fast;

      this.zChosenSpeed = choice;
    },

    /**
     * Sets a custom jogging speed for XY axes.
     * @param {number} value - Custom speed value.
     */
    setCustomXYSpeed(value: number) {
      this.xyJogSpeed = value;
    },

    /**
     * Sets a custom jogging speed for Z axis.
     * @param {number} value - Custom speed value.
     */
    setCustomZSpeed(value: number) {
      this.zJogSpeed = value;
    },
  },
});
