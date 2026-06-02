import gcodetogeometry from 'gcodetogeometry';
import { Constants } from 'src/constants';
import { Config } from 'src/interfaces/configSettings.interface';
import {
  Line,
  GCodeState,
  GCodeColors,
  JobLayerElements,
  SlicingLayers,
  Point,
} from 'src/interfaces/gcodePreivew.interface';
import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * @description A state object that holds the current state and metrics of the G-code parsing process.
 * It is used and updated by the `gcodetogeometry` library to maintain context between parsing operations.
 * @property {object} bounds - The calculated minimum and maximum X and Y coordinates of the toolpath.
 * @property {object} settings - The current G-code settings (e.g., feedrate, units, positioning mode).
 * @property {object} totalSize - The overall dimensions and start/end points of the entire G-code job.
 */
export const parserState: GCodeState = {
  bounds: {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  },
  settings: {
    feedrate: 0,
    previousMoveCommand: '',
    crossAxe: 'z',
    inMm: true,
    relative: false,
    position: { x: 0, y: 0, z: 0 },
  },
  totalSize: {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 0, y: 0, z: 0 },
  },
};

/**
 * @description Parses a raw G-code string into an array of structured `Line` objects representing toolpaths.
 * It updates the global `parserState` with the new settings and dimensions from the parsed G-code.
 * @param {string} gcodeStr - The raw G-code content as a string.
 * @returns {Line[]} An array of `Line` objects representing the G-code movements.
 */
export const convertGCodeToLines = (gcodeStr: string) => {
  const gcode = gcodetogeometry.parse(
    gcodeStr,
    parserState.settings,
    parserState.totalSize
  );
  const linesToDraw: Line[] = [];

  // update the parser state settings
  parserState.settings = gcode.settings;

  // update the parser state size
  parserState.totalSize = gcode.size;
  
  console.log(`[convertGCodeToLines] Parsed ${gcode.lines.length} G-code lines`);
  
  for (let i = 0; i < gcode.lines.length; i++) {
    const line = gcode.lines[i];

    if (['G0', 'G1', 'g0', 'g1'].includes(line.type)) {
      addStraightLine(linesToDraw, line);
      updateBoundsStringtLine(line);
      console.log(`[convertGCodeToLines] ${line.type} from (${line.start.x},${line.start.y}) to (${line.end.x},${line.end.y})`);
    } else if (['G2', 'G3', 'g2', 'g3'].includes(line.type)) {
      addCurvedLine(linesToDraw, line);
      updateBoundsCurevedLine(line);
    }
  }

  return linesToDraw;
};

/**
 * @description Calculates the width and height of the job's bounding box from the parser state.
 * @returns {{maxWidth: number, maxHeight: number}} An object containing the maximum width and height of the job.
 */
export const getGraphBoundingBoxMetrics = () => {
  return {
    maxWidth: parserState.bounds.maxX - parserState.bounds.minX,
    maxHeight: parserState.bounds.maxY - parserState.bounds.minY,
  };
};

/**
 * @description Gets the job's starting point from the parser state.
 * @returns {Point} The starting {x, y} coordinates of the job.
 */
export const getJobStartPoint = () => {
  return (
    parserState.totalSize?.min ??
    ({
      x: 0,
      y: 0,
    } as Point)
  );
};

/**
 * @description Gets the job's end point based on the calculated bounding box.
 * @returns {Point} The ending {x, y} coordinates of the job.
 */
export const getJobEndPoint = () => {
  const endPoint: Point = {
    x: parserState.bounds.maxX,
    y: parserState.bounds.maxY,
  };
  return endPoint;
};

/**
 * @description Maps a speed value (feedrate) to an opacity value between 0 and 1.
 * @param {number} speed - The speed or feedrate value.
 * @returns {number} The calculated opacity value.
 */
export const mapSpeedToOpacity = (speed: number) => {
  const minSpeed = 0;
  const maxSpeed = 100;
  const minOpacity = 0;
  const maxOpacity = 1;

  const opacity =
    minOpacity +
    ((speed - minSpeed) * (maxOpacity - minOpacity)) / (maxSpeed - minSpeed);

  return Math.min(Math.max(opacity, minOpacity), maxOpacity);
};

/**
 * @description Converts an array of `Line` objects into `three.js` `LineSegments` geometry.
 * It populates buffer attributes for position, color, and opacity, and uses a custom shader material to render opacity.
 * @param {Line[]} linesToDraw - The array of `Line` objects to render.
 * @param {GCodeColors | null} [colors=null] - An object mapping G-code types to colors.
 * @param {boolean} [is3DPreview=false] - A flag special for 3D previewer to apply transparency for the `three.js` material.
 * @returns {{lineSegments: THREE.LineSegments, colorsArray: Float32Array}} An object containing the created `LineSegments` and the array of colors used.
 */
