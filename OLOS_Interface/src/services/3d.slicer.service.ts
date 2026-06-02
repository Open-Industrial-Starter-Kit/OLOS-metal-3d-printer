import { Constants } from 'src/constants';
import * as THREE from 'three';
import {
  getGraphStepSize,
  getPlatformDimensions,
} from 'src/services/gcode.previewer.service/gcode.previewer.helper.service';
import {
  createCircularGrid,
  createCustomGrid,
} from 'src/services/gcode.previewer.service/gcode.previewer.tools.service';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';
import { AMFLoader } from 'three/examples/jsm/loaders/AMFLoader';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import {
  ModelData,
  TransformCommand,
  TransformSnapshot,
} from 'src/interfaces/3D.slicing.interface';
import { ViewportGizmo } from 'three-viewport-gizmo';
import { v4 as uuidv4 } from 'uuid';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import { Config } from 'src/interfaces/configSettings.interface';
import { MapControls } from 'three/examples/jsm/Addons';

/**
 * @class ThreeDSlicer
 * @description A service class that encapsulates the entire `three.js` scene, controls, and logic
 * for a 3D model slicer interface. It handles loading, selecting, transforming, and exporting models,
 * and communicates state changes to a Pinia store.
 */
export class ThreeDSlicer {
  /** @private @property {Config} config - The application configuration settings. */
  private config: Config;
  /** @private @property {THREE.Scene} scene - The main scene where all objects are placed. */
  private scene: THREE.Scene;
  /** @private @property {THREE.PerspectiveCamera} camera - The camera used to view the scene. */
  private camera: THREE.PerspectiveCamera;
  /** @private @property {THREE.WebGLRenderer} renderer - The renderer that draws the scene. */
  private renderer: THREE.WebGLRenderer;
  /** @private @property {MapControls} controls - The camera controls for orbit, pan, and zoom. */
  private controls: MapControls;
  /** @private @property {THREE.Group} gridHelper - The grid representing the build platform. */
  private gridHelper: THREE.Group;
  /** @private @property {number} platformWidth - The width of the build platform. */
  private platformWidth: number;
  /** @private @property {number} platformHeight - The height (depth) of the build platform. */
  private platformHeight: number;
  /** @private @property {number} platformDepth - The vertical depth of the build area. */
  private platformDepth: number;
  /** @private @property {number} graphStepSize - The spacing between grid lines. */
  private graphStepSize: number;
  /** @private @property {ViewportGizmo} viewHelper - The orientation gizmo in the corner of the viewport. */
  private viewHelper: ViewportGizmo;
  /** @private @property {THREE.AmbientLight} ambientLight - The scene's ambient light source. */
  private ambientLight: THREE.AmbientLight;
  /** @private @property {THREE.DirectionalLight} directionalLight - The scene's directional light source. */
  private directionalLight: THREE.DirectionalLight;
  /** @private @property {TransformControls} transformControls - The gizmo for translating, rotating, and scaling models. */
  private transformControls: TransformControls;
  /** @private @property {THREE.Raycaster} raycaster - Used for detecting intersections with objects (e.g., for selection). */
  private raycaster: THREE.Raycaster;
  /** @private @property {THREE.Vector2} mouse - Stores the normalized mouse coordinates for raycasting. */
  private mouse: THREE.Vector2;
  /** @private @property {boolean} isResizeUniformed - Flag to determine if scaling should be uniform. */
  private isResizeUniformed = true;
  /** @private @property {ModelData} selectedModel - Holds the data of the currently selected model. */
  private selectedModel: ModelData = {
    object: null,
    helperBox: null,
    preTransform: null,
    isTransforming: false,
  };
  /** @private @property {ModelData[]} uploadedModels - An array of all models currently in the scene. */
  private uploadedModels: ModelData[] = [];
  /** @private @property {boolean} isModelOutsideOfPlatform - Flag indicating if the selected model is outside the build area. */
  private isModelOutsideOfPlatform = false;
  /** @private @property {TransformCommand[]} undoStack - A stack of transformation commands for the undo functionality. */
  private undoStack: TransformCommand[] = [];
  /** @private @property {TransformCommand[]} redoStack - A stack of undone transformation commands for the redo functionality. */
  private redoStack: TransformCommand[] = [];
  /** @private @property {object} slicingStore - An instance of the 3D slicing Pinia store. */
  private slicingStore = use3DSlicingStore();

