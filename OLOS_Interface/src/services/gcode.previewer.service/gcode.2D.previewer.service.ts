import * as THREE from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import {
  GCodeColors,
  JobLayerElements,
  Line,
} from 'src/interfaces/gcodePreivew.interface';
import {
  addExecutedLineToGraph,
  generateDrawingDataFromGcode,
  getGraphStepSize,
  getPlatformDimensions,
  removeExecutionLayer,
  removeGcodeLinesFromGraph,
  resetGraphControls,
} from './gcode.previewer.helper.service';
import {
  createCustomGrid,
  createDashedLinesAndLabels,
  createLabelRenderer,
} from './gcode.previewer.tools.service';
import { Config } from 'src/interfaces/configSettings.interface';
import { CSS2DRenderer } from 'three/examples/jsm/Addons';

/**
 * @class Gcode2DPreviewer
 * @description A service class that manages a `three.js` scene to provide a 2D preview of G-code toolpaths.
 * It uses an orthographic camera and supports panning, zooming, job dragging, and real-time execution visualization.
 */
export class Gcode2DPreviewer {
  /** @private @property {Config} config - The application configuration settings. */
  private config: Config;
  /** @private @property {THREE.Scene} scene - The main scene where all objects are placed. */
  private scene: THREE.Scene;
  /** @private @property {THREE.OrthographicCamera} camera - The orthographic camera for a 2D top-down view. */
  private camera: THREE.OrthographicCamera;
  /** @private @property {THREE.WebGLRenderer} renderer - The primary renderer for the scene. */
  private renderer: THREE.WebGLRenderer;
  /** @private @property {MapControls} controls - The camera controls for panning and zooming. */
  private controls: MapControls;
  /** @private @property {CSS2DRenderer} labelRenderer - The renderer for HTML-based labels. */
  private labelRenderer: CSS2DRenderer;
  /** @private @property {THREE.Group} gridHelper - The grid representing the build platform. */
  private gridHelper: THREE.Group;
  /** @private @property {JobLayerElements} jobLayer - An object containing the group and data for the rendered G-code job. */
  private jobLayer: JobLayerElements;
  /** @private @property {THREE.Mesh} liveStreamPlane - A plane mesh used to display the live camera feed. */
  private liveStreamPlane: THREE.Mesh;
  /** @private @property {THREE.TextureLoader} streamLoader - A loader for the camera feed texture. */
  private streamLoader: THREE.TextureLoader;
  /** @private @property {THREE.Group} dashLinesAndLabels - A group containing the dashed lines and coordinate labels for the job bounds. */
  private dashLinesAndLabels: THREE.Group;
  /** @private @property {number} platformWidth - The width of the build platform. */
  private platformWidth: number;
  /** @private @property {number} platformHeight - The height of the build platform. */
  private platformHeight: number;
  /** @private @property {number} graphStepSize - The spacing between grid lines. */
  private graphStepSize: number;
  /** @private @property {DragControls | null} dragAndDrop - The drag controls for moving the job layer. */
  private dragAndDrop: DragControls | null = null;
  /** @private @property {THREE.Box3 | null} initialBBox - The initial bounding box of the job layer, used for constraining drag movements. */
  private initialBBox: THREE.Box3 | null = null;
  /** @private @property {number} xJobStarting - The calculated starting X-coordinate of the job, including any drag offset. */
  private xJobStarting: number;
  /** @private @property {number} yJobStarting - The calculated starting Y-coordinate of the job, including any drag offset. */
  private yJobStarting: number;

