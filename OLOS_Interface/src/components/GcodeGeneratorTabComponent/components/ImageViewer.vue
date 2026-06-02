<template>
  <q-card class="fit relative-position" flat bordered>
    <transition
      appear
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
    >
      <div ref="imageViewerArea" class="column overflow-hidden">
        <div
          v-if="!imageToGcodeConvertorStore.generatorImagesDataList.length"
          class="column fit q-ma-md items-center q-gutter-y-xl"
        >
          <media-source-choices
            :config
            :media-type="Constants.MEDIA_TYPES.IMAGES"
          />
        </div>

        <div
          ref="result"
          class="result-container self-center"
          @wheel="handleWheelZoom"
          @touchstart="handleTouchZoom"
        >
          <div ref="stageContainer" id="stage" class="zoom-container"></div>
        </div>
      </div>
    </transition>

    <q-inner-loading :showing="imageToGcodeConvertorStore.isImageLoading">
      <q-spinner-gears size="100" color="primary" />
      <p class="text-h5 q-pa-md">Please wait...</p>
    </q-inner-loading>
  </q-card>
</template>
<script setup lang="ts">
import { Constants } from 'src/constants';
import MediaSourceChoices from 'src/components/GcodeGeneratorTabComponent/components/components/MediaSourceChoices.vue';
import { drawSVGOnCanvas } from 'src/services/svg.editor.service';
import { drawImageOnCanvas } from 'src/services/image.editor.service';
import { onMounted, ref, watch } from 'vue';
import { useImageToGcodeConvertor } from 'src/stores/image-to-gcode';
import { Config } from 'src/interfaces/configSettings.interface';

// Zoom level variables
let zoomLevel = 1;
const maxZoomLevel = 10;

// Access the Pinia store for image-to-G-code conversion.
const imageToGcodeConvertorStore = useImageToGcodeConvertor();

// Reactive references to the DOM elements for the viewer and canvas.
const imageViewerArea = ref<HTMLDivElement | null>(null);
const stageContainer = ref<HTMLDivElement | null>(null);
const result = ref<HTMLElement | null>(null);

/**
 * Defines the props for the component.
 *
 * @property {Config | null} config - The global application configuration, used for image drawing.
 */
const props = defineProps<{
  config: Config | null;
}>();

/**
 * Handles the mouse wheel event for zooming.
 *
 * It prevents the default scroll behavior and calls the `handleZoom` function.
 * @param {WheelEvent} e - The mouse wheel event.
 */
const handleWheelZoom = (e: WheelEvent) => {
  e.preventDefault();
  if (result.value) {
    handleZoom(e.deltaY, e.clientX, e.clientY);
  }
};

/**
 * Handles the multi-touch event for zooming on touch devices.
 *
 * It calculates the distance between two touches to determine the zoom direction
 * and factor, then calls the `handleZoom` function.
 * @param {TouchEvent} e - The touch event.
 */
const handleTouchZoom = (e: TouchEvent) => {
  if (e.cancelable) {
    e.preventDefault();
  }

  if (result.value) {
    const touches = e.touches;
    if (touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      let prevTouchDistance = Math.sqrt(
        Math.pow(touch1.clientX - touch2.clientX, 2) +
          Math.pow(touch1.clientY - touch2.clientY, 2)
      );

      const handleTouchMove = (moveEvent: TouchEvent) => {
        const moveTouches = moveEvent.touches;
        if (moveTouches.length === 2) {
          const moveTouch1 = moveTouches[0];
          const moveTouch2 = moveTouches[1];
          const touchDistance = Math.sqrt(
            Math.pow(moveTouch1.clientX - moveTouch2.clientX, 2) +
              Math.pow(moveTouch1.clientY - moveTouch2.clientY, 2)
          );
          const deltaY = touchDistance - prevTouchDistance;
          handleZoom(
            -deltaY,
            (moveTouch1.clientX + moveTouch2.clientX) / 2,
            (moveTouch1.clientY + moveTouch2.clientY) / 2
          );
          prevTouchDistance = touchDistance;
        }
      };

      const handleTouchEnd = () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };

      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
  }
};

/**
 * Performs the actual zooming and pans the view to the new center.
 *
 * It calculates the new zoom level based on the scroll direction (`deltaY`) and
 * applies a CSS `transform: scale()` to the viewer element. The `transform-origin`
 * is set to the cursor position to provide a "zoom-to-point" effect.
 *
 * @param {number} deltaY - The vertical scroll amount. A positive value means scrolling down (zoom out), negative means scrolling up (zoom in).
 * @param {number} clientX - The X coordinate of the cursor or touch center.
 * @param {number} clientY - The Y coordinate of the cursor or touch center.
 */
