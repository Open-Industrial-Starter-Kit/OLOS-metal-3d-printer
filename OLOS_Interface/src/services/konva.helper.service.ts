import Konva from 'konva';
import { Box } from 'konva/lib/shapes/Transformer';
import { Constants } from 'src/constants';
import { Config } from 'src/interfaces/configSettings.interface';
import {
  GcodeGeneratorImageData,
  ImageMetrics,
} from 'src/interfaces/imageToGcode.interface';
import { configurationSettings } from './configuration.loader.service';
import { getPlatformDimensions } from './gcode.previewer.service/gcode.previewer.helper.service';

/**
 * @class KonvaHelper
 * @description Utility class for managing Konva canvas operations, image placement, transformations,
 * and stage interactions for G-code image generation and preview.
 */
export class KonvaHelper {
  /** @property {Konva.Stage | null} stage - The Konva Stage instance representing the canvas root container. */
  stage: Konva.Stage | null;

  /** @property {Konva.Layer | null} layer - The Konva Layer instance for holding image and shape elements. */
  layer: Konva.Layer | null;

  /** @property {Konva.Transformer | null} transformer - The Konva Transformer instance for resizing, rotating, and scaling nodes. */
  transformer: Konva.Transformer | null;

  /** @property {HTMLElement | null} imageViewerArea - The HTML container where the Konva Stage will be rendered. */
  imageViewerArea: HTMLElement | null;

  /**
   * @constructor
   * @description Initializes the KonvaHelper with null references for stage, layer, transformer, and image viewer area.
   */
  constructor() {
    this.stage = null;
    this.layer = null;
    this.transformer = null;
    this.imageViewerArea = null;
  }

