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
  /** Executable dashed grid lines inside the engraved contour core. */
  gridToDraw?: Line[];
  /** Farther/lower variable-grid band, typically 4x4. */
  variableGridStage2ToDraw?: Line[];
  /** Farthest/lower variable-grid band, for a third support section. */
  variableGridStage3ToDraw?: Line[];
  /** Closest variable-grid band below roof, typically 3x3. */
  variableGridStage1ToDraw?: Line[];
  /** Executable roof/deck surface skin lines. */
  surfaceSkinToDraw?: Line[];
  /** True when this batch belongs to an engraving scan-mode layer. */
  isEngravingLayer?: boolean;
  /** Whether this is the final message. */
  done: boolean;
  /** Error object in case of failure. */
  error?: unknown;
}

const convertLaserOffMovesToTravel = (gcode: string) => {
  let laserEnabled = false;
  let activePower = 0;
  const wordPattern = /[A-Za-z][-+]?(?:\d+(?:\.\d*)?|\.\d+)/g;

  return gcode
    .split('\n')
    .map((line) => {
      const code = line.split(';', 1)[0].trim();
      const compact = code.replace(/\s+/g, '').toUpperCase();
      const words = compact.match(wordPattern) ?? [];
      const command = words[0] ?? '';
      const values: Record<string, number> = {};
      words.slice(1).forEach((word) => {
        const value = Number(word.slice(1));
        if (Number.isFinite(value)) values[word[0]] = value;
      });
      if (/^S[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/i.test(command)) {
        const power = Number(command.slice(1));
        if (Number.isFinite(power)) activePower = power;
        return line;
      }

      if (command === 'M3') {
        laserEnabled = true;
        return line;
      }
      if (command === 'M5') {
        laserEnabled = false;
        activePower = 0;
        return line;
      }
      if (values.S !== undefined) activePower = values.S;

      const isLinearMove = command === 'G1' || command === 'G01';
      const hasXY = values.X !== undefined || values.Y !== undefined;
      const isPoweredMove = isLinearMove && laserEnabled && activePower > 0;
      if (!isLinearMove || !hasXY || isPoweredMove) return line;

      return line
        .replace(/^\s*G0?1(?=\s|[XYZABFS]|$)/i, 'G0')
        .replace(/\s*S0(?:\.0+)?(?=\s|F|$)/i, '')
        .replace(/S0(?:\.0+)?(?=F|$)/i, '');
    })
    .join('\n');
};

const drawableCutMovesOnly = (lines: Line[]) =>
  lines.filter(
    (line) =>
      line.type.toUpperCase() === 'G1' &&
      (line.start.x !== line.end.x || line.start.y !== line.end.y)
  );

// The solid bottom base: contiguous bottom layers that keep (roughly) the
// model's base footprint. Their sparse infill stacks directly on top of itself
// and, viewed edge-on at the bed, blends into an opaque slab. We hide infill for
// that run only — keeping infill everywhere above it — capped so a tall or
// uniform-cross-section model never has more than the base slab hidden.
const BASE_SLAB_MAX_LAYERS = 25;
const BASE_SLAB_FOOTPRINT_RATIO = 0.75;

const footprintArea = (lines: Line[]) => {
  if (!lines.length) return 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const line of lines) {
    minX = Math.min(minX, line.start.x, line.end.x);
    maxX = Math.max(maxX, line.start.x, line.end.x);
    minY = Math.min(minY, line.start.y, line.end.y);
    maxY = Math.max(maxY, line.start.y, line.end.y);
  }
  return Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
};

const normalizeCompactPreviewGcode = (line: string) => {
  const words = line.match(/[A-Za-z][-+]?(?:\d+(?:\.\d*)?|\.\d+)/g);
  return words ? words.join(' ') : line.trim();
};

const makeSyntheticPreviewLineVisible = (line: string) =>
  normalizeCompactPreviewGcode(line)
    .replace(/\bS(?:0?\.?\d+|1(?:\.0+)?)\b/i, 'S100')
    .replace(/\bF(?:0?\.?\d+|1(?:\.0+)?)\b/i, 'F100');

