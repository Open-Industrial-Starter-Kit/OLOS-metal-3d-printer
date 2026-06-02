<template>
  <q-dialog
    v-model="isDialogShown"
    persistent
    maximized
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="row fit bg-grey-9 text-white">
      <q-card-section class="fixed-top bg-grey-10" style="z-index: 1">
        <q-bar>
          <q-space />
          <q-btn
            dense
            flat
            icon="close"
            size="lg"
            @click="store.closeDebuggerDialog"
            class="q-pt-md"
          >
            <q-tooltip class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>

        <div class="row items-center justify-evenly bg-grey-10">
          <q-toggle
            v-model="showSerialCommands"
            label="Serial Commands"
            style="font-size: 15px"
          />
          <q-toggle
            v-model="showConnectionMessages"
            label="Connection Messages"
            style="font-size: 15px"
          />
          <q-toggle
            v-model="showFileExecution"
            label="File Execution"
            style="font-size: 15px"
          />
          <q-toggle
            v-model="showFileManager"
            label="File Manager"
            style="font-size: 15px"
          />
          <q-toggle
            v-model="showMachineStatus"
            label="Machine Status"
            style="font-size: 15px"
          />
          <q-toggle
            v-model="showTimeStamp"
            label="Time"
            style="font-size: 15px"
          />
          <q-toggle
            v-if="
              config?.machine_type === Constants.MACHINE_TYPE.THREE_D_PRINTER
            "
            v-model="showSliceCommands"
            label="Slice Commands"
            style="font-size: 15px"
          />
          <div class="row q-gutter-x-md">
            <q-btn @click="resetToggles" label="Reset" color="green">
              <q-tooltip class="bg-white text-primary">Reset Toggles</q-tooltip>
            </q-btn>
            <q-btn @click="clearScrollArea" label="Clear" color="primary">
              <q-tooltip class="bg-white text-primary">Clear Console</q-tooltip>
            </q-btn>
            <q-btn @click="store.downloadLogs" color="purple" label="Download">
              <q-tooltip class="bg-white text-primary">Download Logs</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>
      <q-card-section class="scroll-area">
        <q-virtual-scroll
          :items="logs"
          ref="scrollAreaRef"
          :bar-style="{ borderRadius: '5px', background: 'brown' }"
          @virtual-scroll="onScroll"
          @pointerdown.prevent="handlePointerScroll"
          virtual-scroll-slice-size="100"
          :items-size="10"
        >
          <template v-slot="{ item }">
            <span
              v-if="
                showSerialCommands &&
                item.type === Constants.SERIAL_COMMAND_DATA_TYPE
              "
              class="row q-gutter-x-md text-h6"
              :key="item.id"
            >
              <span v-if="showTimeStamp">{{ item.time }}</span>
              <span>[{{ item.type }}]</span>
              <span>{{ item.text }}</span>
            </span>
            <span
              v-if="
                showConnectionMessages &&
                (item.type === Constants.CONNECTION_DATA_TYPE ||
                  item.type === Constants.CONNECTION_DATA_TYPE)
              "
              class="row q-gutter-x-md text-h6"
              :key="item.id"
            >
              <span v-if="showTimeStamp">{{ item.time }}</span>
              <span>[{{ item.type }}]</span>
              <span>{{ item.text }}</span>
            </span>
            <span
              v-if="
                showFileExecution &&
                item.type === Constants.JOB_EXECUTION_DATA_TYPE
              "
              class="row q-gutter-x-md text-h6"
              :key="item.id"
            >
              <span v-if="showTimeStamp">{{ item.time }}</span>
              <span>[{{ item.type }}]</span>
              <span>{{ item.text }}</span>
            </span>
            <span
              v-if="
                showMachineStatus &&
                item.type === Constants.MACHINE_STATUS_DATA_TYPE
              "
              class="row q-gutter-x-md text-h6"
              :key="item.id"
            >
              <span v-if="showTimeStamp">{{ item.time }}</span>
              <span>[{{ item.type }}]</span>
              <span>{{ item.text }}</span>
            </span>
            <span
              v-if="
                showFileManager &&
                item.type === Constants.JOBS_MANAGER_DATA_TYPE
              "
              class="row q-gutter-x-md text-h6"
              :key="item.id"
            >
              <span v-if="showTimeStamp">{{ item.time }}</span>
              <span>[{{ item.type }}]</span>
              <span>{{ item.text }}</span>
            </span>
            <span
              v-if="
                showSliceCommands &&
                item.type === Constants.SLICE_DATA_TYPE &&
                config?.machine_type === Constants.MACHINE_TYPE.THREE_D_PRINTER
              "
              class="row q-gutter-x-md text-h6"
              :key="item.id"
            >
              <span v-if="showTimeStamp">{{ item.time }}</span>
              <span>[{{ item.type }}]</span>
              <span>{{ item.text }}</span>
            </span>
          </template>
        </q-virtual-scroll>
      </q-card-section>
      <q-card-section class="fixed-bottom bg-grey-10">
        <serial-command-input />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import SerialCommandInput from 'src/components/ConsoleTabComponent/components/SerialCommandInput.vue';