const handleZoom = (deltaY: number, clientX: number, clientY: number) => {
  const zoomFactor = deltaY > 0 ? 0.9 : 1.1;

  if (result.value) {
    const rect = result.value.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const offsetX = (mouseX / rect.width) * 100;
    const offsetY = (mouseY / rect.height) * 100;

    const newZoomLevel = zoomLevel * zoomFactor;
    zoomLevel = Math.max(1, Math.min(maxZoomLevel, newZoomLevel));

    result.value.style.transformOrigin = `${offsetX}% ${offsetY}%`;
    result.value.style.transform = `scale(${zoomLevel})`;
  }
};

/**
 * A watcher that monitors for changes in the active image's modified state.
 *
 * This watcher is triggered whenever a user modifies an SVG or raster image,
 * such as applying a `cut`, `mark`, or `engrave` profile. It then redraws the
 * corresponding image or SVG onto a new canvas and updates the Konva stage.
 * If all modifications are removed, it reverts to showing the original source image.
 *
 * @param {[SVGGraphicsElement| null, SVGGraphicsElement| null , HTMLImageElement| null]} [newCuttingImage, newMarkingImage, newEngravingImage] - The new states of the modified images.
 */
watch(
  () => [
    imageToGcodeConvertorStore.activeImage?.modifiedSVGCutting,
    imageToGcodeConvertorStore.activeImage?.modifiedSVGMarking,
    imageToGcodeConvertorStore.activeImage?.modifiedEngravingImage,
  ],
  async ([newCuttingImage, newMarkingImage, newEngravingImage]) => {
    // Handling cut modifications
    if (newCuttingImage) {
      const svgCanvas = await drawSVGOnCanvas(
        newCuttingImage as SVGGraphicsElement,
        props.config
      );
      await imageToGcodeConvertorStore.addModifiedImage(
        svgCanvas,
        Constants.PROFILE_OPTIONS.CUT
      );
    } else if (newCuttingImage === null) {
      await imageToGcodeConvertorStore.removeModifiedImage(
        Constants.PROFILE_OPTIONS.CUT
      );
    }

    // Handling mark modifications
    if (newMarkingImage) {
      const svgCanvas = await drawSVGOnCanvas(
        newMarkingImage as SVGGraphicsElement,
        props.config
      );
      await imageToGcodeConvertorStore.addModifiedImage(
        svgCanvas,
        Constants.PROFILE_OPTIONS.MARK
      );
    } else if (newMarkingImage === null) {
      await imageToGcodeConvertorStore.removeModifiedImage(
        Constants.PROFILE_OPTIONS.MARK
      );
    }

    // Handling engraving modifications
    if (newEngravingImage) {
      const imageCanvas = drawImageOnCanvas(
        newEngravingImage as HTMLImageElement,
        props.config
      );
      await imageToGcodeConvertorStore.addModifiedImage(
        imageCanvas,
        Constants.PROFILE_OPTIONS.ENGRAVE
      );
    } else if (newEngravingImage === null) {
      await imageToGcodeConvertorStore.removeModifiedImage(
        Constants.PROFILE_OPTIONS.ENGRAVE
      );
    }

    // If no modifications are active, show the original image.
    if (
      newCuttingImage === null &&
      newMarkingImage === null &&
      newEngravingImage === null
    ) {
      imageToGcodeConvertorStore.showSourceImageNode();
    }
  }
);

/**
 * Lifecycle hook `onMounted`.
 *
 * This hook is called when the component is first mounted. It sets the image
 * viewer area in the Konva helper store and checks if a Konva stage already exists,
 * showing it if so.
 */
onMounted(() => {
  // set image viewer container
  if (imageViewerArea.value) {
    imageToGcodeConvertorStore.konvaHelper.setImageViewerArea(
      imageViewerArea.value
    );
  }
  // show stage if it is already created
  if (stageContainer.value) {
    imageToGcodeConvertorStore.konvaHelper.showStageIfExist(
      stageContainer.value
    );
  }
});
</script>
<style scoped>
.remove-image {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
}
.result-container {
  transition: 0.5s ease;
  background-color: white;
}
.zoom-container {
  transition: 0.3s ease;
  min-width: 30vw;
}
</style>
