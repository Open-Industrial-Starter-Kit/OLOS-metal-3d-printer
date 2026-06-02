import { DitheringSettings } from 'src/interfaces/imageToGcode.interface';
import {
  modifySVGElementsForCuttingOrMarking,
  modifySVGElementsForEngraving,
} from 'src/services/svg.editor.service';
import { INode } from 'svgson';

/**
 * Structure of the data sent from the main thread to this worker.
 */
interface WorkerMessageData {
  /** Raw ImageData for engraving tasks (optional) */
  imageData?: ImageData;
  /** JSON stringified attributes applied to all SVG elements */
  svgElementAttributes: string; // serialized: Record<string, string>
  /** JSON stringified array of SVG nodes intended for cutting */
  elementsToCut: string; // serialized: INode[]
  /** JSON stringified array of SVG nodes intended for marking */
  elementsToMark: string; // serialized: INode[]
  /** JSON stringified dithering configuration for engraving */
  dithering: string; // serialized: DitheringSettings
}

/**
 * Structure of the message sent back from the worker to the main thread.
 */
interface WorkerResponse {
  /** SVG string for cutting operations (null if no cutting elements) */
  cutSVGContent: string | null;
  /** SVG string for marking operations (null if no marking elements) */
  markSVGContent: string | null;
  /** Transformed raster data for engraving (null if no engraving performed) */
  engravedImageData: ImageData | null;
}

/**
 * Web Worker message handler.
 *
 * This worker processes:
 * - Cutting: Applies cutting-specific attributes to given SVG elements.
 * - Marking: Applies marking-specific attributes to given SVG elements.
 * - Engraving: Applies raster transformations (e.g., dithering) to image data.
 *
 * Imported functions:
 * - modifySVGElementsForCuttingOrMarking(elements: INode[], svgElementAttributes: Record<string, string>): Promise<string>
 * - modifySVGElementsForEngraving(imageData: ImageData, dithering: DitheringSettings): Promise<ImageData | null>
 */
addEventListener('message', async (event: MessageEvent<WorkerMessageData>) => {
  if (event.data) {
    // Parse incoming JSON-encoded parameters
    const imageData = event.data.imageData;
    const svgElementAttributes = JSON.parse(
      event.data.svgElementAttributes
    ) as Record<string, string>;
    const elementsToCut = JSON.parse(event.data.elementsToCut) as INode[];
    const elementsToMark = JSON.parse(event.data.elementsToMark) as INode[];
    const dithering = JSON.parse(event.data.dithering) as DitheringSettings;

    // Initialize results
    let cutSVGContent: string | null = null;
    let markSVGContent: string | null = null;
    let engravedImageData: ImageData | null = null;

    // Cutting
    if (elementsToCut.length) {
      cutSVGContent = await modifySVGElementsForCuttingOrMarking(
        elementsToCut,
        svgElementAttributes
      );
    }

    // Marking
    if (elementsToMark.length) {
      markSVGContent = await modifySVGElementsForCuttingOrMarking(
        elementsToMark,
        svgElementAttributes
      );
    }

    // Engraving
    if (imageData) {
      engravedImageData = await modifySVGElementsForEngraving(
        imageData,
        dithering
      );
    }

    // Send results back
    postMessage({
      cutSVGContent,
      markSVGContent,
      engravedImageData,
    } as WorkerResponse);
  }
});
