<template>
  <transition
    appear
    enter-active-class="animated fadeIn"
    leave-active-class="animated fadeOut"
  >
    <q-card class="row fit graph-card" flat>
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

      <div
        v-if="currentLineIndex > 0 || executionState === 'rejected'"
        class="execution-hud"
        :class="{ 'execution-hud--error': executionState === 'rejected' }"
      >
        <div class="row items-center no-wrap execution-hud__header">
          <q-icon :name="executionIcon" size="18px" />
          <span>{{ executionLabel }}</span>
          <span class="execution-hud__line">
            Line {{ currentLineIndex.toLocaleString() }} /
            {{ totalLines.toLocaleString() }}
          </span>
        </div>
        <div class="execution-hud__command">
          {{ currentCommand || 'Waiting for controller response' }}
        </div>
      </div>

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
import { computed, onMounted, ref, watch } from 'vue';
import { Config } from 'src/interfaces/configSettings.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { useJobInfoStore } from 'src/stores/job-info';

// Access Pinia stores for G-code preview and machine status.
const gcodePreviewStore = useGcodePreviewStore();
const machineStatusStore = useMachineStatusStore();
const jobInfoStore = useJobInfoStore();

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
const { currentCommand, currentLineIndex, totalLines, executionState } =
  storeToRefs(jobInfoStore);

const executionLabel = computed(() => {
  switch (executionState.value) {
    case 'sent':
      return 'Sent, awaiting controller';
    case 'acknowledged':
      return 'Controller acknowledged';
    case 'skipped':
      return 'Skipped comment';
    case 'rejected':
      return 'Controller rejected command';
    case 'stopped':
      return 'Job stopped';
    default:
      return 'Execution';
  }
});

const executionIcon = computed(() => {
  if (executionState.value === 'rejected') return 'error';
  if (executionState.value === 'sent') return 'hourglass_top';
  if (executionState.value === 'stopped') return 'stop';
  return 'check_circle';
});

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

.graph-card {
  position: relative;
  overflow: hidden;
}

.execution-hud {
  position: absolute;
  left: 16px;
  bottom: 16px;
  width: min(560px, calc(100% - 32px));
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 6px;
  color: #fff;
  background: rgba(20, 24, 28, 0.9);
  z-index: 5;
  pointer-events: none;
}

.execution-hud--error {
  border-color: #ef5350;
  background: rgba(70, 18, 18, 0.94);
}

.execution-hud__header {
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.execution-hud__line {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}

.execution-hud__command {
  margin-top: 7px;
  overflow: hidden;
  color: #d8e1e8;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
