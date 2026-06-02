import * as THREE from 'three';
import {
  CSS2DObject,
  CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer';

/**
 * @description Creates a rectangular grid for a 3D scene using Three.js lines.
 * @param {number} platformWidth - Width of the grid.
 * @param {number} platformHeight - Height of the grid.
 * @param {number} graphStepSize - Distance between grid lines.
 * @returns {THREE.Group} A Three.js Group containing the grid lines.
 */
export const createCustomGrid = (
  platformWidth: number,
  platformHeight: number,
  graphStepSize: number
) => {
  const grid = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: 0x888888 });

  // Vertical lines
  for (
    let i = -platformWidth / 2;
    i < platformWidth / 2 + graphStepSize;
    i += graphStepSize
  ) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(i, 0, -platformHeight / 2),
      new THREE.Vector3(i, 0, platformHeight / 2),
    ]);
    const line = new THREE.Line(geometry, material);
    grid.add(line);
  }

  // Horizontal lines
  for (
    let i = -platformHeight / 2;
    i <= platformHeight / 2;
    i += graphStepSize
  ) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-platformWidth / 2, 0, i),
      new THREE.Vector3(platformWidth / 2, 0, i),
    ]);
    const line = new THREE.Line(geometry, material);
    grid.add(line);
  }

  return grid;
};

/**
 * @description Creates a circular grid with evenly spaced vertical and horizontal lines clipped to a circle, plus a border ring.
 * @param {number} radius - Radius of the circular grid.
 * @param {number} graphStepSize - Distance between grid lines.
 * @returns {THREE.Group} A Three.js Group containing the circular grid lines and border.
 */
export const createCircularGrid = (radius: number, graphStepSize: number) => {
  const grid = new THREE.Group();

  const gridMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });

  // Create vertical grid lines clipped to circle
  for (let x = -radius; x <= radius; x += graphStepSize) {
    const halfChord = Math.sqrt(radius * radius - x * x);
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0, -halfChord),
      new THREE.Vector3(x, 0, halfChord),
    ]);
    const line = new THREE.Line(geometry, gridMaterial);
    grid.add(line);
  }

  // Create horizontal grid lines clipped to circle
  for (let z = -radius; z <= radius; z += graphStepSize) {
    const halfChord = Math.sqrt(radius * radius - z * z);
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-halfChord, 0, z),
      new THREE.Vector3(halfChord, 0, z),
    ]);
    const line = new THREE.Line(geometry, gridMaterial);
    grid.add(line);
  }

  // Circular border using RingGeometry (visible thickness)
  const ringThickness = 0.02 * radius;
  const borderGeometry = new THREE.RingGeometry(
    radius - ringThickness / 2,
    radius + ringThickness / 2,
    128
  );
  const borderMaterial = new THREE.MeshBasicMaterial({
    color: 0x444444,
    side: THREE.DoubleSide,
  });
  const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
  borderMesh.rotation.x = -Math.PI / 2;
  borderMesh.position.y = 0;
  grid.add(borderMesh);
  return grid;
};

/**
 * @description Creates X, Y, and Z axis arrow helpers for visualization.
 * @param {number} platformWidth - Width of the scene, used for X-axis length.
 * @param {number} platformHeight - Height of the scene, used for Z-axis length.
 * @returns {THREE.ArrowHelper[]} Array containing the three axis helpers.
 */
export const create3DAxisHelpers = (
  platformWidth: number,
  platformHeight: number
) => {
  const arrowHelpers = [];

  // X-axis (red)
  const dirX = new THREE.Vector3(1, 0, 0);
  const origin = new THREE.Vector3(0, 0, 0);
  const lengthX = platformWidth + 200;
  const colorX = 0xff0000;
  const arrowHelperX = new THREE.ArrowHelper(dirX, origin, lengthX, colorX);
  arrowHelpers.push(arrowHelperX);

  // Y-axis (green)
  const dirY = new THREE.Vector3(0, 1, 0);
  const lengthY = 500;
  const colorY = 0x00ff00;
  const arrowHelperY = new THREE.ArrowHelper(dirY, origin, lengthY, colorY);
  arrowHelpers.push(arrowHelperY);

  // Z-axis (blue)
  const dirZ = new THREE.Vector3(0, 0, -1);
  const lengthZ = platformHeight + 200;
  const colorZ = 0x0000ff;
  const arrowHelperZ = new THREE.ArrowHelper(dirZ, origin, lengthZ, colorZ);
  arrowHelpers.push(arrowHelperZ);

  return arrowHelpers;
};

