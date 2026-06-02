import { defineStore } from 'pinia';
import { NavTab, NavTabs } from 'src/interfaces/activeTabs.interface';
import { useRouter } from 'vue-router';

/**
 * Pinia store for managing navigation tabs in the application.
 */
export const useTabsStore = defineStore('tabsStore', {
  state: () => ({
    /**
     * List of navigation tabs available in the app.
     * Keyed by tab names with metadata including icon, label, and router name.
     * @type {NavTabs}
     */
    navList: {
      files: {
        icon: 'folder',
        label: 'Jobs Manager',
        router: 'jobs',
      } as NavTab,
      controls: {
        icon: 'tune',
        label: 'Controls',
        router: 'controls',
      } as NavTab,
      preview: {
        icon: 'preview',
        label: 'Job Preview',
        router: 'preview',
      } as NavTab,
      convertor: {
        icon: 'change_circle',
        label: 'Gcode Generator',
        router: 'generator',
      } as NavTab,
      slice: {
        icon: 'layers',
        label: '3D Slicing',
        router: 'slice',
      } as NavTab,
      console: {
        icon: 'code',
        label: 'Console',
        router: 'console',
      } as NavTab,
    } as NavTabs,

    /**
     * The currently active tab.
     * @type {NavTab}
     */
    activeMenuItem: {
      icon: 'tune',
      label: 'Controls',
      router: 'controls',
    } as NavTab,

    /**
     * Vue router instance used for navigation.
     * @type {ReturnType<typeof useRouter>}
     */
    router: useRouter(),
  }),

  actions: {
    /**
     * Checks if a given tab is the active tab.
     * If true, it navigates to the tab and returns true.
     * Otherwise, returns false.
     *
     * @param {NavTab} tab - The tab to check against the active tab.
     * @returns {boolean} True if the tab is active and navigation happened, else false.
     */
    isActiveTab(tab: NavTab): boolean {
      if (this.activeMenuItem.label === tab.label) {
        this.changeTab(tab);
        return true;
      }
      return false;
    },

    /**
     * Changes the active tab and navigates to the corresponding route.
     *
     * @param {NavTab} tab - The tab to activate.
     */
    changeTab(tab: NavTab): void {
      this.activeMenuItem = tab;
      this.router.push({ name: tab.router });
    },
  },
});