import { Constants } from 'src/constants';
import { storeToRefs } from 'pinia';
import { QVirtualScroll } from 'quasar';
import { useDebuggerDialogStore } from 'src/stores/debugger-dialog';
import { watch, ref, onMounted } from 'vue';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { Config } from 'src/interfaces/configSettings.interface';

/**
 * A reactive reference to the configuration settings of the machine.
 * It is initialized to `null` and populated when the component is mounted.
 * @type {ref<Config | null>}
 */
const config = ref<Config | null>(null);

// Access the Pinia store for the debugger dialog.
const store = useDebuggerDialogStore();

/**
 * Destructures reactive properties from the store using `storeToRefs` to maintain reactivity.
 */
const {
  isDialogShown,
  logs,
  showSerialCommands,
  showConnectionMessages,
  showFileExecution,
  showFileManager,
  showMachineStatus,
  showTimeStamp,
  showSliceCommands,
} = storeToRefs(store);

/**
 * A reactive reference to the Quasar QVirtualScroll component.
 * This is used to programmatically control the scroll position.
 * @type {ref<QVirtualScroll | null>}
 */
const scrollAreaRef = ref<QVirtualScroll | null>(null);

/**
 * A reactive variable to control the auto-scrolling behavior.
 * When `true`, the log area will automatically scroll to the bottom as new logs arrive.
 * @type {ref<boolean>}
 */
const autoScroll = ref(true);

/**
 * Clears all logs from the debugger dialog.
 * It calls the `clearDebuggerLogs` action on the store.
 */
const clearScrollArea = () => store.clearDebuggerLogs();

/**
 * Disables auto-scrolling when the user manually scrolls the log area.
 */
const handlePointerScroll = () => {
  autoScroll.value = false;
};

/**
 * A scroll event handler that re-enables auto-scrolling when the user scrolls to the bottom.
 */
const onScroll = () => {
  if (scrollAreaRef.value && autoScroll.value) {
    // User is at the bottom, enable auto-scrolling
    scrollToBottom();
  }
};

/**
 * Scrolls the virtual scroll component to the last log entry.
 * It also enables `autoScroll` so that new logs will be automatically scrolled into view.
 */
const scrollToBottom = () => {
  if (scrollAreaRef.value) {
    autoScroll.value = true;
    scrollAreaRef.value.scrollTo(logs.value.length);
  }
};

/**
 * Resets all log filter toggles to their default "on" state.
 */
const resetToggles = () => {
  showSerialCommands.value = true;
  showConnectionMessages.value = true;
  showFileExecution.value = true;
  showFileManager.value = true;
  showMachineStatus.value = true;
  showTimeStamp.value = true;
};

/**
 * A watcher that automatically scrolls the log area to the bottom whenever the dialog is shown.
 * This ensures that the user always sees the latest logs upon opening the dialog.
 */
watch(isDialogShown, () => {
  scrollToBottom();
});

/**
 * Lifecycle hook `onMounted` to fetch application configuration settings.
 * This runs once when the component is first mounted.
 */
onMounted(async () => {
  config.value = await configurationSettings();
});
</script>
<style scoped>
.scroll-area {
  width: 100%;
  padding: 10vh 0;
}
</style>