  /**
   * @description Creates a Konva canvas (stage and layer) and attaches a transformer with bounded resizing logic.
   * @returns {void}
   */
  createKonvaCanvas = () => {
    if (this.imageViewerArea) {
      const dropAreaStyle = window.getComputedStyle(this.imageViewerArea);
      const dropAreaWidth = parseInt(dropAreaStyle.width);

      // build konva canvas
      this.stage = new Konva.Stage({
        container: 'stage',
        width: dropAreaWidth,
        height: Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.height,
      });
      this.layer = new Konva.Layer();
      this.stage.add(this.layer);

      // define several math function
      const getCorner = (
        pivotX: number,
        pivotY: number,
        diffX: number,
        diffY: number,
        angle: number
      ) => {
        const distance = Math.sqrt(diffX * diffX + diffY * diffY);

        /// find angle from pivot to corner
        angle += Math.atan2(diffY, diffX);

        /// get new x and y and round it off to integer
        const x = pivotX + distance * Math.cos(angle);
        const y = pivotY + distance * Math.sin(angle);

        return { x: x, y: y };
      };

      const getClientRect = (rotatedBox: Box) => {
        const { x, y, width, height } = rotatedBox;
        const rad = rotatedBox.rotation;

        const p1 = getCorner(x, y, 0, 0, rad);
        const p2 = getCorner(x, y, width, 0, rad);
        const p3 = getCorner(x, y, width, height, rad);
        const p4 = getCorner(x, y, 0, height, rad);

        const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
        const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
        const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
        const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        };
      };

      // create new transformer
      this.transformer = new Konva.Transformer({
        anchorSize: 30,
        boundBoxFunc: (oldBox, newBox) => {
          const box = getClientRect(newBox);
          if (this.stage) {
            const isOut =
              box.x < 0 ||
              box.y < 0 ||
              box.x + box.width > this.stage.width() ||
              box.y + box.height > this.stage.height();

            // if new bounding box is out of visible viewport, let's just skip transforming
            // this logic can be improved by still allow some transforming if we have small available space
            if (isOut) {
              return oldBox;
            }
          }
          return newBox;
        },
        anchorStyleFunc: (anchor) => {
          anchor.cornerRadius(20);
          if (anchor.hasName('top-center') || anchor.hasName('bottom-center')) {
            anchor.height(20);
            anchor.offsetY(10);
            anchor.width(100);
            anchor.offsetX(50);
          }
          if (anchor.hasName('middle-left') || anchor.hasName('middle-right')) {
            anchor.height(100);
            anchor.offsetY(50);
            anchor.width(20);
            anchor.offsetX(10);
          }
        },
        centeredScaling: true,
      });

      this.layer.add(this.transformer);
    }
  };

  /**
   * @description Renders the stage in the provided container if it exists.
   * @param {HTMLDivElement} stageContainer - The container to render the stage into.
   * @returns {void}
   */
  showStageIfExist(stageContainer: HTMLDivElement) {
    if (this.stage) {
      this.stage.container(stageContainer);
      this.stage.draw();
    }
  }

  /**
   * @description Removes an image from the stage and clears the canvas if no images remain.
   * @param {GcodeGeneratorImageData} imageData - The image data object.
   * @param {boolean} isGeneratorImagesListEmpty - Whether there are no more images left.
   * @returns {void}
   */
  removeImageFromStage(
    imageData: GcodeGeneratorImageData,
    isGeneratorImagesListEmpty: boolean
  ) {
    imageData.imageKonvaTransformerGroup?.destroy();
    // if there is no more images in the image Viewer clear konva canvas
    if (isGeneratorImagesListEmpty) {
      this.clearKonvaCanvas();
    }
  }

  /**
   * @private
   * @description Clears the Konva canvas and resets stage, layer, and transformer to null.
   * @returns {void}
   */
  private clearKonvaCanvas = () => {
    if (this.stage && this.layer && this.transformer) {
      this.transformer.destroy();
      this.layer.destroy();
      this.stage.destroy();

      this.stage = null;
      this.layer = null;
      this.transformer = null;
    }
  };

  /**
   * @private
   * @description Creates a Konva.Image node from a base64 image string.
   * @param {string} imageContent - The base64 or URL of the image.
   * @param {string} imageId - The ID to assign to the image node.
   * @param {string} imageType - The type/name to assign to the image node.
   * @returns {Promise<Konva.Image>} A promise that resolves to the created Konva.Image node.
   */
  private createKonvaImageNode = (
    imageContent: string,
    imageId: string,
    imageType: string
  ): Promise<Konva.Image> => {
    return new Promise((resolve) => {
      const image = new Image();

      image.onload = () => {
        // Create the Konva.Image node
        const imageNode = new Konva.Image({
          name: imageType,
          id: imageId,
          image,
        });
        resolve(imageNode);
      };

      // Set the image source to start loading
      image.src = imageContent;
    });
  };

  /**
   * @description Adds a source image to the Konva canvas, creating the stage if needed.
   * @param {GcodeGeneratorImageData} imageData - The image data object.
   * @returns {Promise<void>}
   */
  addSourceImageToKonvaCanvas = async (imageData: GcodeGeneratorImageData) => {
    const systemConfig = await configurationSettings();

    // create konva canvas if it is not already created
    if (!this.stage && !this.layer && !this.transformer) {
      this.createKonvaCanvas();
    }

    const imageNode = await this.createKonvaImageNode(
      imageData.imageContent,
      imageData.imageId,
      Constants.PROFILE_OPTIONS.NOTHING
    );

    // Set dimensions after the image is loaded
    const image = imageNode.image() as HTMLImageElement;
    if (image) {
      imageData.imageConfig = this.setImageDimensions(
        image,
        imageData.imageConfig,
        systemConfig
      );
      imageData.imageNode = imageNode;
    }

    if (
      this.stage &&
      imageData.imageKonvaTransformerGroup &&
      imageData.imageNode
    ) {
      // set group dimensions
      imageData.imageKonvaTransformerGroup.setAttrs({
        x: imageData.imageConfig.x,
        y: imageData.imageConfig.y,
        width: imageData.imageConfig.width,
        height: imageData.imageConfig.height,
        scaleX: imageData.imageConfig.scaleX,
        scaleY: imageData.imageConfig.scaleY,
        offsetX: imageData.imageConfig.offsetX,
        offsetY: imageData.imageConfig.offsetY,
        draggable: true,
      });

      // save the original image configuration
      this.saveOriginalImageConfig(imageData);

      // add image to Group
      imageData.imageKonvaTransformerGroup.add(imageData.imageNode);

      // add group to the layer
      this.layer?.add(imageData.imageKonvaTransformerGroup);
    }

    // init config
    this.updateImageConfig(imageData, systemConfig);

    this.setListenersForImageGroup(imageData, systemConfig);
  };

  /**
   * @description Adds a cloned image to the Konva canvas and offsets its position.
   * @param {GcodeGeneratorImageData} clonedImageData - The cloned image data object.
   * @returns {Promise<void>}
   */
  async addClonedImageToKonvaCanvas(clonedImageData: GcodeGeneratorImageData) {
    const systemConfig = await configurationSettings();

    if (
      this.layer &&
      clonedImageData.imageKonvaTransformerGroup &&
      clonedImageData.imageNode
    ) {
      clonedImageData.imageKonvaTransformerGroup =
        clonedImageData.imageKonvaTransformerGroup.clone();

      // change the id of the transformer group
      clonedImageData.imageKonvaTransformerGroup.id(clonedImageData.imageId);

      // clean the transformer group after cloning
      this.clearTransformerGroup(clonedImageData.imageKonvaTransformerGroup);

      // clone image clone
      clonedImageData.imageNode = clonedImageData.imageNode.clone();
      if (clonedImageData.imageNode) {
        // add image node to group
        clonedImageData.imageKonvaTransformerGroup.add(
          clonedImageData.imageNode
        );

        // add group to the layer
        this.layer.add(clonedImageData.imageKonvaTransformerGroup);

        // move the copied image a little bit for the user to notice the new copy
        this.moveClonedImage(clonedImageData, systemConfig);

        this.setListenersForImageGroup(clonedImageData, systemConfig);
      }
    }
  }

  /**
   * @private
   * @description Moves a cloned image to an available position on the stage.
   * @param {GcodeGeneratorImageData} cloneImageData - The cloned image data.
   * @param {Config} systemConfig - The system configuration.
   * @returns {void}
   */
  private moveClonedImage(
    cloneImageData: GcodeGeneratorImageData,
    systemConfig: Config
  ) {
    if (this.stage) {
      let platformWidth = this.stage.width();
      let platformHeight = this.stage.height();
      if (systemConfig) {
        platformWidth = getPlatformDimensions(systemConfig).platformWidth;
        platformHeight = getPlatformDimensions(systemConfig).platformHeight;
      }

      const scaledWidth =
        cloneImageData.imageMetrics.width * cloneImageData.imageMetrics.scaleX;
      const scaledHeight =
        cloneImageData.imageMetrics.height * cloneImageData.imageMetrics.scaleY;

      const imageXPosition = cloneImageData.imageMetrics.x;
      const imageYPosition = cloneImageData.imageMetrics.y;

      // move x 10 mm
      if (
        scaledWidth / 2 <= imageXPosition + 10 &&
        imageXPosition + 10 <= platformWidth - scaledWidth / 2
      ) {
        const metrics = {
          ...cloneImageData.imageMetrics,
          x: (imageXPosition + 10) * (this.stage.width() / platformWidth),
          y: imageYPosition * (this.stage.height() / platformHeight),
          scaleX:
            cloneImageData.imageMetrics.scaleX *
            (this.stage.width() / platformWidth),
          scaleY:
            cloneImageData.imageMetrics.scaleY *
            (this.stage.height() / platformHeight),
        } as ImageMetrics;
        this.updateMetricsManually(cloneImageData, metrics, systemConfig);
      } else if (
        // move y to the next line
        scaledHeight / 2 <= imageYPosition + scaledHeight &&
        imageYPosition + scaledHeight <= platformHeight - scaledHeight / 2
      ) {
        const metrics = {
          ...cloneImageData.imageMetrics,
          x: (scaledWidth / 2) * (this.stage.width() / platformWidth),
          y:
            (imageYPosition + scaledHeight) *
            (this.stage.height() / platformHeight),
          scaleX:
            cloneImageData.imageMetrics.scaleX *
            (this.stage.width() / platformWidth),
          scaleY:
            cloneImageData.imageMetrics.scaleY *
            (this.stage.height() / platformHeight),
        } as ImageMetrics;
        this.updateMetricsManually(cloneImageData, metrics, systemConfig);
      } else {
        // return to the beginning of the stage
        const metrics = {
          ...cloneImageData.imageMetrics,
          x: (scaledWidth / 2) * (this.stage.width() / platformWidth),
          y: (scaledHeight / 2) * (this.stage.height() / platformHeight),
          scaleX:
            cloneImageData.imageMetrics.scaleX *
            (this.stage.width() / platformWidth),
          scaleY:
            cloneImageData.imageMetrics.scaleY *
            (this.stage.height() / platformHeight),
        } as ImageMetrics;
        this.updateMetricsManually(cloneImageData, metrics, systemConfig);
      }
    }
  }

  /**
   * @private
   * @description Attaches drag and transform event listeners to an image group to update its configuration.
   * @param {GcodeGeneratorImageData} imageData - The image data.
   * @param {Config} systemConfig - The system configuration.
   * @returns {void}
   */
  private setListenersForImageGroup(
    imageData: GcodeGeneratorImageData,
    systemConfig: Config
  ) {
    imageData.imageKonvaTransformerGroup?.on('dragmove', () => {
      this.checkBoundaries(imageData);
      this.updateImageConfig(imageData, systemConfig);
    });

    imageData.imageKonvaTransformerGroup?.on('transform', () => {
      this.updateImageConfig(imageData, systemConfig);
    });
  }

  /**
   * @description Ensures that an image group stays within the stage boundaries when dragged.
   * @param {GcodeGeneratorImageData} imageData - The image data.
   * @returns {void}
   */
  checkBoundaries = (imageData: GcodeGeneratorImageData) => {
    if (imageData.imageKonvaTransformerGroup) {
      const box = imageData.imageKonvaTransformerGroup.getClientRect();
      const absPos = imageData.imageKonvaTransformerGroup.getAbsolutePosition();
      if (this.stage) {
        // where are shapes inside bounding box of all shapes?
        const offsetX = box.x - absPos.x;
        const offsetY = box.y - absPos.y;

        // we total box goes outside of viewport, we need to move absolute position of shape
        const newAbsPos = { ...absPos };
        if (box.x < 0) {
          newAbsPos.x = -offsetX;
        }
        if (box.y < 0) {
          newAbsPos.y = -offsetY;
        }
        if (box.x + box.width > this.stage.width()) {
          newAbsPos.x = this.stage.width() - box.width - offsetX;
        }
        if (box.y + box.height > this.stage.height()) {
          newAbsPos.y = this.stage.height() - box.height - offsetY;
        }
        imageData.imageKonvaTransformerGroup.setAbsolutePosition(newAbsPos);
      }
    }
  };

  /**
   * @private
   * @description Updates the image's configuration and metrics based on its current position, scale, and rotation on the stage.
   * @param {GcodeGeneratorImageData} imageData - The image data.
   * @param {Config} systemConfig - The system configuration.
   * @returns {void}
   */
  private updateImageConfig = (
    imageData: GcodeGeneratorImageData,
    systemConfig: Config
  ) => {
    if (imageData.imageKonvaTransformerGroup && systemConfig && this.stage) {
      const imageX = imageData.imageKonvaTransformerGroup.x();
      const imageY = imageData.imageKonvaTransformerGroup.y();
      const imageWidth = imageData.imageKonvaTransformerGroup.width();
      const imageHeight = imageData.imageKonvaTransformerGroup.height();
      const imageScaleX = imageData.imageKonvaTransformerGroup.scaleX();
      const imageScaleY = imageData.imageKonvaTransformerGroup.scaleY();
      const imageRotation = imageData.imageKonvaTransformerGroup.rotation();
      const imageOffsetX = imageData.imageKonvaTransformerGroup.offsetX();
      const imageOffsetY = imageData.imageKonvaTransformerGroup.offsetY();

      const { platformWidth, platformHeight } =
        getPlatformDimensions(systemConfig);

      const stageWidth = this.stage.getSize().width;
      const stageHeight = this.stage.getSize().height;

      // X
      imageData.imageMetrics.x = imageData.imageConfig.x =
        imageX * (platformWidth / stageWidth);
      imageData.gcodeSettings.mainSettings.metrics.x =
        (imageX - (imageWidth * imageScaleX) / 2) *
        (platformWidth / stageWidth);

      // Y
      imageData.imageMetrics.y = imageData.imageConfig.y =
        imageY * (platformHeight / stageHeight);
      imageData.gcodeSettings.mainSettings.metrics.y =
        (stageHeight - imageY - (imageHeight * imageScaleY) / 2) *
        (platformHeight / stageHeight);

      // Width
      imageData.gcodeSettings.mainSettings.metrics.width =
        imageData.imageConfig.width =
        imageData.imageMetrics.width =
          imageWidth;

      // Height
      imageData.gcodeSettings.mainSettings.metrics.height =
        imageData.imageConfig.height =
        imageData.imageMetrics.height =
          imageHeight;

      // ScaleX
      imageData.imageConfig.scaleX = imageScaleX;
      imageData.gcodeSettings.mainSettings.metrics.scaleX =
        imageData.imageMetrics.scaleX =
          imageScaleX * (platformWidth / stageWidth);

      // ScaleY
      imageData.imageConfig.scaleY = imageScaleY;
      imageData.gcodeSettings.mainSettings.metrics.scaleY =
        imageData.imageMetrics.scaleY =
          imageScaleY * (platformHeight / stageHeight);

      // OffsetX
      imageData.imageConfig.offsetX =
        imageData.imageMetrics.offsetX =
        imageData.gcodeSettings.mainSettings.metrics.offsetX =
          imageOffsetX;

      // OffsetY
      imageData.imageConfig.offsetY =
        imageData.imageMetrics.offsetY =
        imageData.gcodeSettings.mainSettings.metrics.offsetY =
          imageOffsetY;

      // Rotation
      if (imageRotation >= 0) {
        imageData.gcodeSettings.mainSettings.metrics.rotation =
          360 - imageRotation;
        imageData.imageConfig.rotation = imageData.imageMetrics.rotation =
          imageRotation;
      } else {
        imageData.gcodeSettings.mainSettings.metrics.rotation = -imageRotation;
        imageData.imageConfig.rotation = imageData.imageMetrics.rotation =
          360 + imageRotation;
      }
    }
  };

  /**
   * @description Manually updates an image's metrics and applies them to its Konva group.
   * @param {GcodeGeneratorImageData} imageData - The image data.
   * @param {ImageMetrics} metrics - The updated metrics.
   * @param {Config} systemConfig - The system configuration.
   * @returns {void}
   */
  updateMetricsManually = (
    imageData: GcodeGeneratorImageData,
    metrics: ImageMetrics,
    systemConfig: Config
  ) => {
    if (imageData.imageKonvaTransformerGroup && imageData.imageMetrics) {
      imageData.imageKonvaTransformerGroup.x(metrics.x);
      imageData.imageKonvaTransformerGroup.y(metrics.y);
      imageData.imageKonvaTransformerGroup.scaleX(metrics.scaleX);
      imageData.imageKonvaTransformerGroup.scaleY(metrics.scaleY);
      imageData.imageKonvaTransformerGroup.rotation(metrics.rotation);

      // update all the image configuration data
      this.updateImageConfig(imageData, systemConfig);

      // make sure that the image stays in the boundaries of the stage
      this.checkBoundaries(imageData);
    }
  };

  /**
   * @description Sets the transformer to manipulate a given Konva node.
   * @param {Konva.Node | null} node - The node to attach to the transformer.
   * @returns {void}
   */
  setKonvaTransformerNodes = (node: Konva.Node | null) => {
    if (this.layer && node) {
      this.transformer?.nodes([node]);
      this.bringNodeToTop(node);
    }
  };

  /**
   * @private
   * @description Brings a given Konva node and transformer to the top layer.
   * @param {Konva.Node | null} node - The node to bring forward.
   * @returns {void}
   */
  private bringNodeToTop(node: Konva.Node | null) {
    if (node && this.transformer && this.layer) {
      node.moveToTop();
      this.transformer.moveToTop();
    }
  }

  /**
   * @description Creates a new Konva.Group with a specified ID.
   * @param {string} imageId - The ID for the group.
   * @returns {Konva.Group} The created group.
   */
  createImageKonvaTransformerGroup = (imageId: string) => {
    const group = new Konva.Group({
      id: imageId,
    });
    return group;
  };

  /**
   * @description Adds a source image node to its transformer group.
   * @param {GcodeGeneratorImageData} imageData - The image data.
   * @returns {void}
   */
  addSourceImageNode(imageData: GcodeGeneratorImageData) {
    if (imageData.imageKonvaTransformerGroup && imageData.imageNode) {
      imageData.imageKonvaTransformerGroup.add(imageData.imageNode);
    }
  }

  /**
   * @description Removes a source image node from the stage.
   * @param {Konva.Image | null} node - The image node to remove.
   * @returns {void}
   */
  removeSourceImageNode(node: Konva.Image | null) {
    if (node) {
      node.remove();
    }
  }

  /**
   * @description Adds a modified image node (e.g., engraved or processed version) to an image's transformer group.
   * @param {GcodeGeneratorImageData} imageData - The image data.
   * @param {HTMLCanvasElement} canvas - The canvas to create the image from.
   * @param {string} imageType - The type of the modified image.
   * @returns {Promise<void>}
   */
  async addModifiedImageNodeToTransformerGroup(
    imageData: GcodeGeneratorImageData,
    canvas: HTMLCanvasElement,
    imageType: string
  ) {
    // remove the modified node if already exist
    this.removeModifiedImageNodeFromTransformerGroup(imageData, imageType);

    // create image node from canvas data
    const node = await this.createKonvaImageNode(
      canvas.toDataURL(),
      imageData.imageId,
      imageType
    );

    imageData.imageKonvaTransformerGroup?.add(node);

    node.setAttrs({
      width: imageData.imageConfig.width,
      height: imageData.imageConfig.height,
      // put the engraved image in the back
      zIndex:
        imageType === Constants.PROFILE_OPTIONS.ENGRAVE
          ? 0
          : (imageData.imageKonvaTransformerGroup?.children.length ?? 0) - 1,
    });
  }

  /**
   * @description Removes a modified image node from an image's transformer group.
   * @param {GcodeGeneratorImageData} imageData - The image data.
   * @param {string} imageType - The type of modified image to remove.
   * @returns {void}
   */
  removeModifiedImageNodeFromTransformerGroup(
    imageData: GcodeGeneratorImageData,
    imageType: string
  ) {
    const modifiedNode = imageData.imageKonvaTransformerGroup?.children.find(
      (node) => node.name() === imageType
    );

    modifiedNode?.destroy();
  }

  /**
   * @private
   * @description Calculates and sets appropriate image dimensions and scaling to fit within the stage.
   * @param {HTMLImageElement} image - The image element.
   * @param {Konva.ImageConfig} imageConfig - The image configuration object.
   * @param {Config} systemConfig - The system configuration.
   * @returns {Konva.ImageConfig} The updated image configuration.
   */
  private setImageDimensions = (
    image: HTMLImageElement,
    imageConfig: Konva.ImageConfig,
    systemConfig: Config
  ) => {
    if (this.imageViewerArea && this.stage) {
      let platformWidth, platformHeight;
      const dropAreaStyle = window.getComputedStyle(this.imageViewerArea);
      const dropAreaWidth = parseInt(dropAreaStyle.width);
      platformWidth = dropAreaWidth;
      platformHeight = Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.height;

      if (systemConfig) {
        platformWidth = getPlatformDimensions(systemConfig).platformWidth;
        platformHeight = getPlatformDimensions(systemConfig).platformHeight;
      }

      // Get the dimensions of the image
      const imageWidth =
        imageConfig.width !== 0 ? imageConfig.width : image.width ?? 0;
      const imageHeight =
        imageConfig.height !== 0 ? imageConfig.height : image.height ?? 0;

      // Initialize scale factors for width and height
      let scaleX = 1;
      let scaleY = 1;
      let isBiggerThanTheStage = false;

      // Check if the image width exceeds the stage width
      if (imageWidth && imageWidth > platformWidth) {
        scaleX = this.stage.width() / imageWidth;
        isBiggerThanTheStage = true;
      } else {
        scaleX = this.stage.width() / platformWidth;
      }

      // Check if the image height exceeds the stage height
      if (imageHeight && imageHeight > platformHeight) {
        scaleY = this.stage.height() / imageHeight;
        isBiggerThanTheStage = true;
      } else {
        scaleY = this.stage.height() / platformHeight;
      }

      // Apply the smaller scaling factor to preserve the aspect ratio
      if (isBiggerThanTheStage) {
        const scale = Math.min(scaleX, scaleY);
        scaleX = scaleY = scale;
      }

      // Set the image scaling and positioning to center the image in the stage
      imageConfig = {
        ...imageConfig,
        width: imageWidth,
        height: imageHeight,
        x: imageWidth
          ? (imageWidth * scaleX) / 2
          : Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.width / 2,
        y: imageHeight
          ? (imageHeight * scaleY) / 2
          : Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.height / 2,
        scaleX,
        scaleY,
        offsetX: imageWidth
          ? imageWidth / 2
          : Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.width / 2,
        offsetY: imageHeight
          ? imageHeight / 2
          : Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.height / 2,
      };
    }
    return imageConfig;
  };

  /**
   * @description Enables or disables certain transformer anchors based on lock status.
   * @param {boolean} isLocked - Whether to restrict transformation anchors.
   * @returns {void}
   */
  changeEnabledTransformationAnchors = (isLocked: boolean) => {
    if (isLocked) {
      this.transformer?.enabledAnchors([
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ]);
    } else {
      this.transformer?.enabledAnchors([
        'top-left',
        'top-center',
        'top-right',
        'middle-right',
        'middle-left',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ]);
    }
  };

  /**
   * @private
   * @description Removes all children from a Konva.Group.
   * @param {Konva.Group} group - The group to clear.
   * @returns {void}
   */
  private clearTransformerGroup(group: Konva.Group) {
    group.removeChildren();
  }

  /**
   * @private
   * @description Saves the original image configuration for later reference.
   * @param {GcodeGeneratorImageData} imageData - The image data.
   * @returns {void}
   */
  private saveOriginalImageConfig(imageData: GcodeGeneratorImageData) {
    imageData.originalImageConfig = structuredClone(imageData.imageConfig);
  }

  /**
   * @description Sets the HTML element used as the image viewer area.
   * @param {HTMLElement} imageViewerArea - The image viewer container.
   * @returns {void}
   */
  setImageViewerArea(imageViewerArea: HTMLElement) {
    this.imageViewerArea = imageViewerArea;
  }
}
