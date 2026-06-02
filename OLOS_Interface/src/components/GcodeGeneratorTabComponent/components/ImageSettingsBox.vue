<template>
  <q-card flat bordered class="fit">
    <image-settings-buttons :config="config" />
    <q-expansion-item
      v-model="expandMetrics"
      dense-toggle
      header-style="fontSize: 2vh;"
    >
      <template v-slot:header>
        <q-item-section> Image Settings </q-item-section>
      </template>
      <template v-slot:default>
        <div class="row q-pa-md q-gutter-y-md sub-text-size">
          <div class="row fit items-start justify-between">
            <div
              class="row col-lg col-md-6 col-sm-12 col-xs-12 items-center q-gutter-x-md"
            >
              <span class="text-bold">Image Name:</span>
              <div class="q-pa-sm">{{ imageName }}</div>
            </div>
            <div
              class="row col-lg col-md-6 col-sm-12 col-xs-12 items-center q-gutter-x-md"
            >
              <span class="text-bold">Number of Image Copies:</span>
              <div class="q-pa-sm">{{ numberOfImageCopies }}</div>
            </div>
          </div>

          <q-separator class="full-width" />

          <div class="row fit items-start justify-between">
            <div
              class="column col-lg col-md-6 col-sm-12 col-xs-12 q-gutter-y-md"
            >
              <div class="row items-center q-gutter-x-md">
                <span class="text-bold">Original Width:</span>
                <div class="q-pa-sm">{{ imageOriginalWidth }} mm</div>
              </div>
              <div class="row items-center q-gutter-x-md">
                <span class="text-bold">Original Height:</span>
                <div class="q-pa-sm">{{ imageOriginalHeight }} mm</div>
              </div>
            </div>

            <div
              class="column col-lg col-md-6 col-sm-12 col-xs-12 q-pb-md q-gutter-y-md"
            >
              <div class="row items-center q-gutter-x-md">
                <span class="text-bold">X:</span>
                <div class="rounded-borders q-pa-sm cursor-pointer edit-box">
                  {{ parseFloat(imagePositionX) }} mm
                  <q-popup-edit
                    v-model="imagePositionX"
                    buttons
                    persistent
                    label-set="Save"
                    label-cancel="Close"
                    v-slot="scope"
                    :validate="isImagePositionXValid"
                    @save="saveImagePositionX"
                  >
                    <q-input
                      ref="imagePositionXInputElement"
                      v-model.number="scope.value"
                      dense
                      suffix="mm"
                      :error="errorImagePositionX"
                      :error-message="errorImagePositionXMessage"
                      @keyup.enter="scope.set"
                      @keydown="virtualKeyboardStore.handleSanitizeNumberInput"
                      @touchstart="
                        virtualKeyboardStore.handleInputTouchStart(
                          null,
                          imagePositionXInputElement
                        )
                      "
                      @blur="virtualKeyboardStore.handleInputBlur"
                      @change.capture="(event: KeyboardEvent | TouchEvent) => (scope.value = virtualKeyboardStore.handleSanitizeNumberInput(event))"
                      data-kioskboard-specialcharacters="true"
                      class="position-metric"
                    />
                  </q-popup-edit>
                </div>
              </div>
              <div class="row items-center q-gutter-x-md">
                <span class="text-bold">Y:</span>
                <div class="rounded-borders q-pa-sm cursor-pointer edit-box">
                  {{ parseFloat(imagePositionY) }}
                  mm
                  <q-popup-edit
                    v-model="imagePositionY"
                    buttons
                    label-set="Save"
                    label-cancel="Close"
                    v-slot="scope"
                    :validate="isImagePositionYValid"
                    @save="saveImagePositionY"
                  >
                    <q-input
                      ref="imagePositionYInputElement"
                      v-model="scope.value"
                      dense
                      suffix="mm"
                      :error="errorImagePositionY"
                      :error-message="errorImagePositionYMessage"
                      @keyup.enter="scope.set"
                      @keydown="virtualKeyboardStore.handleSanitizeNumberInput"
                      @touchstart="
                        virtualKeyboardStore.handleInputTouchStart(
                          null,
                          imagePositionYInputElement
                        )
                      "
                      @blur="virtualKeyboardStore.handleInputBlur"
                      @change.capture="(event: KeyboardEvent | TouchEvent) => (scope.value = virtualKeyboardStore.handleSanitizeNumberInput(event))"
                      data-kioskboard-specialcharacters="true"
                      class="position-metric"
                    />
                  </q-popup-edit>
                </div>
              </div>
            </div>
            <div
              class="row items-center col-lg col-md-6 col-sm-12 col-xs-12 q-pb-md q-gutter-x-md"
            >
              <div class="column">
                <span class="text-bold flip-vertical self-center">L</span>
                <q-btn
                  :icon="isScaleLocked ? 'lock_open' : 'lock'"
                  text-color="black"
                  class="bg-white q-pa-xs"
                  color="bg-white"
                  outline
                  push
                  size="1vh"
                  @click="changeScaleValues"
                >
                  <q-tooltip class="bg-black">{{
                    isScaleLocked ? 'Unlock Scale' : 'Lock Scale'
                  }}</q-tooltip>
                </q-btn>
                <span class="text-bold self-center">L</span>
              </div>
              <div class="column q-gutter-y-md">
                <div class="row items-center q-gutter-x-md">
                  <span class="text-bold">Scaled Width:</span>
                  <div class="rounded-borders q-pa-sm cursor-pointer edit-box">
                    {{ parseInt(imageScaledWidth) }} mm
                    <q-popup-edit
                      v-model="imageScaledWidth"
                      buttons
                      persistent
                      label-set="Save"
                      label-cancel="Close"
                      v-slot="scope"
                      :validate="isScaledWidthValid"
                      @save="saveScaledWidth"
                    >
                      <q-input
                        ref="imageScaledWidthInputElement"
                        v-model.number="scope.value"
                        inputmode="numeric"
                        mask="####"
                        dense
                        suffix="mm"
                        :error="errorScaledWidth"
                        :error-message="errorScaledWidthMessage"
                        @keyup.enter="scope.set"
                        @keydown="
                          virtualKeyboardStore.handleSanitizeNumberInput
                        "
                        @touchstart="
                          virtualKeyboardStore.handleInputTouchStart(
                            null,
                            imageScaledWidthInputElement
                          )
                        "
                        @blur="virtualKeyboardStore.handleInputBlur"
                        @change.capture="(event: KeyboardEvent | TouchEvent) => (scope.value = virtualKeyboardStore.handleSanitizeNumberInput(event))"
                        data-kioskboard-specialcharacters="true"
                        class="position-metric"
                      />
                    </q-popup-edit>
                  </div>
                </div>
                <div class="row items-center q-gutter-x-md">
                  <span class="text-bold">Scaled Height:</span>
                  <div class="rounded-borders q-pa-sm cursor-pointer edit-box">
                    {{
                      parseInt(imageScaledHeight) > 0
                        ? parseInt(imageScaledHeight)
                        : -parseInt(imageScaledHeight)
                    }}
                    mm
                    <q-popup-edit
                      v-model="imageScaledHeight"
                      buttons
                      persistent
                      label-set="Save"
                      label-cancel="Close"
                      v-slot="scope"
                      :validate="isScaledHeightValid"
                      @save="saveScaledHeight"
                    >
                      <q-input
                        ref="imageScaledHeightInputElement"
                        v-model.number="scope.value"
                        inputmode="numeric"
                        mask="####"
                        dense
                        suffix="mm"
                        :error="errorScaledHeight"
                        :error-message="errorScaledHeightMessage"
                        @keyup.enter="scope.set"
                        @keydown="
                          virtualKeyboardStore.handleSanitizeNumberInput
                        "
                        @touchstart="
                          virtualKeyboardStore.handleInputTouchStart(
                            null,
                            imageScaledHeightInputElement
                          )
                        "
                        @blur="virtualKeyboardStore.handleInputBlur"
                        @change.capture="(event: KeyboardEvent | TouchEvent) => (scope.value = virtualKeyboardStore.handleSanitizeNumberInput(event))"
                        data-kioskboard-specialcharacters="true"
                        class="position-metric"
                      />
                    </q-popup-edit>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="column col-lg col-md-6 col-sm-12 col-xs-12 q-gutter-y-md"
            >
              <div class="row items-center q-gutter-x-md">
                <span class="text-bold">Rotation:</span>
                <div class="rounded-borders q-pa-sm cursor-pointer edit-box">
                  {{ imageRotation }}°
                  <q-popup-edit
                    v-model="imageRotation"
                    buttons
                    persistent
                    label-set="Save"
                    label-cancel="Close"
                    v-slot="scope"
                    :validate="isRotationError"
                    @save="saveRotation"
                  >
                    <q-input
                      ref="imageRotationInputElement"
                      v-model="scope.value"
                      dense
                      suffix="°"
                      :error="errorRotation"
                      :error-message="errorRotationMessage"
                      @keyup.enter="scope.set"
                      @keydown="virtualKeyboardStore.handleSanitizeNumberInput"
                      @touchstart="
                        virtualKeyboardStore.handleInputTouchStart(
                          null,
                          imageRotationInputElement
                        )
                      "
                      @blur="virtualKeyboardStore.handleInputBlur"
                      @change.capture="(event: KeyboardEvent | TouchEvent) => (scope.value = virtualKeyboardStore.handleSanitizeNumberInput(event))"
                      data-kioskboard-specialcharacters="true"
                      class="position-metric"
                    />
                  </q-popup-edit>
                </div>
                <q-btn
                  outline
                  icon="rotate_90_degrees_ccw"
                  class="q-pa-sm"
                  size="1.5vh"
                  :disable="!is90RotationValid"
                  :color="!is90RotationValid ? 'grey-4' : 'black'"
                  @click="rotate90Degree(false)"
                >
                  <q-tooltip class="bg-black">Rotate -90°</q-tooltip>
                </q-btn>
                <q-btn
                  outline
                  class="q-pa-sm"
                  size="1.5vh"
                  :disable="!is90RotationValid"
                  :color="!is90RotationValid ? 'grey-4' : 'black'"
                  @click="rotate90Degree()"
                >
                  <q-icon
                    name="rotate_90_degrees_ccw"
                    class="flip-horizontal"
                  />
                  <q-tooltip class="bg-black">Rotate +90°</q-tooltip>
                </q-btn>
              </div>
              <div class="row items-center q-gutter-x-md">
                <span class="text-bold">Flip:</span>
                <div class="row items-center q-gutter-x-sm">
                  <q-btn
                    outline
                    class="q-pa-sm"
                    size="1.5vh"
                    @click="flipVertically"
                  >
                    <q-icon name="flip" class="rotate-90" />
                  </q-btn>
                  <q-btn
                    outline
                    size="1.5vh"
                    class="q-pa-sm"
                    icon="flip"
                    @click="flipHorizontally"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </q-expansion-item>
  </q-card>
