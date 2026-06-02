import { Constants } from 'src/constants';
import { useWebSocketStore } from 'src/stores/websocket-connection';

/**
 * @description Sends a G-code command to the server for immediate real-time execution via WebSocket.
 * @param {string} command - The G-code command string to be executed in real time.
 * @returns {void}
 */
export const executeRealTimeGCommands = (command: string) => {
  // send to server using websocket
  const req = {
    type: Constants.REAL_TIME_COMMAND_DATA_TYPE,
    data: {
      command,
    },
  };
  useWebSocketStore().send(req);
};

/**
 * @description Sends a G-code command to the server for standard (non-real-time) execution via WebSocket.
 * @param {string} command - The G-code command string to be executed normally.
 * @returns {void}
 */
export const executeNormalGCommands = (command: string) => {
  // send to server using websocket
  const req = {
    type: Constants.NORMAL_COMMAND_DATA_TYPE,
    data: {
      command,
    },
  };
  useWebSocketStore().send(req);
};

/**
 * @description Sends a Cameras system command to the server.
 * @param {string} command - The Cameras system command string to be executed.
 * @returns {void}
 */
export const executeCamerasSystem = (command: string) => {
  // send to server using websocket
  const req = {
    type: Constants.CAMERAS_SYSTEM_DATA_TYPE,
    data: {
      command,
    },
  };
  useWebSocketStore().send(req);
};