export const generateDrawingDataFromGcode = (
  linesToDraw: Line[],
  colors: GCodeColors | null = null,
  is3DPreview = false
) => {
  const geometry = new THREE.BufferGeometry();
  // Determine the fixed size of arrays
  const numLines = linesToDraw.length;
  // 2 points per line, 3 coordinates per point
  const positionsArray = new Float32Array(numLines * 6);
  // 2 points per line, 3 color values per point (RGB)
  const colorsArray = new Float32Array(numLines * 6);
  // 2 points per line, 1 opacity value per point
  const opacitiesArray = new Float32Array(numLines * 2);

  const color = new THREE.Color();

  let index = linesToDraw.length;
  while (index--) {
    const line = linesToDraw[index];
    const opacity = line.speed ? mapSpeedToOpacity(line.speed) : 0;
    // ignore lines without opacity
    if (!opacity) continue;

    // Set color to gray at the beginning
    color.setColorName('red');

    if (line.type === 'G0') {
      if (colors) color.setColorName(colors.G0);
    } else if (line.type === 'G1') {
      if (colors) color.setColorName(colors.G1);
    } else if (line.type === 'G2') {
      if (colors) color.setColorName(colors.G2);
    } else if (line.type === 'G3') {
      if (colors) color.setColorName(colors.G3);
    }

    // Calculate base index for current line in arrays
    const basePosIndex = index * 6;
    const baseOpacityIndex = index * 2;

    // Add the positions for each vertex
    positionsArray[basePosIndex] =
      Constants.GCODE_PREVIEWER_RATIO * line.start.x;
    positionsArray[basePosIndex + 1] =
      Constants.GCODE_PREVIEWER_RATIO * (line.start.z ?? 0);
    positionsArray[basePosIndex + 2] =
      -Constants.GCODE_PREVIEWER_RATIO * line.start.y;
    positionsArray[basePosIndex + 3] =
      Constants.GCODE_PREVIEWER_RATIO * line.end.x;
    positionsArray[basePosIndex + 4] =
      Constants.GCODE_PREVIEWER_RATIO * (line.end.z ?? 0);
    positionsArray[basePosIndex + 5] =
      -Constants.GCODE_PREVIEWER_RATIO * line.end.y;

    // Add the color for each vertex
    colorsArray[basePosIndex] = color.r;
    colorsArray[basePosIndex + 1] = color.g;
    colorsArray[basePosIndex + 2] = color.b;
    colorsArray[basePosIndex + 3] = color.r;
    colorsArray[basePosIndex + 4] = color.g;
    colorsArray[basePosIndex + 5] = color.b;

    // Add the opacities for each vertex
    opacitiesArray[baseOpacityIndex] = opacity;
    opacitiesArray[baseOpacityIndex + 1] = opacity;
  }

  // Create Float32 buffer attributes from the arrays
  const positionAttribute = new THREE.Float32BufferAttribute(positionsArray, 3);
  const colorAttribute = new THREE.Float32BufferAttribute(colorsArray, 3);
  const opacityAttribute = new THREE.Float32BufferAttribute(opacitiesArray, 1);

  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('color', colorAttribute);
  geometry.setAttribute('opacity', opacityAttribute);

  const material = new THREE.ShaderMaterial({
    vertexColors: true,
    transparent: is3DPreview,
    blending: THREE.NormalBlending,
    vertexShader: `
      attribute float opacity;
      varying float vOpacity;
      varying vec3 vColor;

      void main() {
        vOpacity = opacity;
        vColor = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
      }
    `,
    fragmentShader: `
      varying float vOpacity;
      varying vec3 vColor;

      void main() {
        gl_FragColor = vec4(vColor, vOpacity);
      }
    `,
  });

  const lineSegments = new THREE.LineSegments(geometry, material);
  return { lineSegments, colorsArray };
};

/**
 * @description Groups an array of G-code `Line` objects into a dictionary where keys are Z-heights,
 * effectively organizing the toolpaths by layer.
 * @param {Line[]} linesToDraw - The array of lines to classify.
 * @returns {SlicingLayers} An object where each key is a Z-coordinate and the value is an array of lines at that height.
 */
export const classifyGcodeLinesToLayers = (linesToDraw: Line[]) => {
  const layers: SlicingLayers = {};
  linesToDraw.forEach((line) => {
    const z = line.start.z ?? 0;
    if (!layers[z]) layers[z] = [];
    layers[z].push(line);
  });
  return layers;
};

