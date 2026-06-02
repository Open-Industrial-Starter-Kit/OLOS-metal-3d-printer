import { Constants } from 'src/constants';
import { Config } from 'src/interfaces/configSettings.interface';
import { DitheringSettings } from 'src/interfaces/imageToGcode.interface';
import {
  averageDithering,
  floydSteinbergDithering,
  gridDithering,
  halftoneDithering,
  orderedDithering,
  randomDithering,
} from 'src/services/dithering.algorithms.service';

/**
 * @description Creates an SVG string containing a rectangular path around the image for cutting or marking.
 * @param {ImageData} imageData - The image data used to determine SVG dimensions and stroke size.
 * @returns {string} The generated SVG string.
 */
export const modifyImageForCuttingOrMarking = (imageData: ImageData) => {
  const scaleFactor = Math.min(imageData.width, imageData.height) / 400;
  const strokeWidth = 1 + scaleFactor * 2;
  const halfStrokeWidth = strokeWidth / 2;

  // Define the coordinates of the rectangle as a path
  const x1 = halfStrokeWidth;
  const y1 = halfStrokeWidth;
  const x2 = imageData.width - halfStrokeWidth;
  const y2 = imageData.height - halfStrokeWidth;

  const svgString = `
    <svg width="${imageData.width}" height="${imageData.height}" xmlns="http://www.w3.org/2000/svg">
      <path d="M ${x1},${y1} L ${x2},${y1} L ${x2},${y2} L ${x1},${y2} Z" stroke="black" fill="none" stroke-width="${strokeWidth}"/>
    </svg>
  `;
  return svgString;
};

/**
 * @description Applies a specified dithering algorithm to prepare an image for engraving.
 * @param {ImageData} imageData - The source image data to be processed.
 * @param {DitheringSettings} dithering - The dithering settings including algorithm and parameters.
 * @returns {ImageData | null} The dithered image data.
 */
export const modifyImageForEngraving = (
  imageData: ImageData,
  dithering: DitheringSettings
) => {
  const ditheringImageData = ditheringAnImage(imageData, dithering);
  return ditheringImageData;
};

/**
 * @description Loads an image from a string source and draws it on an OffscreenCanvas at a calculated scale.
 * @param {string} imageContent - The base64 or URL string of the image to draw.
 * @param {number} resolution - The target resolution to scale the image for processing.
 * @returns {Promise<OffscreenCanvas>} A promise that resolves with the rendered OffscreenCanvas.
 */
export const drawImageOnOffscreenCanvas = (
  imageContent: string,
  resolution: number
) => {
  return new Promise<OffscreenCanvas>((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      const width = img.width;
      const height = img.height;

      // Determine the aspect ratio and calculate the scale factor dynamically
      const maxDimension = Math.max(width, height);
      const scaleFactor = resolution * (10 / maxDimension);

      // Scale the dimensions
      const scaledWidth = Math.floor(width * scaleFactor);
      const scaledHeight = Math.floor(height * scaleFactor);

      const canvas = new OffscreenCanvas(scaledWidth, scaledHeight);
      const ctx = canvas.getContext('2d', {
        willReadFrequently: true,
      }) as OffscreenCanvasRenderingContext2D;

      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      resolve(canvas);
    };
    img.onerror = function () {
      reject('Failed to load image.');
    };
    img.src = imageContent;
  });
};

/**
 * @description Draws an image on a standard HTML canvas, scaling it to fit machine screen dimensions if provided.
 * @param {HTMLImageElement} image - The HTML image element to draw.
 * @param {Config|null} [config=null] - Optional machine configuration for scaling.
 * @param {string} [backgroundColor='white'] - The background fill color.
 * @returns {HTMLCanvasElement} The rendered HTML canvas element.
 */
export const drawImageOnCanvas = (
  image: HTMLImageElement,
  config: Config | null = null,
  backgroundColor = 'white'
) => {
  //set dimensions
  const width = image.width;
  const height = image.height;
  let scaleFactor;

  if (config) {
    // Calculate scale factor based on max dimensions
    scaleFactor = Math.min(
      config.machine_screen.width / width,
      config.machine_screen.height / height,
      10
    );
  } else {
    scaleFactor = 10;
  }

  const canvasElement = document.createElement('canvas');
  const scaledWidth = width * scaleFactor;
  const scaledHeight = height * scaleFactor;

  canvasElement.width = scaledWidth;
  canvasElement.height = scaledHeight;

  const context = canvasElement.getContext('2d');
  if (context) {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvasElement.width, canvasElement.height);
    context.drawImage(image, 0, 0, scaledWidth, scaledHeight);
  }

  return canvasElement;
};

/**
 * @description Extracts ImageData from an OffscreenCanvas.
 * @param {OffscreenCanvas} canvas - The OffscreenCanvas to extract image data from.
 * @returns {ImageData} The extracted ImageData object.
 */
export const getImageDataFromOffscreenCanvas = (canvas: OffscreenCanvas) => {
  const context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  return imageData;
};

/**
 * @description Creates an HTMLImageElement from ImageData with a white background.
 * @param {ImageData} imageData - The image data to render into an image element.
 * @returns {HTMLImageElement} The generated HTML image element.
 */
export const createImageFromImageData = (imageData: ImageData) => {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set canvas dimensions based on ImageData dimensions
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  if (ctx) {
    // Put the ImageData onto the canvas
    ctx.putImageData(imageData, 0, 0);
    // white background
    ctx.globalCompositeOperation = 'destination-over';
    // set the fill color to white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Create an image element
  const image = new Image();

  image.width = canvas.width;
  image.height = canvas.height;

  // Set image source to canvas's data URL
  image.src = canvas.toDataURL();
  return image;
};

/**
 * @description Applies a selected dithering algorithm to the provided image data.
 * @param {ImageData} imageData - The image data to be processed.
 * @param {DitheringSettings} dithering - The dithering settings specifying the algorithm and parameters.
 * @returns {ImageData | null} The processed ImageData after dithering, or null if no valid algorithm is selected.
 */
export const ditheringAnImage = (
  imageData: ImageData,
  dithering: DitheringSettings
) => {
  let image: ImageData | null = null;
  switch (dithering.algorithm) {
    case Constants.DITHERING_ALGORITHMS.FLOYDSTEINBERG:
      image = floydSteinbergDithering(imageData, dithering.grayShift);
      break;

    case Constants.DITHERING_ALGORITHMS.ORDERED:
      image = orderedDithering(imageData, dithering.grayShift);
      break;

    case Constants.DITHERING_ALGORITHMS.HALFTONE:
      image = halftoneDithering(imageData, dithering.grayShift);
      break;

    case Constants.DITHERING_ALGORITHMS.RANDOM:
      image = randomDithering(imageData, dithering.grayShift);
      break;

    case Constants.DITHERING_ALGORITHMS.AVERAGE:
      image = averageDithering(imageData, dithering.grayShift);
      break;

    case Constants.DITHERING_ALGORITHMS.GRID:
      image = gridDithering(
        imageData,
        dithering.grayShift,
        dithering.blockSize,
        dithering.blockDistance
      );
      break;

    default:
      break;
  }
  return image;
};
