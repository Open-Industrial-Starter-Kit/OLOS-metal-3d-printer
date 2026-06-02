import { Constants } from 'src/constants';
import { DitheringSettings } from 'src/interfaces/imageToGcode.interface';
import { TransformData } from 'src/interfaces/imageToGcode.interface';
import { INode, stringify } from 'svgson';
import {
  ditheringAnImage,
  drawImageOnOffscreenCanvas,
  getImageDataFromOffscreenCanvas,
} from './image.editor.service';
import toPath from 'element-to-path';
import { Config } from 'src/interfaces/configSettings.interface';
import { Helper } from 'dxf';

/**
 * @description Processes an SVG data URI by extracting the SVG string, calculating its effective dimensions
 * (handling viewBox and percentages), and returning a new data URI with standardized width and height attributes.
 * @param {string} svgContent - The input SVG as a data URI.
 * @returns {Promise<{svgDataURI: string | undefined, svgWidth: number, svgHeight: number}>} A promise that resolves to an object
 * containing the new `svgDataURI`, `svgWidth`, and `svgHeight`.
 */
export const postProcessSvgDataURI = async (svgContent: string) => {
  const svgElementString = getSvgStringFromDataUri(svgContent);

  // find the default dimensions
  const dimensions = getDefaultSvgDimensions(svgElementString);
  let svgWidth = dimensions.width;
  let svgHeight = dimensions.height;

  let svgDataURI;
  if (svgElementString) {
    const calculatedDimensions = getCalculatedSvgDimensions(
      svgElementString,
      svgWidth,
      svgHeight
    );

    svgWidth = calculatedDimensions.calculatedWidth;
    svgHeight = calculatedDimensions.calculatedHeight;

    const updatedSvgString = replaceSvgDimensions(
      svgElementString,
      svgWidth,
      svgHeight
    );
    svgDataURI = await svgStringToBase64DataUri(updatedSvgString);
  } else {
    svgDataURI = await svgStringToBase64DataUri(svgElementString);
  }
  return {
    svgDataURI,
    svgWidth,
    svgHeight,
  };
};

/**
 * @description Converts a DXF file content string into an SVG data URI using the 'dxf' helper library.
 * @param {string} fileContent - The raw string content of a DXF file.
 * @returns {string} The resulting SVG as a Base64 data URI.
 */
export const convertDXFToSVGDataURI = (fileContent: string) => {
  const helper = new Helper(fileContent);
  // create svg string from dxf string
  const svgContent = helper.toSVG();

  // Create a Data URL for the SVG
  const svgDataURL = `data:image/svg+xml;base64,${btoa(svgContent)}`;

  return svgDataURL;
};

/**
 * @description Creates an SVG DOM element from an SVG content string.
 * @param {string} svgContent - The raw string of the SVG content.
 * @returns {SVGSVGElement | null} The parsed <svg> element or null if parsing fails.
 */
export const createSVGFromSVGContent = (svgContent: string) => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = svgDoc.querySelector('svg');
  return svgElement;
};

/**
 * @description Extracts width and height from an SVG's viewBox or its width/height attributes.
 * @param {Record<string, string>} svgAttributes - The attributes of the <svg> element.
 * @returns {{width: number, height: number} | null} An object with width and height, or null if not found.
 */
const getViewportDimensions = (svgAttributes: Record<string, string>) => {
  if (svgAttributes.viewBox) {
    const parts = svgAttributes.viewBox.trim().split(/\s+|,/);
    if (parts.length === 4) {
      const width = parseFloat(parts[2]);
      const height = parseFloat(parts[3]);
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        return { width, height };
      }
    }
  }
  // Fallback to width/height attributes if viewBox is invalid or missing
  if (svgAttributes.width && svgAttributes.height) {
    const width = parseFloat(svgAttributes.width);
    const height = parseFloat(svgAttributes.height);
    if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
      return { width, height };
    }
  }
  return null;
};

