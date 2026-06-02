import { defineStore } from 'pinia';

/**
 * Pinia store to manage slicing process state and progress.
 */
export const useSliceInfoStore = defineStore('sliceInfo', {
  state: () => ({
    /** Indicates whether the slicing process is currently running */
    isSlicingProcess: false as boolean,

    /** Indicates whether the slicing process has completed */
    isSlicingDone: false as boolean,

    /** Progress of slicing as a fraction (0 to 1) */
    sliceProgress: 0 as number,
  }),

  actions: {
    /**
     * Updates the slicing progress based on current layer index and total layers.
     * Marks slicing as done if progress reaches or exceeds 100%.
     *
     * @param {number} layer_index - Current processed layer index.
     * @param {number} total_layers - Total number of layers to process.
     */
    updateSlicingProgress(layer_index: number, total_layers: number) {
      this.sliceProgress = layer_index / total_layers;
      if (this.sliceProgress >= 1) {
        this.isSlicingDone = true;
        this.isSlicingProcess = false;
      }
    },

    /**
     * Starts the slicing process by resetting progress and setting the slicing flag.
     */
    startSliceProgress() {
      this.restSliceProgress();
      this.isSlicingProcess = true;
    },

    /**
     * Resets the slicing progress and status flags.
     */
    restSliceProgress() {
      this.sliceProgress = 0;
      this.isSlicingDone = false;
      this.isSlicingProcess = false;
    },
  },
});
