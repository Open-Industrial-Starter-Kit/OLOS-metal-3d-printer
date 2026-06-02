<template>
  <div class="column q-gutter-y-md">
    <div class="row col items-center q-gutter-x-md">
      <span class="sub-text-size">Laser Power:</span>
      <q-input
        ref="laserPowerInputElement"
        v-model.number="laserPower"
        :min="config?.laser_cutter_settings?.gcode_generator.laser_power.min"
        :max="config?.laser_cutter_settings?.gcode_generator.laser_power.max"
        outlined
        dense
        suffix="%"
        :error-message="errorMessage()"
        :error="!isValidPower"
        class="row col"
        @touchstart="
          virtualKeyboardStore.handleInputTouchStart(
            props.addNewThicknessCardElement ?? null,
            laserPowerInputElement
          )
        "
        @blur="virtualKeyboardStore.handleInputBlur"
        @change.capture="handleChangePowerValue"
        data-kioskboard-specialcharacters="true"
      />
    </div>
    <div class="row col items-center q-gutter-x-md">
      <span class="sub-text-size">Movement Speed:</span>
      <q-input
        ref="movementSpeedInputElement"
        v-model.number="movementSpeed"
        :min="config?.laser_cutter_settings?.gcode_generator.movement_speed.min"
        :max="config?.laser_cutter_settings?.gcode_generator.movement_speed.max"
        outlined
        dense
        suffix="mm/min"
        :error-message="errorMessage(true)"
        :error="!isValidSpeed"
        class="row col"
        @touchstart="
          virtualKeyboardStore.handleInputTouchStart(
            props.addNewThicknessCardElement ?? null,
            movementSpeedInputElement
          )
        "
        @blur="virtualKeyboardStore.handleInputBlur"
        @change.capture="handleChangeSpeedValue"
        data-kioskboard-specialcharacters="true"
      />
    </div>
    <div class="row col q-gutter-x-md items-center">
      <span class="sub-text-size">Used Tool:</span>
      <div
        v-for="(toolName, toolNum) in config?.laser_cutter_settings?.tools"
        :key="toolNum"
        class="row col q-gutter-x-md items-center"
      >
        <q-radio
          v-model="laserTool"
          :val="toolName.name"
          :label="toolName.name"
          size="4vh"
          keep-color
          @update:model-value="(newValue: string) => emit('update:tool', newValue)"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Config } from 'src/interfaces/configSettings.interface';
import { ref, watch } from 'vue';
import { QInput, QCard } from 'quasar';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';

/**
 * Defines the props for the component.
 *
 * @property {Config | null} config - The machine configuration.
 * @property {QCard | null} [addNewThicknessCardElement] - Optional reference to a card element.
 * @property {number} power - The current laser power value.
 * @property {number} speed - The current movement speed value.
 * @property {string} tool - The currently selected laser tool.
 * @property {boolean} isValidPower - A flag indicating if the power value is valid.
 * @property {boolean} isValidSpeed - A flag indicating if the speed value is valid.
 */
const props = defineProps<{
  config: Config | null;
  addNewThicknessCardElement?: QCard | null;
  power: number;
  speed: number;
  tool: string;
  isValidPower: boolean;
  isValidSpeed: boolean;
}>();

/**
 * Defines the events emitted by this component.
 *
 * @event update:power - Emitted when the laser power value changes.
 * @event update:speed - Emitted when the movement speed value changes.
 * @event update:tool - Emitted when the laser tool changes.
 * @event update:isValidPower - Emitted when the validity of the power changes.
 * @event update:isValidSpeed - Emitted when the validity of the speed changes.
 */
const emit = defineEmits([
  'update:power',
  'update:speed',
  'update:tool',
  'update:isValidPower',
  'update:isValidSpeed',
]);

// Access the Pinia store for the virtual keyboard.
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Reactive references for the laser cutter settings.
 * These are initialized with the values from the props.
 */
