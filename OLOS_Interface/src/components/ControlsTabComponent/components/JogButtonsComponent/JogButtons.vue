<template>
  <div class="row fit rounded-borders">
    <div class="row fit bg-grey-4 rounded-borders">
      <xy-jogging-buttons :is-disabled="isJoggingButtonsDisabled()" />
      <z-jogging-buttons
        v-if="config?.machine_type !== Constants.MACHINE_TYPE.VINYL_CUTTER"
        :is-disabled="isJoggingButtonsDisabled()"
      />
      <return-to-zero-buttons :is-disabled="isJoggingButtonsDisabled()" />
      <rest-to-zero-buttons :config :is-disabled="isJoggingButtonsDisabled()" />
    </div>
  </div>
</template>
<script setup lang="ts">
import xyJoggingButtons from './components/XYJoggingButtons.vue';
import zJoggingButtons from './components/ZJoggingButtons.vue';
import RestToZeroButtons from './components/RestToZeroButtons.vue';
import ReturnToZeroButtons from './components/ReturnToZeroButtons.vue';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { storeToRefs } from 'pinia';
import { Constants } from 'src/constants';
import { Config } from 'src/interfaces/configSettings.interface';

// Access machine status store
const store = useMachineStatusStore();
const { machineState } = storeToRefs(store);

/**
 * Props:
 * - config: Config | null — machine configuration, can be used to customize behavior based on machine type.
 */
defineProps<{
  config: Config | null;
}>();

/**
 * Determines whether jogging buttons should be disabled.
 * Jogging is only enabled when the machine is in the `IDLE` state.
 *
 * @returns boolean - true if buttons should be disabled, false otherwise
 */
const isJoggingButtonsDisabled = () => {
  return machineState.value !== Constants.IDLE;
};
</script>