</template>
<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ImageMetrics } from 'src/interfaces/imageToGcode.interface';
import { Config } from 'src/interfaces/configSettings.interface';
import { getPlatformDimensions } from 'src/services/gcode.previewer.service/gcode.previewer.helper.service';
import { Constants } from 'src/constants';
import { useImageToGcodeConvertor } from 'src/stores/image-to-gcode';
import ImageSettingsButtons from 'src/components/GcodeGeneratorTabComponent/components/components/ImageSettingsButtons.vue';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';

import { QInput } from 'quasar';

/**
 * Defines the props for the component.
 *
 * @property {Config | null} config - The machines's configuration settings.
 */
const props = defineProps<{
  config: Config | null;
}>();

// Access Pinia stores for application state management.
const imageToGcodeConvertorStore = useImageToGcodeConvertor();
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * A computed property that returns the name of the active image.
 * @returns {string | undefined} - The image name or `undefined` if no image is active.
 */
const imageName = computed(
  () => imageToGcodeConvertorStore.activeImage?.imageName
);

/**
 * A computed property that counts the number of copies of the active image.
 * @returns {number} - The number of copies of the active image.
 */
const numberOfImageCopies = computed(() =>
  imageToGcodeConvertorStore.generatorImagesDataList.reduce(
    (count, imageData) => {
      if (imageName.value === imageData.imageName) {
        count += 1;
      }
      return count;
    },
    0
  )
);

