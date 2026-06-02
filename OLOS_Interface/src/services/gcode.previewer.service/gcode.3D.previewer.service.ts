import { Constants } from 'src/constants';
import { LayersRange } from 'src/interfaces/3D.slicing.interface';
import { Config } from 'src/interfaces/configSettings.interface';
import {
  GCodeColors,
  JobLayerElements,
  Line,
  SlicingLayers,
} from 'src/interfaces/gcodePreivew.interface';
import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import {
  addExecutedLineToGraph,
  addGrid,
  removeGrid,
  generateDrawingDataFromGcode,
  getGraphStepSize,
  getPlatformDimensions,
  resetGraphControls,
  removeExecutionLayer,
  removeGcodeLinesFromGraph,
  classifyGcodeLinesToLayers,
  generateDrawingContourDataFromGcode,
} from './gcode.previewer.helper.service';
import {
  createCircularGrid,
  createCustomGrid,
} from './gcode.previewer.tools.service';

/**
 * @class Gcode3DPreviewer
 * @description A service class that manages a `three.js` scene to provide a 3D preview of G-code,
 * typically from a 3D slicing process. It supports layer-by-layer visualization of contours and infill.
 */
export class Gcode3DPreviewer {
  /** @private @property {Config} config - The application configuration settings. */
  private config: Config;
  /** @private @property {THREE.Scene} scene - The main scene where all objects are placed. */
  private scene: THREE.Scene;
  /** @private @property {THREE.PerspectiveCamera} camera - The perspective camera for viewing the 3D scene. */
  private camera: THREE.PerspectiveCamera;
  /** @private @property {THREE.WebGLRenderer} renderer - The renderer that draws the scene. */
  private renderer: THREE.WebGLRenderer;
  /** @private @property {MapControls} controls - The camera controls for orbit, pan, and zoom. */
  private controls: MapControls;
  /** @private @property {THREE.Group} gridHelper - The grid representing the build platform. */
  private gridHelper: THREE.Group;
  /** @private @property {JobLayerElements} jobLayer - An object containing the group and data for the rendered G-code job. */
  private jobLayer: JobLayerElements;
  /** @private @property {number} platformWidth - The width of the build platform. */
  private platformWidth: number;
  /** @private @property {number} platformHeight - The height of the build platform. */
  private platformHeight: number;
  /** @private @property {number} graphStepSize - The spacing between grid lines. */
  private graphStepSize: number;
  /** @private @property {Array<number>} zLevelsArray - An array of unique Z-heights (layers) found in the G-code. */
  private zLevelsArray: Array<number> = [];
  /** @private @property {number} preZLevel - The Z-height of the previously processed layer, used for calculating offsets. */
  private preZLevel = 0;
  /** @private @property {LayersRange} layerRange - The current range of visible layers. */
  private layerRange: LayersRange = {
    min: 1,
    max: 1,
  };
  /** @private @property {Array<THREE.Object3D>} layerObjects - An array of all rendered layer objects (meshes and line segments) for visibility control. */
  private layerObjects: Array<THREE.LineSegments | THREE.Mesh> = [];

  /**
   * @constructor
   * @description Initializes the 3D `three.js` environment, including the perspective camera, renderer,
   * controls, and grid based on the provided application configuration.
   * @param {Config} config - The application configuration settings.
   */
  constructor(config: Config) {
    this.config = config;

    // Get platform dimensions and step size
    const { platformWidth, platformHeight } = getPlatformDimensions(
      this.config
    );
    this.platformWidth = platformWidth;
    this.platformHeight = platformHeight;
    this.graphStepSize = getGraphStepSize(this.config) ?? 50;

    // === THREE.js Setup ===

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const aspectRatio = platformWidth / platformHeight;
    const cameraDistance = Math.max(platformWidth, platformHeight);

    this.camera = new THREE.PerspectiveCamera(
      60, // FOV
      aspectRatio,
      0.1,
      cameraDistance * 10 // Far plane
    );
    this.camera.position.set(cameraDistance, cameraDistance, cameraDistance);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.domElement.id = 'threejs-canvas';
    this.renderer.domElement.style.border = '1px solid black';

    // 4. Controls
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 1;
    this.controls.maxDistance = cameraDistance * 10;

    // 5. Grid
    this.gridHelper = this.createGrid(); // Assuming this uses graphStepSize
    this.scene.add(this.gridHelper);

    // 6. Job Layer
    this.jobLayer = {
      group: new THREE.Group(),
      colorsArray: new Uint8Array(0),
      executedLineIndex: 0,
      lineSegmentsIndex: 0,
    };
    this.scene.add(this.jobLayer.group);

    // 7. Animate
    this.animate();
  }

