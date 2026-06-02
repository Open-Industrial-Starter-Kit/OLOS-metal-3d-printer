<template>
  <div class="column q-my-sm flex-center full-width">
    <span class="sub-text-size">Job Position</span>
    <div class="row full-width justify-evenly">
      <div class="column col-xs-12 col-sm-6 col-md-4 items-center">
        <span class="sub-text-size">X</span>
        <div
          :class="[
            { 'cursor-pointer': machineState === Constants.IDLE },
            'rounded-borders',
            'q-pa-sm',
          ]"
          style="font-size: 2vh; border: dotted 1px"
        >
          {{ jobPosition.x }}

          <q-popup-edit
            v-model="jobPosition.x"
            buttons
            persistent
            label-set="SET"
            label-cancel="CANCEL"
            v-slot="scope"
            :disable="machineState !== Constants.IDLE"
            @save="handleXSetPosition"
          >
            <q-input
              ref="jobPositionXInputElement"
              v-model.number="scope.value"
              hint="Advance user only!"
              dense
              @keyup.enter="scope.set"
              @keydown="virtualKeyboardStore.handleSanitizeNumberInput"
              @touchstart="
                virtualKeyboardStore.handleInputTouchStart(
                  null,
                  jobPositionXInputElement
                )
              "
              @blur="virtualKeyboardStore.handleInputBlur"
              @change.capture="(event: KeyboardEvent | TouchEvent) => (scope.value = virtualKeyboardStore.handleSanitizeNumberInput(event))"
              data-kioskboard-specialcharacters="true"
              class="position-metric"
              input-style="font-size: 2vh"
            />
          </q-popup-edit>
        </div>
      </div>
      <div class="column col-xs-12 col-sm-6 col-md-4 items-center">
        <span class="sub-text-size">Y</span>
        <div
          :class="[
            { 'cursor-pointer': machineState === Constants.IDLE },
            'rounded-borders',
            'q-pa-sm',
          ]"
          style="font-size: 2vh; border: dotted 1px"
        >
          {{ jobPosition.y }}

          <q-popup-edit
            v-model="jobPosition.y"
            buttons
            persistent
            label-set="SET"
            label-cancel="CANCEL"
            v-slot="scope"
            :disable="machineState !== Constants.IDLE"
            @save="handleYSetPosition"
          >
            <q-input
              ref="jobPositionYInputElement"
              v-model.number="scope.value"
              hint="Advance user only!"
              dense
              @keyup.enter="scope.set"
              @keydown="virtualKeyboardStore.handleSanitizeNumberInput"
              @touchstart="
                virtualKeyboardStore.handleInputTouchStart(
                  null,
                  jobPositionYInputElement
                )
              "
              @blur="virtualKeyboardStore.handleInputBlur"
              @change.capture="(event: KeyboardEvent | TouchEvent) => (scope.value = virtualKeyboardStore.handleSanitizeNumberInput(event))"
              data-kioskboard-specialcharacters="true"
              class="position-metric"
              input-style="font-size: 2vh"
            />
          </q-popup-edit>
        </div>
      </div>
      <div
        v-if="config?.machine_type !== Constants.MACHINE_TYPE.VINYL_CUTTER"
        class="column col-xs-12 col-sm-6 col-md-4 items-center"
      >
        <span class="sub-text-size">Z</span>
        <div
          :class="[
            { 'cursor-pointer': machineState === Constants.IDLE },
            'rounded-borders',
            'q-pa-sm',
          ]"
          style="font-size: 2vh; border: dotted 1px"
        >
          {{ jobPosition.z }}

          <q-popup-edit
            v-model="jobPosition.z"
            buttons
            persistent
            label-set="SET"
            label-cancel="CANCEL"
            v-slot="scope"
            :disable="machineState !== Constants.IDLE"
            @save="handleZSetPosition"
          >
            <q-input
              ref="jobPositionZInputElement"
              v-model.number="scope.value"
              hint="Advance user only!"
              dense
              @keyup.enter="scope.set"
              @keydown="virtualKeyboardStore.handleSanitizeNumberInput"
              @touchstart="
                virtualKeyboardStore.handleInputTouchStart(
                  null,
                  jobPositionZInputElement
                )
              "
              @blur="virtualKeyboardStore.handleInputBlur"
              @change.capture="(event: KeyboardEvent | TouchEvent) => (scope.value = virtualKeyboardStore.handleSanitizeNumberInput(event))"
              data-kioskboard-specialcharacters="true"
              class="position-metric"
              input-style="font-size: 2vh"
            />
          </q-popup-edit>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { QPopupEdit, QInput } from 'quasar';
import { Constants } from 'src/constants';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';
import { executeNormalGCommands } from 'src/services/execute.commands.service';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { Config } from 'src/interfaces/configSettings.interface';

/**
 * Defines the props for the component.
 *
 * @property {Config | null} config - The machine's configuration settings.
 */
defineProps<{
  config: Config | null;
}>();

// Access Pinia stores for machine status and the virtual keyboard.
const machineStatusStore = useMachineStatusStore();
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Destructures reactive properties from the store using `storeToRefs`.
 */
const { machineState, jobPosition } = storeToRefs(machineStatusStore);

/**
 * Reactive references to the Quasar Input components for each axis.
 * These are used to programmatically interact with the input fields,
 * such as to focus them when the virtual keyboard is needed.
 */
const jobPositionXInputElement = ref<QInput | null>(null);
const jobPositionYInputElement = ref<QInput | null>(null);
const jobPositionZInputElement = ref<QInput | null>(null);

/**
 * Handles setting the new X job position.
 *
 * It sends a `G92 X...` command to the machine to set the new coordinate system offset and updates the corresponding value in the `machineStatusStore`.
 * @param {string} value - The new X coordinate value from the input.
 */
const handleXSetPosition = (value: string) => {
  if (value !== '') {
    executeNormalGCommands('G92 X' + value);
    machineStatusStore.setXJobPosition(parseFloat(value));
  }
};

/**
 * Handles setting the new Y job position.
 *
 * It sends a `G92 Y...` command to the machine to set the new coordinate system offset and updates the corresponding value in the `machineStatusStore`.
 * @param {string} value - The new Y coordinate value from the input.
 */
const handleYSetPosition = (value: string) => {
  if (value !== '') {
    executeNormalGCommands('G92 Y' + value);
    machineStatusStore.setYJobPosition(parseFloat(value));
  }
};

/**
 * Handles setting the new Z job position.
 *
 * It sends a `G92 Z...` command to the machine to set the new coordinate system offset and updates the corresponding value in the `machineStatusStore`.
 * @param {string} value - The new Z coordinate value from the input.
 */
const handleZSetPosition = (value: string) => {
  if (value !== '') {
    executeNormalGCommands('G92 Z' + value);
    machineStatusStore.setZJobPosition(parseFloat(value));
  }
};
</script>
<style scoped>
.position-metric {
  font-size: x-large;
  font-weight: 500;
}
</style>
