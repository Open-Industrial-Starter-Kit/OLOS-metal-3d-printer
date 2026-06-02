<template>
  <q-btn
    icon="restart_alt"
    label="Soft Reset"
    stack
    color="grey-4"
    text-color="black"
    class="col items-center q-py-md"
    style="font-size: 1.5vh"
    @click="softResetMachine()"
    :disable="isSoftResetBtnDisabled()"
  />
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Constants } from 'src/constants';
import { executeNormalGCommands } from 'src/services/execute.commands.service';
import { useMachineStatusStore } from 'src/stores/machine-status';

/**
 * Store for accessing machine status and state.
 */
const store = useMachineStatusStore();
const { status, machineState } = storeToRefs(store);

/**
 * Checks if the "Soft Reset" button should be disabled.
 * - Disabled if the machine is currently in RUN state.
 *
 * @returns boolean - true if the button should be disabled.
 */
const isSoftResetBtnDisabled = () => {
  return machineState.value === Constants.RUN;
};

/**
 * Sends a GRBL soft reset command to the machine.
 * - Sets machine status to CONNECTING while reset is performed.
 */
const softResetMachine = () => {
  status.value.state = Constants.CONNECTING;
  executeNormalGCommands(Constants.GRBL_COMMAND_SOFT_RESET);
};
</script>
