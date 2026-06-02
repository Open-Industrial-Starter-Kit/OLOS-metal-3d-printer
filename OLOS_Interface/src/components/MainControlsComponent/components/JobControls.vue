<template>
  <div class="row justify-evenly full-width">
    <q-btn
      round
      color="white"
      text-color="black"
      :icon="startButtonStatus?.icon"
      size="3vh"
      :class="[
        'q-ma-sm',
        {
          'bg-blue-grey-2': startButtonStatus?.disabled,
        },
      ]"
      @click="startProcess()"
      :disable="startButtonStatus?.disabled"
      :loading="isFileLoading"
    />
    <q-btn
      round
      color="white"
      text-color="black"
      icon="stop"
      size="3vh"
      :class="[
        'q-ma-sm',
        {
          'bg-blue-grey-2': isStopBtnDisabled(),
        },
      ]"
      @click="stopProcess()"
      :disable="isStopBtnDisabled()"
    />
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useJobsFilesManagementStore } from 'src/stores/jobs-files-management';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { Constants } from 'src/constants';
import {
  executeNormalGCommands,
  executeRealTimeGCommands,
} from 'src/services/execute.commands.service';
import { onMounted, ref, watch } from 'vue';
import { useOverrideSettingsStore } from 'src/stores/override-settings';
import { useJobInfoStore } from 'src/stores/job-info';

import { Config } from 'src/interfaces/configSettings.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { useGcodePreviewStore } from 'src/stores/gcode-preview';
import { Gcode2DPreviewer } from 'src/services/gcode.previewer.service/gcode.2D.previewer.service';

// Access Pinia stores for application state management.
const jobManagerStore = useJobsFilesManagementStore();
const machineStatusStore = useMachineStatusStore();
const overrideSettingsStore = useOverrideSettingsStore();
const jobInfoStore = useJobInfoStore();
const gcodePreviewStore = useGcodePreviewStore();

/**
 * Destructures reactive properties from the stores using `storeToRefs`.
 */
const { isFileOpen, isFileExecuting, isFileLoading } =
  storeToRefs(jobManagerStore);
const { machineState, machinePosition } = storeToRefs(machineStatusStore);
const { gcodePreviewerInstance } = storeToRefs(gcodePreviewStore);

// Initialize notification service and config.
const notifyMessage = showNotifyMessage();
const config = ref<Config | null>(null);

/**
 * Determines the status of the "Start/Pause" button based on the machine's state.
 *
 * It returns an object with the button's icon and disabled state.
 * @returns {{ icon: string, disabled: boolean }} The status object.
 */
const getStartButtonStatus = () => {
  if (machineState.value === Constants.IDLE) {
    if (isFileOpen.value) {
      return {
        icon: 'play_arrow',
        disabled: false,
      };
    } else {
      return {
        icon: 'play_arrow',
        disabled: true,
      };
    }
  } else if (machineState.value === Constants.RUN) {
    return {
      icon: 'pause',
      disabled: false,
    };
  } else if (machineState.value === Constants.HOLD) {
    return {
      icon: 'mdi-play-pause',
      disabled: false,
    };
  } else if (machineState.value === Constants.DOOR) {
    return {
      icon: 'mdi-play-pause',
      disabled: false,
    };
  } else {
    return {
      icon: 'play_arrow',
      disabled: true,
    };
  }
};

/**
 * Reactive property to store the current status of the start button.
 */
const startButtonStatus = ref(getStartButtonStatus());

/**
 * A watcher that updates the start button's status whenever the machine state or file open status changes.
 */
watch([machineState, isFileOpen], () => {
  startButtonStatus.value = getStartButtonStatus();
});

/**
 * Checks if the "Stop" button should be disabled.
 * @returns {boolean} `true` if the button should be disabled, `false` otherwise.
 */
const isStopBtnDisabled = (): boolean => {
  return (
    machineState.value === Constants.IDLE ||
    machineState.value === Constants.ALARM ||
    machineState.value === Constants.DISCONNECTED
  );
};

/**
 * Stops the current process by sending a real-time GRBL command.
 */
const stopProcess = () => {
  executeRealTimeGCommands(Constants.GRBL_COMMAND_STOP);
  isFileExecuting.value = false;
};

/**
 * Handles the logic for starting, pausing, or resuming a job based on the machine's state.
 *
 * - If `IDLE`, it starts a new job, resets overrides, and checks for job preview coordinates.
 * - If `HOLD` or `DOOR`, it resumes the job.
 * - If `RUN`, it pauses the job.
 */
const startProcess = () => {
  isFileExecuting.value = true;
  if (machineState.value === Constants.IDLE) {
    overrideSettingsStore.defaultFeedRate();
    jobManagerStore
      .startFileExecution()
      .then(() => {
        gcodePreviewerInstance.value?.removeExecutionLayer();
        if (
          config.value?.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER
        ) {
          checkJobPreviewCoordinates();
          jobInfoStore.restJobProgress();
          overrideSettingsStore.defaultToolPower();
        } else if (
          config.value?.machine_type === Constants.MACHINE_TYPE.VINYL_CUTTER
        ) {
          overrideSettingsStore.defaultToolPower();
        } else if (config.value?.machine_type === Constants.MACHINE_TYPE.CNC) {
          overrideSettingsStore.defaultToolPower();
        }
      })
      .catch((error) => {
        notifyMessage.error(error.message);
      });
  } else if (
    machineState.value === Constants.HOLD ||
    machineState.value === Constants.DOOR
  ) {
    executeRealTimeGCommands(Constants.GRBL_COMMAND_RESUME);
  } else if (machineState.value === Constants.RUN) {
    executeRealTimeGCommands(Constants.GRBL_COMMAND_PAUSE);
  }
};

/**
 * Checks if the machine's current position matches the G-code job's starting coordinates.
 * If not, it moves the machine to the correct starting position.
 */
const checkJobPreviewCoordinates = () => {
  if (
    gcodePreviewerInstance.value instanceof Gcode2DPreviewer &&
    (machinePosition.value.x !==
      gcodePreviewerInstance.value.xJobStartingValue ||
      machinePosition.value.y !==
        gcodePreviewerInstance.value.yJobStartingValue)
  ) {
    moveMachineToJobPreviewCoordinate(
      gcodePreviewerInstance.value.xJobStartingValue,
      gcodePreviewerInstance.value.yJobStartingValue
    );
  }
};

/**
 * Sends G-code commands to move the machine to the specified coordinates relative to the current position.
 * @param {number} x - The target X coordinate.
 * @param {number} y - The target Y coordinate.
 */
const moveMachineToJobPreviewCoordinate = (x: number, y: number) => {
  executeNormalGCommands(Constants.GRBL_COMMAND_RESET_ZERO_XYZ);
  executeNormalGCommands(
    'G92' +
      'X' +
      (machinePosition.value.x - x).toFixed(2) +
      'Y' +
      (machinePosition.value.y - y).toFixed(2)
  );
  machineStatusStore.resetXYZJobPosition();
};

/**
 * Lifecycle hook `onMounted`.
 *
 * This hook is called when the component is first mounted. It loads the
 * application configuration asynchronously.
 */
onMounted(async () => {
  config.value = await configurationSettings();
});
</script>
