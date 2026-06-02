<template>
  <q-list class="column fit justify-center">
    <template v-for="(navItem, index) in navList" :key="index">
      <q-item
        :clickable="!isTabDisabled(navItem.label)"
        :active="tabsStore.isActiveTab(navItem)"
        @click="changeTab(navItem)"
        class="col-grow q-pa-sm"
        active-class="active-tab"
        v-if="showTab(navItem)"
      >
        <q-item-section
          class="column flex-center text-center"
          :class="{ 'disabled-tab': isTabDisabled(navItem.label) }"
        >
          <q-icon :name="navItem.icon" size="lg" />
          <p class="tab-font-size">{{ navItem.label }}</p>
        </q-item-section>
      </q-item>
    </template>
  </q-list>
</template>
<script setup lang="ts">
import { useTabsStore } from 'src/stores/active-tab';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { useJobsFilesManagementStore } from 'src/stores/jobs-files-management';
import { useUSBMonitorStore } from 'src/stores/usb-monitor';
import { useMediaFilesManagementStore } from 'src/stores/media-files-management';
import { storeToRefs } from 'pinia';
import { Constants } from 'src/constants';
import { onMounted, ref, watch } from 'vue';
import { NavTab } from 'src/interfaces/activeTabs.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { Config } from 'src/interfaces/configSettings.interface';

// Access Pinia stores for application state management.
const tabsStore = useTabsStore();
const machineStore = useMachineStatusStore();
const jobsFilesManagementStore = useJobsFilesManagementStore();
const usbMonitorStore = useUSBMonitorStore();
const mediaFilesManagementStore = useMediaFilesManagementStore();

/**
 * Destructures reactive properties from the stores using `storeToRefs`.
 */
const { isUSBStorageConnected } = storeToRefs(usbMonitorStore);
const { isUploadedMediaDialogShown } = storeToRefs(mediaFilesManagementStore);
const { navList } = storeToRefs(tabsStore);
const { machineState } = storeToRefs(machineStore);
const { isFileLoading, isFileExecuting } = storeToRefs(
  jobsFilesManagementStore
);

/**
 * Reactive variables for component state.
 *
 * @property {ref<Config | null>} config - The application configuration object.
 * @property {ref<boolean>} isFilesManagerDisabled - Flag to disable the Files Manager tab.
 * @property {ref<boolean>} isJobPreviewDisabled - Flag to disable the Job Preview tab.
 */
const config = ref<Config | null>(null);
const isFilesManagerDisabled = ref(false);
const isJobPreviewDisabled = ref(false);

/**
 * Checks the machine's state and file loading status to determine which tabs should be disabled.
 */
const checkIfTabsDisabled = () => {
  isFilesManagerDisabled.value =
    machineState.value === Constants.RUN ||
    machineState.value === Constants.HOLD;
  isJobPreviewDisabled.value = isFileLoading.value;
};

/**
 * A utility function to check if a specific tab should be disabled.
 * @param {string} label - The label of the navigation tab.
 * @returns {boolean} `true` if the tab should be disabled, otherwise `false`.
 */
const isTabDisabled = (label: string) => {
  if (label === 'Jobs Manager') {
    return isFilesManagerDisabled.value;
  } else if (label === 'Job Preview') {
    return isJobPreviewDisabled.value;
  } else if (label === 'Gcode Generator') {
    return isFileExecuting.value;
  }
  return false;
};

/**
 * Handles a tab change event.
 * It changes the active tab only if the selected tab is not disabled.
 * @param {NavTab} navItem - The navigation tab object.
 */
const changeTab = (navItem: NavTab) => {
  if (!isTabDisabled(navItem.label)) {
    tabsStore.changeTab(navItem);
  }
};

/**
 * Determines whether a specific tab should be shown based on the machine type.
 * For example, the G-code Generator is only shown for laser cutters, and the Slicer is only for 3D printers.
 * @param {NavTab} navItem - The navigation tab object.
 * @returns {boolean} `true` if the tab should be shown, otherwise `false`.
 */
const showTab = (navItem: NavTab) => {
  if (
    config.value?.machine_type !== Constants.MACHINE_TYPE.LASER_CUTTER &&
    navItem.router === 'generator'
  ) {
    return false;
  }
  if (
    config.value?.machine_type !== Constants.MACHINE_TYPE.THREE_D_PRINTER &&
    navItem.router === 'slice'
  ) {
    return false;
  }
  return true;
};

/**
 * A watcher that monitors `machineState` and `isFileLoading`.
 * It triggers the `checkIfTabsDisabled` function to update the disabled state of the tabs.
 */
watch(
  [machineState, isFileLoading],
  () => {
    checkIfTabsDisabled();
  },
  { deep: true }
);

/**
 * A watcher that monitors the USB connection status.
 * If a USB is connected and a media upload dialog is currently open, it closes the media dialog to prevent UI conflicts.
 */
watch(isUSBStorageConnected, (newIsUSBStorageConnected) => {
  if (newIsUSBStorageConnected && isUploadedMediaDialogShown.value) {
    mediaFilesManagementStore.closeUploadedMediaFilesDialog();
  }
});

/**
 * Lifecycle hook `onMounted`.
 * It checks the initial disabled state of the tabs and loads the application configuration.
 */
onMounted(async () => {
  checkIfTabsDisabled();
  config.value = await configurationSettings();
});
</script>
<style scoped>
.active-tab {
  background-color: white;
  color: black;
}

.disabled-tab {
  pointer-events: none;
  opacity: 0.5;
}
.tab-font-size {
  font-size: 1.5vh;
}
</style>
