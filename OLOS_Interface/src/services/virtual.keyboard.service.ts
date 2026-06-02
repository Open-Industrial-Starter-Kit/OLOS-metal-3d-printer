import KioskKeyboard from 'kioskboard';
import { QCard, QInput } from 'quasar';
import { Constants } from 'src/constants';

/**
 * @class VirtualKeyboard
 * @description Manages the display and behavior of a virtual keyboard for input fields.
 * It handles showing/hiding the keyboard, adjusting the UI to prevent obstruction,
 * and sanitizing input.
 */
export class VirtualKeyboard {
  /** @private @property {HTMLDivElement | null} dialogBoxElement - The container element (e.g., a dialog or card) that will be moved when the keyboard appears. */
  private dialogBoxElement: HTMLDivElement | null = null;
  /** @private @property {HTMLInputElement | null} inputElement - The actual <input> element that the keyboard will type into. */
  private inputElement: HTMLInputElement | null = null;
  /** @private @property {MutationObserver | null} keyboardObserver - An observer to detect when the keyboard is added to or removed from the DOM. */
  private keyboardObserver: MutationObserver | null = null;

  /**
   * @description Sets up the necessary DOM elements for the virtual keyboard to interact with.
   * @param {HTMLDivElement | InstanceType<typeof QCard> | null} dialogBoxElement - The container element (like a dialog or card) that needs to be moved.
   * @param {QInput | null} inputElement - The Quasar input component that the keyboard will target.
   * @returns {void}
   */
  setUpInputBoxElements(
    dialogBoxElement: HTMLDivElement | InstanceType<typeof QCard> | null,
    inputElement: QInput | null
  ) {
    if (dialogBoxElement instanceof HTMLDivElement) {
      this.dialogBoxElement = dialogBoxElement;
    } else {
      this.dialogBoxElement = dialogBoxElement?.$el;
    }
    this.inputElement = inputElement?.$el.querySelector('.q-field__native');
  }

  /**
   * @description Displays the virtual keyboard and starts an observer to handle layout changes.
   * @returns {void}
   */
  show = () => {
    this.startVirtualKeyboardObserver();
    this.useKioskKeyboard();
  };

  /**
   * @description Removes the keyboard if it is no longer in the DOM, then stops the observer and resets element references.
   * @returns {void}
   */
  remove = () => {
    const keyboard = document.getElementById('KioskBoard-VirtualKeyboard');
    if (!keyboard) {
      this.stopVirtualKeyboardObserver();
      this.resetInputBoxElements();
    }
  };

  /**
   * @private
   * @description Initializes and starts a MutationObserver to watch for the virtual keyboard being
   * added to or removed from the DOM, triggering layout adjustments accordingly.
   * @returns {void}
   */
  private startVirtualKeyboardObserver() {
    if (!this.keyboardObserver) {
      const onMutationChangeCallback = () => {
        const keyboard = document.getElementById('KioskBoard-VirtualKeyboard');
        // wait for keyboard to be shown or removed from the Dom tree
        setTimeout(() => {
          if (keyboard) {
            this.addKeyboardMargin();
          } else {
            this.removeKeyboardMargin();
          }
        }, Constants.VIRTUAL_KEYBOARD_DELAY);
      };

      this.keyboardObserver = new MutationObserver(onMutationChangeCallback);

      this.keyboardObserver.observe(document.body, {
        childList: true,
      });
    }
  }

  /**
   * @private
   * @description Disconnects and cleans up the MutationObserver.
   * @returns {void}
   */
  private stopVirtualKeyboardObserver() {
    if (this.keyboardObserver) {
      this.keyboardObserver?.disconnect();
      this.keyboardObserver = null;
    }
  }

  /**
   * @private
   * @description Resets the stored dialog box and input element references to null.
   * @returns {void}
   */
  private resetInputBoxElements() {
    this.dialogBoxElement = null;
    this.inputElement = null;
  }

