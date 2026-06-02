import { Constants } from 'src/constants';
import { Line } from 'src/interfaces/gcodePreivew.interface';
import { convertGCodeToLines } from 'src/services/gcode.previewer.service/gcode.previewer.helper.service';

/**
 * Message data structure sent from the main thread to this worker.
 */
interface WorkerMessageData {
  /** Full G-code string to process. */
  gcodeStr: string;
}

/**
 * Response message structure sent back from the worker to the main thread.
 */
interface WorkerResponse {
  /** Converted infill lines (null if this batch doesn't contain any). */
  infillToDraw?: Line[];
  /** Converted contour lines (null if this batch doesn't contain any). */
  contourToDraw?: Line[];
  /** Whether this is the final message. */
  done: boolean;
  /** Error object in case of failure. */
  error?: unknown;
}

const convertLaserOffMovesToTravel = (gcode: string) =>
  gcode
    .split('\n')
    .map((line) => {
      if (
        !/^\s*G0?1(?=\s|[XYZABFS]|$)/.test(line) ||
        !/S0(?:\.0+)?(?:\b|F)/.test(line)
      ) {
        return line;
      }
      return line
        .replace(/^\s*G0?1(?=\s|[XYZABFS]|$)/, 'G0')
        .replace(/\s*S0(?:\.0+)?(?:F-?\d+(?:\.\d+)?)?/, '');
    })
    .join('\n');

const drawableCutMovesOnly = (lines: Line[]) =>
  lines.filter(
    (line) =>
      line.type.toUpperCase() === 'G1' &&
      (line.start.x !== line.end.x || line.start.y !== line.end.y)
  );

const getVisicutContourStartIndex = (lines: string[]) => {
  for (let index = 0; index < lines.length - 2; index++) {
    const travel = lines[index];
    const firstCut = lines[index + 1];
    const modalCut = lines[index + 2];
    if (
      /^\s*G0(?=\s|[XYZABFS]|$)/.test(travel) &&
      /S0(?:\.0+)?(?:\b|F)/.test(travel) &&
      /^\s*G1(?=\s|[XYZABFS]|$)/.test(firstCut) &&
      /S(?!0(?:\b|F))/.test(firstCut) &&
      /^\s*G1(?=\s|[XYZABFS]|$)/.test(modalCut) &&
      !/S/.test(modalCut)
    ) {
      return index;
    }
  }
  return -1;
};

const getLastRoutineZBefore = (gcodeStr: string, index: number) => {
  const prefix = gcodeStr.substring(0, index);
  const zMatches = [
    ...prefix.matchAll(/^\s*G1\s*Z(-?\d+(?:\.\d+)?)/gim),
  ];
  if (zMatches.length === 0) return null;
  return parseFloat(zMatches[zMatches.length - 1][1]);
};

const inferVisicutPreviewLayerHeight = (
  gcodeStr: string,
  blocks: RegExpMatchArray[]
) => {
  const routineLayers: Array<{ blockIndex: number; z: number }> = [];

  for (let index = 0; index < blocks.length; index++) {
    const blockStart = blocks[index].index ?? 0;
    const routineZ = getLastRoutineZBefore(gcodeStr, blockStart);
    if (routineZ !== null && index > 0) {
      routineLayers.push({ blockIndex: index, z: routineZ });
    }
  }
  if (routineLayers.length > 1) {
    const firstZ = routineLayers[0].z;
    const repeatedRoutineStep = routineLayers.every(
      ({ z }) => Math.abs(z - firstZ) < 0.000001
    );
    if (repeatedRoutineStep) return firstZ;
  }
  if (routineLayers.length > 0) {
    return routineLayers[0].z / routineLayers[0].blockIndex;
  }
  return 0.075;
};

const drawVisicutStyleBlocks = (gcodeStr: string) => {
  const blocks = [...gcodeStr.matchAll(/\bM3\b/g)];
  const previewLayerHeight = inferVisicutPreviewLayerHeight(gcodeStr, blocks);

  blocks.forEach((match, blockIndex) => {
    const start = match.index ?? 0;
    const end = gcodeStr.indexOf('M5', start);
    if (end === -1) return;

    const blockLines = gcodeStr
      .substring(start + match[0].length, end)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const contourStart = getVisicutContourStartIndex(blockLines);
    const previewZ = blockIndex * previewLayerHeight;
    const header = `G0 X0 Y0 Z${previewZ.toFixed(6)}\n`;
    const infillBatch = convertLaserOffMovesToTravel(
      header +
        (contourStart === -1
          ? blockLines.join('\n')
          : blockLines.slice(0, contourStart).join('\n'))
    );
    const contourBatch =
      contourStart === -1
        ? ''
        : convertLaserOffMovesToTravel(
            header + blockLines.slice(contourStart).join('\n')
          );

    postMessage({
      infillToDraw: drawableCutMovesOnly(convertGCodeToLines(infillBatch)),
      contourToDraw: contourBatch
        ? drawableCutMovesOnly(convertGCodeToLines(contourBatch))
        : [],
      done: false,
    } as WorkerResponse);
  });
};