const normalizeCompactMotionGcode = (gcode: string) =>
  gcode
    .split('\n')
    .map((line) =>
      /^\s*G0?1(?=\s|[XYZABFS]|$)/.test(line)
        ? normalizeCompactPreviewGcode(line)
        : line
    )
    .join('\n');

const wrapPreviewCutMoves = (header: string, gcode: string) =>
  `${header}M3\n${gcode}\nM5`;

const splitRoofHollowInfillSections = (gcode: string) =>
  extractMarkedSections(
    gcode,
    ';ROOF HOLLOW INFILL START',
    ';ROOF HOLLOW INFILL END'
  );

const extractMarkedSections = (
  gcode: string,
  startMarker: string,
  endMarker: string
) => {
  let mainGcode = '';
  const sections: string[] = [];
  let cursor = 0;

  while (true) {
    const start = gcode.indexOf(startMarker, cursor);
    if (start === -1) {
      mainGcode += gcode.substring(cursor);
      break;
    }

    const markerLineEnd = gcode.indexOf('\n', start + startMarker.length);
    if (markerLineEnd === -1) {
      mainGcode += gcode.substring(cursor);
      break;
    }

    const contentStart = markerLineEnd + 1;
    const end = gcode.indexOf(endMarker, contentStart);
    if (end === -1) {
      mainGcode += gcode.substring(cursor);
      break;
    }

    mainGcode += gcode.substring(cursor, start);
    sections.push(gcode.substring(contentStart, end));
    cursor = end + endMarker.length;
  }

  return { mainGcode, sections };
};

const splitVariableGridSections = (
  gcode: string,
  keepVariableGridInMain = false
) => {
  if (keepVariableGridInMain) {
    return {
      mainGcode: gcode,
      stage1Gcode: '',
      stage2Gcode: '',
      stage3Gcode: '',
    };
  }

  const lines = gcode.split('\n');
  const mainLines: string[] = [];
  const stage1Lines: string[] = [];
  const stage2Lines: string[] = [];
  const stage3Lines: string[] = [];
  let target = mainLines;

  lines.forEach((line) => {
    if (/^\s*;VARIABLE GRID END\b/i.test(line)) {
      target.push(line);
      target = mainLines;
      return;
    }
    if (
      /^\s*;contour\b/i.test(line) ||
      /^\s*;SURFACE SKIN START\b/i.test(line) ||
      /^\s*;ROUTINE BEGIN\b/i.test(line) ||
      /^\s*;LAYER\s+\d+\b/i.test(line)
    ) {
      target = mainLines;
      target.push(line);
      return;
    }
    if (/^\s*;VARIABLE GRID STAGE 1\b/i.test(line)) {
      target = stage1Lines;
      target.push(line);
      return;
    }
    if (/^\s*;VARIABLE GRID STAGE 2\b/i.test(line)) {
      target = stage2Lines;
      target.push(line);
      return;
    }
    if (/^\s*;VARIABLE GRID STAGE 3\b/i.test(line)) {
      target = stage3Lines;
      target.push(line);
      return;
    }
    target.push(line);
  });

  return {
    mainGcode: mainLines.join('\n'),
    stage1Gcode: stage1Lines.join('\n'),
    stage2Gcode: stage2Lines.join('\n'),
    stage3Gcode: stage3Lines.join('\n'),
  };
};

const findLayerHeaderBefore = (
  layerMatches: RegExpMatchArray[],
  index: number
) => {
  let activeLayerMatch: RegExpMatchArray | undefined;
  for (const match of layerMatches) {
    if ((match.index ?? -1) > index) break;
    activeLayerMatch = match;
  }
  return activeLayerMatch;
};

/**
 * Preview contours are stored as comments so GRBL ignores them. The preview
 * worker alone restores their synthetic G0/G1 commands for blue rendering.
 */
const decodePreviewContourComments = (gcode: string) =>
  gcode
    .split('\n')
    .map((line) => {
      const match = line.match(/^\s*;PREVIEW_CONTOUR\s+(.+)$/);
      return match ? makeSyntheticPreviewLineVisible(match[1]) : line;
    })
    .join('\n');