/**
 * @description Calculates a dynamic stroke width based on the SVG's viewport dimensions to ensure visibility.
 * @param {Record<string, string>} svgElementAttributes - The attributes of the <svg> element.
 * @returns {string} The calculated stroke width as a string with two decimal places.
 */
const calculateStrokeWidth = (svgElementAttributes: Record<string, string>) => {
  // Get viewport dimensions once
  const dimensions = getViewportDimensions(svgElementAttributes);
  if (dimensions) {
    const { width, height } = dimensions;
    const normalizedDiagonal =
      Math.sqrt(width ** 2 + height ** 2) / Math.sqrt(2);

    const strokeWidthPercentage = 0.5;

    const strokeWidthInPixels =
      (strokeWidthPercentage / 100) * normalizedDiagonal;

    return Math.max(strokeWidthInPixels, 0.1).toFixed(2);
  }
  return '0.1';
};

/**
 * @description Modifies an array of SVG elements for cutting or marking operations. This involves setting the
 * stroke to black, removing the fill, calculating a dynamic stroke width, and converting all shapes to paths.
 * @param {INode[]} elements - An array of SVG nodes (from svgson) to modify.
 * @param {Record<string, string>} svgElementAttributes - Attributes for the root <svg> element.
 * @returns {Promise<string>} A promise resolving to the modified SVG content as a string.
 */
export const modifySVGElementsForCuttingOrMarking = async (
  elements: INode[],
  svgElementAttributes: Record<string, string>
) => {
  const updatedElements = [] as Array<INode>;

  for (const elementBody of elements) {
    // Modify element attributes
    const updatedAttributes = { ...elementBody.attributes }; // Avoid mutating the original
    updatedAttributes.stroke = 'black';
    updatedAttributes.opacity = '1';
    updatedAttributes.fill = 'none';
    updatedAttributes['stroke-width'] =
      calculateStrokeWidth(svgElementAttributes);

    // Check if style attribute is defined and clean it up
    if (updatedAttributes.style) {
      let updatedStyle = updatedAttributes.style;
      updatedStyle = updatedStyle.replace(/fill:\s*[^;]*;?/g, ''); // Remove fill
      updatedStyle = updatedStyle.replace(/stroke:\s*[^;]*;?/g, ''); // Remove stroke
      updatedStyle = updatedStyle.replace(/stroke-width:\s*[^;]*;?/g, ''); // Remove stroke-width
      updatedStyle = updatedStyle.replace(/;;+/g, ';').trim(); // Clean up redundant semicolons
      updatedAttributes.style = updatedStyle;
    }

    // Convert primitive elements to path elements
    const convertedElement = await convertElementToPath({
      ...elementBody,
      attributes: updatedAttributes,
    });
    updatedElements.push(convertedElement);
  }

  // Create the modified SVG after applying the cutting
  const modifiedSvgContent = createSVGFromElements(
    updatedElements,
    svgElementAttributes
  );

  return modifiedSvgContent;
};

/**
 * @description Applies a dithering algorithm to image data for engraving purposes.
 * @param {ImageData} imageData - The original image data.
 * @param {DitheringSettings} dithering - The dithering configuration.
 * @returns {ImageData} The dithered image data.
 */
export const modifySVGElementsForEngraving = async (
  imageData: ImageData,
  dithering: DitheringSettings
) => {
  const ditheredImage = ditheringAnImage(imageData, dithering);
  return ditheredImage;
};

/**
 * @description Creates a complete SVG string from an array of SVG nodes and root attributes.
 * @param {INode[]} elements - An array of SVG nodes (from svgson) to include in the SVG.
 * @param {Record<string, string>} svgElementAttributes - The attributes for the root <svg> element.
 * @returns {string} A complete SVG string.
 */
export const createSVGFromElements = (
  elements: INode[],
  svgElementAttributes: Record<string, string>
) => {
  // Initialize SVG string with namespace
  let svgString = '<svg';

  // Add attributes to the opening SVG tag
  for (const [key, value] of Object.entries(svgElementAttributes)) {
    svgString += ` ${key}="${value}"`;
  }

  // Close the opening SVG tag
  svgString += '>';

  // Add inner HTML for each element
  for (const elementBody of elements) {
    svgString += stringify(elementBody);
  }

  // Close the SVG element
  svgString += '</svg>';

  return svgString;
};

