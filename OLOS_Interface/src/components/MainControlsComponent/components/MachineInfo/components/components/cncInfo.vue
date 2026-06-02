<template>
  <div class="column q-gutter-y-md">
    <div class="row items-center justify-between">
      <span>Feed Rate</span>
      <span>{{ feedRate }} mm/s</span>
    </div>
    <div class="row items-center justify-between">
      <span>Spindle Speed</span>
      <span>{{ feedAndSpeed?.speed }} rpm</span>
    </div>
    <div v-if="tools" class="row items-center justify-between">
      <span>Spindle Tool</span>
      <span>{{ spindleTool }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Config, Tool } from 'src/interfaces/configSettings.interface';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { computed } from 'vue';

// Access the Pinia store for machine status
const machineStatusStore = useMachineStatusStore();
/**
 * Destructures reactive properties from the store to ensure updates trigger re-renders.
 */
const { feedAndSpeed, machineTool } = storeToRefs(machineStatusStore);

/**
 * Defines the props for the component.
 *
 * @property {Config} config - The machine's configuration settings
 */
const props = defineProps<{
  config: Config;
}>();

/**
 * A computed property that calculates and formats the feed rate in millimeters per second (mm/s).
 *
 * The `feed_rate` from the store is assumed to be in mm/min. This property converts it to mm/s and rounds it to two decimal places.
 * @returns {string} The formatted feed rate or 0 if not available.
 */
const feedRate = computed(() => {
  if (feedAndSpeed.value?.feed_rate)
    return (feedAndSpeed.value.feed_rate / 60).toFixed(2);
  else return '0';
});

/**
 * A computed property that extracts the list of available tools from the configuration props.
 *
 * It provides a list of tool objects, or an empty array if CNC settings are not available.
 * @returns {Tool[]} An array of tool objects.
 */
const tools = computed(() => {
  if (props.config.cnc_settings) {
    return props.config.cnc_settings.tools;
  }
  return [];
});

/**
 * A computed property that identifies the name of the currently active tool.
 *
 * It iterates through the list of available tools and finds the tool whose index matches the `machineTool` value from the store.
 * @returns {string} The name of the active tool, or '-' if no tool is selected or configured.
 */
const spindleTool = computed(() => {
  if (props.config.cnc_settings) {
    const tools = props.config.cnc_settings.tools as Tool[];
    for (let [index, tool] of Object.values(tools).entries()) {
      if (machineTool.value === index) {
        return tool.name;
      }
    }
  }
  return '-';
});
</script>
