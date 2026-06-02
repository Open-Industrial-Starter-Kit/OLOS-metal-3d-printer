<template>
  <router-view />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useJobsFilesManagementStore } from './stores/jobs-files-management';
import { useGcodePreviewStore } from './stores/gcode-preview';
import { useMachineStatusStore } from './stores/machine-status';
import { useWebSocketStore } from './stores/websocket-connection';
import { onBeforeMount, watch } from 'vue';
import { showNotifyMessage } from './services/notify.messages.service';
import { Constants } from 'src/constants';

// Access Pinia stores for application state management.
const jobManagerStore = useJobsFilesManagementStore();
const gcodePreviewStore = useGcodePreviewStore();
const machineStatusStore = useMachineStatusStore();
const websocketStore = useWebSocketStore();
// Initialize the notification service.
const notifyMessage = showNotifyMessage();

/**
 * Destructures reactive properties from the stores using `storeToRefs`.
 */
const { fileData } = storeToRefs(jobManagerStore);
const { machineState } = storeToRefs(machineStatusStore);

/**
 * Lifecycle hook `onBeforeMount`.
 *
 * This hook is called right before the component is mounted to the DOM.
 * It is used to establish the WebSocket connection and check for any pre-loaded files.
 */
onBeforeMount(() => {
  // Connect to WebSocket when component is mounted
  websocketStore.connect(process.env.WEBSOCKET_URL || '');

  // check the opened file in the system
  jobManagerStore
    .checkOpenFile()
    .catch((error) => notifyMessage.error(error.message));
});

/**
 * A watcher that monitors changes to the `fileContent` within the `fileData` object.
 *
 * When the content of the G-code file changes, it triggers the creation of a new G-code preview graph. It also checks the machine's state and, if the machine is not idle, deactivates the drag-and-drop controls for the preview to prevent user interaction while a job is running.
 */
watch(
  () => fileData.value.fileContent,
  (newFileContent) => {
    gcodePreviewStore.createGcodePreviewerGraph(newFileContent).then(() => {
      // in case the machine is running while creating the gcode preview
      if (machineState.value !== Constants.IDLE) {
        gcodePreviewStore.deactivateDragAndDropControls();
      }
    });
  },
  { deep: true }
);
</script>
<style lang="scss">
.q-dialog__backdrop {
  backdrop-filter: blur(3px);
}
</style>
