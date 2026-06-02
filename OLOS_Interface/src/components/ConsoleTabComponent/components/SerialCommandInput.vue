<template>
  <q-input
    ref="serialCommandsInputElement"
    outlined
    color="black"
    bg-color="white"
    dense
    v-model="command"
    placeholder="Type GRBL Command"
    @keyup.enter="onEnter"
    @keydown="handleUserKeyInput"
    @touchstart="
      virtualKeyboardStore.handleInputTouchStart(
        null,
        serialCommandsInputElement
      )
    "
    @blur="virtualKeyboardStore.handleInputBlur"
    @change="handleChangeCommandValue"
    class="row fit flex-center q-gutter-x-sm"
    :disable="isConsoleDisabled()"
    data-kioskboard-specialcharacters="true"
  >
    <template v-slot:append>
      <q-icon
        v-if="command !== ''"
        name="close"
        @click="command = ''"
        class="cursor-pointer"
      />
    </template>

    <template v-slot:after>
      <q-btn
        label="Send"
        @click="onSubmitCommand"
        color="grey-4"
        size="2vh"
        text-color="black"
        :disable="isConsoleDisabled()"
      />
    </template>
  </q-input>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Constants } from 'src/constants';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { useWebSocketStore } from 'src/stores/websocket-connection';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';
import { onMounted, ref } from 'vue';
import { QInput } from 'quasar';

/**
 * Pinia Stores
 */
const websocketStore = useWebSocketStore();
const machineStatusStore = useMachineStatusStore();
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Reactive references
 */
const { machineState } = storeToRefs(machineStatusStore);
const command = ref<string>(''); // current command input
const formSubmitted = ref<boolean>(false); // track if the form has been submitted
const serialCommandsInputElement = ref<QInput | null>(null); // reference to the QInput element

let keyCount = 0; // tracks navigation in command history

/**
 * Handle form submission or Enter key press
 */
const onSubmitCommand = () => {
  formSubmitted.value = true;

  if (command.value) {
    addCommandToUserHistory(command.value);

    // send command to server via WebSocket
    const req = {
      type: Constants.SERIAL_COMMAND_DATA_TYPE,
      data: { command: command.value },
    };
    websocketStore.send(req);

    // reset input field
    command.value = '';
  }
};

const onEnter = () => {
  if (command.value || formSubmitted.value) {
    onSubmitCommand();
  }
};

/**
 * Add command to user's local history (localStorage)
 */
const addCommandToUserHistory = (command: string) => {
  const history = JSON.parse(localStorage.history || '[]');

  if (history) {
    // keep max 500 commands
    if (history.length >= 500) history.shift();

    history.push(command);
    localStorage.setItem('history', JSON.stringify(history));
  }
};

/**
 * Initialize localStorage for user commands if it doesn't exist
 */
const checkForUserCommandsHistoryStorage = () => {
  if (!localStorage.getItem('history')) {
    createLocalStorage();
  }
};

const createLocalStorage = () => {
  localStorage.setItem('history', JSON.stringify([]));
};

/**
 * Handle arrow key navigation in command history
 */
const handleUserKeyInput = (e: KeyboardEvent) => {
  const keyCode = e.keyCode || e.which;
  const history = JSON.parse(localStorage.history || '[]');

  if (keyCode === 38 && keyCount !== history.length - 1) {
    // Arrow Up: go to previous command
    e.preventDefault();
    keyCount++;
    command.value = history[history.length - keyCount - 1];
  } else if (keyCode === 40 && keyCount > 0) {
    // Arrow Down: go to next command
    e.preventDefault();
    keyCount--;
    command.value = history[history.length - keyCount - 1];
  }
};

/**
 * Disable console input depending on machine state
 */
const isConsoleDisabled = () => {
  return (
    machineState.value === Constants.RUN ||
    machineState.value === Constants.HOLD
  );
};

/**
 * Update command input value manually
 */
const handleChangeCommandValue = (value: string) => {
  command.value = value;
};

/**
 * Ensure localStorage exists on mount
 */
onMounted(() => {
  checkForUserCommandsHistoryStorage();
});
</script>
