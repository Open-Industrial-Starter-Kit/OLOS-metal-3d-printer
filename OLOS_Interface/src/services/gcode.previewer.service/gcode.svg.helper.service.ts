import { Point } from 'electron';
import { Constants } from 'src/constants';
import { GCodeColors, Line } from 'src/interfaces/gcodePreivew.interface';
import { mapSpeedToOpacity } from './gcode.previewer.helper.service';

/**
 * @description Wraps raw SVG content inside an `<svg>` tag with the correct dimensions and viewBox.
 * @param {string} svgContent - The inner SVG elements as a string.
 * @param {Record<string, number>} graphBoxMetrics - An object containing the platform width and height.
 * @returns {string} The complete SVG string with dimensions and namespace.
 */
export const createSVGString = (
  svgContent: string,
  graphBoxMetrics: Record<string, number>
) => {
  // get the bounding box metrics
  const viewBox = `0 0 ${graphBoxMetrics.platformWidth} ${graphBoxMetrics.platformHeight}`;
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${graphBoxMetrics.platformWidth}" height="${graphBoxMetrics.platformHeight}" viewBox="${viewBox}">${svgContent}</svg>`;

  return svgString;
};

/**
 * @description Converts parsed G-code lines into SVG `<line>` elements, using different colors for each G-code type.
 * @param {Line[]} lines - Array of parsed G-code line data.
 * @param {GCodeColors} gcodeCommandsColor - Color mapping for each G-code command type.
 * @param {Record<string, number>} graphBoxMetrics - Platform width/height metrics for scaling.
 * @param {Point} start - The starting offset point for all coordinates.
 * @returns {string} A string containing the generated SVG `<line>` elements.
 */
export const convertLinesToSVGElements = (
  lines: Line[],
  gcodeCommandsColor: GCodeColors,
  graphBoxMetrics: Record<string, number>,
  start: Point
) => {
  let svgContent = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.type === 'G0') {
      svgContent += drawStraightLineTosvgContent(
        line.type,
        start,
        line,
        gcodeCommandsColor.G0,
        graphBoxMetrics.platformHeight
      );
    } else if (line.type === 'G1') {
      svgContent += drawStraightLineTosvgContent(
        line.type,
        start,
        line,
        gcodeCommandsColor.G1,
        graphBoxMetrics.platformHeight
      );
    } else if (line.type === 'G2') {
      svgContent += drawCurvedLineTosvgContent(
        start,
        line,
        gcodeCommandsColor.G2,
        graphBoxMetrics.platformHeight
      );
    } else if (line.type === 'G3') {
      svgContent += drawCurvedLineTosvgContent(
        start,
        line,
        gcodeCommandsColor.G3,
        graphBoxMetrics.platformHeight
      );
    }
  }
  return svgContent;
};

/**
 * @description Creates an SVG `<line>` element for a straight G-code movement (G0/G1).
 * @private
 * @param {string} type - G-code type (`G0` or `G1`).
 * @param {Point} start - Starting offset point.
 * @param {Line} line - Line object containing start/end coordinates and optional speed.
 * @param {string} color - Stroke color for the line.
 * @param {number} maxY - The maximum Y dimension (for coordinate inversion).
 * @returns {string} SVG `<line>` string.
 */
const drawStraightLineTosvgContent = (
  type: string,
  start: Point,
  line: Line,
  color: string,
  maxY: number
) => {
  const startX = Math.round(
    Constants.GCODE_PREVIEWER_RATIO * (line.start.x - start.x)
  );
  const startY = Math.round(
    maxY - Constants.GCODE_PREVIEWER_RATIO * (line.start.y - start.y)
  );
  const endX = Math.round(
    Constants.GCODE_PREVIEWER_RATIO * (line.end.x - start.x)
  );
  const endY = Math.round(
    maxY - Constants.GCODE_PREVIEWER_RATIO * (line.end.y - start.y)
  );

  let svgContent = `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" `;

  if (type === 'G0') {
    svgContent += `stroke="${color}" `;
  } else {
    if (line.speed) {
      const opacity = mapSpeedToOpacity(line.speed);
      svgContent += `stroke="${color}" stroke-opacity="${opacity}" `;
    } else {
      svgContent += 'stroke="grey" ';
    }
  }

  svgContent += 'stroke-width="0.5" />\n';

  return svgContent;
};

/**
 * @description Creates SVG `<line>` elements approximating curved G-code movements (G2/G3) from Bezier curves.
 * @private
 * @param {Point} start - Starting offset point.
 * @param {Line} line - Line object containing Bezier curve control points and optional speed.
 * @param {string} color - Stroke color for the line.
 * @param {number} maxY - The maximum Y dimension (for coordinate inversion).
 * @returns {string} Concatenated SVG `<line>` strings for each curve segment.
 */
const drawCurvedLineTosvgContent = (
  start: Point,
  line: Line,
  color: string,
  maxY: number
) => {
  const beziers = line.beziers;
  let svgContent = '';

  beziers.forEach((curve) => {
    const startX = Math.round(
      Constants.GCODE_PREVIEWER_RATIO * (curve.p0.x - start.x)
    );
    const startY = Math.round(
      maxY - Constants.GCODE_PREVIEWER_RATIO * (curve.p0.y - start.y)
    );
    const endX = Math.round(
      Constants.GCODE_PREVIEWER_RATIO * (curve.p3.x - start.x)
    );
    const endY = Math.round(
      maxY - Constants.GCODE_PREVIEWER_RATIO * (curve.p3.y - start.y)
    );

    svgContent += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" `;

    if (line.speed) {
      const opacity = mapSpeedToOpacity(line.speed);
      svgContent += `stroke="${color}" stroke-opacity="${opacity}" `;
    } else {
      svgContent += 'stroke="grey" ';
    }

    svgContent += 'stroke-width="0.5" />\n';
  });

  return svgContent;
};
