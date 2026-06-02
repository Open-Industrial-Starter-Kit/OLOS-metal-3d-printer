<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="true">
    <q-card
      ref="renameCardElement"
      class="position-relative full-width q-pa-sm bg-blue-grey-1"
    >
      <q-card-section class="row items-center q-pa-sm">
        <span class="text-bold title-text-size">Rename File</span>
        <q-space />
      </q-card-section>
      <q-card-section>
        <q-input
          ref="renameInputElement"
          v-model="filenameData.filename"
          placeholder="Enter file name"
          :rules="[
            () => !!filenameData.filename || '* Required',
            () =>
              !filesListData.find(
                (file: JobFileData | MediaFileData) =>
                  `
                  ${filenameData.filename}.${filenameData.fileExtension}` ===
                  file.file
              ) || 'File name already exist',
          ]"
          reactive-rules
          @touchstart="
            virtualKeyboardStore.handleInputTouchStart(
              renameCardElement,
              renameInputElement
            )
          "
          @blur="virtualKeyboardStore.handleInputBlur"
          @change="handleChangeFilenameValue"
          :suffix="`.${filenameData.fileExtension}`"
          data-kioskboard-specialcharacters="true"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn
          label="Rename"
          color="primary"
          @click="setNewFilename"
          :disable="isRenameButtonDisabled"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { JobFileData } from 'src/interfaces/jobsFilesManagement.interface';
import { MediaFileData } from 'src/interfaces/mediaFilesManagement.interface';
import { useDialogPluginComponent, QInput, QCard } from 'quasar';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';

// The `useDialogPluginComponent` hook provides the necessary methods for a Quasar dialog.
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
defineEmits([...useDialogPluginComponent.emits]);

/**
 * Defines the props for the component.
 *
 * @property {Array<JobFileData | MediaFileData>} filesListData - A list of existing files to check for name uniqueness.
 * @property {string} filename - The original name of the file to be renamed.
 * @property {MediaFileData} [mediaData] - Optional: The media data object, if a media file is being renamed.
 * @property {Function} [renameMedia] - Optional: A callback function to rename a media file.
 * @property {Function} [renameJob] - Optional: A callback function to rename a job file.
 */
const props = defineProps<{
  filesListData: JobFileData[] | MediaFileData[];
  filename: string;
  mediaData?: MediaFileData;
  renameMedia?: (newFilename: string, mediaData: MediaFileData) => void;
  renameJob?: (newFilename: string) => void;
}>();

// Access the Pinia store for the virtual keyboard.
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * A reactive object to hold the filename and its extension.
 * This is used to separate the base name from the extension for easier editing.
 * @type {reactive<{filename: string, fileExtension: string}>}
 */
const filenameData = reactive({
  filename: '',
  fileExtension: '',
});

// Refs for accessing the Quasar components in the template.
const renameInputElement = ref<QInput | null>(null);
const renameCardElement = ref<QCard | null>(null);

/**
 * A computed property to determine if the "Rename" button should be disabled.
 *
 * The button is disabled if:
 * 1. The filename is empty.
 * 2. The new filename (base name + extension) already exists in the `filesListData`.
 *
 * @returns {boolean} - `true` if the button should be disabled, `false` otherwise.
 */
const isRenameButtonDisabled = computed(() => {
  // make sure it is not an already file name from the files list
  if (
    filenameData.filename.length > 0 &&
    !props.filesListData.find(
      (file) =>
        `${filenameData.filename}.${filenameData.fileExtension}` === file.file
    )
  ) {
    return false;
  }
  return true;
});

// Methods

/**
 * Handles the renaming of the file and closes the dialog.
 *
 * It constructs the new filename and calls the appropriate renaming function
 * (`renameMedia` or `renameJob`) passed via props. It then closes the dialog
 * with an "OK" status.
 */
const setNewFilename = () => {
  const newFilename = filenameData.filename + '.' + filenameData.fileExtension;
  if (props.mediaData && props.renameMedia) {
    props.renameMedia(newFilename, props.mediaData);
  } else if (props.renameJob) {
    props.renameJob(newFilename);
  }
  onDialogOK();
};

/**
 * Initializes the `filenameData` reactive object by parsing the `filename` prop.
 *
 * This function is called on component mount to separate the filename from its
 * extension and populate the input fields accordingly.
 */
const updateFileInfo = () => {
  const fileNameParts = props.filename.split('.');
  filenameData.filename = fileNameParts[0];
  filenameData.fileExtension =
    fileNameParts.length > 1 ? fileNameParts[fileNameParts.length - 1] : '';
};

/**
 * Updates the filename portion of the `filenameData` reactive object.
 *
 * @param {string} value - The new filename value.
 */
const handleChangeFilenameValue = (value: string) => {
  filenameData.filename = value;
};

/**
 * Lifecycle hook `onMounted`.
 *
 * This hook is called when the component is first mounted. It calls `updateFileInfo`
 * to set up the initial state of the input fields.
 */
onMounted(() => {
  updateFileInfo();
});
</script>
