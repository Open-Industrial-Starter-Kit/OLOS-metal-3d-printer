<template>
  <div class="column q-gutter-y-md">
    <div class="row items-center justify-between">
      <span>Feed Rate</span>
      <span>{{ feedRate }} mm/s</span>
    </div>
    <div class="row items-center justify-between">
      <span>Tool Power</span>
      <span>{{ feedAndSpeed?.speed }} %</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { computed } from 'vue';

// Access the Pinia store for machine status.
const machineStatusStore = useMachineStatusStore();
/**
 * Destructures the `feedAndSpeed` state from the store to make it reactive.
 */
const { feedAndSpeed } = storeToRefs(machineStatusStore);

/**
 * A computed property that calculates the feed rate in millimeters per second (mm/s).
 *
 * The raw `feed_rate` from the store is assumed to be in millimeters per minute (mm/min).
 * This computed property divides it by 60 to convert it to mm/s and formats it
 * to two decimal places for a cleaner display. If the feed rate is not available,
 * it defaults to 0.
 *
 * @returns {string} The calculated feed rate in mm/s, or 0 if not available.
 */
const feedRate = computed(() => {
  if (feedAndSpeed.value?.feed_rate)
    return (feedAndSpeed.value.feed_rate / 60).toFixed(2);
  else return '0';
});
</script>