/**
 * Reactive variables for the component's state.
 */
const expandMetrics = ref<boolean>(true);
const isScaleLocked = ref<boolean>(false);
const is90RotationValid = ref<boolean>(false);

/**
 * Reactive variables to hold the image metrics.
 * These are represented as strings to be used with `QInput` components.
 */
const imagePositionX = ref<string>('0');
const imagePositionY = ref<string>('0');
const imageOriginalWidth = ref<string>('0');
const imageOriginalHeight = ref<string>('0');
const imageScaledWidth = ref<string>('0');
const imageScaledHeight = ref<string>('0');
const imageRotation = ref<string>('0');

/**
 * Reactive references to the input elements for virtual keyboard integration.
 */
const imagePositionXInputElement = ref<QInput | null>(null);
const imagePositionYInputElement = ref<QInput | null>(null);
const imageScaledWidthInputElement = ref<QInput | null>(null);
const imageScaledHeightInputElement = ref<QInput | null>(null);
const imageRotationInputElement = ref<QInput | null>(null);

/**
 * Reactive flags and messages for input validation errors.
 */
const errorImagePositionX = ref<boolean>(false);
const errorImagePositionY = ref<boolean>(false);
const errorScaledWidth = ref<boolean>(false);
const errorScaledHeight = ref<boolean>(false);
const errorRotation = ref<boolean>(false);