/**
 * @description Converts an SVG DOM element into a Base64 data URI.
 * @param {SVGGraphicsElement} svgElement - The SVG element to convert.
 * @returns {string} The resulting SVG as a Base64 data URI.
 */
export const svgElementToBase64 = (svgElement: SVGGraphicsElement) => {
  // draw the svg element on canvas
  const svgString = new XMLSerializer().serializeToString(svgElement);
  // Create a data URL from the SVG string
  const svgDataURL = 'data:image/svg+xml;base64,' + btoa(svgString);
  return svgDataURL;
};

/**
 * @description Draws an SVG element onto a new HTML canvas, scaling it to fit configured dimensions.
 * @param {SVGGraphicsElement} svgElement - The SVG element to draw.
 * @param {Config | null} config - The application configuration, containing machine screen dimensions.
 * @returns {Promise<HTMLCanvasElement>} A promise that resolves with the canvas element containing the drawn SVG.
 */
export const drawSVGOnCanvas = (
  svgElement: SVGGraphicsElement,
  config: Config | null
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    // Create a data URL from the SVG string
    const svgDataURL = svgElementToBase64(svgElement);
    const image = new Image();

    // When the image is loaded, draw it onto the canvas
    image.onload = function () {
      const canvasElement = document.createElement('canvas');
      //set dimensions
      const width = image.width;
      const height = image.height;
      let scaleFactor;

      if (config) {
        // Calculate scale factor based on max dimensions
        scaleFactor = Math.min(
          config.machine_screen.width / width,
          config.machine_screen.height / height,
          100
        );
      } else {
        scaleFactor = 100;
      }
      const scaledWidth = width * scaleFactor;
      const scaledHeight = height * scaleFactor;
      // Set canvas dimensions
      canvasElement.width = scaledWidth;
      canvasElement.height = scaledHeight;

      const context = canvasElement.getContext('2d');

      context?.drawImage(image, 0, 0, scaledWidth, scaledHeight);

      resolve(canvasElement);
    };

    image.onerror = function (error) {
      reject(new Error('Error loading SVG image: ' + error));
    };

    image.src = svgDataURL;
  });
};

/**
 * @description Prepares SVG elements for an engraving operation by rendering them into a new SVG,
 * drawing it on an offscreen canvas, and extracting the pixel data.
 * @param {INode[]} engravingElements - An array of SVG nodes to be engraved.
 * @param {Record<string, string>} svgElementAttributes - The attributes for the root <svg> element.
 * @param {number} resolution - The resolution to use for the offscreen canvas.
 * @returns {Promise<ImageData | null>} A promise that resolves to the ImageData for the rendered elements, or null if there are no elements.
 */
export const prepareSVGElementsForEngraving = async (
  engravingElements: INode[],
  svgElementAttributes: Record<string, string>,
  resolution: number
) => {
  let imageData = null;
  // create an image for engraving svg elements
  if (engravingElements.length) {
    // create new svg element
    const modifiedSvgContentForEngraving = createSVGFromElements(
      engravingElements,
      svgElementAttributes
    );

    // After that draw svg on canvas to fetch the image data
    const svgDataURI =
      'data:image/svg+xml;base64,' + btoa(modifiedSvgContentForEngraving);
    const canvasElement = await drawImageOnOffscreenCanvas(
      svgDataURI,
      resolution
    );
    imageData = getImageDataFromOffscreenCanvas(canvasElement);
  }
  return imageData;
};

/**
 * @description Converts a basic SVG shape element (like <circle>, <rect>) into a <path> element.
 * @param {INode} element - The SVG node to convert.
 * @returns {Promise<INode>} A promise that resolves with the element converted to a path.
 */
const convertElementToPath = async (element: INode) => {
  // get the d attribute of the element
  const path = toPath(element);
  // convert to path element
  element.name = 'path';
  element.attributes.d = path;

  return element;
};

