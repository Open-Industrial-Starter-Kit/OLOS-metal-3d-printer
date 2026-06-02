<template>
  <div class="column q-gutter-y-md">
    <div class="row col items-center q-gutter-x-md">
      <span class="sub-text-size">Algorithm:</span>
      <q-select
        square
        outlined
        dense
        behavior="menu"
        :options="Object.values(Constants.DITHERING_ALGORITHMS)"
        v-model="ditheringAlgorithm"
        class="row col"
        @update:model-value="(newVal: string) => emit('update:algorithm', newVal)"
      />
    </div>

    <div
      v-if="ditheringAlgorithm === Constants.DITHERING_ALGORITHMS.GRID"
      class="row col items-center q-gutter-x-md"
    >
      <span class="sub-text-size">Grid settings:</span>
      <div class="row col q-gutter-x-lg">
        <div class="row col items-center q-gutter-x-lg">
          <span>Block Size:</span>
          <q-slider
            v-model="ditheringBlockSize"
            :min="
              props.config?.laser_cutter_settings?.gcode_generator
                .dithering_settings.grid_algorithm.block_size.min
            "
            :max="
              props.config?.laser_cutter_settings?.gcode_generator
                .dithering_settings.grid_algorithm.block_size.max
            "
            :step="0.1"
            snap
            label
            :label-value="ditheringBlockSize + ' px'"
            label-always
            color="primary"
            class="row col"
            @update:model-value="(newVal: string) => emit('update:blockSize', newVal)"
          />
        </div>
        <div class="row col items-center q-gutter-x-lg">
          <span>Block Distance:</span>
          <q-slider
            v-model="ditheringBlockDistance"
            :min="
              props.config?.laser_cutter_settings?.gcode_generator
                .dithering_settings.grid_algorithm.block_distance.min
            "
            :max="
              props.config?.laser_cutter_settings?.gcode_generator
                .dithering_settings.grid_algorithm.block_distance.max
            "
            :step="0.1"
            snap
            label
            :label-value="ditheringBlockDistance + ' px'"
            label-always
            color="primary"
            class="row col"
            @update:model-value="
              (newVal: string) => emit('update:blockDistance', newVal)
            "
          />
        </div>
      </div>
    </div>

    <div class="row col items-center q-gutter-x-md">
      <span class="sub-text-size">Resolution:</span>
      <q-input
        ref="resolutionInputElement"
        v-model.number="ditheringResolution"
        :min="
          props.config?.laser_cutter_settings?.gcode_generator
            .dithering_settings.resolution.min
        "
        :max="
          props.config?.laser_cutter_settings?.gcode_generator
            .dithering_settings.resolution.max
        "
        outlined
        dense
        class="row col"
        suffix="DPI"
        :error-message="errorMessage()"
        :error="!isValidDitheringResolution"
        @touchstart="
          virtualKeyboardStore.handleInputTouchStart(
            addNewThicknessCardElement ?? null,
            resolutionInputElement
          )
        "
        @blur="virtualKeyboardStore.handleInputBlur"
        @change.capture="handleChangeResolutionValue"
        data-kioskboard-specialcharacters="true"
      />
    </div>
    <div class="row col items-center q-gutter-x-md">
      <span class="sub-text-size">Gray Shift:</span>
      <q-slider
        v-model="ditheringGrayShift"
        :min="-255"
        :max="255"
        :step="1"
        snap
        label
        :label-value="ditheringGrayShift"
        label-always
        color="grey-7"
        track-color="grey-1"
        class="row col"
        @update:model-value="(newVal: string) => emit('update:grayShift', newVal)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { Constants } from 'src/constants';
import { Config } from 'src/interfaces/configSettings.interface';
import { ref, watch } from 'vue';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';
import { QInput, QCard } from 'quasar';

/**
 * Defines the props for the component.
 *
 * @property {Config | null} config - The machine's configuration settings.
 * @property {QCard | null} [addNewThicknessCardElement] - Optional reference to a card element, for virtual keyboard placement.
 * @property {string} algorithm - The currently selected dithering algorithm.
 * @property {number} resolution - The current dithering resolution value.
 * @property {number} grayShift - The current gray shift value.
 * @property {number} blockSize - The current block size value.
 * @property {number} blockDistance - The current block distance value.
 * @property {boolean} isValidResolution - A flag indicating if the resolution value is valid.
 */
