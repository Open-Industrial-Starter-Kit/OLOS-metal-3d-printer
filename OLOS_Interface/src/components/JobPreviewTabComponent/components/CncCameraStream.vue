<template>
  <div class="column fit q-gutter-y-md">
    <u class="row message-text text-bold">Webcam Stream:</u>
    <canvas
      v-if="cameraFrame"
      ref="webcamCanvas"
      class="fit camera-stream"
    ></canvas>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useGcodePreviewStore } from 'src/stores/gcode-preview';
import { ref, watch } from 'vue';

// A reactive reference to the HTML canvas element.
const webcamCanvas = ref<HTMLCanvasElement | null>(null);

// Access the Pinia store for G-code preview and webcam functionality.
const gcodePreviewStore = useGcodePreviewStore();
/**
 * Destructures the `cameraFrame` state from the store to make it reactive.
 */
const { cameraFrame } = storeToRefs(gcodePreviewStore);

/**
 * A watcher that observes the `cameraFrame` state.
 *
 * This watcher is triggered whenever a new camera frame is available. It creates
 * a new `Image` object, sets its source to the base64 string, and then draws
 * it onto the `webcamCanvas` once the image has loaded. This process is repeated
 * for each new frame, providing a continuous video stream.
 *
 * @param {string | null} newCameraFrame - The new base64 string for the camera frame.
 */
watch(cameraFrame, (newCameraFrame) => {
  if (newCameraFrame && webcamCanvas.value) {
    // Get the 2D rendering context of the canvas.
    const context = webcamCanvas.value.getContext('2d');
    // Create a new Image element to load the frame.
    const img = new Image();

    // Set arbitrary size for the image element; the canvas size determines the final display size.
    img.style.width = '100px';
    img.style.height = '100px';

    // Once the image is loaded, draw it onto the canvas.
    img.onload = function () {
      if (webcamCanvas.value)
        context?.drawImage(
          img,
          0,
          0,
          webcamCanvas.value.width,
          webcamCanvas.value.height
        );
    };
    // Set the source of the image to the new camera frame base64 string.
    img.src = newCameraFrame;
  }
});
</script>
<style scoped>
.camera-stream {
  width: 50%;
  height: 50%;
}
</style>