/**
 * @description Generates 3D mesh geometry for contour (wall) lines by creating extruded boxes between
 * consecutive lines in a layer. This is used for visualizing the walls of a 3D print.
 * @param {Line[]} linesToDraw - An array of lines representing a single layer's contour.
 * @param {number} zOffset - The height of the extrusion (typically the layer height).
 * @returns {THREE.Mesh} A mesh object representing the extruded contour walls for the layer.
 */
/**
 * @description Generates 3D mesh geometry for contour (wall) lines by creating vertical walls
 * for each contour line segment. Each wall extends from the contour line down to a lower Z height.
 * @param {Line[]} linesToDraw - An array of lines representing a single layer's contour.
 * @param {number} zOffset - The height of the extrusion (typically the layer height).
 * @returns {THREE.Mesh} A mesh object representing the contour walls for the layer.
 */
export const generateDrawingContourDataFromGcode = (
  linesToDraw: Line[],
  zOffset: number
) => {
  // Give the first layer a tiny visible wall without making it look like many
  // layers are already printed.
  const minZOffset = 0.001;
  const effectiveZOffset = zOffset > 0 ? zOffset : minZOffset;

  console.log(`[generateDrawingContourDataFromGcode] Processing ${linesToDraw.length} lines with zOffset=${zOffset}, effectiveZOffset=${effectiveZOffset}`);

  const layerGeometries = [];
  let mergedLayerGeometry = new THREE.BufferGeometry();

  for (let i = 0; i < linesToDraw.length; i++) {
    const line = linesToDraw[i];
    const opacity = line.speed ? mapSpeedToOpacity(line.speed) : 0.8;

    // Skip lines without opacity
    if (!opacity) continue;

    // Create a vertical wall for this line segment at the layer height. The
    // first layer has z=0, so the top edge must be lifted by zOffset to show.
    const bottomZ = line.start.z ?? 0;
    const topZ = bottomZ + effectiveZOffset;
    const topStart = { ...line.start, z: topZ };
    const topEnd = { ...line.end, z: topZ };
    const bottomStart = { ...line.start, z: bottomZ };
    const bottomEnd = { ...line.end, z: bottomZ };

    const wallGeometry = new THREE.BufferGeometry();
    const wallPositions = [];

    const ts = [
      Constants.GCODE_PREVIEWER_RATIO * topStart.x,
      Constants.GCODE_PREVIEWER_RATIO * (topStart.z ?? 0),
      -Constants.GCODE_PREVIEWER_RATIO * topStart.y,
    ];
    const te = [
      Constants.GCODE_PREVIEWER_RATIO * topEnd.x,
      Constants.GCODE_PREVIEWER_RATIO * (topEnd.z ?? 0),
      -Constants.GCODE_PREVIEWER_RATIO * topEnd.y,
    ];
    const bs = [
      Constants.GCODE_PREVIEWER_RATIO * bottomStart.x,
      Constants.GCODE_PREVIEWER_RATIO * (bottomStart.z ?? 0),
      -Constants.GCODE_PREVIEWER_RATIO * bottomStart.y,
    ];
    const be = [
      Constants.GCODE_PREVIEWER_RATIO * bottomEnd.x,
      Constants.GCODE_PREVIEWER_RATIO * (bottomEnd.z ?? 0),
      -Constants.GCODE_PREVIEWER_RATIO * bottomEnd.y,
    ];

    wallPositions.push(...ts, ...te, ...bs);
    wallPositions.push(...te, ...be, ...bs);

    wallGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(wallPositions, 3)
    );

    layerGeometries.push(wallGeometry);
  }

  if (layerGeometries.length > 0) {
    mergedLayerGeometry = BufferGeometryUtils.mergeGeometries(layerGeometries);
    mergedLayerGeometry.computeBoundingBox();
    console.log(`[generateDrawingContourDataFromGcode] Created ${layerGeometries.length} wall geometries, merged successfully`);
  } else {
    console.warn(`[generateDrawingContourDataFromGcode] No geometries created! linesToDraw=${linesToDraw.length}`);
  }

  const material = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const contourMesh = new THREE.Mesh(mergedLayerGeometry, material);
  console.log('[generateDrawingContourDataFromGcode] Contour mesh created');
  return contourMesh;
};

/**
 * @description Updates the color of a specific line segment in the job's geometry to visually
 * represent real-time G-code execution.
 * @param {JobLayerElements} jobLayer - The job layer containing the geometry to update.
 * @param {string} color - The color to apply to the executed line.
 */
