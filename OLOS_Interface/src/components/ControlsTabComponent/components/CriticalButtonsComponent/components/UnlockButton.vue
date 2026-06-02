<template>
  <q-btn
    icon="lock_open"
    label="Unlock"
    stack
    color="grey-4"
    text-color="black"
    class="col items-center q-py-md"
    style="font-size: 1.5vh"
    @click="unlockMachine()"
    :disable="isUnlockBtnDisabled()"
  />
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Constants } from 'src/constants';
import { executeNormalGCommands } from 'src/services/execute.commands.service';
import { useMachineStatusStore } from 'src/stores/machine-status';

/**
 * Access machine state from the store.
 */
const store = useMachineStatusStore();
const { machineState } = storeToRefs(store);

/**
 * Determines if the "Unlock" button should be disabled.
 * - Enabled only when the machine is in ALARM state.
 *
 * @returns boolean - true if button should be disabled.
 */
const isUnlockBtnDisabled = () => machineState.value !== Constants.ALARM;

/**
 * Sends the GRBL unlock command to the machine.
 */
const unlockMachine = () => {
  executeNormalGCommands(Constants.GRBL_COMMAND_UNLOCK);
};
</script>
