<template>
  <div class="column flex-center col-lg-4 col-md-4 col-sm col-xs-12 q-pb-md">
    <div class="row q-gutter-md">
      <div class="column self-center justify-around">
        <div class="row q-gutter-x-md q-pb-md">
          <q-btn
            label="X0"
            color="white"
            stack
            text-color="blue-grey-10"
            class="button-size"
            push
            @click="resetXToZero"
            :disable="isDisabled"
          />
          <q-btn
            label="Y0"
            color="white"
            stack
            text-color="blue-grey-10"
            class="button-size"
            push
            @click="resetYToZero"
            :disable="isDisabled"
          />
        </div>
        <q-btn
          label="XY0"
          color="white"
          stack
          text-color="blue-grey-10"
          class="wide-button-size"
          push
          @click="resetXYToZero"
          :disable="isDisabled"
        />
      </div>
      <q-btn
        v-if="config?.machine_type !== Constants.MACHINE_TYPE.VINYL_CUTTER"
        label="Z0"
        color="white"
        stack
        class="long-button-size"
        text-color="blue-grey-10"
        push
        @click="resetZToZero"
        :disable="isDisabled"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { Constants } from 'src/constants';
import { Config } from 'src/interfaces/configSettings.interface';
import { executeNormalGCommands } from 'src/services/execute.commands.service';
import { useMachineStatusStore } from 'src/stores/machine-status';

/**
 * Props:
 * - isDisabled: boolean — disables buttons when true.
 * - config: Config | null — machine configuration, can be used to customize behavior based on machine type.
 */
defineProps<{
  isDisabled: boolean;
  config: Config | null;
}>();

// Access the machine status store
const store = useMachineStatusStore();

/**
 * Resets the X-axis position to zero.
 * Sends the GRBL command to the machine and updates the store.
 */
const resetXToZero = () => {
  executeNormalGCommands(Constants.GRBL_COMMAND_RESET_ZERO_X);
  store.resetXJobPosition();
};

/**
 * Resets the Y-axis position to zero.
 * Sends the GRBL command to the machine and updates the store.
 */
const resetYToZero = () => {
  executeNormalGCommands(Constants.GRBL_COMMAND_RESET_ZERO_Y);
  store.resetYJobPosition();
};

/**
 * Resets both X and Y axes to zero.
 * Sends the combined GRBL command and updates the store.
 */
const resetXYToZero = () => {
  executeNormalGCommands(Constants.GRBL_COMMAND_RESET_ZERO_XY);
  store.resetXYJobPosition();
};

/**
 * Resets the Z-axis position to zero.
 * Sends the GRBL command to the machine and updates the store.
 */
const resetZToZero = () => {
  executeNormalGCommands(Constants.GRBL_COMMAND_RESET_ZERO_Z);
  store.resetZJobPosition();
};
</script>

<style scoped>
.button-size {
  font-size: 1.5vh;
  width: 7vh;
  height: 7vh;

  i {
    padding: 0;
    margin: -5;
  }
}
.wide-button-size {
  font-size: 1.5vh;
  height: 7vh;
}
.long-button-size {
  font-size: 1.5vh;
  width: 7vh;
}
</style>