const laserPower = ref<number>(props.power);
const movementSpeed = ref<number>(props.speed);
const laserTool = ref<string>(props.tool);

/**
 * Reactive variables to track the validity of the power and speed values.
 * They are initialized with the values from the props.
 */
const isValidLaserPower = ref<boolean>(props.isValidPower);
const isValidMovementSpeed = ref<boolean>(props.isValidSpeed);

/**
 * Reactive references to the input elements for virtual keyboard integration.
 */
const laserPowerInputElement = ref<QInput | null>(null);
const movementSpeedInputElement = ref<QInput | null>(null);

/**
 * Handles the change event for the movement speed input field.
 *
 * This function sanitizes the input, updates the `movementSpeed` reactive variable,
 * emits the new value, and validates it against the configuration to update the
 * `isValidMovementSpeed` flag.
 *
 * @param {KeyboardEvent | TouchEvent} event - The input event from the virtual keyboard.
 */
const handleChangeSpeedValue = (event: KeyboardEvent | TouchEvent) => {
  movementSpeed.value = virtualKeyboardStore.handleSanitizeNumberInput(event);

  emit('update:speed', movementSpeed.value);

  isValidMovementSpeed.value = props.config?.laser_cutter_settings
    ? movementSpeed.value <=
        props.config.laser_cutter_settings.gcode_generator.movement_speed.max &&
      movementSpeed.value >
        props.config.laser_cutter_settings.gcode_generator.movement_speed.min
    : false;
};

/**
 * Handles the change event for the laser power input field.
 *
 * This function sanitizes the input, updates the `laserPower` reactive variable,
 * emits the new value, and validates it against the configuration to update the
 * `isValidLaserPower` flag.
 *
 * @param {KeyboardEvent | TouchEvent} event - The input event from the virtual keyboard.
 */
const handleChangePowerValue = (event: KeyboardEvent | TouchEvent) => {
  laserPower.value = virtualKeyboardStore.handleSanitizeNumberInput(event);

  emit('update:power', laserPower.value);

  isValidLaserPower.value = props.config?.laser_cutter_settings
    ? laserPower.value <=
        props.config.laser_cutter_settings.gcode_generator.laser_power.max &&
      laserPower.value >
        props.config.laser_cutter_settings.gcode_generator.laser_power.min
    : false;
};

/**
 * Generates a dynamic error message for the speed or power input fields.
 *
 * This function returns a user-friendly error message based on the specified
 * validation range from the `config` prop.
 *
 * @param {boolean} [isSpeedError=false] - A flag to determine if the error message is for speed or power.
 * @returns {string | undefined} - The error message string, or `undefined` if `config` is not available.
 */
const errorMessage = (isSpeedError = false) => {
  if (isSpeedError && props.config?.laser_cutter_settings) {
    const minValue =
      props.config.laser_cutter_settings.gcode_generator.movement_speed.min;
    const maxValue =
      props.config.laser_cutter_settings.gcode_generator.movement_speed.max;
    return `The value should be between ${minValue} and ${maxValue}`;
  } else if (props.config?.laser_cutter_settings) {
    const minValue =
      props.config.laser_cutter_settings.gcode_generator.laser_power.min;
    const maxValue =
      props.config.laser_cutter_settings.gcode_generator.laser_power.max;
    return `The value should be between ${minValue} and ${maxValue}`;
  }
};

/**
 * A watcher that observes changes to `isValidLaserPower`.
 *
 * It emits the `update:isValidPower` event to the parent component when the
 * validity state changes.
 */
watch(isValidLaserPower, (newIsValidLaserPower) => {
  emit('update:isValidPower', newIsValidLaserPower);
});

/**
 * A watcher that observes changes to `isValidMovementSpeed`.
 *
 * It emits the `update:isValidSpeed` event to the parent component when the
 * validity state changes.
 */
watch(isValidMovementSpeed, (newIsValidLMovementSpeed) => {
  emit('update:isValidSpeed', newIsValidLMovementSpeed);
});
</script>