  /**
   * @constructor
   * @description Initializes the `three.js` scene, camera, renderer, lighting, controls, and helpers
   * based on the provided application configuration.
   * @param {Config} config - The application configuration settings.
   */
  constructor(config: Config) {
    this.config = config;

    // Get platform dimensions and step size
    const { platformWidth, platformHeight, platformDepth } =
      getPlatformDimensions(this.config);
    this.platformWidth = platformWidth;
    this.platformHeight = platformHeight;
    this.platformDepth = platformDepth;

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
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(platformWidth, platformHeight);
    this.renderer.domElement.id = 'threejs-canvas';

    // 4. Controls
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.minDistance = 1;
    this.controls.maxDistance = cameraDistance * 10;

    // 5. Grid
    this.gridHelper = this.createGrid();
    this.scene.add(this.gridHelper);

    // 6. View Helper
    this.viewHelper = new ViewportGizmo(this.camera, this.renderer);

    // 7. Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    // 8. Directional Light
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(5, 10, 7.5);
    this.scene.add(this.directionalLight);

    // 9. Selected object tools
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 10. transformation controls
    this.transformControls = new TransformControls(
      this.camera,
      this.renderer.domElement
    );
    this.scene.add(this.transformControls);

    // 11.animation
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
      this.viewHelper.render();
    };
    loop();
  }

  /**
   * @description Attaches the renderer's canvas to a DOM element and sets up event listeners.
   * @param {HTMLDivElement} slicingContainer - The container element to append the canvas to.
   */
  drawSlicingContainer = (slicingContainer: HTMLDivElement) => {
    this.resizeThreeJSCanvasToFitPageDimensions(slicingContainer);
    slicingContainer.addEventListener('pointermove', this.onPointerMove);
    slicingContainer.addEventListener('pointerdown', this.onPointerDown);
    this.initTransformerControlsEventListeners();
    slicingContainer.appendChild(this.renderer.domElement);
    this.setupContainerViewHelper(slicingContainer);
  };

  /**
   * @description Asynchronously loads a 3D model from a File object, adds it to the scene,
   * and sets it up for manipulation.
   * @param {File} file - The 3D model file (STL, OBJ, 3MF, AMF).
   */
  addNew3DModel = async (file: File) => {
    const object = (await this.load3DModel(file)) as THREE.Mesh;
    this.addModelToContainer(object);
  };

  /**
   * @description Merges all models in the scene into a single group and exports them to a specified file format.
   * @param {string} format - The desired file format (e.g., '.stl', '.obj').
   * @returns {Blob | undefined} A Blob containing the exported model data, or undefined for unsupported formats.
   */
  exportSceneModels = (format: string) => {
    const exportGroup = this.prepareExportGroup();
    let output;
    let blob;

    switch (format) {
      case Constants.SLICING_FILES_FORMATE.OBJ: {
        const exporter = new OBJExporter();
        output = exporter.parse(exportGroup);
        blob = new Blob([output], { type: 'text/plain' });
        break;
      }

      case Constants.SLICING_FILES_FORMATE.STL: {
        const exporter = new STLExporter();
        output = exporter.parse(exportGroup, { binary: true });
        blob = new Blob([output], { type: 'application/octet-stream' });
        break;
      }

      default:
        return;
    }
    return blob;
  };

  /**
   * @description Calculates the bounding box size of all models in the scene combined.
   * @returns {THREE.Vector3} The size of the combined bounding box.
   */
  getModelsGroupSize = () => {
    const exportGroup = this.prepareExportGroup();
    const groupBB = new THREE.Box3().setFromObject(exportGroup);
    return groupBB.getSize(new THREE.Vector3());
  };

  /**
   * @description Removes all models from the slicing scene and resets the selection state.
   */
  clearAllModelsFromSlicingContainer = () => {
    // create a copy of the main array to not lose
    const uploadedModelsClone = [...this.uploadedModels];
    uploadedModelsClone.forEach((model) => this.removeModel(model));
    this.clearAllUploadedModels();
    this.removeTransformTools();
    this.resetSelectedModel();
  };

  /**
   * @description Selects a model in the scene by its unique ID.
   * @param {string} id - The UUID of the model to select.
   */
  setNewSelectedModel = (id: string) => {
    const model = this.uploadedModels.find(
      (model) => model.object?.userData.id === id
    );
    if (model) {
      this.resetSelectedModel();
      this.selectNewModel(model.object, model.helperBox, model.preTransform);
    }
  };

  /** @description Makes the grid helper visible. */
  addGridHelper = () => {
    this.gridHelper.visible = true;
  };

  /** @description Hides the grid helper. */
  removeGridHelper = () => {
    this.gridHelper.visible = false;
  };

  /** @description Makes the view helper (orientation gizmo) visible and enabled. */
  addViewHelper = () => {
    this.viewHelper.visible = true;
    this.viewHelper.enabled = true;
  };

  /**
   * @description Adds a primitive 3D shape to the scene.
   * @param {string} shape - The type of shape to add (e.g., 'Box', 'Sphere').
   */
  addNewMesh = (shape: string) => {
    let mesh = null as THREE.Mesh | null;

    switch (shape) {
      case Constants.SLICING_MESH_SHAPES.BOX:
        {
          const geometry = new THREE.BoxGeometry(10, 10, 10, 10, 10, 10);
          const material = new THREE.MeshStandardMaterial();
          mesh = new THREE.Mesh(geometry, material);
          mesh.name = 'Box';
        }
        break;

      case Constants.SLICING_MESH_SHAPES.CAPSULE: {
        const geometry = new THREE.CapsuleGeometry(10, 10, 40, 80);
        const material = new THREE.MeshStandardMaterial();
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'Capsule';
        break;
      }
      case Constants.SLICING_MESH_SHAPES.CYLINDER: {
        const geometry = new THREE.CylinderGeometry(
          10,
          10,
          10,
          32,
          10,
          false,
          0,
          Math.PI * 2
        );
        const material = new THREE.MeshStandardMaterial();
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'Cylinder';
        break;
      }
      case Constants.SLICING_MESH_SHAPES.DODECAHEDRON: {
        const geometry = new THREE.DodecahedronGeometry(10, 0);
        const material = new THREE.MeshStandardMaterial();
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'Dodecahedron';
        break;
      }
      case Constants.SLICING_MESH_SHAPES.ICOSAHEDRON: {
        const geometry = new THREE.IcosahedronGeometry(10, 0);
        const material = new THREE.MeshStandardMaterial();
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'Icosahedron';
        break;
      }
      case Constants.SLICING_MESH_SHAPES.LATHE: {
        const geometry = new THREE.LatheGeometry([
          new THREE.Vector2(0, -10),
          new THREE.Vector2(10, 0),
          new THREE.Vector2(0, 10),
        ]);
        const material = new THREE.MeshStandardMaterial({
          side: THREE.DoubleSide,
        });
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'Lathe';
        break;
      }
      case Constants.SLICING_MESH_SHAPES.OCTAHEDRON: {
        const geometry = new THREE.OctahedronGeometry(10, 0);
        const material = new THREE.MeshStandardMaterial();
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'Octahedron';
        break;
      }
      case Constants.SLICING_MESH_SHAPES.RING: {
        const geometry = new THREE.TorusGeometry(10, 2, 16, 100);
        const material = new THREE.MeshStandardMaterial();
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'Ring';
        break;
      }
      case Constants.SLICING_MESH_SHAPES.SPHERE: {
        const geometry = new THREE.SphereGeometry(
          10,
          32,
          16,
          0,
          Math.PI * 2,
          0,
          Math.PI
        );
        const material = new THREE.MeshStandardMaterial();
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'Sphere';
        break;
      }
      case Constants.SLICING_MESH_SHAPES.TETRAHEDRON: {
        const geometry = new THREE.TetrahedronGeometry(10, 0);
        const material = new THREE.MeshStandardMaterial();
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'Tetrahedron';
        break;
      }
      case Constants.SLICING_MESH_SHAPES.TORUS: {
        const geometry = new THREE.TorusGeometry(10, 4, 12, 48, Math.PI * 2);
        const material = new THREE.MeshStandardMaterial();
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'Torus';
        break;
      }
      case Constants.SLICING_MESH_SHAPES.TORUS_KNOT: {
        const geometry = new THREE.TorusKnotGeometry(10, 4, 64, 8, 2, 3);
        const material = new THREE.MeshStandardMaterial();
        mesh = new THREE.Mesh(geometry, material);
        mesh.name = 'TorusKnot';
        break;
      }
      default:
        break;
    }

    this.addModelToContainer(mesh);
  };

  /**
   * @description Checks if the bounding box of a model is outside the defined platform boundaries.
   * @param {ModelData | null} model - The model to check.
   */
  checkIfModelOutsidePlatform = (model: ModelData | null) => {
    const object = model?.object;
    if (object) {
      // Sample the 4 bottom corners of the bounding box (XZ plane)
      const box = new THREE.Box3().setFromObject(object);
      const min = box.min;
      const max = box.max;
      this.isModelOutsideOfPlatform = (() => {
        if (Constants.THREE_D_PRINTER_PLATFORM_SHAPE.CIRCLE) {
          const platformRadius =
            Math.max(this.platformWidth, this.platformHeight) / 2;

          const pointsToTest: THREE.Vector3[] = [];

          pointsToTest.push(new THREE.Vector3(min.x, min.y, min.z));
          pointsToTest.push(new THREE.Vector3(min.x, min.y, max.z));
          pointsToTest.push(new THREE.Vector3(max.x, max.y, min.z));
          pointsToTest.push(new THREE.Vector3(max.x, max.y, max.z));
          for (const point of pointsToTest) {
            const distance = new THREE.Vector2(point.x, point.z).length();

            if (distance > platformRadius || point.y > this.platformDepth) {
              return true;
            }
          }

          return false;
        } else {
          // square platform
          return (
            min.x < -this.platformWidth / 2 ||
            max.x > this.platformWidth / 2 ||
            min.y > -this.platformDepth / 2 ||
            max.y > this.platformDepth / 2 ||
            min.z < -this.platformHeight / 2 ||
            max.z > this.platformHeight / 2
          );
        }
      })();
      this.updatePiniaStoreIsModelOutsidePlatform();
    }
  };

  /**
   * @description Checks if a model is positioned below the platform (y < 0) and, if so, places it on top.
   * @param {ModelData | null} model - The model to check.
   */
  checkIfModelBelowPlatform = (model: ModelData | null) => {
    const object = model?.object;
    const helperBox = model?.helperBox;
    if (object && helperBox) {
      // Sample the 4 bottom corners of the bounding box (XZ plane)
      const box = new THREE.Box3().setFromObject(object);
      const min = box.min;
      if (parseFloat(min.y.toFixed(2)) < 0) this.placeModelOnPlatform(model);
    }
  };

  /** @description Hides the view helper. */
  removeViewHelper = () => {
    this.viewHelper.visible = false;
    this.viewHelper.enabled = false;
  };

  /** @description Makes the ambient light visible. */
  addAmbientLightHelper = () => {
    this.ambientLight.visible = true;
  };

  /** @description Hides the ambient light. */
  removeAmbientLightHelper = () => {
    this.ambientLight.visible = false;
  };

  /** @description Makes the directional light visible. */
  addDirectionalLightHelper = () => {
    this.directionalLight.visible = true;
  };

  /** @description Hides the directional light. */
  removeDirectionalLightHelper = () => {
    this.directionalLight.visible = false;
  };

  /** @description Attaches the transform controls gizmo to the selected model. */
  addTransformTools = () => {
    if (this.selectedModel.object) {
      this.transformControls.attach(this.selectedModel.object);
    }
  };

  /** @description Detaches the transform controls gizmo from any model. */
  removeTransformTools = () => {
    this.transformControls.detach();
  };

  /** @description Makes the selected model's bounding box helper visible. */
  addBoxHelper = () => {
    if (this.selectedModel.helperBox) {
      this.selectedModel.helperBox.visible = true;
    }
  };

  /** @description Hides the selected model's bounding box helper. */
  removeBoxHelper = () => {
    if (this.selectedModel.helperBox) {
      this.selectedModel.helperBox.visible = false;
    }
  };

  /**
   * @description Sets whether resizing operations should be uniform across all axes.
   * @param {boolean} isResizeUniformed - True for uniform scaling, false otherwise.
   */
  setUniformedResizing = (isResizeUniformed: boolean) => {
    this.isResizeUniformed = isResizeUniformed;
  };

  /** @description Sets the transform controls mode to 'translate'. */
  applyTranslatingToolsOnSelectedModel = () => {
    this.transformControls.mode = 'translate';
  };

  /** @description Sets the transform controls mode to 'rotate'. */
  applyRotatingToolsOnSelectedModel = () => {
    this.transformControls.mode = 'rotate';
  };

  /** @description Sets the transform controls mode to 'scale'. */
  applyResizingToolsOnSelectedModel = () => {
    this.transformControls.mode = 'scale';
  };

  /**
   * @description Mirrors the selected model on a given axis by inverting its scale on that axis.
   * @param {string} axis - The axis to mirror on ('x', 'y', or 'z').
   */
  applyMirroringToolsOnSelectedModel = (axis: string) => {
    if (this.selectedModel.object && this.selectedModel.helperBox) {
      if (axis === 'x') this.selectedModel.object.scale.x *= -1;
      else if (axis === 'y') this.selectedModel.object.scale.y *= -1;
      else if (axis === 'z') this.selectedModel.object.scale.z *= -1;

      this.updateSelectedModelAfterTransformations();
    }
  };

  /** @description Moves the selected model to the center of the platform (on the X and Z axes). */
  centralizeSelectedModel = () => {
    if (this.selectedModel.object && this.selectedModel.helperBox) {
      this.centralizeModel(this.selectedModel);
      this.updateSelectedModelAfterTransformations();
    }
  };

  /** @description Moves the selected model down to sit on top of the platform (Y=0). */
  dropModelOnPlatform = () => {
    if (this.selectedModel.object && this.selectedModel.helperBox) {
      this.placeModelOnPlatform(this.selectedModel);
      this.updateSelectedModelAfterTransformations();
    }
  };

  /** @description Creates a deep clone of the selected model and adds it to the scene. */
  cloneSelectedModel = () => {
    this.resetModelOriginalColor(this.selectedModel.object);
    this.removeModelHelperBox(this.selectedModel.helperBox);
    const clonedObject = this.deepCloneObject3D(
      this.selectedModel.object
    ) as THREE.Mesh;
    this.addModelToContainer(clonedObject);
  };

  /** @description Deletes the currently selected model from the scene. */
  deleteSelectedModel = () => {
    this.removeModel(this.selectedModel);
    this.resetSelectedModel();
  };

  /**
   * @description Creates and pushes a new transformation command onto the undo stack.
   * This is typically called after a user finishes a transformation.
   */
  addNewTransformCommand = () => {
    if (this.selectedModel) {
      // position before transformation
      const preTransform = this.selectedModel.preTransform;
      // position after transformation
      const postTransform = this.getTransformSnapshot(
        this.selectedModel.object
      );

      if (preTransform && postTransform) {
        const cmd = this.createTransformCommand(
          this.selectedModel,
          preTransform,
          postTransform
        );
        this.undoStack.push(cmd);
        this.redoStack = [];

        // Update stored position for next transformation
        this.selectedModel.preTransform = postTransform;
      }
    }
  };

  /** @description Undoes the last transformation command from the stack. */
  undoTransformCommand = () => {
    const cmd = this.undoStack.pop();
    if (cmd) {
      cmd.undo();
      this.redoStack.push(cmd);
    }
  };

  /** @description Redoes the last undone transformation command from the stack. */
  redoTransformCommand = () => {
    const cmd = this.redoStack.pop();
    if (cmd) {
      cmd.execute();
      this.undoStack.push(cmd);
    }
  };

  /**
   * @description Converts a Blob to a Base64 encoded string.
   * @param {Blob} blob - The blob to convert.
   * @returns {Promise<string>} A promise that resolves with the Base64 string.
   */
  blobToBase64 = (blob: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  /** @description Deselects the current model, removes highlights and helpers, and resets the selection state. */
  resetSelectedModel = () => {
    this.resetModelOriginalColor(this.selectedModel.object);
    this.removeModelHelperBox(this.selectedModel.helperBox);
    this.removeTransformTools();
    this.removeKeyboardEvents();
    this.selectedModel.object = null;
    this.selectedModel.helperBox = null;
    this.selectedModel.preTransform = null;
    this.selectedModel.isTransforming = false;
    this.updatePiniaStoreSelectedModel();
  };

  /** @description Resets the camera controls to their default position and zoom. */
  resetSlicingContainerControls = () => {
    this.controls.reset();
  };

  /**
   * @private
   * @description Loads a 3D model from a file, parsing it based on its extension.
   * @param {File} file - The file to load.
   * @returns {Promise<THREE.Object3D>} A promise that resolves with the loaded 3D object.
   */
  private load3DModel = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        const contents = reader.result;

        let loader;

        switch (extension) {
          case 'stl':
            loader = new STLLoader();
            const stlGeometry = loader.parse(contents as ArrayBuffer);
            stlGeometry.center();
            const stlMesh = new THREE.Mesh(
              stlGeometry,
              new THREE.MeshStandardMaterial()
            );
            stlMesh.name = file.name;
            resolve(stlMesh);
            break;

          case 'obj':
            loader = new OBJLoader();
            const objGroup = loader.parse(contents as string);
            const objMesh = this.flattenToSingleMesh(objGroup);
            objMesh.name = file.name;
            resolve(objMesh);
            break;

          case '3mf':
            loader = new ThreeMFLoader();
            const threeMFGroup = loader.parse(contents as ArrayBuffer);
            const threeMFMesh = this.flattenToSingleMesh(threeMFGroup);
            threeMFMesh.name = file.name;
            resolve(threeMFMesh);
            break;

          case 'amf':
            loader = new AMFLoader();
            loader
              .loadAsync(URL.createObjectURL(file))
              .then((amfGroup) => {
                const amfMesh = this.flattenToSingleMesh(amfGroup);
                amfMesh.name = file.name;
                resolve(amfMesh);
              })
              .catch(reject);
            break;

          default:
            reject(new Error('Unsupported file format'));
        }
      };

      if (file.name.endsWith('.obj')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  /**
   * @private
   * @description The main pipeline for adding a new model to the scene. It handles selection reset,
   * helper creation, positioning, and state updates.
   * @param {THREE.Mesh | null} object - The mesh to add.
   */
  private addModelToContainer = (object: THREE.Mesh | null) => {
    if (object) {
      this.resetSelectedModel();

      const helperBox = new THREE.BoxHelper(object, 0xdfff00);
      const model = {
        object,
        helperBox,
        isTransforming: false,
      } as ModelData;

      this.assignUserDataRecursively(model);
      this.layModelFlat(model);
      this.placeModelOnPlatform(model);
      this.checkIfModelOutsidePlatform(model);
      this.centralizeModel(model);

      this.scene.add(object);
      this.uploadedModels.push(model);
      this.updatePiniaStoreUploadedModelsList();
    }
  };

  /**
   * @private
   * @description Resizes the renderer and updates the camera aspect ratio to fit the container's dimensions.
   * @param {HTMLDivElement} slicingContainer - The container element.
   */
  private resizeThreeJSCanvasToFitPageDimensions = (
    slicingContainer: HTMLDivElement
  ) => {
    const containerWidth = slicingContainer.clientWidth;
    const containerHeight = slicingContainer.clientHeight;
    this.renderer.setSize(containerWidth, containerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.camera.aspect = containerWidth / containerHeight;
    this.camera.updateProjectionMatrix();
  };

  /**
   * @private
   * @description Captures the current position, rotation, and scale of a model.
   * @param {THREE.Mesh | null} object - The object to snapshot.
   * @returns {TransformSnapshot | null} A snapshot of the object's transform state.
   */
  private getTransformSnapshot = (object: THREE.Mesh | null) => {
    if (object) {
      return {
        position: object.position.clone(),
        rotation: object.rotation.clone(),
        scale: object.scale.clone(),
      } as TransformSnapshot;
    }
    return null;
  };

  /**
   * @private
   * @description Applies a transform snapshot to a model.
   * @param {ModelData} model - The model to apply the transform to.
   * @param {TransformSnapshot} snapshot - The transform data to apply.
   */
  private applyTransformSnapshot(
    model: ModelData,
    snapshot: TransformSnapshot
  ) {
    model.object?.position.copy(snapshot.position);
    model.object?.rotation.copy(snapshot.rotation);
    model.object?.scale.copy(snapshot.scale);

    model.helperBox?.position.copy(snapshot.position);
    model.helperBox?.rotation.copy(snapshot.rotation);
    model.helperBox?.scale.copy(snapshot.scale);

    model.preTransform = snapshot;
  }

  /**
   * @private
   * @description Creates a command object for undo/redo functionality.
   * @param {ModelData} model - The model that was transformed.
   * @param {TransformSnapshot} preTransform - The state before transformation.
   * @param {TransformSnapshot} postTransform - The state after transformation.
   * @returns {TransformCommand} An object with `execute` and `undo` methods.
   */
  private createTransformCommand = (
    model: ModelData,
    preTransform: TransformSnapshot,
    postTransform: TransformSnapshot
  ) => {
    return {
      execute: () => {
        if (model.object && model.helperBox) {
          this.applyTransformSnapshot(model, postTransform);
          this.updateSelectedModelAfterTransformations();
        }
      },
      undo: () => {
        if (model.object && model.helperBox) {
          this.applyTransformSnapshot(model, preTransform);
          this.updateSelectedModelAfterTransformations();
        }
      },
    };
  };

  /**
   * @private
   * @description Configures and attaches the view helper to the container.
   * @param {HTMLElement} slicingContainer - The main container element.
   */
  private setupContainerViewHelper = (slicingContainer: HTMLElement) => {
    this.viewHelper.set({
      container: slicingContainer,
      id: 'view-helper',
      size: 120,
      placement: 'bottom-left',
    });
    this.viewHelper.attachControls(this.controls);
    this.viewHelper.update();
  };

  /**
   * @private
   * @description Updates the mouse coordinates on pointer move for raycasting.
   * @param {MouseEvent} event - The mouse event.
   */
  private onPointerMove = (event: MouseEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  /**
   * @private
   * @description Handles pointer down events to select or deselect models in the scene using raycasting.
   * @param {PointerEvent} event - The pointer event.
   */
  private onPointerDown = (event: PointerEvent) => {
    // avoid right clicks
    if (event.button === 2) return;

    // avoid event from view helper
    if (
      event.target &&
      (event.target as HTMLElement).id === 'view-helper' &&
      this.viewHelper.visible
    )
      return;

    // avoid deselection while transforming
    if (this.selectedModel.isTransforming) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const allUploadedModels = this.uploadedModels.map(
      (model) => model.object
    ) as THREE.Mesh[];

    const intersects = this.raycaster.intersectObjects(allUploadedModels, true);

    if (intersects.length > 0) {
      const object = intersects[0].object as THREE.Mesh;
      const helperBox = this.uploadedModels.find(
        (model) => model.object?.userData.id === object?.userData.id
      )?.helperBox as THREE.BoxHelper;
      const preTransform = this.getTransformSnapshot(object);

      if (this.selectedModel.object !== object) {
        this.resetSelectedModel();
        this.selectNewModel(object, helperBox, preTransform);
      }
    } else {
      this.resetSelectedModel();
    }
  };

  /**
   * @private
   * @description Handles keydown events for undo/redo shortcuts.
   * @param {KeyboardEvent} event - The keyboard event.
   */
  private onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (this.selectedModel.object) {
      if (event.ctrlKey && key === 'z' && !event.shiftKey) {
        this.undoTransformCommand();
      } else if (event.ctrlKey && key === 'z' && event.shiftKey) {
        this.redoTransformCommand();
      } else if (event.ctrlKey && key === 'y') {
        this.redoTransformCommand();
      }
    }
  };

  /**
   * @private
   * @description Initializes event listeners for the transform controls gizmo.
   */
  private initTransformerControlsEventListeners = () => {
    const initialScale = new THREE.Vector3();

    this.transformControls.addEventListener('mouseDown', () => {
      if (
        this.transformControls.mode === 'scale' &&
        this.selectedModel.object
      ) {
        // Store the object's initial scale
        initialScale.copy(this.selectedModel.object.scale);
      }
    });

    // prevent interaction when transforming
    this.transformControls.addEventListener('dragging-changed', (event) => {
      if (event.value === this.controls.enabled) {
        const isDragging = event.value as boolean;
        this.controls.enabled = !isDragging;
        this.selectedModel.isTransforming = isDragging;
        if (!isDragging) {
          this.addNewTransformCommand();
        }
      }
    });
    // Event listener for when the selected model is transformed
    this.transformControls.addEventListener('objectChange', () => {
      // uniform scaling or not
      if (this.transformControls.mode === 'scale' && this.isResizeUniformed) {
        this.handleUniformedResizingTransformations(initialScale);
      }

      this.updateSelectedModelAfterTransformations();
    });
  };

  /**
   * @private
   * @description Rotates a model to lay flat on the XZ plane.
   * @param {ModelData} model - The model to rotate.
   */
  private layModelFlat = (model: ModelData) => {
    model.object?.rotation.set(-Math.PI / 2, 0, 0);
  };

  /**
   * @private
   * @description Adjusts a model's Y position to sit on top of the platform.
   * @param {ModelData} model - The model to place.
   */
  private placeModelOnPlatform = (model: ModelData) => {
    const object = model.object;
    if (object) {
      const box = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      box.getSize(size);
      object.position.y -= box.min.y; // shift upward to sit on platform
    }
  };

  /**
   * @private
   * @description Centers a model on the X and Z axes of the platform.
   * @param {ModelData} model - The model to centralize.
   */
  private centralizeModel = (model: ModelData) => {
    const object = model.object;
    if (object) {
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(new THREE.Vector3(center.x, 0, center.z));
    }
  };

  /**
   * @private
   * @description Changes the color of a model to highlight it.
   * @param {THREE.Mesh | null} object - The mesh to highlight.
   */
  private highlightModel = (object: THREE.Mesh | null) => {
    if (object) {
      const objMaterial = object.material as THREE.MeshBasicMaterial;
      objMaterial.color.setHex(0xff9900);
    }
  };

  /**
   * @private
   * @description Reverts a model's color to its original state.
   * @param {THREE.Mesh | null} object - The mesh to reset.
   */
  private resetModelOriginalColor = (object: THREE.Mesh | null) => {
    if (object) {
      const objMaterial = object.material as THREE.MeshBasicMaterial;
      const originalColor = object.userData.originalEmissive;
      objMaterial.color.setHex(originalColor || 0x000000);
    }
  };

  /**
   * @private
   * @description Stores the original color of a model in its `userData`.
   * @param {THREE.Mesh | null} object - The mesh to save the color of.
   */
  private saveModelOriginalColor = (object: THREE.Mesh | null) => {
    if (object) {
      const objMaterial = object.material as THREE.MeshBasicMaterial;
      object.userData.originalEmissive = objMaterial.color.getHex();
    }
  };

  /**
   * @private
   * @description Adds a model's bounding box helper to the scene.
   * @param {THREE.BoxHelper | null} helperBox - The helper to add.
   */
  private addModelHelperBox = (helperBox: THREE.BoxHelper | null) => {
    if (helperBox) {
      this.scene.add(helperBox);
      helperBox.update();
    }
  };

  /**
   * @private
   * @description Attaches the transform controls to a model if they are set to be visible.
   * @param {THREE.Mesh | null} object - The object to attach the controls to.
   */
  private addModelTransformTools = (object: THREE.Mesh | null) => {
    if (object && object.userData.isTransformToolsVisible) {
      this.transformControls.attach(object);
    }
  };

  /**
   * @private
   * @description Completely removes a model and its helpers from the scene and internal arrays.
   * @param {ModelData} model - The model to remove.
   */
  private removeModel = (model: ModelData) => {
    this.removeModelObject(model.object);
    this.removeModelHelperBox(model.helperBox);
    this.removeModelFromUploadedModelsArray(model);
  };

  /**
   * @private
   * @description Removes a model's object from the scene.
   * @param {THREE.Mesh | null} object - The object to remove.
   */
  private removeModelObject = (object: THREE.Mesh | null) => {
    if (object) {
      this.scene.remove(object);
    }
  };

  /**
   * @private
   * @description Removes a model's helper box from the scene.
   * @param {THREE.BoxHelper | null} helperBox - The helper to remove.
   */
  private removeModelHelperBox = (helperBox: THREE.BoxHelper | null) => {
    if (helperBox) {
      this.scene.remove(helperBox);
    }
  };

  /**
   * @private
   * @description Removes a model from the internal `uploadedModels` array.
   * @param {ModelData} model - The model to remove from the array.
   */
  private removeModelFromUploadedModelsArray = (model: ModelData) => {
    this.uploadedModels.splice(
      this.uploadedModels.findIndex(
        (m) => m.object?.userData.id === model.object?.userData.id
      ),
      1
    );
    this.updatePiniaStoreUploadedModelsList();
  };

  /**
   * @private
   * @description Enforces uniform scaling when the user is resizing a model.
   * @param {THREE.Vector3} initialScale - The scale of the object when the transformation started.
   */
  private handleUniformedResizingTransformations = (
    initialScale: THREE.Vector3
  ) => {
    const obj = this.selectedModel.object;
    const axis = this.transformControls.axis;
    if (obj) {
      if (axis && axis !== 'XYZ') {
        // Determine which axis changed
        let scaleFactor = 1;

        if (axis === 'X') {
          scaleFactor = obj.scale.x / initialScale.x;
        } else if (axis === 'Y') {
          scaleFactor = obj.scale.y / initialScale.y;
        } else if (axis === 'Z') {
          scaleFactor = obj.scale.z / initialScale.z;
        }

        // Apply the same factor to all axes
        obj.scale.set(
          initialScale.x * scaleFactor,
          initialScale.y * scaleFactor,
          initialScale.z * scaleFactor
        );
      }
    }
  };

  /**
   * @private
   * @description Flattens a `THREE.Group` containing multiple meshes into a single `THREE.Mesh`
   * by merging their geometries.
   * @param {THREE.Group} group - The group to flatten.
   * @returns {THREE.Mesh} The resulting single mesh.
   */
  private flattenToSingleMesh = (group: THREE.Group) => {
    const geometries: THREE.BufferGeometry[] = [];
    let inheritedMaterial: THREE.Material | THREE.Material[] | undefined;

    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        // Save the first encountered material
        if (!inheritedMaterial) {
          inheritedMaterial = mesh.material;
        }

        // Clone geometry and apply world transform
        const geometry = mesh.geometry.clone();
        geometry.applyMatrix4(mesh.matrixWorld);

        geometries.push(geometry);
      }
    });

    const mergedGeometry = mergeGeometries(geometries, false);

    return new THREE.Mesh(
      mergedGeometry,
      inheritedMaterial ?? new THREE.MeshStandardMaterial()
    );
  };

  /**
   * @private
   * @description Recursively assigns a unique ID and other metadata to a model and all its children.
   * @param {ModelData} model - The model to assign user data to.
   */
  private assignUserDataRecursively = (model: ModelData) => {
    const object = model.object;
    if (object) {
      const id = uuidv4();
      const isTransformToolsVisible = true;
      const isBoxHelperVisible = true;

      object.userData.id = id;
      object.userData.isTransformToolsVisible = isTransformToolsVisible;
      object.userData.isBoxHelperVisible = isBoxHelperVisible;

      if (!object.geometry.boundingBox) {
        object.geometry.computeBoundingBox();
      }
      const originalSize = new THREE.Vector3();
      object.geometry.boundingBox?.getSize(originalSize);
      object.userData.originalSize = originalSize.clone();

      object.traverse((child) => {
        if (child instanceof THREE.Object3D) {
          child.userData.id = id;
          child.userData.isTransformToolsVisible = isTransformToolsVisible;
          child.userData.isBoxHelperVisible = isBoxHelperVisible;
          child.userData.originalSize = originalSize;
        }
      });
    }
  };

  /**
   * @private
   * @description Creates a new group containing clones of all uploaded models, ready for export.
   * @returns {THREE.Group} The group prepared for export.
   */
  private prepareExportGroup = () => {
    const exportGroup = new THREE.Group();
    for (const model of this.uploadedModels) {
      if (model.object) {
        const cloned = model.object.clone();
        this.bakeWorldTransforms(cloned);
        exportGroup.add(cloned);
      }
    }

    //reset the original rotation for the model
    exportGroup.rotation.set(Math.PI / 2, 0, 0);
    exportGroup.updateMatrixWorld(true);
    return exportGroup;
  };

  /**
   * @private
   * @description Bakes the world transformations into the geometry of an object's children.
   * @param {THREE.Object3D} object - The parent object.
   */
  private bakeWorldTransforms = (object: THREE.Object3D) => {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Apply world transform to geometry
        child.geometry = child.geometry.clone();
      }
    });
  };

  /**
   * @private
   * @description Sets a new model as the selected model and applies necessary highlights and helpers.
   * @param {THREE.Mesh | null} object - The object to select.
   * @param {THREE.BoxHelper | null} helperBox - The associated helper box.
   * @param {TransformSnapshot | null} preTransform - The initial transform state.
   */
  private selectNewModel = (
    object: THREE.Mesh | null,
    helperBox: THREE.BoxHelper | null,
    preTransform: TransformSnapshot | null
  ) => {
    this.selectedModel.object = object;
    this.selectedModel.helperBox = helperBox;
    this.selectedModel.preTransform = preTransform;
    this.addKeyboardEvents();
    this.saveModelOriginalColor(this.selectedModel.object);
    this.addModelHelperBox(this.selectedModel.helperBox);
    this.addModelTransformTools(this.selectedModel.object);
    this.highlightModel(this.selectedModel.object);
    this.updatePiniaStoreSelectedModel();
  };

  /**
   * @private
   * @description Adds global keydown event listeners.
   */
  private addKeyboardEvents = () => {
    document.addEventListener('keydown', this.onKeyDown);
  };

  /**
   * @private
   * @description Removes global keydown event listeners.
   */
  private removeKeyboardEvents = () => {
    document.removeEventListener('keydown', this.onKeyDown);
  };

  /**
   * @private
   * @description Clears the internal array of uploaded models.
   */
  private clearAllUploadedModels = () => {
    this.uploadedModels = [];
  };

  /**
   * @private
   * @description Creates a deep clone of a 3D object, including its geometry, materials, and user data.
   * @param {THREE.Mesh | null} object - The object to clone.
   * @returns {THREE.Mesh | undefined} The cloned mesh.
   */
  private deepCloneObject3D = (object: THREE.Mesh | null) => {
    if (object) {
      const clone = object.clone();

      clone.traverse((node) => {
        const sourceNode = object.getObjectById(node.id);

        if (node instanceof THREE.Mesh) {
          node.geometry = node.geometry.clone();
          if (Array.isArray(node.material)) {
            node.material = node.material.map((mat) => mat.clone());
          } else {
            node.material = node.material.clone();
          }
        }

        // Clone userData deeply
        node.userData = JSON.parse(JSON.stringify(sourceNode?.userData ?? {}));
      });
      return clone;
    }
  };

  /**
   * @private
   * @description Updates helpers and Pinia store state after a model has been transformed.
   */
  private updateSelectedModelAfterTransformations() {
    const model = this.selectedModel;
    if (!model) return;

    // Update the BoxHelper to reflect new transform
    model.helperBox?.update();

    // Update UI/store representation
    this.updatePiniaStoreSelectedModel();
    this.checkIfModelOutsidePlatform(model);
    this.checkIfModelBelowPlatform(model);
  }

  /**
   * @private
   * @description Updates the `selectedModel` state in the Pinia store.
   */
  private updatePiniaStoreSelectedModel = () => {
    this.slicingStore.setSelectedModel(this.selectedModel);
  };

  /**
   * @private
   * @description Updates the list of uploaded models in the Pinia store.
   */
  private updatePiniaStoreUploadedModelsList = () => {
    this.slicingStore.setUploadedModelsList(this.uploadedModels);
  };

  /**
   * @private
   * @description Updates the `isModelOutsidePlatform` flag in the Pinia store.
   */
  private updatePiniaStoreIsModelOutsidePlatform = () => {
    this.slicingStore.setIsModelOutsidePlatformFlag(
      this.isModelOutsideOfPlatform
    );
  };
}