  /**
   * @constructor
   * @description Initializes the 2D `three.js` environment, including the orthographic camera, renderers,
   * controls, grid, and initial job layers based on the provided application configuration.
   * @param {Config} config - The application configuration settings.
   */
  constructor(config: Config) {
    this.config = config;
    const { platformWidth, platformHeight } = getPlatformDimensions(
      this.config
    );
    this.platformWidth = platformWidth;
    this.platformHeight = platformHeight;
    this.graphStepSize = getGraphStepSize(this.config) ?? 50;
    this.xJobStarting = this.config.machine_platform.start_point.x;
    this.yJobStarting = this.config.machine_platform.end_point.y;

    this.scene = new THREE.Scene();
    const minDistance = 0.1;
    const maxDistance = Math.max(platformWidth * 2, platformHeight * 2, 1000);
    // Set up orthographic camera
    this.camera = new THREE.OrthographicCamera(
      -platformWidth / 2,
      platformWidth / 2,
      platformHeight / 2,
      -platformHeight / 2 + 8,
      minDistance,
      maxDistance
    );

    this.camera.position.set(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ alpha: true });

    this.renderer.setSize(platformWidth, platformHeight, true);
    this.renderer.domElement.id = 'threejs-canvas';
    this.renderer.domElement.style.border = '1px solid black';

    // Create a CSS2DRenderer for rendering labels
    this.labelRenderer = createLabelRenderer(platformWidth, platformHeight);
    this.labelRenderer.domElement.id = 'threejs-canvas';

    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.minZoom = 1;
    this.controls.maxZoom = 100;
    this.controls.enableRotate = false;

    this.controls.addEventListener('change', () =>
      this.constrainCameraPosition()
    );

    // Grid
    this.gridHelper = createCustomGrid(
      platformWidth,
      platformHeight,
      this.graphStepSize
    );

    // background stream image
    this.liveStreamPlane = new THREE.Mesh();

    // Stream camera frame loader
    this.streamLoader = new THREE.TextureLoader();

    // Label and dash lines
    this.dashLinesAndLabels = new THREE.Group();

    // job layer elements
    this.jobLayer = {
      group: new THREE.Group(),
      colorsArray: new Uint8Array(0),
      executedLineIndex: 0,
      lineSegmentsIndex: 0,
    } as JobLayerElements;

    this.scene.add(this.jobLayer.group);