/**
 * @description Calculates the combined transformation string for a child element that inherits transforms
 * from a parent. It correctly sums translations, rotations, etc., to produce a final transform attribute.
 * @param {Record<string, string>} childAttributes - The attributes of the child element.
 * @param {Record<string, string>} parentAttributes - The attributes of the parent element.
 * @returns {string} The combined transform attribute string.
 */
export const calculateTransformationValue = (
  childAttributes: Record<string, string>,
  parentAttributes: Record<string, string>
) => {
  if (childAttributes.transform && parentAttributes.transform) {
    const childTransformValues = parseTransformAttribute(
      childAttributes.transform
    );
    const parentTransformValues = parseTransformAttribute(
      parentAttributes.transform
    );

    // Initialize the combined transform data
    const combinedTransformValues: TransformData = { ...parentTransformValues };

    // Merge child and parent transform values while considering their cumulative effect
    Object.keys(childTransformValues).forEach((key) => {
      const childValue = childTransformValues[key];
      const parentValue = combinedTransformValues[key];

      // Check if the key exists in both child and parent transform values
      if (Array.isArray(childValue) && Array.isArray(parentValue)) {
        // If both child and parent values are arrays, merge them element-wise
        combinedTransformValues[key] = childValue.map(
          (value, index) => value + parentValue[index]
        );
      } else if (
        typeof childValue === 'number' &&
        typeof parentValue === 'number'
      ) {
        // If both child and parent values are numbers, add them
        combinedTransformValues[key] = childValue + parentValue;
      } else {
        // Otherwise, just set the child value
        combinedTransformValues[key] = childValue;
      }
    });

    // Convert the combined transform values back to a transform attribute string
    return convertToTransformAttribute(combinedTransformValues);
  } else if (childAttributes.transform) {
    return childAttributes.transform;
  } else if (parentAttributes.transform) {
    return parentAttributes.transform;
  }
  return '';
};

/**
 * @description Extracts the raw SVG string from a Base64 data URI.
 * @param {string} svgDataUri - The SVG data URI.
 * @returns {string | null} The raw SVG string, or null if it cannot be parsed.
 */
export const getSvgStringFromDataUri = (svgDataUri: string) => {
  // Create a temporary <div> element
  const tempDiv = document.createElement('div');

  // Set the innerHTML of the <div> to be the data URI string
  tempDiv.innerHTML = atob(svgDataUri.split(',')[1]);

  // Find the first <svg> element within the <div>
  const svgElement = tempDiv.querySelector('svg');
  if (svgElement) {
    // Return the outerHTML of the <svg> element
    return svgElement.outerHTML;
  }
  return null;
};

/**
 * @description Calculates the bounding box of an SVG to determine its actual dimensions.
 * @param {string | null} svgString - The raw SVG string.
 * @returns {{width: number, height: number}} An object containing the calculated width and height.
 */
const getDefaultSvgDimensions = (svgString: string | null) => {
  if (svgString) {
    const svgElement = createSVGFromSVGContent(svgString);
    if (svgElement) {
      // added to the main document to make sure the svg render on the browser
      document.body.appendChild(svgElement);

      // Initialize variables for bounding box
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      // Calculate the bounding box of the <svg> element itself
      const svgBBox = svgElement.getBBox();
      minX = Math.min(minX, svgBBox.x);
      minY = Math.min(minY, svgBBox.y);
      maxX = Math.max(maxX, svgBBox.x + svgBBox.width);
      maxY = Math.max(maxY, svgBBox.y + svgBBox.height);

      // Calculate width and height based on bounding box
      const width = maxX - minX;
      const height = maxY - minY;

      // added to the main document to make sure the svg render on the browser
      document.body.removeChild(svgElement);
      return { width, height };
    }
  }
  return {
    width: Constants.SVG_DIMENSION_DEFAULT_VALUE,
    height: Constants.SVG_DIMENSION_DEFAULT_VALUE,
  };
};

