/**
 * @interface StatusData
 * @description Represents metadata for the full status of the machine.
 */
export interface StatusData {
  /** Websocket message type */
  type: string;

  /** The state of the machine (e.g. IDLE, RUN..etc) */
  state?: string;

  /** The absolute position for the machine */
  machine_position: {
    x: number;
    y: number;
    z?: number;
  };

  /** The relative position for the machine */
  work_coordinate_offset: {
    x: number;
    y: number;
    z?: number;
  };

  /**  information about the available buffer space on the GRBL controller */
  buffer_state: {
    commands_queued: number;
    buffer_length: number;
  };

  /** The feed rate and the machine speed data */
  feed_and_speed: {
    feed_rate: number;
    speed: number;
  };

  /** Overrides data */
  overrides: {
    feed: number;
    rapids: number;
    spindle: number;
  };

  /** The tool info that the machine is currently using */
  machine_tool: number;
}

/**
 * @interface MachineConnectionData
 * @description Represents metadata for the connection status of the machine
 */
export interface MachineConnectionData {
  /** Websocket message type */
  type: string;

  /** flag represent if the machine action is connection to the machine established successfully */
  success: boolean;

  /** Timestamp of the message*/
  time: string;
}

/**
 * @interface JobPosition
 * @description Represents metadata job or relative position for the machine
 */
export interface JobPosition {
  x: number;
  y: number;
  z?: number;
}
