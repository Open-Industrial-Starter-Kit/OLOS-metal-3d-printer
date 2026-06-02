import { Dialog } from 'quasar';
import { Constants } from 'src/constants';

/**
 * @description Creates and displays a Quasar Dialog component with a message based on the given type and code.
 *              The dialog can represent disconnection alerts, alarm messages, or error messages, each with specific configurations.
 * @param {string} msgType - The type of message (e.g., `Constants.DISCONNECTED`, `Constants.ALARM`, or other).
 * @param {string} [okLabel='Ok'] - The label for the OK button.
 * @param {string} [cancelLabel='Cancel'] - The label for the Cancel button.
 * @param {number} [msgCode=0] - The code used to retrieve a specific alarm or error message.
 * @returns {import('quasar').QDialog} A Quasar Dialog instance configured according to the message type and code.
 */
export const createDialogComponent = (
  msgType: string,
  okLabel = 'Ok',
  cancelLabel = 'Cancel',
  msgCode = 0
) => {
  if (msgType === Constants.DISCONNECTED) {
    return Dialog.create({
      title: msgType,
      message: Constants.LONG_MESSAGES.DISCONNECTED_MESSAGE as string,
      persistent: true,
      noEscDismiss: true,
      color: 'primary',
      ok: {
        label: okLabel,
        flat: true,
      },
    });
  } else if (msgType === Constants.ALARM) {
    return Dialog.create({
      title: msgType + ' ' + msgCode,
      message: Constants.LONG_MESSAGES.ALARM_MESSAGES[msgCode],
      persistent: true,
      noEscDismiss: true,
      color: 'primary',
      ok: {
        label: okLabel,
        flat: true,
      },
      cancel: {
        label: cancelLabel,
        flat: true,
      },
    });
  }
  return Dialog.create({
    title: msgType + ' ' + msgCode,
    message: Constants.LONG_MESSAGES.ERROR_MESSAGES[msgCode],
    persistent: true,
    noEscDismiss: true,
    color: 'primary',
    ok: {
      label: okLabel,
      flat: true,
    },
    cancel: {
      label: cancelLabel,
      flat: true,
    },
  });
};
