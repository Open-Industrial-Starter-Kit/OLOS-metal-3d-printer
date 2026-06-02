import { defineStore } from 'pinia';
import { Platform } from 'quasar';

/**
 * Pinia store to provide information about the current platform.
 */
export const usePlatformTypeStore = defineStore('platform', {
  state: () => ({
    /** Platform details object provided by Quasar's Platform utility */
    platformDetails: Platform.is,
  }),

  getters: {
    /**
     * Returns true if the platform is mobile (i.e., not desktop).
     * @param state - The store state
     * @returns {boolean} Whether the platform is mobile
     */
    isMobile: (state) => !state.platformDetails.desktop,

    /**
     * Returns the platform name as a string (e.g., 'android', 'ios', 'windows', etc.).
     * @param state - The store state
     * @returns {string} The platform name
     */
    getPlatform: (state) => state.platformDetails.platform,
  },
});