const errorImagePositionXMessage = ref<string>('');
const errorImagePositionYMessage = ref<string>('');
const errorScaledWidthMessage = ref<string>('');
const errorScaledHeightMessage = ref<string>('');
const errorRotationMessage = ref<string>('');

/**
 * Saves and applies the new X position of the image.
 * @param {string} value - The new X position value.
 */
const saveImagePositionX = (value: string) => {
  imagePositionX.value = value;
  setImageMetrics();
};

/**
 * Saves and applies the new Y position of the image.
 * @param {string} value - The new Y position value.
 */
const saveImagePositionY = (value: string) => {
  imagePositionY.value = value;
  setImageMetrics();
};

/**
 * Saves and applies the new scaled width of the image.
 *
 * If the scale is locked, it also updates the height to maintain the aspect ratio.
 *
 * @param {string} value - The new scaled width value.
 */
const saveScaledWidth = (value: string) => {
  imageScaledWidth.value = value;
  if (isScaleLocked.value) {
    matchImageWidthScale();
  }
  setImageMetrics();
};

/**
 * Saves and applies the new scaled height of the image.
 *
 * If the scale is locked, it also updates the width to maintain the aspect ratio.
 *
 * @param {string} value - The new scaled height value.
 */
const saveScaledHeight = (value: string) => {
  imageScaledHeight.value = value;
  if (isScaleLocked.value) {
    matchImageHeightScale();
  }
  setImageMetrics();
};

/**
 * Saves and applies the new rotation of the image.
 * @param {string} value - The new rotation value.
 */
const saveRotation = (value: string) => {
  imageRotation.value = value;
  setImageMetrics();
};

/**
 * Flips the image vertically.
 */
const flipVertically = () => {
  imageScaledHeight.value = (
    -1 * parseFloat(imageScaledHeight.value)
  ).toString();
  setImageMetrics();
};

/**
 * Flips the image horizontally.
 *
 * This function also adjusts the rotation to reflect the horizontal flip.
 */