    this.animate();
  }

  /**
   * @private
   * @description Starts the animation loop for rendering the scene and labels.
   */
  private animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.labelRenderer.render(this.scene, this.camera);
    this.renderer.render(this.scene, this.camera);
  };

  /**
   * @description Appends the renderers' DOM elements to a container and resizes them to fit.
   * If a new file is being drawn, it first clears the previous job layer.
   * @param {HTMLDivElement} container - The container element to attach the previewer to.
   * @param {boolean} isNewFileToDraw - A flag indicating if this is a new job file.
   */
  add2DGraphToContainer = (
    container: HTMLDivElement,
    isNewFileToDraw: boolean
  ) => {
    if (isNewFileToDraw) {
      this.removeJobLayer();
    }
    container.appendChild(this.labelRenderer.domElement);
    container.appendChild(this.renderer.domElement);
    this.resizeThreeJSCanvasToFitContainerDimensions(container);
  };

  /**
   * @description Processes an array of G-code lines, generates the corresponding geometry and colors,
   * and adds the resulting line segments to the job layer for rendering.
   * @param {Line[]} linesToDraw - An array of G-code lines to be drawn.
   * @param {GCodeColors} colors - The color mapping for different G-code command types.
   */
  draw2DGcodeLinesOnGraph = (linesToDraw: Line[], colors: GCodeColors) => {
    const { lineSegments, colorsArray } = generateDrawingDataFromGcode(
      linesToDraw,
      colors
    );
    // save the color array for the execution process
    const mergedArray = new Uint8Array(
      this.jobLayer.colorsArray.length + colorsArray.length
    );
    mergedArray.set(this.jobLayer.colorsArray);
    mergedArray.set(colorsArray, this.jobLayer.colorsArray.length);
    this.jobLayer.colorsArray = mergedArray;

    const graphStartPointX = -this.platformWidth / 2;
    const graphStartPointY = this.platformHeight / 2 - 8;

    lineSegments.position.set(graphStartPointX, 0, graphStartPointY);
    this.jobLayer.group.add(lineSegments);
  };

  /**
   * @description Highlights a single G-code line on the graph to simulate execution.
   * @param {string} color - The color to use for the executed line.
   */
  addExecutedLineToGraph = (color: string) => {
    addExecutedLineToGraph(this.jobLayer, color);
  };

  /** @description Makes the grid helper visible in the scene. */
  showGrid = () => {
    this.scene.add(this.gridHelper);
  };

  /** @description Hides the grid helper from the scene. */
  hideGrid = () => {
    this.scene.remove(this.gridHelper);
  };

  /**
   * @description Displays a camera feed image as the background of the previewer.
   * If the stream is inactive, it removes any existing frame.
   * @param {string} cameraFrame - The Base64 encoded image data for the camera frame.
   * @param {boolean} active - A flag indicating if the camera stream is active.
   */
  showCameraFrame = (cameraFrame: string, active: boolean) => {
    // Only draw frame if stream is active
    if (!active) {
      // Remove the camera frame if any
      this.hideCameraFrame();
      return;
    }

    this.streamLoader.load(cameraFrame, (texture) => {
      // Check again inside callback, in case stream was stopped while loading
      if (!active) {
        texture.dispose();
        return;
      }
      // Remove previous frame immediately
      this.hideCameraFrame();

      const planeGeometry = new THREE.PlaneGeometry(
        this.platformWidth,
        this.platformHeight
      );
      const planeMaterial = new THREE.MeshBasicMaterial({ map: texture });
      this.liveStreamPlane = new THREE.Mesh(planeGeometry, planeMaterial);
      this.liveStreamPlane.position.set(0, -2, 0);
      this.liveStreamPlane.rotation.x = (Math.PI / 180) * -90;
      this.scene.add(this.liveStreamPlane);
    });
  };

  /** @description Hides the camera frame from the scene. */
  hideCameraFrame = () => {
    // Remove from scene
    this.scene.remove(this.liveStreamPlane);
  };

  /**
   * @description Shows coordinate labels and dashed lines for the job's bounding box.
   * Attaches a 'drag' event listener to update them if drag controls are active.
   */
  showLabels = () => {
    if (this.jobLayer.group) {
      this.dashLinesAndLabels = createDashedLinesAndLabels(
        this.scene,
        this.dashLinesAndLabels,
        this.jobLayer.group,
        this.platformWidth,
        this.platformHeight
      );
      // Add the event listener to the drag control
      this.dragAndDrop?.addEventListener(
        'drag',
        this.updateDashedLinesAndLabels
      );
    }
  };

  /** @description Clears the entire job layer, resets drag controls, and resets the job's starting position. */
  resetAllGraphElements = () => {
    this.removeJobLayer();
    this.dragAndDrop = null;
    this.xJobStarting = this.config.machine_platform.start_point.x;
    this.yJobStarting = this.config.machine_platform.end_point.y;
  };

  /** @description Hides the coordinate labels and dashed lines and removes related event listeners. */
  hideLabels = () => {
    // Remove previous dashed lines and labels
    this.dashLinesAndLabels.clear();
    this.scene.remove(this.dashLinesAndLabels);

    // Remove the event listener
    this.dragAndDrop?.removeEventListener(
      'drag',
      this.updateDashedLinesAndLabels
    );
  };

  /** @description Clears only the "executed" line highlights from the graph. */
  removeExecutionLayer = () => {
    removeExecutionLayer(this.jobLayer);
  };

  /**
   * @description Adjusts the graph and camera view to accommodate jobs with a specified height.
   * @param {number} maxJobHeight - The maximum height of the job to be displayed.
   */
  setGraphHeightSize = (maxJobHeight: number) => {
    const offset = maxJobHeight >= 100 ? 100 : maxJobHeight;
    this.jobLayer.group.position.z =
      -this.platformHeight / 2 + (maxJobHeight + offset) / 2;

    this.camera.top = (maxJobHeight + offset) / 2;
    this.camera.bottom = -(maxJobHeight + offset) / 2 + 8;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.platformWidth, maxJobHeight + offset, true);
    this.labelRenderer.setSize(this.platformWidth, maxJobHeight + offset);
    this.gridHelper.clear();
    this.gridHelper = createCustomGrid(
      this.platformWidth,
      maxJobHeight + offset,
      this.graphStepSize
    );
  };

  /**
   * @description Clears a loaded G-code job, including its geometry, labels, and drag controls.
   */
  removeJobLayer = () => {
    // Remove drag controls event listeners and clear the controls
    if (this.dragAndDrop) {
      this.dragAndDrop.removeEventListener(
        'dragstart',
        this.disableDragAndDrop
      );
      this.dragAndDrop.removeEventListener('dragend', this.enableDragAndDrop);
      this.dragAndDrop.removeEventListener('drag', this.constrainBoxPosition);
      this.dragAndDrop.deactivate();
    }
    this.hideLabels();

    removeGcodeLinesFromGraph(this.jobLayer, this.controls);

    this.resetJobLayerPosition();
  };

  /** @description Resets the job layer's position to the origin (0, 0, 0). */
  resetJobLayerPosition = () => {
    this.jobLayer.group.position.set(0, 0, 0);
  };

  /** @description Resets the camera controls to their default position and zoom. */
  resetGraphControls = () => {
    resetGraphControls(this.controls);
  };

  /** @description Disables camera controls, typically done when a drag operation starts. */
  disableDragAndDrop = () => {
    this.controls.enabled = false;
  };

  /** @description Enables camera controls, typically done when a drag operation ends. */
  enableDragAndDrop = () => {
    this.controls.enabled = true;
  };

  /**
   * @description Initializes `DragControls` for the entire job layer, allowing the user to
   * drag the job's position on the platform. It creates an invisible bounding box mesh to act as the drag handle.
   */
  initDragAndDropForGraph = () => {
    // Create and add bounding box mesh to the jobLayerElements.group group
    const boundingBoxMesh = this.createBoundingBoxMeshForJobLayer();

    // add bounding box mesh to drag the whole jobLayerElements.group
    this.jobLayer.group.add(boundingBoxMesh);

    // get the bounding box for the mesh
    this.initialBBox = new THREE.Box3().setFromObject(boundingBoxMesh);

    // Set up drag controls
    this.dragAndDrop = new DragControls(
      [this.jobLayer.group],
      this.camera,
      this.renderer.domElement
    );

    this.dragAndDrop.transformGroup = true;
    // Add event listeners for drag events
    this.dragAndDrop.addEventListener('dragstart', () =>
      this.disableDragAndDrop()
    );

    this.dragAndDrop.addEventListener('dragend', () =>
      this.enableDragAndDrop()
    );

    // Constrain the box position during dragging
    this.dragAndDrop.addEventListener('drag', () => {
      this.constrainBoxPosition();
      this.updateStartJobPosition();
    });
  };

  /**
   * @description Creates an invisible mesh with the same dimensions as the job's bounding box.
   * This mesh is used as the target for the `DragControls`.
   * @returns {THREE.Mesh} The invisible bounding box mesh.
   */
  createBoundingBoxMeshForJobLayer = () => {
    const bbox = new THREE.Box3().setFromObject(this.jobLayer.group);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      opacity: 0,
      transparent: true,
    });
    const boxMesh = new THREE.Mesh(geometry, material);

    // Set the position of the boxMesh to match the center of the bounding box
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    boxMesh.position.copy(center);

    return boxMesh;
  };

  /**
   * @description Resizes the CSS dimensions of the renderer's canvas to fit its parent container while maintaining aspect ratio.
   * @param {HTMLDivElement} graphContainer - The container element holding the canvas.
   */
  resizeThreeJSCanvasToFitContainerDimensions = (
    graphContainer: HTMLDivElement
  ) => {
    if (graphContainer) {
      const scale =
        graphContainer.clientWidth /
        this.renderer.domElement.getBoundingClientRect().width;

      // modify the css graph aspects
      this.renderer.domElement.style.width = `${
        this.renderer.domElement.getBoundingClientRect().width * scale
      }px`;

      this.renderer.domElement.style.height = `${
        this.renderer.domElement.getBoundingClientRect().height * scale
      }px`;
    }
  };

  /**
   * @description A helper method to redraw the dashed lines and labels, typically called after a drag event.
   */
  updateDashedLinesAndLabels = () => {
    // Create new dashed lines and labels
    if (this.jobLayer.group) {
      this.dashLinesAndLabels.clear();
      createDashedLinesAndLabels(
        this.scene,
        this.dashLinesAndLabels,
        this.jobLayer.group,
        this.platformWidth,
        this.platformHeight
      );
    }
  };

  /**
   * @description Constrains the position of the job layer during a drag operation to keep it within the platform boundaries.
   */
  constrainBoxPosition = () => {
    if (this.jobLayer.group && this.initialBBox) {
      const maxX = this.platformWidth / 2 - this.initialBBox.max.x;
      const minX = -(this.platformWidth / 2) - this.initialBBox.min.x;

      const minZ = -this.platformHeight / 2 - this.initialBBox.min.z;
      const maxZ = this.platformHeight / 2 - 8 - this.initialBBox.max.z;

      if (this.jobLayer.group.position.x < minX) {
        this.jobLayer.group.position.x = minX;
      } else if (this.jobLayer.group.position.x > maxX) {
        this.jobLayer.group.position.x = maxX;
      }

      if (this.jobLayer.group.position.z > maxZ) {
        this.jobLayer.group.position.z = maxZ;
      } else if (this.jobLayer.group.position.z < minZ) {
        this.jobLayer.group.position.z = minZ;
      }
    }
  };

  /**
   * @description Prevents the user from panning the orthographic camera outside the bounds of the visible area,
   * especially when zoomed in.
   */
  constrainCameraPosition = () => {
    // Calculate maximum/minimum movement range based on the scale
    const maxX =
      (this.camera.zoom - 1) * (this.platformWidth / (this.camera.zoom * 2));
    const minX =
      -(this.camera.zoom - 1) * (this.platformWidth / (this.camera.zoom * 2));
    const maxZ =
      (this.camera.zoom - 1) * (this.platformHeight / (this.camera.zoom * 2));
    const minZ =
      -(this.camera.zoom - 1) * (this.platformHeight / (this.camera.zoom * 2));

    // Check if the target's x coordinate is within the adjusted grid boundaries
    if (this.controls.target.x < minX) {
      this.controls.target.setX(minX);
    } else if (this.controls.target.x > maxX) {
      this.controls.target.setX(maxX);
    }

    // Check if the target's z coordinate is within the adjusted grid boundaries
    if (this.controls.target.z < minZ) {
      this.controls.target.setZ(minZ);
    } else if (this.controls.target.z > maxZ) {
      this.controls.target.setZ(maxZ);
    }

    // Update camera position based on the updated target position
    const distance = this.camera.position.distanceTo(this.controls.target);
    const phi = this.controls.getPolarAngle();
    const theta = this.controls.getAzimuthalAngle();
    this.camera.position.set(
      distance * Math.sin(phi) * Math.sin(theta) + this.controls.target.x,
      distance * Math.cos(phi) + this.controls.target.y,
      distance * Math.sin(phi) * Math.cos(theta) + this.controls.target.z
    );
  };

  /**
   * @description Updates the job's starting coordinates based on its current dragged position.
   */
  updateStartJobPosition = () => {
    this.xJobStarting =
      this.config.machine_platform.start_point.x +
      this.jobLayer.group.position.x;
    this.yJobStarting =
      this.config.machine_platform.end_point.y - this.jobLayer.group.position.z;
  };

  /**
   * @description Gets the `DragControls` instance.
   * @returns {DragControls | null} The DragControls instance or null if not initialized.
   */
  get dragAndDropControls(): DragControls | null {
    return this.dragAndDrop;
  }
  /**
   * @description Gets the calculated starting X-coordinate of the job.
   * @returns {number} The starting X-coordinate.
   */
  get xJobStartingValue(): number {
    return this.xJobStarting;
  }
  /**
   * @description Gets the calculated starting Y-coordinate of the job.
   * @returns {number} The starting Y-coordinate.
   */
  get yJobStartingValue(): number {
    return this.yJobStarting;
  }
}
