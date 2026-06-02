import { Constants } from 'src/constants';
import { Config } from 'src/interfaces/configSettings.interface';
import { Line, Point } from 'src/interfaces/gcodePreivew.interface';
import {
  convertGCodeToLines,
  getGraphBoundingBoxMetrics,
  getJobStartPoint,
  getJobEndPoint,
} from 'src/services/gcode.previewer.service/gcode.previewer.helper.service';

/**
 * Incoming message data structure sent to the worker.
 */
interface WorkerMessageData {
  /** The full G-code string to preview. */
  gcodeStr: string;
  /** Configuration related to the machine and platform. */
  config: Config;
}

/**
 * Response message structure sent back from the worker.
 */
interface WorkerResponse {
  /** Array of parsed lines to draw in this batch. */
  linesToDraw?: Line[];
  /** Whether the drawing exceeds the machine platform size. */
  isBiggerThanPlatform?: boolean;
  /** Indicates if processing is finished. */
  done: boolean;
  /** Starting point of the entire job (sent on completion). */
  startPoint?: Point;
  /** Ending point of the entire job (sent on completion). */
  endPoint?: Point;
  /** Error information if processing failed. */
  error?: unknown;
}

/**
 * Worker message handler for streaming G-code preview data in batches.
 *
 * This worker:
 * - Receives a G-code string and machine config.
 * - Splits the G-code string into batches (size from Constants).
 * - Parses each batch to drawable lines.
 * - Checks if the batch fits within the machine platform.
 * - Posts each batch back to the main thread incrementally.
 * - Terminates early if a batch exceeds platform dimensions.
 * - Posts job start and end points on completion.
 */
addEventListener('message', async (event: MessageEvent<WorkerMessageData>) => {
  try {
    if (event.data) {
      const gcodeStr = event.data.gcodeStr;
      const config = event.data.config;

      // Calculate platform width and height
      const platformWidth = Math.abs(
        config.machine_platform.end_point.x -
          config.machine_platform.start_point.x
      );
      const platformHeight = Math.abs(
        config.machine_platform.end_point.y -
          config.machine_platform.start_point.y
      );

      // Split G-code into individual lines for batching
      const gcodeLines = gcodeStr.split('\n');
      const totalLines = gcodeLines.length;

      let currentIndex = 0;

      while (currentIndex < totalLines) {
        // Get next batch of lines from G-code
        const batch = gcodeLines.slice(
          currentIndex,
          currentIndex + Constants.PREVIEWER_WORKER_BATCH_SIZE
        );

        // Convert batch to drawable line objects
        const linesToDraw = convertGCodeToLines(batch.join('\n'));

        // Get bounding box of the drawn lines
        const { maxWidth, maxHeight } = getGraphBoundingBoxMetrics();

        let respond: WorkerResponse = { done: false };

        // Check if batch fits within the platform size
        if (maxWidth <= platformWidth) {
          if (maxHeight <= platformHeight) {
            // Fits within platform
            respond = {
              linesToDraw,
              isBiggerThanPlatform: false,
              done: false,
            };
            postMessage(respond);
            currentIndex += Constants.PREVIEWER_WORKER_BATCH_SIZE;
          } else {
            // Platform height exceeded — special case for vinyl cutters
            if (config.machine_type === Constants.MACHINE_TYPE.VINYL_CUTTER) {
              respond = {
                linesToDraw,
                isBiggerThanPlatform: false,
                done: false,
              };
              postMessage(respond);
              currentIndex += Constants.PREVIEWER_WORKER_BATCH_SIZE;
            } else {
              // Height exceeds platform, stop processing
              respond = {
                linesToDraw,
                isBiggerThanPlatform: true,
                done: true,
              };
              postMessage(respond);
              break;
            }
          }
        } else {
          // Width exceeds platform, stop processing
          respond = {
            linesToDraw,
            isBiggerThanPlatform: true,
            done: true,
          };
          postMessage(respond);
          break;
        }
      }

      // Get start and end points of the entire job
      const startPoint = getJobStartPoint();
      const endPoint = getJobEndPoint();

      // Notify main thread that processing is complete
      postMessage({ done: true, startPoint, endPoint });
      self.close();
    }
  } catch (error) {
    // Send error details to main thread
    postMessage({ error, done: true });
  }
});