/**
 * @description Reads the width and height attributes from an SVG string, handling percentage values.
 * @param {string} svgString - The raw SVG string.
 * @param {number} defaultWidth - The total width to use for percentage calculations.
 * @param {number} defaultHeight - The total height to use for percentage calculations.
 * @returns {{calculatedWidth: number, calculatedHeight: number}} The calculated dimensions.
 */
const getCalculatedSvgDimensions = (
  svgString: string,
  defaultWidth: number,
  defaultHeight: number
) => {
  const svgTagRegex = /<svg\s+([^>]*)>/;
  const svgTagMatch = svgString.match(svgTagRegex);

  if (svgTagMatch) {
    const svgAttributes = svgTagMatch[1];
    const widthMatch = svgAttributes.match(/width="([^"]+)"/);
    const heightMatch = svgAttributes.match(/height="([^"]+)"/);

    // Helper function to replace percentage values
    const replacePercentage = (value: string, total: number) => {
      const percentageMatch = value.match(/([\d.]+)%/);
      if (percentageMatch) {
        return (parseFloat(percentageMatch[1]) / 100) * total;
      }
      return parseFloat(value); // If not percentage, return as a number
    };

    let calculatedWidth = defaultWidth;
    let calculatedHeight = defaultHeight;

    // If width is found and it's in percentage, calculate the value
    if (widthMatch && widthMatch[1].includes('%')) {
      calculatedWidth = replacePercentage(widthMatch[1], defaultWidth);
    } else if (widthMatch) {
      calculatedWidth = parseFloat(widthMatch[1]);
    }

    // If height is found and it's in percentage, calculate the value
    if (heightMatch && heightMatch[1].includes('%')) {
      calculatedHeight = replacePercentage(heightMatch[1], defaultHeight);
    } else if (heightMatch) {
      calculatedHeight = parseFloat(heightMatch[1]);
    }

    return { calculatedWidth, calculatedHeight };
  }

  // If no <svg> tag or attributes are found, return default values
  return {
    calculatedWidth: defaultWidth,
    calculatedHeight: defaultHeight,
  };
};

/**
 * @description Updates or adds width and height attributes to an SVG string.
 * @param {string} svgString - The raw SVG string.
 * @param {number} width - The new width to set.
 * @param {number} height - The new height to set.
 * @returns {string} The SVG string with updated dimensions.
 */
const replaceSvgDimensions = (
  svgString: string,
  width: number,
  height: number
) => {
  const svgTagRegex = /<svg\s+([^>]*)>/;
  const svgTagMatch = svgString.match(svgTagRegex);

  if (svgTagMatch) {
    let svgAttributes = svgTagMatch[1];
    const widthMatch = svgAttributes.match(/width="([^"]+)"/);
    const heightMatch = svgAttributes.match(/height="([^"]+)"/);

    // Helper function to replace percentage values
    const replacePercentage = (value: string, total: number) => {
      const percentageMatch = value.match(/([\d.]+)%/);
      if (percentageMatch) {
        return (parseFloat(percentageMatch[1]) / 100) * total;
      }
      return parseFloat(value); // If not percentage, return as a number
    };

    // If width and height attributes are not present, add them
    if (!widthMatch && !heightMatch) {
      return svgString.replace(
        '<svg',
        `<svg width="${width}" height="${height}"`
      );
    } else {
      // Handle width replacement (whether percentage or absolute value)
      if (widthMatch) {
        let newWidth = width;
        if (widthMatch[1].includes('%')) {
          newWidth = replacePercentage(widthMatch[1], width);
        }
        svgAttributes = svgAttributes.replace(
          widthMatch[0],
          `width="${newWidth}"`
        );
      } else {
        // Add width if missing
        svgAttributes = svgAttributes.replace(
          'height=',
          `width="${width}" height=`
        );
      }

      // Handle height replacement (whether percentage or absolute value)
      if (heightMatch) {
        let newHeight = height;
        if (heightMatch[1].includes('%')) {
          newHeight = replacePercentage(heightMatch[1], height);
        }
        svgAttributes = svgAttributes.replace(
          heightMatch[0],
          `height="${newHeight}"`
        );
      } else {
        // Add height if missing
        svgAttributes = svgAttributes.replace(
          'width=',
          `height="${height}" width=`
        );
      }

      return svgString.replace(svgTagMatch[1], svgAttributes);
    }
  }

  return svgString;
};

