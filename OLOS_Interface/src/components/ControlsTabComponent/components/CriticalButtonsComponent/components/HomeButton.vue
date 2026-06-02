<template>
  <q-btn
    icon="home"
    label="Homing"
    stack
    color="grey-4"
    text-color="black"
    class="col q-mb-md q-pa-lg"
    style="font-size: 1.5vh"
    @click="homingMachine()"
    :disable="isHomeBtnDisabled()"
  />
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Constants } from 'src/constants';
import { executeNormalGCommands } from 'src/services/execute.commands.service';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { Config } from 'src/interfaces/configSettings.interface';

/**
 * Props
 * - config: machine configuration object, containing machine type and other settings.
 */
const props = defineProps<{
  config: Config | null;
}>();

/**
 * Machine status store - holds current state of the machine.
 */
const store = useMachineStatusStore();
const { machineState } = storeToRefs(store);

/**
 * Checks whether the "Home" button should be disabled.
 * - Enabled only if the machine is in IDLE or ALARM state.
 *
 * @returns boolean - true if button should be disabled.
 */
const isHomeBtnDisabled = () => {
  return (
    machineState.value !== Constants.IDLE &&
    machineState.value !== Constants.ALARM
  );
};

/**
 * Sends the homing command to the machine.
 *
 * - If the machine type is a vinyl cutter:
 *    - Executes vinyl cutter homing command.
 *    - Resets XY zero position.
 * - Otherwise:
 *    - Executes standard GRBL homing command.
 */
const homingMachine = () => {
  if (props.config?.machine_type === Constants.MACHINE_TYPE.VINYL_CUTTER) {
    executeNormalGCommands(Constants.GRBL_COMMAND_HOMING_VINYL_CUTTER);
    executeNormalGCommands(Constants.GRBL_COMMAND_RESET_ZERO_XY);
  } else {
    executeNormalGCommands(Constants.GRBL_COMMAND_HOMING);
  }
};
</script>
