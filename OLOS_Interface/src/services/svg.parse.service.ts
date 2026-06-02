import { Constants } from 'src/constants';
import {
  IColorElement,
  IShapeElement,
} from 'src/interfaces/imageToGcode.interface';
import { INode } from 'svgson';
import {
  calculateTransformationValue,
  convertColorToRgb,
} from './svg.editor.service';

/**
 * @class SVGParser
 * @description A service class to parse a JSON structure of an SVG (from the 'svgson' library).
 * It filters for drawable elements, assigns unique IDs, and groups them by shape and color.
 */
export class SVGParser {
  /** @property {Record<string, string>} svgElementAttributes - Stores the attributes of the root <svg> element. */
  svgElementAttributes: Record<string, string>;
  /** @property {number} elementId - A counter to assign a unique sequential ID to each parsed SVG element. */
  elementId: number;
  /** @property {Array<IShapeElement>} shapeElements - An array containing SVG elements grouped by their shape type (e.g., 'path', 'circle'). */
  shapeElements: Array<IShapeElement>;
  /** @property {Array<IColorElement>} colorElements - An array containing SVG elements grouped by their fill or stroke color. */
  colorElements: Array<IColorElement>;

  /**
   * @constructor
   * @description Initializes the properties for the SVG parser.
   */
  constructor() {
    this.svgElementAttributes = {};
    this.elementId = 0;
    this.shapeElements = [];
    this.colorElements = [];
  }

  /**
   * @description Recursively traverses a JSON representation of an SVG, filters for allowed drawable elements,
   * assigns IDs, and groups them by shape and color.
   * @param {INode} json - The root node or a child node of the SVG JSON structure from svgson.
   * @param {Record<string, string>} [attributes] - Optional. Attributes inherited from parent nodes during recursion.
   * @returns {void}
   */
  filterSvgElements = (json: INode, attributes?: Record<string, string>) => {
    // get svg element attributes to apply on the modified svg
    if (json.name === 'svg') {
      this.svgElementAttributes = json.attributes;
    }

    // filter svg sub elements/nodes
    json.children.forEach((childElement) => {
      // check the element name and if it match the allowed elements used to draw on the svg
      if (Constants.SVG_ALLOWED_ELEMENTS.includes(childElement.name)) {
        childElement.attributes = this.addParentAttributesToChild(
          childElement.attributes,
          attributes
        );
        // give the element an id for sorting and deleting
        childElement.attributes.id = this.elementId.toString();
        this.elementId++;

        this.checkElementBasedOnShape(childElement);
        this.checkElementBasedOnColor(childElement);
      }

      // check if the element contains children elements and try to filter its elements
      if (childElement.children.length) {
        this.filterSvgElements(childElement, {
          ...attributes,
          ...childElement.attributes,
        });
      }
    });
  };

  /**
   * @description Merges attributes from a parent element into a child element. It gives precedence to
   * child attributes and correctly calculates combined transformations.
   * @param {Record<string, string>} childAttributes - The attributes of the child element.
   * @param {Record<string, string>} [parentAttributes] - Optional. The attributes inherited from the parent.
   * @returns {Record<string, string>} The merged and calculated attributes for the child element.
   */
  addParentAttributesToChild = (
    childAttributes: Record<string, string>,
    parentAttributes?: Record<string, string>
  ) => {
    if (parentAttributes) {
      // apply the correct transformation incase of inherited attributes
      childAttributes.transform = calculateTransformationValue(
        childAttributes,
        parentAttributes
      );
    }
    // add the rest of attributes inherited from the parent node
    childAttributes = {
      ...parentAttributes,
      ...childAttributes,
    };

    return childAttributes;
  };