/**
 * @description Converts an SVG string into a Base64 data URI.
 * @param {string | null} svgString - The raw SVG string.
 * @returns {Promise<string> | undefined} A promise that resolves with the data URI, or undefined if the input is null.
 */
export const svgStringToBase64DataUri = (svgString: string | null) => {
  if (svgString) {
    // Create a Blob object from the SVG string
    const blob = new Blob([svgString], { type: 'image/svg+xml' });

    // Read the Blob as a data URI
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
};

/**
 * @description Parses an SVG transform attribute string into a structured object.
 * @param {string} transformAttribute - The transform attribute string (e.g., "translate(10,20) scale(2)").
 * @returns {TransformData} A structured object representing the transformations.
 */
const parseTransformAttribute = (transformAttribute: string) => {
  // Regular expression pattern to match transform functions and their parameters
  const transformRegex = /(\w+)\(([^\)]+)\)/g;

  // Object to store parsed transformation data
  const transformData: TransformData = {};

  // Match each transform function and its parameters
  let match;
  while ((match = transformRegex.exec(transformAttribute)) !== null) {
    const [, transformFunction, params] = match;
    const paramArray = params
      .split(/\s*,\s*/)
      .map((value) => value.split(' ').map(parseFloat))[0]; // Convert parameter values to numbers
    transformData[transformFunction] =
      paramArray.length === 1 ? paramArray[0] : paramArray;
  }

  return transformData;
};

/**
 * @description Converts a structured transform data object back into an SVG transform attribute string.
 * @param {TransformData} transformData - The structured object representing transformations.
 * @returns {string} The resulting transform attribute string.
 */
const convertToTransformAttribute = (transformData: TransformData): string => {
  // Initialize an empty array to store the transform strings
  const transformStrings: string[] = [];

  // Iterate over each key-value pair in the transform data
  Object.entries(transformData).forEach(([key, value]) => {
    // Convert the key-value pair to a string representation
    let transformString: string;

    if (Array.isArray(value)) {
      // If the value is an array, format it as a space-separated string
      transformString = `${key}(${value.join(',')})`;
    } else {
      // If the value is a single number, format it directly
      transformString = `${key}(${value})`;
    }

    // Add the formatted string to the array
    transformStrings.push(transformString);
  });

  // Join all transform strings with spaces and return the result
  return transformStrings.join(' ');
};

/**
 * @description Converts a color string from various formats (named, hex, rgb) into a standard 'rgb(r, g, b)' string.
 * Defaults to black if the color format is unrecognized or invalid.
 * @param {string} color - The color string to convert.
 * @returns {string} The color in 'rgb(r, g, b)' format.
 */
export const convertColorToRgb = (color: string) => {
  // Helper function to convert RGB to hexadecimal
  // Function to convert hex color to RGB
  const hexToRGB = (hexColor: string) => {
    // Remove '#' if present
    hexColor = hexColor.replace('#', '');
    // Parse hex color to RGB components
    const bigint = parseInt(hexColor, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Helper function to convert named colors to hexadecimal
  const colorNameToHex = (color: string) => {
    if (typeof Constants.ALL_HEX_COLORS[color.toLowerCase()] != 'undefined')
      return Constants.ALL_HEX_COLORS[color.toLowerCase()];

    return Constants.ALL_HEX_COLORS.BLACK;
  };

  // Check if it's a named color
  if (/^[a-zA-Z]+$/.test(color)) {
    const hexColor = colorNameToHex(color);
    return hexToRGB(hexColor);
  }
  // Check if it's a hexadecimal color
  if (/^#[0-9A-Fa-f]{3,6}$/.test(color)) {
    return hexToRGB(color);
  }
  // Check if it's an RGB color
  if (/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.test(color)) {
    return color;
  }
  return Constants.RGB_COLOR.BLACK; // Return black color incase no color founded
};
