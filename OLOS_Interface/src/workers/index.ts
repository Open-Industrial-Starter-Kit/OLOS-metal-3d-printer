import imageWorker from 'src/workers/image.editor.worker?worker&inline';
import svgWorker from 'src/workers/svg.editor.worker?worker&inline';
import previewWorker from 'src/workers/gcode.previewer.worker?worker&inline';
import sliceWorker from 'src/workers/slice.previewer.worker?worker&inline';

/**
 * @function getImageWorker
 * @description Creates and returns a new instance of the image editor web worker.
 * @returns {Worker} A new image editor worker instance.
 */
export const getImageWorker = () => {
  return new imageWorker();
};

/**
 * @function getSVGWorker
 * @description Creates and returns a new instance of the SVG editor web worker.
 * @returns {Worker} A new SVG editor worker instance.
 */
export const getSVGWorker = () => {
  return new svgWorker();
};

/**
 * @function getPreviewerWorker
 * @description Creates and returns a new instance of the G-code previewer web worker.
 * @returns {Worker} A new G-code previewer worker instance.
 */
export const getPreviewerWorker = () => {
  return new previewWorker();
};

/**
 * @function getSliceWorker
 * @description Creates and returns a new instance of the slice previewer web worker.
 * @returns {Worker} A new slice previewer worker instance.
 */
export const getSliceWorker = () => {
  return new sliceWorker();
};