  /**
   * @description Adds a given SVG element to an array, grouping it with other elements
   * of the same shape (e.g., 'path', 'circle').
   * @param {INode} childElement - The SVG element to be grouped.
   * @returns {void}
   */
  checkElementBasedOnShape = (childElement: INode) => {
    let found = false;

    this.shapeElements.forEach((element) => {
      // If the shape already exists in the array
      if (element.shape === childElement.name) {
        element.elements.push(childElement);
        found = true; // Set flag to indicate shape was found
      }
    });

    // If the shape doesn't exist in the array, create a new entry
    if (!found) {
      this.shapeElements.push({
        shape: childElement.name,
        elements: [childElement],
      });
    }
  };

  /**
   * @description Checks the stroke and fill color of an SVG element to group it by color.
   * @param {INode} childElement - The SVG element to check.
   * @returns {void}
   */
  checkElementBasedOnColor = (childElement: INode) => {
    this.checkElementStrokeColor(childElement);
    this.checkElementFillColor(childElement);
  };

  /**
   * @description Extracts the stroke color from an element's 'stroke' attribute or 'style' property,
   * converts it to RGB, and adds it to the color-grouped list.
   * @param {INode} childElement - The SVG element to check for a stroke color.
   * @returns {void}
   */
  checkElementStrokeColor = (childElement: INode) => {
    let rgbColor;
    // for stroke attribute
    if (childElement.attributes.stroke) {
      const color = childElement.attributes.stroke;
      rgbColor = convertColorToRgb(color);
    } else if (childElement.attributes.style) {
      // Extract the stroke value from the style attribute
      const strokeValueMatch = childElement.attributes.style.match(
        /stroke:\s*(.*?)(?:;|$)/
      );
      const color = strokeValueMatch ? strokeValueMatch[1] : null;
      // check if there is a color value and convert it to rgb color
      if (color && color !== 'none') {
        rgbColor = convertColorToRgb(color);
      }
    }

    // add a new color
    if (rgbColor) {
      this.addColorToElement(childElement, rgbColor);
    }
  };

  /**
   * @description Extracts the fill color from an element's 'fill' attribute or 'style' property.
   * If no color is found, it defaults to black. The color is then converted to RGB
   * and the element is added to the color-grouped list.
   * @param {INode} childElement - The SVG element to check for a fill color.
   * @returns {void}
   */
  checkElementFillColor = (childElement: INode) => {
    let rgbColor;
    if (childElement.attributes.fill) {
      // for fill attribute
      const color = childElement.attributes.fill;
      rgbColor = convertColorToRgb(color);
    } else if (childElement.attributes.style) {
      // Extract the fill value from the style attribute
      const fillValueMatch =
        childElement.attributes.style.match(/fill:\s*(.*?)(?:;|$)/);
      const color = fillValueMatch ? fillValueMatch[1] : null;
      // check if there is a color value and convert it to rgb color
      if (color && color !== 'none') {
        rgbColor = convertColorToRgb(color);
      } else {
        rgbColor = Constants.RGB_COLOR.BLACK;
      }
    } else {
      // there is no fill attribute give it a black color
      rgbColor = Constants.RGB_COLOR.BLACK;
    }

    // add new element based on color value
    if (rgbColor) {
      this.addColorToElement(childElement, rgbColor);
    }
  };

  /**
   * @description Adds an element to a group based on its RGB color. If the color group doesn't
   * exist in the `colorElements` array, it creates a new one. It ensures an element is not added twice
   * (e.g., from both stroke and fill).
   * @param {INode} childElement - The SVG element to be added.
   * @param {string} rgbColor - The RGB color string to group the element by.
   * @returns {void}
   */
  addColorToElement = (childElement: INode, rgbColor: string) => {
    let found = false;

    this.colorElements.forEach((element) => {
      // If the color already exists in the array
      if (element.color === rgbColor) {
        // check if it is not already added from stroke before
        if (!element.elements.includes(childElement)) {
          element.elements.push(childElement);
        }
        found = true; // Set flag to indicate color was found
      }
    });

    // If the color doesn't exist in the array, create a new entry
    if (!found) {
      this.colorElements.push({
        color: rgbColor,
        elements: [childElement],
      });
    }
  };
}
