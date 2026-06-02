import { Constants } from 'src/constants';
import { executeNormalGCommands } from 'src/services/execute.commands.service';
import { useMachineStatusStore } from 'src/stores/machine-status';

interface JoystickData {
  type: string;
  x_axis_step: number;
  y_axis_step: number;
  feedRate: number;
  rest_xy: boolean;
  time: string;
}

/**
 * @description Handles incoming joystick control data to either reset or move the X and Y axes.
 * @param {JoystickData} res - The joystick event data containing movement steps, feed rate, and control flags.
 * @returns {void}
 */
export const handleJoystickData = (res: JoystickData) => {
  // reset x and y
  // if (res.rest_xy) {
  //   resetXY();
  // } else {
  jogXY(res.x_axis_step, res.y_axis_step, res.feedRate);
  // }
};

/**
 * @description Sends G-code commands to reset the X and Y coordinates to zero and updates the machine status store.
 * @returns {void}
 */
const resetXY = () => {
  executeNormalGCommands(Constants.GRBL_COMMAND_RESET_ZERO_XY);
  useMachineStatusStore().resetXYJobPosition();
};

/**
 * @description Sends G-code jog commands to move the machine's X and Y axes by specified steps at a given feed rate.
 *              Uses relative positioning for the move, then switches back to absolute positioning.
 * @param {number} x - The movement step for the X-axis.
 * @param {number} y - The movement step for the Y-axis.
 * @param {number} feedRate - The feed rate for the jog movement in units per minute.
 * @returns {void}
 */
const jogXY = (x: number, y: number, feedRate: number) => {
  // jog x and y
  executeNormalGCommands(Constants.GRBL_COMMAND_RELATIVE_POSITION);
  executeNormalGCommands('G1 X' + x + ' Y' + y + ' F' + feedRate * 60);
  executeNormalGCommands(Constants.GRBL_COMMAND_ABSOLUTE_POSITION);
};
