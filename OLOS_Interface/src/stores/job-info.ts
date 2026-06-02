import { defineStore } from 'pinia';

/**
 * Pinia store for tracking the current job's progress, timer, and completion state.
 */
export const useJobInfoStore = defineStore('jobInfo', {
  state: () => ({
    /** Whether the current job has ended */
    isJobEnded: false as boolean,

    /** Total elapsed job time in seconds */
    jobTimer: 0 as number,

    /**
     * Job progress as a decimal between `0` (not started) and `1` (completed).
     * Example: `0.5` means 50% completed.
     */
    jobProgress: 0 as number,
  }),

  actions: {
    /**
     * Updates the job timer value.
     * @param {number} file_timer - The elapsed time for the job in seconds.
     */
    updateJobTimer(file_timer: number) {
      this.jobTimer = file_timer;
    },

    /**
     * Updates job progress based on the current line index and total lines.
     * Automatically marks the job as ended if progress reaches 100%.
     *
     * @param {number} line_index - The current processed line index.
     * @param {number} total_lines - The total number of lines in the job file.
     */
    updateJobProgress(line_index: number, total_lines: number) {
      this.jobProgress = line_index / total_lines;

      // If job is complete, mark as ended
      if (this.jobProgress === 1) {
        this.isJobEnded = true;
      }
    },

    /**
     * Resets the job progress and completion status to initial values.
     */
    restJobProgress() {
      this.jobProgress = 0;
      this.isJobEnded = false;
    },
  },
});
