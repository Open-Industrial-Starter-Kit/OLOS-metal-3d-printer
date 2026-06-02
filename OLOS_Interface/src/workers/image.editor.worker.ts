import { Constants } from 'src/constants';
import { DitheringSettings } from 'src/interfaces/imageToGcode.interface';
import {
  modifyImageForEngraving,
  modifyImageForCuttingOrMarking,
} from 'src/services/image.editor.service';

/**
 * Message structure sent from the main thread to this worker.
 */
interface WorkerMessageData {
  /** Type of drawing operation to perform (cut/mark or engrave). */
  drawType: string;
  /** Image data to be processed. */
  imageData: ImageData;
  /** JSON stringified dithering settings (only used for engraving). */
  dithering: string; // serialized: DitheringSettings
}

/**
 * Message structure sent from the worker to the main thread.
 */
interface WorkerResponse {
  /** SVG content generated for cutting or marking (null if not applicable). */
  cutSVGContent: string | null;
  /** Image data modified for engraving (null if not applicable). */
  engravedImageData: ImageData | null;
}

/**
 * Web Worker message handler.
 *
 * This worker processes image editing tasks for laser cutting, marking, or engraving:
 *
 * - Cutting/Marking:
 *   Uses `modifyImageForCuttingOrMarking(imageData: ImageData): string`
 *   to convert raster image data into SVG path data for vector cutting or marking.
 *
 * - Engraving:
 *   Uses `modifyImageForEngraving(imageData: ImageData, dithering: DitheringSettings): ImageData | null`
 *   to apply raster engraving effects, such as dithering.
 *
 * Flow:
 * 1. Receives image data and operation type from the main thread.
 * 2. Depending on `drawType`, calls the appropriate image processing function.
 * 3. Posts the processed result back to the main thread.
 */
addEventListener('message', (event: MessageEvent<WorkerMessageData>) => {
  if (event.data) {
    let engravedImageData: ImageData | null = null;
    let cutSVGContent: string | null = null;

    const { drawType, imageData } = event.data;
    const ditheringSettings = JSON.parse(
      event.data.dithering
    ) as DitheringSettings;

    if (drawType === Constants.IMAGE_DRAW_TYPE.CUT_MARK) {
      // Process image for vector cutting or marking
      cutSVGContent = modifyImageForCuttingOrMarking(imageData);
    } else if (drawType === Constants.IMAGE_DRAW_TYPE.ENGRAVE) {
      // Process image for raster engraving
      engravedImageData = modifyImageForEngraving(imageData, ditheringSettings);
    }

    postMessage({
      cutSVGContent,
      engravedImageData,
    } as WorkerResponse);
  }
});
