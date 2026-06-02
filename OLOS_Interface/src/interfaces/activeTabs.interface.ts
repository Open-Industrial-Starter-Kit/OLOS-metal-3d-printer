/**
 * @interface NavTab
 * @description Represents a single navigation tab in the application's UI.
 */
export interface NavTab {
  /** Icon name or path used for the tab. */
  icon: string;
  /** Display label for the tab. */
  label: string;
  /** Router path or route name to navigate when the tab is clicked. */
  router: string;
}

/**
 * @interface NavTabs
 * @description Represents a collection of navigation tabs, keyed by a unique identifier.
 */
export interface NavTabs {
  /** Key-value mapping where the key is a unique identifier and the value is a `NavTab`. */
  [key: string]: NavTab;
}
