import Konva from 'konva';
import { defineStore } from 'pinia';
import { Dialog, QTableProps } from 'quasar';
import { Constants } from 'src/constants';
import {
  DrawElement,
  GcodeFileSettings,
  SelectedElementType,
  MainSettings,
  ThicknessOperation,
  EngravingSettings,
  GcodeGeneratorImageData,
  ImageMetrics,
  IShapeElement,
  IColorElement,
} from 'src/interfaces/imageToGcode.interface';
import {
  createImageFromImageData,
  drawImageOnOffscreenCanvas,
  getImageDataFromOffscreenCanvas,
} from 'src/services/image.editor.service';
import { getImageContentFromFile } from 'src/services/imageToGcode.helper.service';
import { KonvaHelper } from 'src/services/konva.helper.service';
import {
  createSVGFromSVGContent,
  getSvgStringFromDataUri,
  prepareSVGElementsForEngraving,
} from 'src/services/svg.editor.service';
import { SVGParser } from 'src/services/svg.parse.service';
import { getImageWorker, getSVGWorker } from 'src/workers';
import { INode, parse } from 'svgson';
import { reactive, shallowRef } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

/**
 * Pinia store for managing the state and actions of the image to G-code conversion process.
 */
export const useImageToGcodeConvertor = defineStore('imageToGcodeConvertor', {
  state: () => ({
    /** An instance of the KonvaHelper service to manage canvas operations. */
    konvaHelper: new KonvaHelper(),

    /** The currently selected image data object being edited. */
    activeImage: null as ReturnType<
      typeof shallowRef<GcodeGeneratorImageData>
    > | null,

    /** A list of all loaded image data objects. */
    generatorImagesDataList: [] as Array<GcodeGeneratorImageData>,

    /** A flag to indicate when an image processing task is running. */
    isImageLoading: false as boolean,
  }),
  actions: {
    /**
     * Processes a new image or SVG file, creates a data object, adds it to the list,
     * and sets it as the active image for editing.
     * @param {File} file - The image or SVG file uploaded by the user.
     * @returns {Promise<void>} A promise that resolves when the image is loaded and set up.
     */
    async addNewImageData(file: File) {
      this.isImageLoading = true;

      // initial image data
      const imageId = uuidv4() as string;
      const imageName = file.name as string;
      const imageFile = file as File;
      const imageConfig = reactive(
        structuredClone(
          Constants.DEFAULT_GCODE_GENERATOR_SETTINGS.IMAGE_CONFIGURATION
        )
      ) as Konva.ImageConfig;

      const imageContent = (await getImageContentFromFile(
        imageFile,
        imageConfig
      )) as string;
      const imageNode = null as Konva.Image | null;

      const imageKonvaTransformerGroup =
        this.konvaHelper.createImageKonvaTransformerGroup(imageId);

      // event handler for active image
      imageKonvaTransformerGroup?.on('pointerdown', (event) => {
        const targetImage = this.generatorImagesDataList.find((imageData) => {
          if (imageData) {
            return imageData.imageId === event.target.parent?.id();
          }
        }) as GcodeGeneratorImageData;
        if (targetImage) {
          this.setActiveImage(targetImage);
        }
      });
      const imageMetrics = reactive(
        structuredClone(
          Constants.DEFAULT_GCODE_GENERATOR_SETTINGS.IMAGE_CONFIGURATION
        ) as ImageMetrics
      );
      const originalImageConfig = null as ImageMetrics | null;

      const activeTab = 'mapping' as string;
      const svgElementsToModify = [] as Array<DrawElement>;
      const gcodeSettings = reactive({
        mainSettings: structuredClone(
          Constants.DEFAULT_GCODE_GENERATOR_SETTINGS.MAIN_SETTINGS
        ) as MainSettings,
        cuttingSettings: structuredClone(
          Constants.DEFAULT_GCODE_GENERATOR_SETTINGS.CUTTING_SETTINGS
        ) as ThicknessOperation,
        markingSettings: structuredClone(
          Constants.DEFAULT_GCODE_GENERATOR_SETTINGS.MARKING_SETTINGS
        ) as ThicknessOperation,
        engravingSettings: structuredClone(
          Constants.DEFAULT_GCODE_GENERATOR_SETTINGS.ENGRAVING_SETTINGS
        ) as EngravingSettings,
      }) as GcodeFileSettings;
      const modifiedSVGCutting = null as SVGGraphicsElement | null;
      const modifiedSVGMarking = null as SVGGraphicsElement | null;
      const modifiedEngravingImage = null as HTMLImageElement | null;

      // parse dxf and svg images
      let filteredElementsByShape = [] as Array<IShapeElement>;
      let filteredElementsByColor = [] as Array<IColorElement>;
      let svgElementAttributes = {} as Record<string, string>;
      if (imageContent.startsWith('data:image/svg+xml;base64')) {
        const svgString = getSvgStringFromDataUri(imageContent);
        if (svgString) {
          const svgParser = new SVGParser();
          const json = await parse(svgString);
          svgParser.filterSvgElements(json);
          svgElementAttributes = svgParser.svgElementAttributes;
          filteredElementsByShape = svgParser.shapeElements;
          filteredElementsByColor = svgParser.colorElements;
        }
      }

      // table reactive states
      const tableFilterType = 'shape' as string;
      const tableSelectedElements = [] as QTableProps['selected'];
      const tableProfileModels = {} as Record<string, string>;
      const tableProfileAllModels = Constants.PROFILE_ALL_OPTIONS
        .CUSTOM as string;
      const singleProfileOptions = Object.values(
        Constants.PROFILE_OPTIONS
      ) as Array<string>;
      const allProfileOptions = Object.values(
        Constants.PROFILE_ALL_OPTIONS
      ) as Array<string>;

      const newImageData = {
        imageId,
        imageName,
        imageFile,
        imageContent,
        imageConfig,
        imageNode,
        imageKonvaTransformerGroup,
        imageMetrics,
        originalImageConfig,
        activeTab,
        svgElementsToModify,
        gcodeSettings,
        modifiedSVGCutting,
        modifiedSVGMarking,
        modifiedEngravingImage,
        tableFilterType,
        tableSelectedElements,
        tableProfileModels,
        tableProfileAllModels,
        singleProfileOptions,
        allProfileOptions,
        filteredElementsByShape,
        filteredElementsByColor,
        svgElementAttributes,
      };

      // add to the list of generator images
      this.generatorImagesDataList.push(newImageData);

      // add image to konva canvas
      await this.konvaHelper.addSourceImageToKonvaCanvas(newImageData);

      // set the added image as active image
      this.setActiveImage(newImageData);

      // set the initial table profiles data
      this.setInitialTableProfileModelsData();

      this.isImageLoading = false;
    },

    /**
     * Removes the currently active image from the list and the Konva canvas.
     * If other images remain, it sets the last one in the list as the new active image.
     * @returns {void}
     */
    removeActiveImage() {
      // remove active image from generator images list
      if (this.activeImage) {
        this.generatorImagesDataList = this.generatorImagesDataList.filter(
          (imageData) => imageData.imageId !== this.activeImage?.imageId
        );

        const isGeneratorImagesListEmpty = this.generatorImagesDataList.length
          ? false
          : true;

        // remove image group from the stage of konva canvas
        this.konvaHelper.removeImageFromStage(
          this.activeImage,
          isGeneratorImagesListEmpty
        );

        if (!isGeneratorImagesListEmpty) {
          // get last image in the generator list and set it as active image
          const newActiveImage = this.generatorImagesDataList.slice(
            -1
          )[0] as GcodeGeneratorImageData;
          if (newActiveImage) {
            this.setActiveImage(newActiveImage);
          }
        } else {
          // there is no more images
          this.resetActiveImage();
        }
      }
    },

    /**
     * Creates a deep clone of the active image, gives it a new unique ID,
     * adds it to the list and canvas, and sets the clone as the new active image.
     * @returns {Promise<void>} A promise that resolves when the duplication process is complete.
     */
    async duplicateActiveImage() {
      if (this.activeImage) {
        this.isImageLoading = true;

        const copyActiveImage = _.cloneDeep({ ...this.activeImage });

        // give the copy image a new id
        copyActiveImage.imageId = uuidv4() as string;

        // add to the list of generator images
        this.generatorImagesDataList.push(copyActiveImage);

        // add image to konva canvas
        await this.konvaHelper.addClonedImageToKonvaCanvas(copyActiveImage);

        // set the copied image as active image
        this.setActiveImage(copyActiveImage);

        this.isImageLoading = false;
      }
    },

    /**
     * Sets the provided image data object as the `activeImage` in the store and
     * updates the Konva transformer to target this image's group.
     * @param {GcodeGeneratorImageData} imageData - The image data object to be set as active.
     * @returns {void}
     */
    setActiveImage(imageData: GcodeGeneratorImageData) {
      this.activeImage = imageData;

      // add group to transformer
      this.konvaHelper.setKonvaTransformerNodes(
        this.activeImage.imageKonvaTransformerGroup
      );
    },

    /**
     * Clears the `activeImage` state, setting it to `null`.
     * @returns {void}
     */
    resetActiveImage() {
      this.activeImage = null;
    },

    /**
     * Makes the original source image node visible on the Konva canvas for the active image.
     * @returns {void}
     */
    showSourceImageNode() {
      if (this.activeImage) {
        this.konvaHelper.addSourceImageNode(this.activeImage);
      }
    },

    /**
     * Hides or removes the original source image node from the Konva canvas for the active image.
     * @returns {void}
     */
    removeSourceImageNode() {
      if (this.activeImage) {
        this.konvaHelper.removeSourceImageNode(this.activeImage.imageNode);
      }
    },

    /**
     * Adds a modified image preview (e.g., for cutting, marking, engraving)
     * to the Konva canvas for the active image.
     * @param {HTMLCanvasElement} canvas - The canvas element containing the modified image data.
     * @param {string} imageType - A string identifier for the type of modification (e.g., 'cutting', 'marking').
     * @returns {Promise<void>}
     */
    async addModifiedImage(canvas: HTMLCanvasElement, imageType: string) {
      if (this.activeImage) {
        // if the source image is presented hide it
        this.removeSourceImageNode();

        await this.konvaHelper.addModifiedImageNodeToTransformerGroup(
          this.activeImage,
          canvas,
          imageType
        );
      }
    },

    /**
     * Removes a specific modified image node (preview) from the Konva canvas.
     * @param {string} imageType - The identifier of the modified image to remove.
     * @returns {Promise<void>}
     */
    async removeModifiedImage(imageType: string) {
      if (this.activeImage) {
        this.konvaHelper.removeModifiedImageNodeFromTransformerGroup(
          this.activeImage,
          imageType
        );
      }
    },

    /**
     * Prepares SVG data based on user selections (cut, mark, engrave) and sends it
     * to a web worker for processing to avoid blocking the main UI thread.
     * @returns {Promise<void>}
     */
    async applySVGChanges() {
      if (this.activeImage) {
        this.isImageLoading = true;
        // rest the image and svg elements because of one should be profiled
        this.resetAllImageModifications();
        if (this.activeImage.svgElementsToModify.length) {
          // use Worker to prevent blocking the main thread
          const worker = getSVGWorker();
          const data = await this.prepareSVGWorkerData();
          worker.postMessage(data);
          this.listenToWorkerResponse(worker);
        } else {
          this.isImageLoading = false;
        }
      }
    },

    /**
     * Prepares raster image data for processing (e.g., "cut everything", "engrave everything")
     * and sends it to a web worker.
     * @returns {Promise<void>}
     */
    async applyImageChanges() {
      if (this.activeImage) {
        this.isImageLoading = true;
        // rest the image and svg elements because of one should be profiled
        this.resetAllImageModifications();
        // use Worker to prevent blocking the main thread
        const worker = getImageWorker();
        if (
          this.activeImage.tableProfileAllModels ===
            Constants.PROFILE_ALL_OPTIONS.CUT_EVERYTHING ||
          this.activeImage.tableProfileAllModels ===
            Constants.PROFILE_ALL_OPTIONS.MARK_EVERYTHING
        ) {
          const data = await this.prepareImageWorkerData(
            Constants.IMAGE_DRAW_TYPE.CUT_MARK
          );
          // send data to worker
          worker.postMessage(data);
          // listen to worker response data
          this.listenToWorkerResponse(worker);
        } else if (
          this.activeImage.tableProfileAllModels ===
          Constants.PROFILE_ALL_OPTIONS.ENGRAVE_EVERYTHING
        ) {
          const data = await this.prepareImageWorkerData(
            Constants.IMAGE_DRAW_TYPE.ENGRAVE
          );

          // send data to worker
          worker.postMessage(data);
          // listen to worker response data
          this.listenToWorkerResponse(worker);
        } else {
          this.isImageLoading = false;
        }
      }
    },

    /**
     * Updates the list of SVG elements to be modified based on user selections in the mapping table.
     * @param {SelectedElementType[]} selectedElements - An array of objects describing the selected elements
     * and their desired profile type (Cut, Mark, Engrave).
     * @returns {void}
     */
    setSvgElementsToModify(selectedElements: SelectedElementType[]) {
      // Iterate through the selected elements
      selectedElements.forEach((element) => {
        // Check if the element is being added or removed
        if (element.added) {
          if (
            element.profileType === Constants.PROFILE_OPTIONS.CUT ||
            element.profileType === Constants.PROFILE_OPTIONS.MARK
          ) {
            if (this.activeImage) {
              // incase of redrawing same element with different profile type
              this.activeImage.svgElementsToModify =
                this.activeImage.svgElementsToModify.filter((ele) => {
                  return ele.identifier !== element.identifier;
                });

              // Add elements that need to be modified with an identifier to be able help remove it later
              this.activeImage.svgElementsToModify.push({
                identifier: element.identifier,
                elements: element.elements,
                type: element.profileType,
              });
            }
          } else if (
            element.profileType === Constants.PROFILE_OPTIONS.ENGRAVE
          ) {
            if (this.activeImage) {
              // incase of redrawing same element with different profile type
              this.activeImage.svgElementsToModify =
                this.activeImage.svgElementsToModify.filter(
                  (ele) => ele.identifier !== element.identifier
                );

              // Add elements that need to be modified with an identifier to be able help remove it later
              this.activeImage.svgElementsToModify.push({
                identifier: element.identifier,
                elements: element.elements,
                type: element.profileType,
              });
            }
          }
        } else {
          if (this.activeImage) {
            // Find and remove the corresponding canvas element from the array
            this.activeImage.svgElementsToModify =
              this.activeImage.svgElementsToModify.filter(
                (ele) => ele.identifier !== element.identifier
              );
          }
        }
      });
    },

    /**
     * Creates the data payload for the image processing web worker.
     * @param {string} drawType - The type of drawing operation to perform (e.g., 'Cut/Mark', 'Engrave').
     * @returns {Promise<object>} A promise that resolves to the data object for the worker.
     */
    async prepareImageWorkerData(drawType: string) {
      if (this.activeImage) {
        // draw image on offscreen canvas
        const canvasElement = await drawImageOnOffscreenCanvas(
          this.activeImage.imageContent,
          this.activeImage.gcodeSettings.engravingSettings.dithering.resolution
        );
        const imageData = getImageDataFromOffscreenCanvas(canvasElement);

        const imageWorkerData = {
          imageData,
          drawType,
          dithering: JSON.stringify(
            this.activeImage.gcodeSettings.engravingSettings.dithering
          ),
        };
        return imageWorkerData;
      }
      return {};
    },

    /**
     * Gathers, sorts, and formats selected SVG elements into a data payload for the SVG processing web worker.
     * @returns {Promise<object>} A promise that resolves to the data object for the worker.
     */
    async prepareSVGWorkerData() {
      if (this.activeImage) {
        // catagories the elements based on the profiling type
        const cuttingElements: INode[] = [];
        const markingElements: INode[] = [];
        const engravingElements: INode[] = [];
        this.activeImage.svgElementsToModify.forEach((element: DrawElement) => {
          if (element.type === 'Engrave')
            engravingElements.push(...element.elements);
          else if (element.type === 'Cut')
            cuttingElements.push(...element.elements);
          else markingElements.push(...element.elements);
        });

        // sort the elements first based on their id
        cuttingElements.sort(
          (a, b) => parseFloat(a.attributes.id) - parseFloat(b.attributes.id)
        );
        markingElements.sort(
          (a, b) => parseFloat(a.attributes.id) - parseFloat(b.attributes.id)
        );
        engravingElements.sort(
          (a, b) => parseFloat(a.attributes.id) - parseFloat(b.attributes.id)
        );

        const imageData = await prepareSVGElementsForEngraving(
          engravingElements,
          this.activeImage.svgElementAttributes,
          this.activeImage.gcodeSettings.engravingSettings.dithering.resolution
        );
        const svgWorkerData = {
          imageData,
          svgElementAttributes: JSON.stringify(
            this.activeImage.svgElementAttributes
          ),
          elementsToCut: JSON.stringify(cuttingElements),
          elementsToMark: JSON.stringify(markingElements),
          dithering: JSON.stringify(
            this.activeImage.gcodeSettings.engravingSettings.dithering
          ),
        };
        return svgWorkerData;
      }
      return {};
    },

    /**
     * Sets up an event listener for a web worker. When the worker posts a message back,
     * this function processes the data (e.g., creating SVG or image elements from the worker's output).
     * @param {Worker} worker - The web worker instance to listen to.
     * @returns {void}
     */
    listenToWorkerResponse(worker: Worker) {
      // listen to the worker data
      worker.addEventListener('message', (e) => {
        if (this.activeImage) {
          const { cutSVGContent, markSVGContent, engravedImageData } = e.data;

          if (cutSVGContent) {
            // generate the cut svg element
            this.activeImage.modifiedSVGCutting =
              createSVGFromSVGContent(cutSVGContent);
          }
          if (markSVGContent) {
            // generate the mark svg element
            this.activeImage.modifiedSVGMarking =
              createSVGFromSVGContent(markSVGContent);
          }
          if (engravedImageData) {
            // generate the engraved image element
            this.activeImage.modifiedEngravingImage =
              createImageFromImageData(engravedImageData);
          }
          this.isImageLoading = false;
        }
      });
    },

    /**
     * Initializes the profile models for the SVG mapping table, setting the default
     * profile to 'Nothing' for each shape and color group.
     * @returns {void}
     */
    setInitialTableProfileModelsData() {
      // fill it with cut values for all the shapes
      this.activeImage?.filteredElementsByShape.forEach((element) => {
        if (this.activeImage)
          this.activeImage.tableProfileModels[element.shape] =
            Constants.PROFILE_OPTIONS.NOTHING;
      });
      // fill it with cut values for all the shapes
      this.activeImage?.filteredElementsByColor.forEach((element) => {
        if (this.activeImage)
          this.activeImage.tableProfileModels[element.color] =
            Constants.PROFILE_OPTIONS.NOTHING;
      });
    },

    /**
     *  Clears any generated previews for cutting, marking, or engraving for the active image,
     * resetting their state to `null`.
     * @returns {void}
     */
    resetAllImageModifications() {
      if (this.activeImage) {
        this.activeImage.modifiedEngravingImage = null;
        this.activeImage.modifiedSVGCutting = null;
        this.activeImage.modifiedSVGMarking = null;
      }
    },

    /**
     *  Resets the SVG element mapping table to its default state, clearing selected profiles and elements.
     * @returns {void}
     */
    resetMappingTable() {
      if (this.activeImage) {
        // clear the profile models and selected elements
        this.activeImage.tableProfileModels = {};
        this.activeImage.tableSelectedElements = [];
        this.activeImage.tableProfileAllModels =
          Constants.PROFILE_ALL_OPTIONS.CUSTOM;
        if (
          this.activeImage.tableFilterType ===
          Constants.SVG_ELEMENTS_FILTER.SHAPE
        ) {
          // fill it with cut values for all the shapes
          this.activeImage.filteredElementsByShape.forEach((element) => {
            if (this.activeImage)
              this.activeImage.tableProfileModels[element.shape] =
                Constants.PROFILE_OPTIONS.NOTHING;
          });
        } else if (
          this.activeImage.tableFilterType ===
          Constants.SVG_ELEMENTS_FILTER.COLOR
        ) {
          // fill it with cut values for all the shapes
          this.activeImage.filteredElementsByColor.forEach((element) => {
            if (this.activeImage)
              this.activeImage.tableProfileModels[element.color] =
                Constants.PROFILE_OPTIONS.NOTHING;
          });
        }
      }
    },
    /**
     *  Resets the Konva image configuration (e.g., position, scale, rotation)
     * for the active image back to its default values.
     * @returns {void}
     */
    resetImageConfiguration() {
      if (this.activeImage) {
        this.activeImage.imageConfig = structuredClone(
          Constants.DEFAULT_GCODE_GENERATOR_SETTINGS.IMAGE_CONFIGURATION
        );
      }
    },
  },
});
