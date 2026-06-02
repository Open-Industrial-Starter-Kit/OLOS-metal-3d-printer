<template>
  <div class="full-width q-pa-lg">
    <div
      :class="{
        disabled:
          machineState === Constants.RUN || machineState === Constants.HOLD,
      }"
    >
      <jobs-files-uploader v-if="config?.remote_file_uploader" />
      <jobs-files-table />
      <jobs-files-buttons />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useMachineStatusStore } from 'src/stores/machine-status';
import { useUSBMonitorStore } from 'src/stores/usb-monitor';
import { useTabsStore } from 'src/stores/active-tab';
import JobsFilesButtons from './components/JobsFilesButtons.vue';
import JobsFilesTable from './components/JobsFilesTable.vue';
import JobsFilesUploader from './components/JobsFilesUploader.vue';
import { storeToRefs } from 'pinia';
import { Constants } from 'src/constants';
import { useRouter } from 'vue-router';
import { onMounted, ref, watch } from 'vue';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { Config } from 'src/interfaces/configSettings.interface';

// Get the Vue Router instance
const router = useRouter();

/**
 * Reactive variable to hold the application configuration.
 * @type {ref<Config | null>}
 */
const config = ref<Config | null>(null);

// Access Pinia stores for machine status, tabs, and USB monitoring.
const machineStore = useMachineStatusStore();
const tabsStore = useTabsStore();
const usbMonitorStore = useUSBMonitorStore();

/**
 * Destructures reactive properties from the stores using `storeToRefs`.
 */
const { machineState } = storeToRefs(machineStore);
const { navList } = storeToRefs(tabsStore);
const { isUSBStorageConnected } = storeToRefs(usbMonitorStore);

/**
 * A watcher that monitors the machine's state.
 *
 * If the machine state changes to `RUN` or `HOLD` and the user is not
 * already on the controls tab, it programmatically switches to the controls tab.
 */
watch(machineState, (newState) => {
  if (
    (newState === Constants.RUN || newState === Constants.HOLD) &&
    router.currentRoute.value.path !== '/controls'
  ) {
    tabsStore.changeTab(navList.value.controls);
  }
});

/**
 * A watcher that monitors the USB connection status.
 *
 * When a USB storage device is connected, it displays a dialog to the user.
 * Conversely, when the device is disconnected, it closes the dialog.
 */
watch(isUSBStorageConnected, (newIsUSBStorageConnected) => {
  if (newIsUSBStorageConnected) {
    usbMonitorStore.showJobUSBFilesDialog();
  } else {
    usbMonitorStore.closeJobUSBFilesDialog();
  }
});

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

<style scoped>
.disabled {
  pointer-events: none;
  opacity: 0.1;
}
</style>