  /**
   * @private
   * @description Creates a grid helper based on the platform shape specified in the config.
   * @returns {THREE.Group} The created grid helper.
   */
  private createGrid() {
    if (
      this.config.machine_type === Constants.MACHINE_TYPE.THREE_D_PRINTER &&
      this.config.printer_settings?.job_previewer.platform_shape ===
        Constants.THREE_D_PRINTER_PLATFORM_SHAPE.CIRCLE
    ) {
      return createCircularGrid(
        Math.max(this.platformWidth, this.platformHeight) / 2,
        this.graphStepSize
      );
    }
    return createCustomGrid(
      this.platformWidth,
      this.platformHeight,
      this.graphStepSize
    );
  }

  /**
   * @private
   * @description Starts the animation loop for rendering the scene.
   */
  private animate() {
    const loop = () => {
      requestAnimationFrame(loop);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  /**
   * @private
   * @description Centers the entire job layer group on the X and Z axes of the platform.
   */
  private centralizeJobLayer() {
    const box = new THREE.Box3().setFromObject(this.jobLayer.group);
    const center = box.getCenter(new THREE.Vector3());
    this.jobLayer.group.position.sub(new THREE.Vector3(center.x, 0, center.z));
  }

  /**
   * @description Appends the renderer's DOM element to a container and resizes it to fit.
   * If a new file is being drawn, it first clears the previous job layer.
   * @param {HTMLDivElement} container - The container element to attach the previewer to.
   * @param {boolean} isNewFileToDraw - A flag indicating if this is a new job file.
   */
  add3DGraphToContainer(container: HTMLDivElement, isNewFileToDraw: boolean) {
    if (isNewFileToDraw) {
      removeGcodeLinesFromGraph(this.jobLayer, this.controls);
    }
    container.appendChild(this.renderer.domElement);
    this.resizeThreeJSCanvasToFitContainerDimensions(container);
  }

  /**
   * @description A general-purpose method to draw an array of G-code lines as simple line segments.
   * @param {Line[]} lines - An array of G-code lines to be drawn.
   * @param {GCodeColors | null} [colors=null] - The color mapping for different G-code command types.
   */
  draw3DGcodeLinesOnGraph(lines: Line[], colors: GCodeColors | null = null) {
    const { lineSegments, colorsArray } = generateDrawingDataFromGcode(
      lines,
      colors,
      true
    );

    const mergedArray = new Uint8Array(
      this.jobLayer.colorsArray.length + colorsArray.length
    );
    mergedArray.set(this.jobLayer.colorsArray);
    mergedArray.set(colorsArray, this.jobLayer.colorsArray.length);
    this.jobLayer.colorsArray = mergedArray;

    this.jobLayer.group.add(lineSegments);

    this.centralizeJobLayer();
  }

  /**
   * @description Processes separate arrays of contour and infill G-code lines, classifies them into layers,
   * and draws them in the 3D scene. Contours are drawn as meshes and infill as lines.
   * It also updates the layer information for the UI slider.
   * @param {Line[] | undefined} contourToDraw - An array of G-code lines representing the model's contours (walls).
   * @param {Line[] | undefined} infillToDraw - An array of G-code lines representing the model's infill.
   */
  drawSliceResult = (
    contourToDraw: Line[] | undefined,
    infillToDraw: Line[] | undefined
  ) => {
    console.log(`[drawSliceResult] contourToDraw=${contourToDraw?.length ?? 0} lines, infillToDraw=${infillToDraw?.length ?? 0} lines`);
    let infillLayers, contourLayers;

    if (contourToDraw) {
      console.log('[drawSliceResult] Processing contour data');
      contourLayers = classifyGcodeLinesToLayers(contourToDraw);
      this.drawContour(contourLayers);
    } else {
      console.warn('[drawSliceResult] No contour data provided');
    }

    if (infillToDraw) {
      infillLayers = classifyGcodeLinesToLayers(infillToDraw);
      this.drawInfill(infillLayers);
    }

    this.centralizeJobLayer();

    contourLayers
      ? this.updateZLevelList(contourLayers)
      : infillLayers
      ? this.updateZLevelList(infillLayers)
      : null;
  };

  /**
   * @private
   * @description Renders the contour (wall) portions of sliced layers as extruded meshes.
   * @param {SlicingLayers} layers - The G-code lines for contours, grouped by Z-height.
   */
  private drawContour(layers: SlicingLayers) {
    console.log(`[drawContour] Drawing ${Object.keys(layers).length} layers`);
    const sortedLayers = Object.entries(layers).sort(
      ([a], [b]) => parseFloat(a) - parseFloat(b)
    );

    sortedLayers.forEach(([z, layerLines], index) => {
      console.log(`[drawContour] Layer z=${z} has ${layerLines.length} lines`);
      const currZ = parseFloat(z);
      const prevZ = index > 0 ? parseFloat(sortedLayers[index - 1][0]) : null;
      const nextZ =
        index < sortedLayers.length - 1
          ? parseFloat(sortedLayers[index + 1][0])
          : null;
      const zOffset =
        prevZ !== null
          ? currZ - prevZ
          : nextZ !== null
          ? nextZ - currZ
          : 0;
      const contourMesh = generateDrawingContourDataFromGcode(
        layerLines,
        zOffset
      );
      contourMesh.userData.layerIndex = currZ;
      contourMesh.userData.previewRole = 'contour';
      this.jobLayer.group.add(contourMesh);
      // add to tracked list
      this.layerObjects.push(contourMesh);
      this.preZLevel = currZ;
      console.log('[drawContour] Contour mesh added to scene');
    });
  }

  /**
   * @private
   * @description Renders the infill portions of sliced layers as simple line segments.
   * @param {SlicingLayers} layers - The G-code lines for infill, grouped by Z-height.
   */
  private drawInfill(layers: SlicingLayers) {
    Object.entries(layers).forEach(([z, layerLines]) => {
      const currZ = parseFloat(z);
      const { lineSegments } = generateDrawingDataFromGcode(
        layerLines,
        null,
        true
      );
      lineSegments.userData.layerIndex = currZ;
      this.jobLayer.group.add(lineSegments);
      // track for later visibility control
      this.layerObjects.push(lineSegments);
    });
  }

  /**
   * @private
   * @description Updates the internal list of Z-heights (layers) and the min/max range for the UI slider
   * based on the newly added layers.
   * @param {SlicingLayers} layers - The newly processed layers.
   */
  private updateZLevelList(layers: { [z: number]: Line[] }) {
    // update the list of layers level
    const layersLevels = Object.keys(layers).map((z) => parseFloat(z));
    const previousLayerCount = this.zLevelsArray.length;
    const shouldFollowTopLayer =
      previousLayerCount === 0 || this.layerRange.max >= previousLayerCount;

    this.zLevelsArray = Array.from(
      new Set(this.zLevelsArray.concat(layersLevels))
    ).sort((a, b) => a - b);

    if (this.zLevelsArray.length > 0) {
      this.layerRange = {
        min: Math.min(Math.max(this.layerRange.min || 1, 1), this.zLevelsArray.length),
        max: shouldFollowTopLayer
          ? this.zLevelsArray.length
          : Math.min(
              Math.max(this.layerRange.max || 1, 1),
              this.zLevelsArray.length
            ),
      };
      if (this.layerRange.min > this.layerRange.max) {
        this.layerRange.min = this.layerRange.max;
      }
    }
    this.applyLayerVisibility();
  }

  /**
   * @description Controls the visibility of rendered G-code layers based on a given range,
   * allowing for a layer-by-layer inspection of the sliced model.
   * @param {LayersRange} layersRange - An object with `min` and `max` properties representing the desired visible layer range.
   */
  setSlicedLayerVisibility(layersRange: LayersRange) {
    this.layerRange = layersRange;
    this.applyLayerVisibility();
  }

  private applyLayerVisibility() {
    if (this.zLevelsArray.length === 0) return;

    const minLayer = Math.min(
      Math.max(this.layerRange.min || 1, 1),
      this.zLevelsArray.length
    );
    const maxLayer = Math.min(
      Math.max(this.layerRange.max || minLayer, minLayer),
      this.zLevelsArray.length
    );
    const minIndex = this.zLevelsArray[minLayer - 1];
    const maxIndex = this.zLevelsArray[maxLayer - 1];

    this.layerObjects.forEach((obj) => {
      const layerIndex = obj.userData.layerIndex;
      const isInsideVisibleRange = minIndex <= layerIndex && layerIndex <= maxIndex;

      obj.visible = isInsideVisibleRange;
    });
  }

  /**
   * @description Resets all parameters related to the slicing preview, including the list of Z-levels,
   * layer range, and tracked layer objects, to prepare for a new preview.
   */
  resetSlicingPreviewerParameters() {
    this.zLevelsArray = [];
    this.preZLevel = 0;
    this.layerRange = {
      min: 1,
      max: 1,
    };
    this.layerObjects = [];
  }

  /**
   * @description Resizes the renderer and updates the camera aspect ratio to fit the container's dimensions.
   * @param {HTMLDivElement} graphContainer - The container element holding the canvas.
   */
  resizeThreeJSCanvasToFitContainerDimensions = (
    graphContainer: HTMLDivElement
  ) => {
    const containerWidth = graphContainer.clientWidth;
    const containerHeight = graphContainer.clientHeight;
    this.renderer.setSize(containerWidth, containerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.camera.aspect = containerWidth / containerHeight;
    this.camera.updateProjectionMatrix();
  };

  /**
   * @description Highlights a single G-code line on the graph to simulate execution.
   * @param {string} color - The color to use for the executed line.
   */
  addExecutedLineToGraph(color: string) {
    addExecutedLineToGraph(this.jobLayer, color);
  }

  /** @description Makes the grid helper visible in the scene. */
  showGrid() {
    addGrid(this.scene, this.gridHelper);
  }

  /** @description Hides the grid helper from the scene. */
  hideGrid() {
    removeGrid(this.scene, this.gridHelper);
  }

  /** @description Resets the camera controls to their default position and zoom. */
  resetGraphControls() {
    resetGraphControls(this.controls);
  }

  /** @description Clears only the "executed" line highlights from the graph. */
  removeExecutionLayer() {
    removeExecutionLayer(this.jobLayer);
  }

  /** @description Clears the entire job layer and resets the previewer. */
  resetAllGraphElements = () => {
    this.removeJobLayer();
  };

  /** @description Clears the loaded G-code job from the scene. */
  removeJobLayer = () => {
    removeGcodeLinesFromGraph(this.jobLayer, this.controls);
  };

  /**
   * @description Gets the renderer's DOM element.
   * @returns {HTMLCanvasElement} The canvas element.
   */
  get canvasElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /**
   * @description Gets the total number of unique Z-layers detected in the sliced G-code.
   * @returns {number} The number of layers.
   */
  get numberOfSlicingLayers(): number {
    return this.zLevelsArray.length;
  }

  /**
   * @description Gets the current min/max range of visible layers.
   * @returns {LayersRange} The current layer range.
   */
  get sliderLayerRange(): LayersRange {
    return this.layerRange;
  }
}