  /**
   * @private
   * @description Initializes the KioskKeyboard library with custom configuration (keys, theme, behavior)
   * and attaches it to the target input element.
   * @returns {void}
   */
  private useKioskKeyboard = () => {
    if (this.inputElement)
      KioskKeyboard.run(this.inputElement, {
        /*!
         * Required
         * An Array of Objects has to be defined for the custom keys. Hint: Each object creates a row element (HTML) on the keyboard.
         * e.g. [{"key":"value"}, {"key":"value"}] => [{"0":"A","1":"B","2":"C"}, {"0":"D","1":"E","2":"F"}]
         */
        keysArrayOfObjects: [
          {
            '0': 'Q',
            '1': 'W',
            '2': 'E',
            '3': 'R',
            '4': 'T',
            '5': 'Y',
            '6': 'U',
            '7': 'I',
            '8': 'O',
            '9': 'P',
          },
          {
            '0': 'A',
            '1': 'S',
            '2': 'D',
            '3': 'F',
            '4': 'G',
            '5': 'H',
            '6': 'J',
            '7': 'K',
            '8': 'L',
          },
          {
            '0': 'Z',
            '1': 'X',
            '2': 'C',
            '3': 'V',
            '4': 'B',
            '5': 'N',
            '6': 'M',
          },
        ],

        /*
         * Optional: An Array of Strings can be set to override the built-in special characters.
         * e.g. ["#", "€", "%", "+", "-", "*"]
         */
        keysSpecialCharsArrayOfStrings: [
          '~',
          ':',
          "'",
          '+',
          '[',
          '\\',
          '@',
          '^',
          '{',
          '%',
          '(',
          '-',
          '"',
          '*',
          '|',
          ',',
          '&',
          '<',
          '`',
          '}',
          '.',
          '_',
          '=',
          ']',
          '!',
          '>',
          ';',
          '?',
          '#',
          '$',
          ')',
          '/',
        ],

        // Language Code (ISO 639-1) for custom keys (for language support) => e.g. "de" || "en" || "fr" || "hu" || "tr" etc...
        language: 'en',

        // The theme of keyboard => "light" || "dark" || "flat" || "material" || "oldschool"
        theme: 'light',

        // Scrolls the document to the top or bottom(by the placement option) of the input/textarea element. Prevented when "false"
        autoScroll: true,

        // Uppercase or lowercase to start. Uppercased when "true"
        capsLockActive: false,

        /*
         * Allow or prevent real/physical keyboard usage. Prevented when "false"
         * In addition, the "allowMobileKeyboard" option must be "true" as well, if the real/physical keyboard has wanted to be used.
         */
        allowRealKeyboard: true,

        // Allow or prevent mobile keyboard usage. Prevented when "false"
        allowMobileKeyboard: true,

        // CSS animations for opening or closing the keyboard
        cssAnimations: true,

        // CSS animations duration as millisecond
        cssAnimationsDuration: Constants.VIRTUAL_KEYBOARD_DELAY,

        // CSS animations style for opening or closing the keyboard => "slide" || "fade"
        cssAnimationsStyle: 'slide',

        // Enable or Disable Spacebar functionality on the keyboard. The Spacebar will be passive when "false"
        keysAllowSpacebar: true,

        // Text of the space key (Spacebar). Without text => " "
        keysSpacebarText: ' ',

        // Font family of the keys
        keysFontFamily: 'sans-serif',

        // Font size of the keys
        keysFontSize: '22px',

        // Font weight of the keys
        keysFontWeight: 'bold',

        // Size of the icon keys
        keysIconSize: '25px',

        // Text of the Enter key (Enter/Return). Without text => " "
        keysEnterText: 'Close',
        keysEnterCallback: () =>
          setTimeout(
            () => this.stopVirtualKeyboardObserver(),
            Constants.VIRTUAL_KEYBOARD_DELAY
          ),
        // The Enter key can close and remove the keyboard. Prevented when "false"
        keysEnterCanClose: true,
      });

    // add listeners to change the color of the key when clicked
    this.listenerToChangeKeyboardKeyColors();
  };

  /**
   * @private
   * @description Calculates and applies the required bottom margin to the dialog box
   * to prevent it from being obscured by the virtual keyboard.
   * @returns {void}
   */
  private addKeyboardMargin = () => {
    // wait until the keyboard created in the DOM tree
    const keyboard = document.getElementById('KioskBoard-VirtualKeyboard');
    const keyboardHeight = keyboard?.getBoundingClientRect().height ?? 0;
    const inputElementBottomPoint =
      this.inputElement?.getBoundingClientRect().bottom ?? 0;

    const bottomMargin =
      keyboardHeight - (window.screen.height - inputElementBottomPoint) + 30;

    if (this.dialogBoxElement) {
      this.dialogBoxElement.style.bottom = `${
        bottomMargin > 0 ? bottomMargin : 0
      }px`;
    }
  };

  /**
   * @private
   * @description Resets the bottom margin of the dialog box to 0, moving it back to its original position.
   * @returns {void}
   */
  private removeKeyboardMargin = () => {
    if (this.dialogBoxElement) {
      this.dialogBoxElement.style.bottom = '0';
    }
  };

  /**
   * @private
   * @description Adds `touchstart` and `touchend` event listeners to the virtual keyboard keys
   * to provide visual feedback (color change) on touch interaction.
   * @returns {void}
   */
  private listenerToChangeKeyboardKeyColors = () => {
    document.querySelectorAll('.kioskboard-key').forEach((key) => {
      const keyboardKey = key as HTMLSpanElement;
      keyboardKey.addEventListener(
        'touchstart',
        () => (keyboardKey.style.backgroundColor = '#dddddd')
      );
      keyboardKey.addEventListener(
        'touchend',
        () => (keyboardKey.style.backgroundColor = '#fafafa')
      );
    });
  };

  /**
   * @description A utility function to sanitize user input in a text field, allowing only numbers
   * in a specific format (up to 4 digits before the decimal and 2 digits after).
   * @param {KeyboardEvent | TouchEvent} event - The keyboard or touch event from the input field.
   * @returns {number} The sanitized numeric value, or 0 if invalid.
   */
  sanitizeNumberInput = (event: KeyboardEvent | TouchEvent) => {
    // Allow up to 4 digits before the decimal and 2 digits after
    const regex = /^\d{0,4}(\.\d{0,2})?$/;
    const target = event.target as HTMLInputElement;

    // Check if the current value matches the regex
    const isValid = regex.test(target.value);

    if (!isValid) {
      // Replace invalid characters or numbers with only valid ones
      target.value = target.value.replace(/[^0-9.]/g, ''); // Remove all non-numeric or non-decimal characters
      target.value = target.value.replace(/(\..*)\./g, '$1'); // Prevent multiple decimal points
      const decimalIndex = target.value.indexOf('.');
      if (decimalIndex !== -1) {
        // Limit to two digits after the decimal point
        target.value =
          target.value.slice(0, decimalIndex + 1) +
          target.value.slice(decimalIndex + 1).slice(0, 2);
      }
    }

    return !isNaN(parseFloat(target.value)) ? parseFloat(target.value) : 0;
  };
}
