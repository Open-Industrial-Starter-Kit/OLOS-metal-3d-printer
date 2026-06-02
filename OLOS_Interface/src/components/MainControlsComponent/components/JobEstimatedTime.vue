<template>
  <div class="column q-my-sm full-width">
    <div class="column items-start">
      <span class="text-style">Job Progress:</span>
      <q-linear-progress
        dark
        rounded
        instant-feedback
        size="20px"
        :value="jobProgress"
        :color="progressColor"
        class="q-mt-sm bg-white"
      >
        <div class="absolute-full flex flex-center">
          <q-badge
            color="white"
            text-color="blue-grey"
            :label="progressFileLabel"
            style="font-size: 15px"
          />
        </div>
      </q-linear-progress>
    </div>
    <div class="row q-mt-sm items-center justify-between">
      <span class="text-style">Job Timer:</span>
      <span style="color: brown" class="text-style">{{ formatTime }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useJobInfoStore } from 'src/stores/job-info';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { computed } from 'vue';
import { Constants } from 'src/constants';

// Access Pinia stores for machine status and job information.
const machineStatusStore = useMachineStatusStore();
const jobInfoStore = useJobInfoStore();

/**
 * Destructures reactive properties from the stores using `storeToRefs`.
 */
const { machineState } = storeToRefs(machineStatusStore);
const { jobProgress } = storeToRefs(jobInfoStore);

/**
 * A computed property that formats the job progress as a percentage string with two decimal places.
 * @returns {string} The formatted progress percentage.
 */
const progressFileLabel = computed(
  () => (jobProgress.value * 100).toFixed(2) + '%'
);

/**
 * A computed property that formats the job timer into a human-readable HH:MM:SS string.
 * It converts the total seconds from the store into hours, minutes, and seconds, padding each part with a leading zero if necessary.
 * @returns {string} The formatted time string.
 */
const formatTime = computed(() => {
  const totalSeconds = jobInfoStore.jobTimer;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`;
});

/**
 * A computed property that determines the color of the progress bar based on the machine's state.
 * @returns {string} The name of the Quasar color to be used.
 */
const progressColor = computed(() => {
  switch (machineState.value) {
    case Constants.IDLE:
      return 'light-blue-2';
    case Constants.RUN:
      return 'light-green-4';
    case Constants.ALARM:
      return 'red-4';
    case Constants.HOLD:
      return 'yellow-4';
    case Constants.DOOR:
      return 'orange-3';
    case Constants.HOMING:
      return 'purple-2';
    case Constants.DISCONNECTED:
      return 'white';
    default:
      return 'primary';
  }
});
</script>

<style scoped lang="scss">
.text-style {
  font-size: 1.5vh;
  font-weight: bold;
}
</style>
