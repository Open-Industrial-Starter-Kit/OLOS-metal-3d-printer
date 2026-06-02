<template>
  <transition
    appear
    enter-active-class="animated fadeIn"
    leave-active-class="animated fadeOut"
  >
    <q-card class="row fit" flat>
      <div v-if="isGcodeError" class="q-pa-md">
        <p class="row fit flex-center message-text">
          {{ Constants.PREVIEWER_GCODE_ERROR_MESSAGE }}
        </p>
      </div>
      <div v-else-if="isGcodeBiggerThanPlatform" class="q-pa-md">
        <p class="row fit flex-center message-text">
          {{ Constants.PREVIEWER_BIG_GCODE_MESSAGE }}
        </p>
      </div>
      <div v-else ref="graphContainer" class="fit"></div>

      <q-inner-loading :showing="isGraphLoading">
        <q-spinner-gears size="100" color="primary" />
        <p class="loading-text">Please wait...</p>
      </q-inner-loading>
    </q-card>
  </transition>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Constants } from 'src/constants';
import { useGcodePreviewStore } from 'src/stores/gcode-preview';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { onMounted, ref, watch } from 'vue';
import { Config } from 'src/interfaces/configSettings.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';

// Access Pinia stores for G-code preview and machine status.
const gcodePreviewStore = useGcodePreviewStore();
const machineStatusStore = useMachineStatusStore();

/**
 * Reactive variable for storing the machine's configuration.
 * @type {ref<Config | null>}
 */
const config = ref<Config | null>(null);

/**
 * Destructures reactive properties from the stores using `storeToRefs`.
 */
const {
  isGraphLoading,
  isGcodeError,
  isGcodeBiggerThanPlatform,
  gcodePreviewerInstance,
} = storeToRefs(gcodePreviewStore);
const { machineState } = storeToRefs(machineStatusStore);

/**
 * A reactive reference to the DOM element that will contain the graph.
 * @type {ref<HTMLDivElement | null>}
 */
const graphContainer = ref<HTMLDivElement | null>(null);

/**
 * A watcher that observes the machine's state.
 *
 * This watcher is triggered whenever the `machineState` changes. It controls
 * the interactivity of the G-code previewer, activating drag-and-drop controls
 * only when the machine is in the `IDLE` state and deactivating them otherwise.
 * The `immediate: true` option ensures this check runs as soon as the component is mounted.
 */
watch(
  machineState,
  (newMachineState) => {
    if (newMachineState === Constants.IDLE) {
      gcodePreviewStore.activateDragAndDropControls();
    } else {
      gcodePreviewStore.deactivateDragAndDropControls();
    }
  },
  { immediate: true }
);

/**
 * Lifecycle hook `onMounted`.
 *
 * This hook is called when the component is first mounted. It performs the
 * following actions:
 * 1. Loads the application's configuration settings asynchronously.
 * 2. Resets the camera zoom of the G-code previewer instance to a default view.
 * 3. If the `graphContainer` DOM element is available, it adds the G-code
 * graph to that container, making it visible to the user.
 */
onMounted(async () => {
  config.value = await configurationSettings();
  gcodePreviewerInstance.value?.resetGraphControls();

  if (graphContainer.value) {
    gcodePreviewStore.addGraphToContainer(graphContainer.value);
  }
});
</script>

<style scoped>
.loading-text {
  font-size: 2.5vh;
  padding: 2vh;
  z-index: 1;
}
</style>