/**
 * Splits a G-code string into batches of infill and contour segments
 * based on special comments defined in Constants.
 *
 * Flow:
 * 1. Finds ";infill" comment marker in G-code.
 * 2. Finds the next ";contour" comment marker after it.
 * 3. Extracts the section between them as infill.
 * 4. Extracts the section from ";contour" until the next ";infill" (or end of string) as contour.
 * 5. Converts both sections to arrays of Line objects using convertGCodeToLines().
 * 6. Sends each batch back to the main thread incrementally.
 * 7. Sends a final message with `done: true` when complete.
 *
 * Imported function:
 * - convertGCodeToLines(gcodeStr: string): Line[]
 *   Parses a G-code string and returns an array of Line objects representing its geometry.
 */
addEventListener('message', async (event: MessageEvent<WorkerMessageData>) => {
  try {
    if (event.data) {
      const gcodeStr: string = event.data.gcodeStr;
      let cursor = 0;

      while (true) {
        // Locate first ";infill" comment in the remaining G-code
        const infillIndex = gcodeStr.indexOf(
          Constants.GCODE_INFILL_COMMENT,
          cursor
        );
        if (infillIndex === -1) {
          console.log('[slice.previewer.worker] No infill markers found');
          drawVisicutStyleBlocks(gcodeStr);
          break;
        }

        // Locate the ";contour" comment after the infill section
        const contourIndex = gcodeStr.indexOf(
          Constants.GCODE_CONTOUR_COMMENT,
          infillIndex
        );
        if (contourIndex === -1) {
          console.log('[slice.previewer.worker] No contour marker found after infill');
          break;
        }

        // Locate the next ";infill" after the contour section (if any)
        const nextInfillIndex = gcodeStr.indexOf(
          Constants.GCODE_INFILL_COMMENT,
          contourIndex + 1
        );

        // Keep only the layer-position line before each infill block. Routine
        // Z moves live in this gap too, but they are not layer preview anchors.
        const headerLines = gcodeStr
          .substring(cursor, infillIndex)
          .split('\n')
          .filter(
            (line) =>
              /\bG0\b/.test(line) &&
              /\bX-?\d/.test(line) &&
              /\bY-?\d/.test(line) &&
              /\bZ-?\d/.test(line)
          );
        const header =
          headerLines.length > 0
            ? `${headerLines[headerLines.length - 1]}\n`
            : '';

        // Extract the infill section
        const infillBatch = convertLaserOffMovesToTravel(
          header + gcodeStr.substring(infillIndex, contourIndex)
        );

        // Extract the contour section
        const fullContourBatch =
          nextInfillIndex !== -1
            ? gcodeStr.substring(contourIndex, nextInfillIndex)
            : gcodeStr.substring(contourIndex);
        const contourLaserOffIndex = fullContourBatch.indexOf('\nM5');
        const contourBatch =
          contourLaserOffIndex !== -1
            ? convertLaserOffMovesToTravel(
                header + fullContourBatch.substring(0, contourLaserOffIndex)
              )
            : convertLaserOffMovesToTravel(fullContourBatch);

        // Resume after the contour laser-off so the next layer still keeps
        // its Z-positioning header before the following "; infill".
        cursor =
          contourLaserOffIndex !== -1
            ? contourIndex + contourLaserOffIndex + '\nM5'.length
            : nextInfillIndex !== -1
            ? nextInfillIndex
            : gcodeStr.length;

        // Convert G-code segments into drawable lines
        const infillToDraw = drawableCutMovesOnly(
          convertGCodeToLines(infillBatch)
        );
        const contourToDraw = drawableCutMovesOnly(
          convertGCodeToLines(contourBatch)
        );

        console.log(`[slice.previewer.worker] Batch: infill=${infillToDraw.length} lines, contour=${contourToDraw.length} lines`);

        // Send partial result to the main thread
        postMessage({
          infillToDraw,
          contourToDraw,
          done: false,
        } as WorkerResponse);
      }

      // Final message indicating processing is complete
      postMessage({ done: true } as WorkerResponse);
      self.close();
    }
  } catch (error) {
    // Send error to main thread for handling
    postMessage({ error, done: true } as WorkerResponse);
  }
});