const flipHorizontally = () => {
  imageScaledHeight.value = (
    -1 * parseFloat(imageScaledHeight.value)
  ).toString();

  if (parseFloat(imageRotation.value) < 180) {
    imageRotation.value = (180 + parseFloat(imageRotation.value)).toFixed(2);
  } else {
    imageRotation.value = (parseFloat(imageRotation.value) - 180).toFixed(2);
  }
  setImageMetrics();
};

/**
 * Rotates the image by 90 degrees, either clockwise or counter-clockwise.
 * @param {boolean} [isClockWise=true] - A flag to determine the rotation direction.
 */
const rotate90Degree = (isClockWise = true) => {
  if (isClockWise) {
    imageRotation.value = (parseFloat(imageRotation.value) + 90).toString();
  } else {
    imageRotation.value = (parseFloat(imageRotation.value) - 90).toString();
  }
  if (parseFloat(imageRotation.value) < 0) {
    imageRotation.value = (parseFloat(imageRotation.value) + 360).toString();
  }

  if (parseFloat(imageRotation.value) >= 360) {
    imageRotation.value = (parseFloat(imageRotation.value) - 360).toString();
  }
  setImageMetrics();
};

/**
 * Validates the image's X position.
 * @param {string} val - The value to validate.
 * @returns {boolean} - `true` if the value is valid, `false` otherwise.
 */
const isImagePositionXValid = (val: string) => {
  let platformWidth =
    imageToGcodeConvertorStore.konvaHelper.stage?.width() ??
    Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.width;
  if (props.config) {
    platformWidth = getPlatformDimensions(props.config).platformWidth;
  }
  if (
    parseFloat(imageScaledWidth.value) / 2 <= parseFloat(val) &&
    parseFloat(val) <= platformWidth - parseFloat(imageScaledWidth.value) / 2
  ) {
    errorImagePositionX.value = false;
    return true;
  } else {
    errorImagePositionX.value = true;
    errorImagePositionXMessage.value = `Please Enter a value between ${(
      parseFloat(imageScaledWidth.value) / 2
    ).toFixed(2)} and ${(
      platformWidth -
      parseFloat(imageScaledWidth.value) / 2
    ).toFixed(2)}`;
    return false;
  }
};

/**
 * Validates the image's Y position.
 * @param {string} val - The value to validate.
 * @returns {boolean} - `true` if the value is valid, `false` otherwise.
 */
const isImagePositionYValid = (val: string) => {
  let platformHeight =
    imageToGcodeConvertorStore.konvaHelper.stage?.height() ??
    Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.height;
  if (props.config) {
    platformHeight = getPlatformDimensions(props.config).platformHeight;
  }
  if (
    parseFloat(imageScaledHeight.value) / 2 <= parseFloat(val) &&
    parseFloat(val) <= platformHeight - parseFloat(imageScaledHeight.value) / 2
  ) {
    errorImagePositionY.value = false;
    return true;
  } else {
    errorImagePositionY.value = true;
    errorImagePositionYMessage.value = `Please Enter a value between ${(
      parseFloat(imageScaledHeight.value) / 2
    ).toFixed(2)} and ${(
      platformHeight -
      parseFloat(imageScaledHeight.value) / 2
    ).toFixed(2)}`;
    return false;
  }
};

/**
 * Validates the scaled width of the image.
 * @param {string} val - The value to validate.
 * @returns {boolean} - `true` if the value is valid, `false` otherwise.
 */
const isScaledWidthValid = (val: string) => {
  let platformWidth =
    imageToGcodeConvertorStore.konvaHelper.stage?.width() ??
    Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.width;
  if (props.config) {
    platformWidth = getPlatformDimensions(props.config).platformWidth;
  }
  if (0 <= parseFloat(val) && parseFloat(val) <= platformWidth) {
    errorScaledWidth.value = false;
    return true;
  } else {
    errorScaledWidth.value = true;
    errorScaledWidthMessage.value = `Please Enter a value between 0 and ${platformWidth.toFixed(
      2
    )}`;
    return false;
  }
};

