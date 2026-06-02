
"""
This module provides functionality for interpreting joystick input from a controller.

It converts joystick movement statuses into machine movement commands by calculating
X and Y axis steps, and optionally determining feed rates based on movement intensity.
"""

import re
import time

from core.constants import CoreConstants as constants


class JoystickHandler:
    """
    Handles joystick input and translates it into machine movement commands.

    This class provides methods to:

    - Read raw joystick status strings.
    - Calculate X/Y movement and feed rate.
    - Determine movement direction.

    Attributes:
        _joystick_initial_value (dict): A reference value to initialize the joy stick position
        _joystick_last_movement_time (float): Last time for the movement of the joystick
    """

    def __init__(self):
        # the joystick is in the middle
        self._joystick_initial_value = {
            'X': constants.JOYSTICK_CENTER_POINT[0],
            'Y': constants.JOYSTICK_CENTER_POINT[1],
            'Z': 0,
        }

        self._joystick_last_movement_time = time.time()

    # handle the values of the joystick
    def get_joystick_data_from_status(self, joystick_status):
        """
        Processes joystick status and returns machine movement data.

        Args:
            joystick_status (str): A status string representing joystick direction
                (e.g. 'JoyStick:UP', 'JoyStick:LEFT') or raw coordinate string.

        Returns:
            dict or None: A dictionary containing movement values in X, Y, feed rate (F),
            and reset (Z), or None if the status is unrecognized.
        """

        movement_data = self._calculate_machine_movement_data(
            joystick_status)
        return movement_data

    def _calculate_machine_movement_data(self, joystick_status):
        """
        Internal method to calculate movement data based on joystick status.

        Args:
            joystick_status (str): A high-level directional status or potentially a
                raw coordinate string.

        Returns:
            dict or None: Movement command dictionary for the machine or None if invalid.
        """

        # current_joystick_position = self._extract_joystick_position_data(
        #     joystick_status)

        if joystick_status:
            # x_axis_step = current_joystick_position['X'] - \
            #     self._joystick_initial_value['X']
            # y_axis_step = current_joystick_position['Y'] - \
            #     self._joystick_initial_value['Y']
            # feedRate = self._calculate_machine_moving_feedRate(
            #     x_axis_step, y_axis_step)
            # return {
            #     'X': x_axis_step,
            #     'Y': y_axis_step,
            #     'F': feedRate,
            #     'Reset': current_joystick_position['Z'],
            # }
            feedRate = 30
            if joystick_status == "JoyStick:UP":
                return {
                    'X': 0,
                    'Y': 10,
                    'F': feedRate,
                    'Reset': '0',
                }
            elif joystick_status == "JoyStick:DOWN":
                return {
                    'X': 0,
                    'Y': -10,
                    'F': feedRate,
                    'Reset': '0',
                }
            elif joystick_status == "JoyStick:LEFT":
                return {
                    'X': -10,
                    'Y': 0,
                    'F': feedRate,
                    'Reset': '0',
                }
            elif joystick_status == "JoyStick:RIGHT":
                return {
                    'X': 10,
                    'Y': 0,
                    'F': feedRate,
                    'Reset': '0',
                }
        return None

    # calculate the speed based on the step size (3 types of speed)
    def _calculate_machine_moving_feedRate(self, x_axis_step, y_axis_step):
        """
        Determines machine speed (feed rate) based on how far the joystick was pushed.

        Args:
            x_axis_step (int): Step movement along X-axis.
            y_axis_step (int): Step movement along Y-axis.

        Returns:
            int: Calculated feed rate (speed) based on joystick displacement.
        """

        if abs(x_axis_step) >= constants.MAX_BIT_VALUE_JOYSTICK / 3 or abs(y_axis_step) >= constants.MAX_BIT_VALUE_JOYSTICK / 3:
            return constants.FAST_SPEED_MOVEMENT
        elif abs(x_axis_step) >= constants.MAX_BIT_VALUE_JOYSTICK / 6 or abs(y_axis_step) >= constants.MAX_BIT_VALUE_JOYSTICK / 6:
            return constants.NORMAL_SPEED_MOVEMENT
        else:
            return constants.LOW_SPEED_MOVEMENT

    # get joystick position form joystick status
    def _extract_joystick_position_data(self, joystick_status):
        """
        Extracts joystick coordinates (X, Y, Z) from a raw status string.

        Args:
            joystick_status (str): A raw string in the format "<Joystick,X:...,Y:...,Z:...>"

        Returns:
            dict or None: Dictionary with integer X, Y, Z values, or None if the pattern doesn't match.
        """

        joystick_pattern = r'<Joystick,X:(\d+),Y:(\d+),Z:(\d+)>'
        # Check if the message matches joystick status pattern
        joystick_match = re.match(joystick_pattern, joystick_status)
        if joystick_match:
            current_joystick_coordinates = {
                'X': int(joystick_match.group(1)),
                'Y': int(joystick_match.group(2)),
                'Z': int(joystick_match.group(3)),
            }

            return current_joystick_coordinates
        return None
