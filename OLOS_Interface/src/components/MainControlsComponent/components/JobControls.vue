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
import { executeRealTimeGCommands } from 'src/services/execute.commands.service';
import { onMounted, ref, watch } from 'vue';
import { useOverrideSettingsStore } from 'src/stores/override-settings';
import { useJobInfoStore } from 'src/stores/job-info';

import { Config } from 'src/interfaces/configSettings.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { useGcodePreviewStore } from 'src/stores/gcode-preview';

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
const { machineState } = storeToRefs(machineStatusStore);
const { hasExecutionError } = storeToRefs(jobInfoStore);
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
  if (hasExecutionError.value) {
    return {
      icon: 'error',
      disabled: true,
    };
  }
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
      disabled: !isFileExecuting.value,
    };
  } else if (machineState.value === Constants.HOLD) {
    return {
      icon: 'play_arrow',
      disabled: !isFileExecuting.value,
    };
  } else if (machineState.value === Constants.DOOR) {
    return {
      icon: 'play_arrow',
      disabled: !isFileExecuting.value,
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
watch([machineState, isFileOpen, isFileExecuting, hasExecutionError], () => {
  startButtonStatus.value = getStartButtonStatus();
});

/**
 * Shows an error notification when GRBL rejects a command during execution.
 * The Play button changes to an error icon, but without this watcher the user
 * would have no visible indication of what was rejected.
 */
watch(hasExecutionError, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    const cmd = jobInfoStore.currentCommand;
    notifyMessage.error(cmd ? `Machine error: ${cmd}` : 'Machine rejected a command');
  }
});

/**
 * Checks if the "Stop" button should be disabled.
 * @returns {boolean} `true` if the button should be disabled, `false` otherwise.
 */
const isStopBtnDisabled = (): boolean => {
  if (isFileExecuting.value) {
    return false;
  }
  return (
    machineState.value === Constants.IDLE ||
    machineState.value === Constants.DISCONNECTED
  );
};

/**
 * Stops the current process by sending a real-time GRBL command.
 */
const stopProcess = () => {
  executeRealTimeGCommands(Constants.GRBL_COMMAND_STOP);
  isFileExecuting.value = false;
  jobInfoStore.markExecutionStopped();
};

/**
 * Handles the logic for starting, pausing, or resuming a job based on the machine's state.
 *
 * - If `IDLE`, it starts a new job and resets overrides.
 * - If `HOLD` or `DOOR`, it resumes the job.
 * - If `RUN`, it pauses the job.
 */
const startProcess = () => {
  // A rejected G-code line can leave GRBL reporting Idle while the backend
  // stream is paused. In that state Play must continue the existing stream,
  // not call Start again and rewind the file.
  if (
    isFileExecuting.value &&
    (machineState.value === Constants.IDLE ||
      machineState.value === Constants.HOLD ||
      machineState.value === Constants.DOOR)
  ) {
    executeRealTimeGCommands(Constants.GRBL_COMMAND_RESUME);
  } else if (
    isFileExecuting.value &&
    machineState.value === Constants.RUN
  ) {
    executeRealTimeGCommands(Constants.GRBL_COMMAND_PAUSE);
  } else if (machineState.value === Constants.IDLE) {
    isFileExecuting.value = true;
    overrideSettingsStore.defaultFeedRate();
    jobManagerStore
      .startFileExecution()
      .then(() => {
        gcodePreviewerInstance.value?.removeExecutionLayer();
        jobInfoStore.restJobProgress();
        if (
          config.value?.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER
        ) {
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
        isFileExecuting.value = false;
        notifyMessage.error(error.message);
      });
  }
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