/**
 * Validates the scaled height of the image.
 * @param {string} val - The value to validate.
 * @returns {boolean} - `true` if the value is valid, `false` otherwise.
 */
const isScaledHeightValid = (val: string) => {
  let platformHeight =
    imageToGcodeConvertorStore.konvaHelper.stage?.height() ??
    Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.height;
  if (props.config) {
    platformHeight = getPlatformDimensions(props.config).platformHeight;
  }
  if (0 <= parseFloat(val) && parseFloat(val) <= platformHeight) {
    errorScaledHeight.value = false;
    return true;
  } else {
    errorScaledHeight.value = true;
    errorScaledHeightMessage.value = `Please Enter a value between 0 and ${platformHeight.toFixed(
      2
    )}`;
    return false;
  }
};

/**
 * Helper function to validate if a rotation value is valid without causing the image to exceed platform dimensions.
 * @param {string} val - The rotation value to validate.
 * @returns {boolean} - `true` if the rotation is valid, `false` otherwise.
 */
const isRotationValid = (val: string) => {
  if (
    props.config &&
    imageToGcodeConvertorStore.konvaHelper.stage?.width() &&
    imageToGcodeConvertorStore.konvaHelper.stage?.height()
  ) {
    const platformWidth = getPlatformDimensions(props.config).platformWidth;
    const platformHeight = getPlatformDimensions(props.config).platformHeight;

    // Convert to radians
    const rotationInRadians = (parseFloat(val) * Math.PI) / 180;

    // Calculate rotated bounding box dimensions
    const rotatedWidth =
      Math.abs(
        parseFloat(imageScaledWidth.value) * Math.cos(rotationInRadians)
      ) +
      Math.abs(
        parseFloat(imageScaledHeight.value) * Math.sin(rotationInRadians)
      );
    const rotatedHeight =
      Math.abs(
        parseFloat(imageScaledWidth.value) * Math.sin(rotationInRadians)
      ) +
      Math.abs(
        parseFloat(imageScaledHeight.value) * Math.cos(rotationInRadians)
      );

    // Validate against the stageConfig width and height
    if (rotatedWidth < platformWidth && rotatedHeight < platformHeight) {
      return true;
    }
    return false;
  }
  return false;
};

/**
 * Validates the rotation value and sets the appropriate error messages.
 * @param {string} val - The value to validate.
 * @returns {boolean} - `true` if the value is valid, `false` otherwise.
 */
const isRotationError = (val: string) => {
  if (isRotationValid(val)) {
    // rotation value bigger than 360 or lower that 0
    if (0 > parseFloat(val) || parseFloat(val) > 360) {
      errorRotation.value = true;
      errorRotationMessage.value = 'Please enter a value between 0 and 360';
      return false;
    } else {
      errorRotation.value = false;
      return true;
    }
  } else {
    errorRotation.value = true;
    errorRotationMessage.value =
      'The rotation will cause the image to exceed the viewer dimensions.';
  }
  return false;
};

/**
 * Toggles the scale lock state and updates the Konva transformer accordingly.
 */
const changeScaleValues = () => {
  setImageMetrics();
  isScaleLocked.value = !isScaleLocked.value;
  imageToGcodeConvertorStore.konvaHelper.changeEnabledTransformationAnchors(
    isScaleLocked.value
  );
};

/**
 * Adjusts the image height to maintain the aspect ratio when the width is changed.
 */
const matchImageWidthScale = () => {
  const scale =
    parseFloat(imageScaledWidth.value) /
    ((imageToGcodeConvertorStore.activeImage?.imageMetrics.width ?? 0) *
      (imageToGcodeConvertorStore.activeImage?.imageMetrics.scaleX ?? 0));

  let scaledHeight = parseFloat(imageScaledHeight.value) * scale;
  if (parseFloat(imageScaledHeight.value) < 0) {
    scaledHeight *= -1;
  }

  // Check against platform constraints
  let platformHeight =
    imageToGcodeConvertorStore.konvaHelper.stage?.height() ??
    Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.height;
  if (props.config) {
    platformHeight = getPlatformDimensions(props.config).platformHeight;
  }

  imageScaledHeight.value = Math.min(scaledHeight, platformHeight).toFixed(2);
};