const props = defineProps<{
  config: Config | null;
  addNewThicknessCardElement?: QCard | null;
  algorithm: string;
  resolution: number;
  grayShift: number;
  blockSize: number;
  blockDistance: number;
  isValidResolution: boolean;
}>();

/**
 * Defines the events emitted by this component.
 *
 * @event update:algorithm - Emitted when the dithering algorithm changes.
 * @event update:resolution - Emitted when the resolution value changes.
 * @event update:grayShift - Emitted when the gray shift value changes.
 * @event update:blockSize - Emitted when the block size value changes.
 * @event update:blockDistance - Emitted when the block distance value changes.
 * @event update:isValidResolution - Emitted when the validity of the resolution changes.
 */
const emit = defineEmits([
  'update:algorithm',
  'update:resolution',
  'update:grayShift',
  'update:blockSize',
  'update:blockDistance',
  'update:isValidResolution',
]);

// Access the Pinia store for the virtual keyboard.
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Reactive references for the dithering settings.
 * These are initialized with the values from the props.
 */
const ditheringAlgorithm = ref<string>(props.algorithm);
const ditheringResolution = ref<number>(props.resolution);
const ditheringGrayShift = ref<number>(props.grayShift);
const ditheringBlockSize = ref<number>(props.blockSize);
const ditheringBlockDistance = ref<number>(props.blockDistance);

/**
 * A reactive variable to track the validity of the dithering resolution.
 * It is initialized with the value from the prop.
 * @type {ref<boolean>}
 */
const isValidDitheringResolution = ref<boolean>(props.isValidResolution);

/**
 * Reactive reference to the resolution input element for virtual keyboard integration.
 * @type {ref<QInput | null>}
 */
const resolutionInputElement = ref<QInput | null>(null);

/**
 * Handles the change event for the resolution input field.
 *
 * This function sanitizes the input value using the virtual keyboard store,
 * updates the `ditheringResolution` reactive variable, and emits the new value
 * to the parent component. It also performs validation against the `config` prop
 * to determine if the new resolution is within the allowed range and updates
 * the `isValidDitheringResolution` flag.
 *
 * @param {KeyboardEvent | TouchEvent} event - The input event from the virtual keyboard.
 */
const handleChangeResolutionValue = (event: KeyboardEvent | TouchEvent) => {
  ditheringResolution.value =
    virtualKeyboardStore.handleSanitizeNumberInput(event);

  emit('update:resolution', ditheringResolution.value);

  // Perform validation
  isValidDitheringResolution.value = props.config?.laser_cutter_settings
    ? ditheringResolution.value <=
        props.config.laser_cutter_settings.gcode_generator.dithering_settings
          .resolution.max &&
      ditheringResolution.value >
        props.config.laser_cutter_settings.gcode_generator.dithering_settings
          .resolution.min
    : false;
};

/**
 * Generates a dynamic error message for the resolution input field.
 *
 * This computed property constructs a user-friendly error message based on
 * the minimum and maximum allowed values for the resolution, which are
 * fetched from the `config` prop.
 *
 * @returns {string | undefined} - The error message string, or `undefined` if `config` is not available.
 */
const errorMessage = () => {
  if (props.config?.laser_cutter_settings) {
    const minValue =
      props.config.laser_cutter_settings.gcode_generator.dithering_settings
        .resolution.min;
    const maxValue =
      props.config.laser_cutter_settings.gcode_generator.dithering_settings
        .resolution.max;
    return `The value should be between ${minValue} and ${maxValue}`;
  }
};

/**
 * A watcher that observes changes to `isValidDitheringResolution`.
 *
 * When the validity state of the resolution changes, this watcher
 * automatically emits the `update:isValidResolution` event to the parent
 * component, ensuring the parent is always aware of the validation status.
 */
watch(isValidDitheringResolution, (newIsValidDitheringResolution) => {
  emit('update:isValidResolution', newIsValidDitheringResolution);
});
</script>