/**
 * @description Creates a CSS2DRenderer for rendering labels in the Three.js scene.
 * @param {number} platformWidth - Renderer width.
 * @param {number} platformHeight - Renderer height.
 * @returns {CSS2DRenderer} Configured label renderer.
 */
export const createLabelRenderer = (
  platformWidth: number,
  platformHeight: number
) => {
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(platformWidth, platformHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.pointerEvents = 'none';
  return labelRenderer;
};

/**
 * @description Creates dashed lines and measurement labels around a job object in the scene.
 * @param {THREE.Scene} scene - The Three.js scene to which the group will be added.
 * @param {THREE.Group} group - Group to hold dashed lines and labels.
 * @param {THREE.Group} jobGroup - Group containing the job object for bounding box calculation.
 * @param {number} platformWidth - Width of the platform.
 * @param {number} platformHeight - Height of the platform.
 * @returns {THREE.Group} The updated group with added lines and labels.
 */
export const createDashedLinesAndLabels = (
  scene: THREE.Scene,
  group: THREE.Group,
  jobGroup: THREE.Group,
  platformWidth: number,
  platformHeight: number
) => {
  if (jobGroup.children.length) {
    const bbox = new THREE.Box3().setFromObject(jobGroup);

    // Create dashed lines (same as before)
    const horizontalLineLeft = createDashedLine(
      new THREE.Vector3(-platformWidth / 2, 0, (bbox.max.z + bbox.min.z) / 2),
      new THREE.Vector3(bbox.min.x, 0, (bbox.max.z + bbox.min.z) / 2)
    );
    const horizontalLineRight = createDashedLine(
      new THREE.Vector3(bbox.max.x, 0, (bbox.max.z + bbox.min.z) / 2),
      new THREE.Vector3(platformWidth / 2, 0, (bbox.max.z + bbox.min.z) / 2)
    );
    const verticalLineTop = createDashedLine(
      new THREE.Vector3((bbox.max.x + bbox.min.x) / 2, 0, -platformHeight / 2),
      new THREE.Vector3((bbox.max.x + bbox.min.x) / 2, 0, bbox.min.z)
    );
    const verticalLineDown = createDashedLine(
      new THREE.Vector3((bbox.max.x + bbox.min.x) / 2, 0, platformHeight / 2),
      new THREE.Vector3((bbox.max.x + bbox.min.x) / 2, 0, bbox.max.z)
    );

    // Update X label position dynamically
    const xLabel = createTextLabel(
      (platformWidth / 2 - bbox.max.x).toFixed(2),
      new THREE.Vector3(bbox.max.x + 30, 0, (bbox.max.z + bbox.min.z) / 2 - 20)
    );

    // Update Y label position dynamically
    const yLabel = createTextLabel(
      (platformHeight / 2 + bbox.min.z).toFixed(2),
      new THREE.Vector3((bbox.max.x + bbox.min.x) / 2, 0, bbox.min.z - 20)
    );

    // Add lines and labels to the group
    group.add(horizontalLineLeft);
    group.add(horizontalLineRight);
    group.add(verticalLineTop);
    group.add(verticalLineDown);
    group.add(xLabel);
    group.add(yLabel);

    // Add the group to the scene
    scene.add(group);
  }
  // Return the group for further manipulation if necessary
  return group;
};

/**
 * @description Creates a CSS2DObject label with specified text and position.
 * @param {string} text - The text to display in the label.
 * @param {THREE.Vector3} position - The 3D position to place the label.
 * @returns {CSS2DObject} A Three.js CSS2DObject label.
 */
const createDashedLine = (start: THREE.Vector3, end: THREE.Vector3) => {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineDashedMaterial({
    color: 0x000000,
    dashSize: 5,
    gapSize: 5,
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  return line;
};

// Function to create text labels
export const createTextLabel = (text: string, position: THREE.Vector3) => {
  const div = document.createElement('div');
  // CSS for the labels
  div.textContent = text;
  div.style.cssText = `
  color: white;
  font-size: 15px;
  background-color: rgb(0, 0, 0, 0.7);
  padding: 2px;
  border-radius: 2px;
  `;
  const label = new CSS2DObject(div);
  label.position.copy(position);
  return label;
};
