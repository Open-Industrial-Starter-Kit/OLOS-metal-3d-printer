import { defineStore } from 'pinia';
import { QCard, QInput, useQuasar } from 'quasar';
import { VirtualKeyboard } from 'src/services/virtual.keyboard.service';

/**
 * Pinia store to manage the virtual keyboard functionality,
 * mainly used in native Electron applications.
 */
export const useVirtualKeyboardStore = defineStore('virtualKeyboard', {
  /**
   * Reactive state for the virtual keyboard store.
   * @returns {object} The initial state object.
   */
  state: () => ({
    /** Instance of the VirtualKeyboard service */
    keyboard: new VirtualKeyboard(),

    /** Flag indicating if the app is running as a native Electron application */
    isNativeApplication: useQuasar().platform.is.electron,
  }),

  actions: {
    /**
     * Handles input sanitization for number input events (keyboard or touch).
     *
     * @param {KeyboardEvent | TouchEvent} event - The input event to sanitize.
     * @returns {boolean} Result of the sanitizeNumberInput method from VirtualKeyboard.
     */
    handleSanitizeNumberInput(event: KeyboardEvent | TouchEvent) {
      return this.keyboard.sanitizeNumberInput(event);
    },

    /**
     * Handles the start of input touch/focus event.
     * Sets up the virtual keyboard input elements and shows the keyboard if
     * running in a native Electron environment.
     *
     * @param {QCard | null} dialogBoxElement - The dialog box element containing the input.
     * @param {QInput | null} inputElement - The input element to attach the keyboard to.
     */
    handleInputTouchStart(
      dialogBoxElement: QCard | null,
      inputElement: QInput | null
    ) {
      if (this.isNativeApplication) {
        this.keyboard.setUpInputBoxElements(dialogBoxElement, inputElement);
        this.keyboard.show();
      }
    },

    /**
     * Handles the blur event of the input.
     * Removes the virtual keyboard if running in a native Electron environment.
     */
    handleInputBlur() {
      if (this.isNativeApplication) {
        this.keyboard.remove();
      }
    },
  },
});
