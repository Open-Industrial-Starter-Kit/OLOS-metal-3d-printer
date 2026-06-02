<template>
  <div class="column q-gutter-y-md">
    <div class="row items-center justify-between">
      <span>Feed Rate</span>
      <span>{{ feedRate }} mm/s</span>
    </div>
    <div class="row items-center justify-between">
      <span>Laser Power</span>
      <span>{{ feedAndSpeed?.speed }}%</span>
    </div>
    <div class="row items-center justify-between">
      <span>Laser Tool</span>
      <span>{{ laserTool }}</span>
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
 * @property {Config} config - The machine's configuration settings.
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
 * A computed property that identifies the name of the currently active laser tool.
 *
 * It iterates through the list of available laser tools in the configuration and finds the tool whose index matches the `machineTool` value from the store.
 * @returns {string} The name of the active laser tool, or '-' if no tool is selected or configured.
 */
const laserTool = computed(() => {
  if (props.config.laser_cutter_settings) {
    const tools = props.config.laser_cutter_settings.tools as Tool[];
    for (let [index, tool] of Object.values(tools).entries()) {
      if (machineTool.value === index) {
        return tool.name;
      }
    }
  }
  return '-';
});
</script>