const previewContourCommentsToGcode = (gcode: string) =>
  gcode
    .split('\n')
    .map((line) => {
      const match = line.match(/^\s*;PREVIEW_CONTOUR\s+(.+)$/);
      return match ? makeSyntheticPreviewLineVisible(match[1]) : '';
    })
    .filter((line) => line.length > 0)
    .join('\n');

const decodePreviewGridComments = (gcode: string) =>
  gcode
    .split('\n')
    .map((line) => {
      const match = line.match(/^\s*;PREVIEW_GRID\s+(.+)$/);
      return match ? makeSyntheticPreviewLineVisible(match[1]) : line;
    })
    .join('\n');

const decodePreviewSurfaceSkinComments = (gcode: string) =>
  gcode
    .split('\n')
    .map((line) => {
      const match = line.match(/^\s*;PREVIEW_SURFACE_SKIN\s+(.+)$/);
      return match ? makeSyntheticPreviewLineVisible(match[1]) : line;
    })
    .join('\n');

const previewSurfaceSkinCommentsToGcode = (gcode: string) =>
  gcode
    .split('\n')
    .map((line) => {
      const match = line.match(/^\s*;PREVIEW_SURFACE_SKIN\s+(.+)$/);
      return match ? makeSyntheticPreviewLineVisible(match[1]) : '';
    })
    .filter((line) => line.length > 0)
    .join('\n');

const surfaceSkinSectionToPreviewGcode = (section: string) => {
  const startMarker = ';SURFACE SKIN PREVIEW START';
  const endMarker = ';SURFACE SKIN PREVIEW END';
  const start = section.indexOf(startMarker);
  if (start === -1) return section;

  const markerLineEnd = section.indexOf('\n', start + startMarker.length);
  if (markerLineEnd === -1) return section;
  const end = section.indexOf(endMarker, markerLineEnd + 1);
  if (end === -1) return section;

  const previewGcode = previewSurfaceSkinCommentsToGcode(
    section.substring(markerLineEnd + 1, end)
  );
  return previewGcode || section;
};