/**
 * Adjusts the image width to maintain the aspect ratio when the height is changed.
 */
const matchImageHeightScale = () => {
  const scale =
    parseFloat(imageScaledHeight.value) /
    ((imageToGcodeConvertorStore.activeImage?.imageMetrics.height ?? 0) *
      (imageToGcodeConvertorStore.activeImage?.imageMetrics.scaleY ?? 0));
  let scaledWidth = parseFloat(imageScaledWidth.value) * scale;

  let platformWidth =
    imageToGcodeConvertorStore.konvaHelper.stage?.width() ??
    Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.width;
  if (props.config) {
    platformWidth = getPlatformDimensions(props.config).platformWidth;
  }

  imageScaledWidth.value = Math.min(scaledWidth, platformWidth).toFixed(2);
};

/**
 * Updates the image metrics on the Konva canvas.
 *
 * This function translates the user-provided string values for position, scale,
 * and rotation into a `ImageMetrics` object and passes it to the `konvaHelper`
 * to update the image on the canvas.
 */
const setImageMetrics = () => {
  const activeImage = imageToGcodeConvertorStore.activeImage;

  if (props.config && activeImage?.imageMetrics) {
    const { platformWidth, platformHeight } = getPlatformDimensions(
      props.config
    );
    const stageWidth =
      imageToGcodeConvertorStore.konvaHelper.stage?.width() ??
      Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.width;
    const stageHeight =
      imageToGcodeConvertorStore.konvaHelper.stage?.height() ??
      Constants.FALLBACK_GCODE_GENERATOR_STAGE_METRICS.height;

    const metrics: ImageMetrics = {
      ...activeImage.imageMetrics,
      x: parseFloat(imagePositionX.value) * (stageWidth / platformWidth),
      y: parseFloat(imagePositionY.value) * (stageHeight / platformHeight),
      scaleX:
        (parseFloat(imageScaledWidth.value) / activeImage.imageMetrics.width) *
        (stageWidth / platformWidth),
      scaleY:
        (parseFloat(imageScaledHeight.value) /
          activeImage.imageMetrics.height) *
        (stageHeight / platformHeight),
      rotation: parseFloat(imageRotation.value),
    };

    imageToGcodeConvertorStore.konvaHelper.updateMetricsManually(
      activeImage,
      metrics,
      props.config
    );
  }
};

/**
 * A watcher that synchronizes the component's reactive variables with the
 * `activeImage` data from the store.
 *
 * This ensures the UI reflects the current state of the active image on the canvas.
 * It also performs a validity check for 90-degree rotation.
 */
watch(
  () => imageToGcodeConvertorStore.activeImage,
  (newActiveImage) => {
    if (newActiveImage?.imageMetrics) {
      imagePositionX.value = newActiveImage.imageMetrics.x.toFixed(2);
      imagePositionY.value = newActiveImage.imageMetrics.y.toFixed(2);
      imageOriginalWidth.value = newActiveImage.imageMetrics.width.toFixed(2);
      imageOriginalHeight.value = newActiveImage.imageMetrics.height.toFixed(2);
      imageScaledWidth.value = Math.round(
        newActiveImage.imageMetrics.width * newActiveImage.imageMetrics.scaleX
      ).toString();
      imageScaledHeight.value = Math.round(
        newActiveImage.imageMetrics.height * newActiveImage.imageMetrics.scaleY
      ).toString();
      imageRotation.value = newActiveImage.imageMetrics.rotation.toFixed(2);

      // check if we can rotate the image 90 degrees for the buttons
      is90RotationValid.value = isRotationValid('90');
    }
  },
  { deep: true, immediate: true }
);
</script>
<style scoped>
.edit-box {
  border: dotted 1px;
}

.sub-text-size {
  font-size: 1.5vh;
}
</style>
