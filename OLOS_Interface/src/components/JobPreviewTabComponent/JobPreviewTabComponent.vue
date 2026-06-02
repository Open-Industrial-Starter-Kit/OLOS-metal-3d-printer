<template>
  <div class="column" style="height: 100vh">
    <div v-if="isFileOpen" class="row fit">
      <main-buttons
        v-if="
          config?.machine_type !== Constants.MACHINE_TYPE.CNC &&
          config?.machine_type !== Constants.MACHINE_TYPE.THREE_D_PRINTER
        "
      />
      <graph-component />
      <cnc-camera-stream
        v-if="
          config?.machine_type === Constants.MACHINE_TYPE.CNC &&
          config?.cnc_settings?.cameras_enabled
        "
      />
    </div>
    <div v-else class="row fit message-text flex-center">
      There is no file opened to preview. Please try to open a file from the
      file manager to be able to preview the job.
    </div>
  </div>
</template>
<script setup lang="ts">
import MainButtons from './components/MainButtons.vue';
import CncCameraStream from './components/CncCameraStream.vue';
import GraphComponent from './components/GraphComponent.vue';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { Constants } from 'src/constants';
import { storeToRefs } from 'pinia';
import { onBeforeMount, onMounted, ref, watch } from 'vue';
import { executeNormalGCommands } from 'src/services/execute.commands.service';
import { useQuasar, DialogChainObject } from 'quasar';
import { Config } from 'src/interfaces/configSettings.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { useJobInfoStore } from 'src/stores/job-info';
import { useJobsFilesManagementStore } from 'src/stores/jobs-files-management';

// Use Quasar's hook to access its plugins.
const $q = useQuasar();

// Access Pinia stores for application state management.
const machineStatusStore = useMachineStatusStore();
const jobInfoStore = useJobInfoStore();
const jobsFilesManagementStore = useJobsFilesManagementStore();

/**
 * Destructures reactive properties from the stores using `storeToRefs`.
 */
const { machineState, machinePosition } = storeToRefs(machineStatusStore);
const { isJobEnded } = storeToRefs(jobInfoStore);
const { isFileOpen } = storeToRefs(jobsFilesManagementStore);

/**
 * Reactive variable to hold the application configuration.
 * @type {ref<Config | null>}
 */
const config = ref<Config | null>(null);

/**
 * Variable to hold the Quasar dialog instance for machine parking.
 * @type {DialogChainObject | null}
 */
let parkingDialog: DialogChainObject | null = null;

/**
 * Parks the machine to a predefined position if it's currently idle and not already parked.
 *
 * This function sends a series of G-code commands to move the machine's Y and Z
 * axes to their parking positions as defined in the configuration. It then
 * resets the job position and shows a waiting dialog.
 */
const parkTheMachine = () => {
  if (
    machineState.value === Constants.IDLE &&
    machinePosition.value.z !== undefined &&
    (Math.round(machinePosition.value.y) !==
      config.value?.laser_cutter_settings?.job_previewer.parking_settings?.point
        .y ||
      Math.round(machinePosition.value.z) !==
        config.value?.laser_cutter_settings?.job_previewer.parking_settings
          ?.point.z)
  ) {
    // Set feed rate
    executeNormalGCommands(
      'G1F' +
        config.value?.laser_cutter_settings?.job_previewer.parking_settings
          ?.feed_rate
    );
    // Move Z-axis to parking position
    executeNormalGCommands(
      'G53' +
        'Z' +
        config.value?.laser_cutter_settings?.job_previewer.parking_settings
          ?.point.z
    );
    // Move Y-axis to parking position
    executeNormalGCommands(
      'G53' +
        'Y' +
        config.value?.laser_cutter_settings?.job_previewer.parking_settings
          ?.point.y
    );
    // Reset XYZ zero position
    executeNormalGCommands(Constants.GRBL_COMMAND_RESET_ZERO_XYZ);
    // Reset the job position in the store
    machineStatusStore.resetXYZJobPosition();
    // Show the "waiting to park" dialog
    showWaitingToFinishParkingDialog();
  }
};

/**
 * Displays a persistent Quasar dialog to inform the user that the machine is parking.
 */
const showWaitingToFinishParkingDialog = () => {
  parkingDialog = $q.dialog({
    title: 'Please wait until the machine finishes parking...',
    persistent: true,
    ok: false,
    style: {
      fontSize: '10px',
      width: '50vw',
      textAlign: 'center',
    },
  });
};

/**
 * Scrolls the window to the bottom of the page.
 * This is used for vinyl cutters to ensure the full view is visible.
 */
const scrollToBottom = () => {
  window.scrollTo(0, document.body.scrollHeight);
};

/**
 * A watcher that observes the machine's state.
 *
 * It is used to hide the `parkingDialog` when the machine transitions to an
 * idle, door-open, or alarm state, indicating that the parking sequence has
 * either completed or been interrupted.
 */
watch(
  machineState,
  (newState) => {
    if (
      (newState === Constants.IDLE ||
        newState === Constants.DOOR ||
        newState === Constants.ALARM) &&
      parkingDialog
    ) {
      parkingDialog.hide();
      parkingDialog = null;
    }
  },
  { immediate: true }
);

/**
 * A watcher that observes the `isJobEnded` flag.
 *
 * If a job ends and the machine is a laser cutter with parking enabled,
 * it triggers the `parkTheMachine` function to move the machine back to its
 * parking position.
 */
watch(isJobEnded, () => {
  if (
    config.value?.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER &&
    config.value.laser_cutter_settings?.job_previewer.parking_settings
  ) {
    parkTheMachine();
  }
});

/**
 * Lifecycle hook `onBeforeMount`.
 *
 * This hook is called before the component is mounted. It loads the application
 * configuration and, if the machine is a laser cutter with parking enabled and
 * a file is open, it immediately triggers the `parkTheMachine` function.
 */
onBeforeMount(async () => {
  config.value = await configurationSettings();
  if (
    config.value.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER &&
    config.value.laser_cutter_settings?.job_previewer.parking_settings
      ?.parking_enabled &&
    isFileOpen.value
  ) {
    parkTheMachine();
  }
});

/**
 * Lifecycle hook `onMounted`.
 *
 * This hook is called when the component is first mounted. It loads the
 * configuration and, if the machine is a vinyl cutter, it automatically
 * scrolls the page to the bottom to bring the control panel into view.
 */
onMounted(async () => {
  config.value = await configurationSettings();
  if (config.value.machine_type === Constants.MACHINE_TYPE.VINYL_CUTTER) {
    scrollToBottom();
  }
});
</script>
<style>
.message-text {
  text-align: center;
  font-size: 3vh;
}
</style>