export const addExecutedLineToGraph = (
  jobLayer: JobLayerElements,
  color: string
) => {
  if (jobLayer.group.children.length > 0) {
    // Access the child based on the execution line index, which contains the correct lineSegments
    if (
      jobLayer.executedLineIndex / (6 * Constants.PREVIEWER_WORKER_BATCH_SIZE) >
      1
    ) {
      jobLayer.lineSegmentsIndex += 1;
      jobLayer.executedLineIndex = 0;
    }

    const lineSegments = jobLayer.group.children[
      jobLayer.lineSegmentsIndex
    ] as THREE.LineSegments;

    // Get the geometry of the lineSegments
    const geometry = lineSegments.geometry;

    if (geometry.attributes.color) {
      const colorsArray = geometry.attributes.color.array;
      const lineColor = new THREE.Color(color);

      // Update the color for both vertices of the line
      for (
        let i = jobLayer.executedLineIndex;
        i <= jobLayer.executedLineIndex + 5;
        i += 3
      ) {
        colorsArray[i] = lineColor.r;
        colorsArray[i + 1] = lineColor.g;
        colorsArray[i + 2] = lineColor.b;
      }

      // Increment the executedLineIndex to process the next line
      jobLayer.executedLineIndex += 6;

      // Mark the color attribute for update
      geometry.attributes.color.needsUpdate = true;
    }
  }
};

/**
 * @description Adds a grid object to the scene.
 * @param {THREE.Scene} scene - The main scene.
 * @param {THREE.Object3D} grid - The grid object to add.
 */
export const addGrid = (scene: THREE.Scene, grid: THREE.Object3D) => {
  scene.add(grid);
};

/**
 * @description Removes a grid object from the scene.
 * @param {THREE.Scene} scene - The main scene.
 * @param {THREE.Object3D} grid - The grid object to remove.
 */
export const removeGrid = (scene: THREE.Scene, grid: THREE.Object3D) => {
  scene.remove(grid);
};

/**
 * @description Resets the camera controls to their default position and zoom.
 * @param {MapControls} controls - The camera controls to reset.
 */
export const resetGraphControls = (controls: MapControls) => {
  controls.reset();
};

/**
 * @description Resets the colors of all lines in the execution layer back to their original state.
 * @param {JobLayerElements} jobLayer - The job layer containing the execution visualization.
 */
export const removeExecutionLayer = (jobLayer: JobLayerElements) => {
  if (jobLayer.group.children.length > 0) {
    let colorArrayIndex = 0;

    for (let i = 0; i < jobLayer.group.children.length; i++) {
      const lineSegments = jobLayer.group.children[i] as THREE.LineSegments;

      // Get the geometry of the lineSegments
      const geometry = lineSegments.geometry;

      // Check if the geometry has a color attribute
      if (geometry.attributes.color) {
        const colorAttribute = geometry.attributes.color;
        // Number of values in the color array (3 per vertex)
        const colorCount = colorAttribute.count * 3;

        // Get the slice of the colorsArray that corresponds to this line segment
        const colorSlice = jobLayer.colorsArray.slice(
          colorArrayIndex,
          colorArrayIndex + colorCount
        );

        // Create a new Float32BufferAttribute with the sliced color data
        const slicedColorAttribute = new THREE.Float32BufferAttribute(
          colorSlice,
          3
        );

        // Set the sliced color attribute to the geometry
        geometry.setAttribute('color', slicedColorAttribute);

        // Mark the color attribute for update
        geometry.attributes.color.needsUpdate = true;

        // Update the colorArrayIndex for the next line segment
        colorArrayIndex += colorCount;
      }
    }

    // Reset indices
    jobLayer.executedLineIndex = 0;
    jobLayer.lineSegmentsIndex = 0;
  }
};

/**
 * @description Clears all G-code geometry from a job layer and resets its state and camera controls.
 * @param {JobLayerElements} jobLayer - The job layer to clear.
 * @param {MapControls} controls - The associated camera controls to reset.
 */
export const removeGcodeLinesFromGraph = (
  jobLayer: JobLayerElements,
  controls: MapControls
) => {
  jobLayer.group.clear();
  jobLayer.colorsArray = new Uint8Array(0);
  jobLayer.executedLineIndex = 0;
  jobLayer.lineSegmentsIndex = 0;
  controls.reset();
};

/**
 * @description Updates the bounding box for a straight line.
 * @param {Line} line - The straight line segment.
 */