const getVisicutContourStartIndex = (lines: string[]) => {
  const engravingContourIndex = lines.findIndex((line) =>
    /^;ENGRAVING CONTOUR\b/.test(line)
  );
  if (engravingContourIndex !== -1) return engravingContourIndex;

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
  blockStarts: number[]
) => {
  const routineLayers: Array<{ blockIndex: number; z: number }> = [];

  for (let index = 0; index < blockStarts.length; index++) {
    const blockStart = blockStarts[index];
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
  const layerMatches = [
    ...gcodeStr.matchAll(/^;LAYER\s+\d+\s+SCAN MODE:.*$/gim),
  ];
  const blocks =
    layerMatches.length > 0
      ? layerMatches.map((match, index) => ({
          start: match.index ?? 0,
          end:
            index + 1 < layerMatches.length
              ? layerMatches[index + 1].index ?? gcodeStr.length
              : gcodeStr.length,
        }))
      : [...gcodeStr.matchAll(/\bM3\b/g)].map((match) => {
          const start = match.index ?? 0;
          const end = gcodeStr.indexOf('M5', start);
          return {
            start,
            end: end === -1 ? gcodeStr.length : end,
          };
        });
  const previewLayerHeight = inferVisicutPreviewLayerHeight(
    gcodeStr,
    blocks.map((block) => block.start)
  );

  // Solid-bottom-base infill suppression (see the helper + marker-based path).
  // Only engage when the model has a hollow vector body above the base, so an
  // all-engraving job is never blanked.
  const hasVectoringLayers =
    /;\s*LAYER\s+\d+\s+SCAN MODE:\s*VECTORING\b/i.test(gcodeStr);
  let bottomBaseActive = hasVectoringLayers;
  let baseFootprintArea: number | null = null;
  let baseRunLayers = 0;

  blocks.forEach((block, blockIndex) => {
    if (block.end <= block.start) return;

    const blockLines = gcodeStr
      .substring(block.start, block.end)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const blockIsEngraving =
      /;\s*LAYER\s+\d+\s+SCAN MODE:\s*ENGRAVING\b/i.test(blockLines[0] ?? '') ||
      (/;\s*SCAN MODE:\s*ENGRAVING\b/i.test(blockLines.join('\n')) &&
        !/;\s*LAYER\s+\d+\s+SCAN MODE:\s*VECTORING\b/i.test(
          blockLines[0] ?? ''
        ));
    const blockIsSolidFaceClosure =
      /;FACE CLOSURE:\s*LINE-ONLY\b/i.test(blockLines.join('\n'));
    const blockLayerMatch =
      (blockLines[0] ?? '').match(/;\s*LAYER\s+(\d+)\s+SCAN MODE:/i) ??
      blockLines.join('\n').match(/;\s*LAYER\s+(\d+)\s+SCAN MODE:/i);
    const previewLayerIndex = blockLayerMatch
      ? Math.max(Number(blockLayerMatch[1]) - 1, 0)
      : blockIndex;
    const previewZ = previewLayerIndex * previewLayerHeight;
    const header = `G0 X0 Y0 Z${previewZ.toFixed(6)}\n`;
    const surfaceSplit = extractMarkedSections(
      blockLines.join('\n'),
      ';SURFACE SKIN START',
      ';SURFACE SKIN END'
    );
    const mainBlockLines = surfaceSplit.mainGcode
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const contourStart = getVisicutContourStartIndex(mainBlockLines);
    const rawInfillBatch =
      header +
      (contourStart === -1
        ? mainBlockLines.join('\n')
        : mainBlockLines.slice(0, contourStart).join('\n'));
    const roofHollowSplit = splitRoofHollowInfillSections(
      rawInfillBatch
    );
    const variableGridSplit = splitVariableGridSections(
      roofHollowSplit.mainGcode,
      blockIsEngraving
    );
    const mainGcode = variableGridSplit.mainGcode;
    const gridGcode = [
      ...roofHollowSplit.sections,
    ]
      .filter((section) => section.trim().length > 0)
      .join('\n');
    const infillBatch = normalizeCompactMotionGcode(
      convertLaserOffMovesToTravel(wrapPreviewCutMoves('', mainGcode))
    );
    const gridBatch = gridGcode
      ? normalizeCompactMotionGcode(
          convertLaserOffMovesToTravel(
            wrapPreviewCutMoves(header, decodePreviewGridComments(gridGcode))
          )
        )
      : '';
    const variableGridStage1Batch = variableGridSplit.stage1Gcode
      ? normalizeCompactMotionGcode(
          convertLaserOffMovesToTravel(
            wrapPreviewCutMoves(header, variableGridSplit.stage1Gcode)
          )
        )
      : '';
    const variableGridStage2Batch = variableGridSplit.stage2Gcode
      ? normalizeCompactMotionGcode(
          convertLaserOffMovesToTravel(
            wrapPreviewCutMoves(header, variableGridSplit.stage2Gcode)
          )
        )
      : '';
    const variableGridStage3Batch = variableGridSplit.stage3Gcode
      ? normalizeCompactMotionGcode(
          convertLaserOffMovesToTravel(
            wrapPreviewCutMoves(header, variableGridSplit.stage3Gcode)
          )
        )
      : '';
    const surfaceSkinBatch = surfaceSplit.sections.length
      ? normalizeCompactMotionGcode(
          convertLaserOffMovesToTravel(
            wrapPreviewCutMoves(
              header,
              surfaceSplit.sections
              .map((section) => surfaceSkinSectionToPreviewGcode(section))
                .join('\n')
            )
          )
        )
      : '';
    const previewContourBatch = previewContourCommentsToGcode(
      mainBlockLines.join('\n')
    );
    const hasSolidContour =
      /^\s*;SOLID CONTOUR START\b/im.test(mainBlockLines.join('\n'));
    // Draw the real vector walls AND any explicit PREVIEW_CONTOUR outlines on
    // the same layer (see the matching note in the marker-based path). Keeping
    // both avoids dropping walls on flat-roof contour-shell layers.
    const contourSources: string[] = [];
    if ((!blockIsEngraving || hasSolidContour) && contourStart !== -1) {
      contourSources.push(
        convertLaserOffMovesToTravel(
          wrapPreviewCutMoves(
            header,
            decodePreviewContourComments(
              mainBlockLines.slice(contourStart).join('\n')
            )
          )
        )
      );
    }
    if (previewContourBatch) {
      contourSources.push(
        convertLaserOffMovesToTravel(
          wrapPreviewCutMoves(header, previewContourBatch)
        )
      );
    }
    const contourBatch = contourSources.length
      ? normalizeCompactMotionGcode(contourSources.join('\n'))
      : '';

    const infillLines = drawableCutMovesOnly(convertGCodeToLines(infillBatch));
    const layerFootprint = footprintArea(infillLines);
    if (baseFootprintArea === null && layerFootprint > 0) {
      baseFootprintArea = layerFootprint;
    }
    const suppressBaseInfill =
      bottomBaseActive &&
      !blockIsSolidFaceClosure &&
      !blockIsEngraving &&
      baseFootprintArea !== null &&
      layerFootprint >= BASE_SLAB_FOOTPRINT_RATIO * baseFootprintArea &&
      baseRunLayers < BASE_SLAB_MAX_LAYERS;
    if (suppressBaseInfill) baseRunLayers += 1;
    else bottomBaseActive = false;

    postMessage({
      infillToDraw: suppressBaseInfill ? undefined : infillLines,
      contourToDraw: contourBatch
        ? drawableCutMovesOnly(convertGCodeToLines(contourBatch))
        : undefined,
      gridToDraw: gridBatch
        ? drawableCutMovesOnly(convertGCodeToLines(gridBatch))
        : undefined,
      variableGridStage1ToDraw: variableGridStage1Batch
        ? drawableCutMovesOnly(convertGCodeToLines(variableGridStage1Batch))
        : undefined,
      variableGridStage2ToDraw: variableGridStage2Batch
        ? drawableCutMovesOnly(convertGCodeToLines(variableGridStage2Batch))
        : undefined,
      variableGridStage3ToDraw: variableGridStage3Batch
        ? drawableCutMovesOnly(convertGCodeToLines(variableGridStage3Batch))
        : undefined,
      surfaceSkinToDraw: surfaceSkinBatch
        ? drawableCutMovesOnly(convertGCodeToLines(surfaceSkinBatch))
        : undefined,
      isEngravingLayer: blockIsEngraving,
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
      const isEngravingPreview =
        /;\s*SCAN MODE:\s*ENGRAVING\b/i.test(gcodeStr);
      // Only hide the bottom engraving-base infill when the model also has
      // vector layers to show — otherwise (an all-engraving job) hiding it
      // would blank the whole preview.
      const hasVectoringLayers =
        /;\s*LAYER\s+\d+\s+SCAN MODE:\s*VECTORING\b/i.test(gcodeStr);
      const hasOlosLayerHeaders = /^;LAYER\s+\d+\s+SCAN MODE:.*$/im.test(
        gcodeStr
      );
      const hasExplicitPreviewMarkers =
        gcodeStr.includes(Constants.GCODE_INFILL_COMMENT) &&
        gcodeStr.includes(Constants.GCODE_CONTOUR_COMMENT);
      if (hasOlosLayerHeaders && !hasExplicitPreviewMarkers) {
        drawVisicutStyleBlocks(gcodeStr);
        postMessage({ done: true } as WorkerResponse);
        return;
      }
      const layerMatches = [
        ...gcodeStr.matchAll(/^;LAYER\s+(\d+)\s+SCAN MODE:\s*([A-Z]+).*$/gim),
      ];
      const previewLayerHeight = layerMatches.length
        ? inferVisicutPreviewLayerHeight(
            gcodeStr,
            layerMatches.map((match) => match.index ?? 0)
          )
        : 0.075;
      let cursor = 0;
      let batchIndex = 0;
      // Solid-bottom-base infill suppression (see the footprintArea helper).
      // Hide infill for the contiguous run of bottom layers that keep the base
      // footprint — that run is what stacks into the opaque slab at the bed.
      let bottomBaseActive = hasVectoringLayers;
      let baseFootprintArea: number | null = null;
      let baseRunLayers = 0;

      while (true) {
        // Locate first ";infill" comment in the remaining G-code
        const infillIndex = gcodeStr.indexOf(
          Constants.GCODE_INFILL_COMMENT,
          cursor
        );
        if (infillIndex === -1) {
          console.log('[slice.previewer.worker] No infill markers found');
          if (batchIndex === 0) {
            drawVisicutStyleBlocks(gcodeStr);
          }
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
        const nextLayerIndex = gcodeStr.indexOf(';LAYER ', contourIndex + 1);
        const nextRoutineIndex = gcodeStr.indexOf(
          ';ROUTINE BEGIN',
          contourIndex + 1
        );
        const contourEndIndex =
          [nextInfillIndex, nextLayerIndex, nextRoutineIndex]
            .filter((index) => index !== -1)
            .sort((a, b) => a - b)[0] ?? gcodeStr.length;

        const layerHeaderMatch = findLayerHeaderBefore(
          layerMatches,
          infillIndex
        );
        const batchIsEngraving =
          (layerHeaderMatch?.[2] ?? '').toUpperCase() === 'ENGRAVING';
        const batchIsSolidFaceClosure =
          /;FACE CLOSURE:\s*LINE-ONLY\b/i.test(
            gcodeStr.substring(infillIndex, contourEndIndex)
          );
        const previewLayerIndex = layerHeaderMatch
          ? Math.max(Number(layerHeaderMatch[1]) - 1, 0)
          : batchIndex;
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
            : `G0 X0 Y0 Z${(previewLayerIndex * previewLayerHeight).toFixed(
                6
              )}\n`;

        // Extract the infill section
        const rawInfillBatch =
          header + gcodeStr.substring(infillIndex, contourIndex);
        const surfaceSplit = extractMarkedSections(
          rawInfillBatch,
          ';SURFACE SKIN START',
          ';SURFACE SKIN END'
        );
        const roofHollowSplit = splitRoofHollowInfillSections(
          surfaceSplit.mainGcode
        );
        const variableGridSplit = splitVariableGridSections(
          roofHollowSplit.mainGcode,
          batchIsEngraving
        );
        const mainGcode = variableGridSplit.mainGcode;
        const gridGcode = [
          ...roofHollowSplit.sections,
        ]
          .filter((section) => section.trim().length > 0)
          .join('\n');
        const infillBatch = normalizeCompactMotionGcode(
          convertLaserOffMovesToTravel(wrapPreviewCutMoves('', mainGcode))
        );
        const gridBatch = gridGcode
          ? normalizeCompactMotionGcode(
              convertLaserOffMovesToTravel(
                wrapPreviewCutMoves(header, decodePreviewGridComments(gridGcode))
              )
            )
          : '';
        const variableGridStage1Batch = variableGridSplit.stage1Gcode
          ? normalizeCompactMotionGcode(
              convertLaserOffMovesToTravel(
                wrapPreviewCutMoves(header, variableGridSplit.stage1Gcode)
              )
            )
          : '';
        const variableGridStage2Batch = variableGridSplit.stage2Gcode
          ? normalizeCompactMotionGcode(
              convertLaserOffMovesToTravel(
                wrapPreviewCutMoves(header, variableGridSplit.stage2Gcode)
              )
            )
          : '';
        const variableGridStage3Batch = variableGridSplit.stage3Gcode
          ? normalizeCompactMotionGcode(
              convertLaserOffMovesToTravel(
                wrapPreviewCutMoves(header, variableGridSplit.stage3Gcode)
              )
            )
          : '';
        const surfaceSkinBatch = surfaceSplit.sections.length
          ? normalizeCompactMotionGcode(
              convertLaserOffMovesToTravel(
                wrapPreviewCutMoves(
                  header,
                  surfaceSplit.sections
                  .map((section) => surfaceSkinSectionToPreviewGcode(section))
                    .join('\n')
                )
              )
            )
          : '';

        // Extract the contour section
        const fullContourBatch = gcodeStr.substring(
          contourIndex,
          contourEndIndex
        );
        const previewContourBatch =
          previewContourCommentsToGcode(fullContourBatch);
        const hasSolidContour =
          /^\s*;SOLID CONTOUR START\b/im.test(fullContourBatch);
        // Draw the layer's real vector walls AND any explicit PREVIEW_CONTOUR
        // outlines (e.g. the flat-roof contour shell). Real moves come from
        // decoding the full contour section; the preview outlines are re-added
        // with an M3 wrap so they stay powered cut moves instead of being
        // demoted to travels. Previously a layer that carried PREVIEW_CONTOUR
        // rendered *only* those outlines and dropped its real walls, punching
        // horizontal gaps into the model preview.
        const contourSources = [
          convertLaserOffMovesToTravel(
            wrapPreviewCutMoves(
              header,
              decodePreviewContourComments(fullContourBatch)
            )
          ),
        ];
        if (previewContourBatch) {
          contourSources.push(
            convertLaserOffMovesToTravel(
              wrapPreviewCutMoves(header, previewContourBatch)
            )
          );
        }
        const contourBatch = normalizeCompactMotionGcode(
          contourSources.join('\n')
        );

        cursor = contourEndIndex;
        batchIndex += 1;

        // Convert G-code segments into drawable lines
        const infillLines = drawableCutMovesOnly(
          convertGCodeToLines(infillBatch)
        );
        const layerFootprint = footprintArea(infillLines);
        if (baseFootprintArea === null && layerFootprint > 0) {
          baseFootprintArea = layerFootprint;
        }
        const suppressBaseInfill =
          bottomBaseActive &&
          !batchIsSolidFaceClosure &&
          !batchIsEngraving &&
          baseFootprintArea !== null &&
          layerFootprint >= BASE_SLAB_FOOTPRINT_RATIO * baseFootprintArea &&
          baseRunLayers < BASE_SLAB_MAX_LAYERS;
        if (suppressBaseInfill) baseRunLayers += 1;
        else bottomBaseActive = false;
        const infillToDraw = suppressBaseInfill ? undefined : infillLines;
        const contourToDraw =
          batchIsEngraving && !previewContourBatch && !hasSolidContour
            ? undefined
            : drawableCutMovesOnly(convertGCodeToLines(contourBatch));
        const gridToDraw = gridBatch
          ? drawableCutMovesOnly(convertGCodeToLines(gridBatch))
          : undefined;
        const variableGridStage1ToDraw = variableGridStage1Batch
          ? drawableCutMovesOnly(convertGCodeToLines(variableGridStage1Batch))
          : undefined;
        const variableGridStage2ToDraw = variableGridStage2Batch
          ? drawableCutMovesOnly(convertGCodeToLines(variableGridStage2Batch))
          : undefined;
        const variableGridStage3ToDraw = variableGridStage3Batch
          ? drawableCutMovesOnly(convertGCodeToLines(variableGridStage3Batch))
          : undefined;
        const surfaceSkinToDraw = surfaceSkinBatch
          ? drawableCutMovesOnly(convertGCodeToLines(surfaceSkinBatch))
          : undefined;

        console.log(
          `[slice.previewer.worker] Batch: infill=${infillToDraw?.length ?? 0} lines, ` +
            `contour=${contourToDraw?.length ?? 0} lines, ` +
            `grid=${gridToDraw?.length ?? 0} lines, ` +
            `variableGridStage2=${variableGridStage2ToDraw?.length ?? 0} lines, ` +
            `variableGridStage1=${variableGridStage1ToDraw?.length ?? 0} lines, ` +
            `variableGridStage3=${variableGridStage3ToDraw?.length ?? 0} lines, ` +
            `surfaceSkin=${surfaceSkinToDraw?.length ?? 0} lines`
        );

        // Send partial result to the main thread
        postMessage({
          infillToDraw,
          contourToDraw,
          gridToDraw,
          variableGridStage1ToDraw,
          variableGridStage2ToDraw,
          variableGridStage3ToDraw,
          surfaceSkinToDraw,
          isEngravingLayer: batchIsEngraving,
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
