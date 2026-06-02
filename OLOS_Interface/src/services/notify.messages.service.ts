import { Notify } from 'quasar';

/**
 * @description Provides a centralized way to show notifications using the Quasar framework.
 * @returns An object containing `success` and `error` notification functions.
 */
export const showNotifyMessage = () => {
  /**
   * @description Shows a success notification.
   * @param message The message to be displayed in the notification.
   */
  const success = (message: string) => {
    Notify.create({
      message,
      icon: 'task_alt',
      color: 'green-4',
      timeout: 2000,
    });
  };

  /**
   * @description Shows an error notification.
   * @param message The message to be displayed in the notification. Can be a string or an unknown type.
   */
  const error = (message: string | unknown) => {
    if (typeof message === 'string') {
      Notify.create({
        message,
        icon: 'highlight_off',
        color: 'red',
        timeout: 2000,
      });
    }
  };

  return { success, error };
};