const updateBoundsStringtLine = (line: Line) => {
  const startX = Math.round(Constants.GCODE_PREVIEWER_RATIO * line.start.x);
  const startY = Math.round(Constants.GCODE_PREVIEWER_RATIO * line.start.y);
  const endX = Math.round(Constants.GCODE_PREVIEWER_RATIO * line.end.x);
  const endY = Math.round(Constants.GCODE_PREVIEWER_RATIO * line.end.y);
  parserState.bounds.minX = Math.min(parserState.bounds.minX, startX);
  parserState.bounds.minY = Math.min(parserState.bounds.minY, startY);
  parserState.bounds.maxX = Math.max(parserState.bounds.maxX, endX);
  parserState.bounds.maxY = Math.max(parserState.bounds.maxY, endY);
};

/**
 * @description Updates the bounding box for a curved line by checking each bezier segment.
 * @param {Line} line - The curved line segment containing bezier curves.
 */
const updateBoundsCurevedLine = (line: Line) => {
  for (let i = 0; i < line.beziers.length; i++) {
    const l = line.beziers[i];
    const startX = Math.round(Constants.GCODE_PREVIEWER_RATIO * l.p0.x);
    const startY = Math.round(Constants.GCODE_PREVIEWER_RATIO * l.p0.y);
    const endX = Math.round(Constants.GCODE_PREVIEWER_RATIO * l.p3.x);
    const endY = Math.round(Constants.GCODE_PREVIEWER_RATIO * l.p3.y);
    parserState.bounds.minX = Math.min(parserState.bounds.minX, startX);
    parserState.bounds.minY = Math.min(parserState.bounds.minY, startY);
    parserState.bounds.maxX = Math.max(parserState.bounds.maxX, endX);
    parserState.bounds.maxY = Math.max(parserState.bounds.maxY, endY);
  }
};

/**
 * @description Processes a straight line from the parser and adds it to the drawing array.
 * @param {Line[]} linesToDraw - The array to add the processed line to.
 * @param {Line} line - The line object from the G-code parser.
 */
const addStraightLine = (linesToDraw: Line[], line: Line) => {
  linesToDraw.push({
    ...line,
    start: {
      x: line.start.x,
      y: line.start.y,
      z: line.start.z ?? 0,
    },
    end: {
      x: line.end.x,
      y: line.end.y,
      z: line.end.z ?? 0,
    },
  });
};

/**
 * @description Processes a curved line by breaking its bezier segments into straight lines and adding them to the drawing array.
 * @param {Line[]} linesToDraw - The array to add the processed lines to.
 * @param {Line} line - The line object containing bezier curves.
 */
const addCurvedLine = (linesToDraw: Line[], line: Line) => {
  const b = line.beziers;
  for (let i = 0; i < b.length; i++) {
    const l = b[i];
    linesToDraw.push({
      ...line,
      start: {
        x: l.p0.x,
        y: l.p0.y,
        z: l.p0.z ?? 0,
      },
      end: {
        x: l.p3.x,
        y: l.p3.y,
        z: l.p3.z ?? 0,
      },
    });
  }
};

/**
 * @description Gets the graph step size from the application configuration based on the active machine type.
 * @param {Config} config - The application configuration object.
 * @returns {number | undefined} The graph step size, or undefined if not set for the current machine.
 */
export const getGraphStepSize = (config: Config) => {
  if (config.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER) {
    return config.laser_cutter_settings?.job_previewer.graph_step_size;
  } else if (config.machine_type === Constants.MACHINE_TYPE.VINYL_CUTTER) {
    return config.vinyl_cutter_settings?.job_previewer.graph_step_size;
  } else if (config.machine_type === Constants.MACHINE_TYPE.CNC) {
    return config.cnc_settings?.job_previewer.graph_step_size;
  } else if (config.machine_type === Constants.MACHINE_TYPE.THREE_D_PRINTER) {
    return config.printer_settings?.job_previewer.graph_step_size;
  }
};

/**
 * @description Gets the platform dimensions (width, height, depth) from the application configuration.
 * @param {Config} config - The application configuration object.
 * @returns {{platformWidth: number, platformHeight: number, platformDepth: number}} An object containing the platform dimensions.
 */
export const getPlatformDimensions = (config: Config) => {
  const platformWidth = Math.abs(
    config.machine_platform.end_point.x - config.machine_platform.start_point.x
  );
  const platformHeight = Math.abs(
    config.machine_platform.end_point.y - config.machine_platform.start_point.y
  );
  const platformDepth = Math.abs(
    (config.machine_platform.end_point.z ?? 0) -
      (config.machine_platform.start_point.z ?? 0)
  );

  return { platformWidth, platformHeight, platformDepth };
};
