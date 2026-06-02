<template>
  <q-dialog
    v-model="isUSBMediaFilesDialogShown"
    transition-show="scale"
    transition-hide="scale"
    persistent
  >
    <q-card class="dialog-box">
      <div class="column fit">
        <q-bar
          class="row full-width text-white bg-purple-5 items-center justify-between q-py-lg"
        >
          <span class="dialog-header-font">{{ usbDeviceName }}</span>
          <q-btn
            dense
            flat
            icon="close"
            size="2.5vh"
            @click="usbMonitorStore.closeMediaUSBFilesDialog"
          >
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>
        <q-table
          class="header-table-top bg-white fit"
          flat
          row-key="id"
          bordered
          :rows="specificMediaList"
          :columns="columns"
          :dense="$q.screen.lt.md"
          :filter="filter"
          virtual-scroll
          :virtual-scroll-item-size="10"
          :virtual-scroll-sticky-size-start="10"
          :rows-per-page-options="[0]"
          :loading="specificMediaList === undefined"
          style="max-height: 80vh"
          :no-data-label="`Could not find any ${mediaType}`"
          selection="multiple"
          v-model:selected="selectedMediaFiles"
        >
          <template v-slot:top-right>
            <q-input
              ref="searchInputElement"
              dense
              debounce="300"
              color="purple-5"
              v-model="filter"
              placeholder="Search"
              @touchstart="
                virtualKeyboardStore.handleInputTouchStart(
                  null,
                  searchInputElement
                )
              "
              @blur="virtualKeyboardStore.handleInputBlur"
              @change="handleChangeFilterValue"
              data-kioskboard-specialcharacters="true"
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>

          <template v-slot:top-left>
            <div
              v-if="selectedMediaFiles.length"
              class="row flex-center q-gutter-md"
            >
              <q-btn
                label="Use Selected Files"
                size="1.5vh"
                color="orange-10"
                outline
                @click="handleUseMultipleMediaFiles"
              />
              <q-btn
                label="Upload Selected Files"
                size="1.5vh"
                color="teal-5"
                outline
                @click="handleUploadMultipleMediaFiles"
              />
            </div>
          </template>

          <template v-slot:header-selection="scope">
            <q-checkbox v-model="scope.selected" color="purple-5"></q-checkbox>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props" class="bg-white cursor-pointer">
              <q-td>
                <q-checkbox
                  v-model="props.selected"
                  color="purple-5"
                ></q-checkbox>
              </q-td>
              <q-td key="path" :props="props">
                <span class="row-sub-text-size">{{
                  getShortenPath(props.row)
                }}</span>
              </q-td>
              <q-td key="file" :props="props">
                <span class="row-sub-text-size">{{ props.row.file }}</span>
              </q-td>
              <q-td key="date" :props="props">
                <span class="row-sub-text-size">{{ props.row.date }}</span>
              </q-td>
              <q-td key="size" :props="props">
                <span class="row-sub-text-size">{{ props.row.size }} KB</span>
              </q-td>
              <q-td key="use" :props="props">
                <q-btn
                  flat
                  @click="handleUseMediaFileFromUSB(props.row)"
                  icon="edit"
                  size="2vh"
                />
              </q-td>
              <q-td key="upload" :props="props">
                <div v-if="!props.row.uploaded">
                  <q-spinner
                    v-if="props.row.loading"
                    color="positive"
                    size="2vh"
                    :thickness="5"
                  />
                  <q-btn
                    flat
                    v-else
                    @click="handleUploadMediaFileFromUSB(props.row)"
                    icon="upload"
                    size="2vh"
                  />
                </div>
                <q-icon v-else name="task_alt" color="positive" size="2vh" />
              </q-td>
            </q-tr>
          </template>
          <template v-slot:no-data="{ message }">
            <div class="full-width row flex-center text-h6 q-gutter-sm">
              <span>{{ message }}</span>
              <q-icon size="2em" name="sentiment_dissatisfied" />
            </div>
          </template>
        </q-table>
      </div>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useQuasar, QTableProps, QInput, QCard } from 'quasar';
import { useUSBMonitorStore } from 'src/stores/usb-monitor';
import { useMediaFilesManagementStore } from 'src/stores/media-files-management';
import { useImageToGcodeConvertor } from 'src/stores/image-to-gcode';
import { useMaterialLibraryStore } from 'src/stores/material-library';
import { USBFileData } from 'src/interfaces/usbMonitor.interface';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { Constants } from 'src/constants';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';
import { use3DSlicingStore } from 'src/stores/3d-slicing';

/**
 * Defines the props for the component.
 * @property {string} mediaType - The type of media to display ('images' or '3d_models').
 */
const props = defineProps<{
  mediaType: string;
}>();

// Use Quasar's hook to access its plugins.
const $q = useQuasar();

// Define columns for the Quasar QTable component.
const columns: QTableProps['columns'] = [
  {
    name: 'path',
    label: 'File Path',
    align: 'left',
    sortable: true,
    required: true,
    field: (row) => row.file,
    format: (val) => `${val}`,
    style: 'max-width: max(15vh, 15vw);',
  },
  {
    name: 'file',
    label: 'USB File',
    align: 'left',
    sortable: true,
    required: true,
    field: (row) => row.file,
    format: (val) => `${val}`,
    style: 'max-width: max(15vh, 15vw);',
  },
  {
    name: 'date',
    label: 'Creation Date',
    align: 'center',
    sortable: true,
    required: false,
    sort: (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    field: (row) => row.date,
    style: 'width: max(5vh, 5vw);',
  },
  {
    name: 'size',
    label: 'File Size',
    align: 'center',
    sortable: true,
    required: false,
    field: (row) => row.size,
    style: 'width: max(5vh, 5vw);',
  },
  {
    name: 'upload',
    label: '',
    align: 'center',
    sortable: true,
    required: false,
    field: (row) => row.uploaded,
    style: 'width: max(5vh, 5vw);',
  },
  {
    name: 'use',
    label: '',
    align: 'center',
    sortable: false,
    required: false,
    field: (row) => row.use,
    style: 'width: max(5vh, 5vw);',
  },
];

// Access Pinia stores for application state management.
const usbMonitorStore = useUSBMonitorStore();
const mediaFilesManagementStore = useMediaFilesManagementStore();
const imageToGcodeConvertorStore = useImageToGcodeConvertor();
const sliceStore = use3DSlicingStore();
const materialLibraryStore = useMaterialLibraryStore();
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Destructures reactive properties from the store using `storeToRefs`.
 *
 * @property {boolean} isUSBMediaFilesDialogShown - Controls the visibility of the USB media files dialog.
 * @property {string} usbDeviceName - The name of the connected USB device.
 * @property {Array<USBFileData>} usbMediaFilesListData - The list of media files found on the USB device.
 */
const { isUSBMediaFilesDialogShown, usbDeviceName, usbMediaFilesListData } =
  storeToRefs(usbMonitorStore);

// Utility function for showing notifications.
const notifyMessage = showNotifyMessage();

/**
 * Reactive variable for the search filter input.
 * @type {ref<string>}
 */
const filter = ref<string>('');

/**
 * Reactive reference to the search input element for virtual keyboard integration.
 * @type {ref<QInput | null>}
 */
const searchInputElement = ref<QInput | null>(null);

/**
 * A computed property that filters `usbMediaFilesListData` based on `props.mediaType`.
 * This ensures that the table only displays files of the correct type (images or 3D models).
 *
 * @returns {Array<USBFileData>} - The filtered list of media files from the USB.
 */
const specificMediaList = computed(() => {
  return usbMediaFilesListData.value.filter((media: USBFileData) => {
    if (props.mediaType === Constants.MEDIA_TYPES.IMAGES) {
      return Constants.MEDIA_FILES_EXTENSIONS.IMAGES.some((ext) =>
        media.file.endsWith(ext)
      );
    } else if (props.mediaType === Constants.MEDIA_TYPES.THREE_D_MODELS) {
      return Constants.MEDIA_FILES_EXTENSIONS.THREE_D_MODELS.some((ext) =>
        media.file.endsWith(ext)
      );
    }
    return false;
  });
});

/**
 * Reactive variable to store the selected media files from the table.
 * @type {ref<Array<USBFileData>>}
 */
const selectedMediaFiles = ref<Array<USBFileData>>([]);

/**
 * Handles the "use" action for multiple selected media files.
 * It iterates through `selectedMediaFiles` and calls `handleUseMediaFileFromUSB` for each.
 */
const handleUseMultipleMediaFiles = () => {
  selectedMediaFiles.value.map(
    async (mediaFile) => await handleUseMediaFileFromUSB(mediaFile)
  );
};

/**
 * Handles the upload action for multiple selected media files.
 * It iterates through `selectedMediaFiles` and calls `handleUploadMediaFileFromUSB` for each.
 */
const handleUploadMultipleMediaFiles = () => {
  selectedMediaFiles.value.map(
    async (mediaFile) => await handleUploadMediaFileFromUSB(mediaFile)
  );
};

/**
 * Uploads a single media file from the USB drive to the system.
 *
 * This is an asynchronous function that returns a Promise. It checks if the file
 * has already been uploaded, updates the loading state, calls the store action,
 * and handles success/error notifications.
 *
 * @param {USBFileData} fileData - The data of the file to be uploaded.
 * @returns {Promise<void>} - A promise that resolves when the upload is complete.
 */
const handleUploadMediaFileFromUSB = (fileData: USBFileData) => {
  return new Promise<void>((resolve, reject) => {
    fileData.loading = true;
    if (!fileData.uploaded) {
      mediaFilesManagementStore
        .uploadMediaFileFromUSB(fileData.path)
        .then(() => {
          notifyMessage.success(Constants.API_SUCCESS_MESSAGES.UPLOAD_MESSAGE);
          fileData.loading = false;
          fileData.uploaded = true;
          resolve();
        })
        .catch((error) => {
          fileData.loading = false;
          notifyMessage.error(error.message);
          reject(error);
        });
    }
    resolve();
  });
};

/**
 * Handles the "use" action for a single media file from the USB.
 *
 * It first calls `handleUploadMediaFileFromUSB` to ensure the file is on the system,
 * then fetches the file, and finally passes it to the appropriate store (image-to-gcode
 * or 3d-slicing) based on the media type. It also handles dialog closure and notifications.
 *
 * @param {USBFileData} fileData - The data of the file to be used.
 */
const handleUseMediaFileFromUSB = async (fileData: USBFileData) => {
  await handleUploadMediaFileFromUSB(fileData).then(() => {
    mediaFilesManagementStore
      .fetchMediaFile(fileData.file)
      .then(async (file) => {
        if (file) {
          if (props.mediaType === Constants.MEDIA_TYPES.IMAGES) {
            await imageToGcodeConvertorStore.addNewImageData(file);
            materialLibraryStore.updateGcodeFileSettings();
          } else {
            sliceStore.addNew3DModelToSlicingContainer(file);
          }
        }
        usbMonitorStore.closeMediaUSBFilesDialog();
        mediaFilesManagementStore.closeAddNewMediaDialog();
      })
      .catch((error) => {
        notifyMessage.error(error.message);
      });
  });
};

/**
 * Extracts and shortens the file path for display in the table.
 *
 * It removes the mount point and normalizes the path to a consistent format,
 * returning only the last two directories of the file path.
 *
 * @param {USBFileData} mediaData - The data of the media file.
 * @returns {string} - The shortened, user-friendly file path.
 */
const getShortenPath = (mediaData: USBFileData) => {
  // remove the mount point path from the full path
  const path = mediaData.path.replace(mediaData.mountPoint, '');
  // normalize the path for all operation systems paths
  const normalizedPath = path.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/');

  // Get the last two directories
  const lastTwoDirectories = pathParts.slice(-3, -1).join('/') + '/';
  return lastTwoDirectories;
};

/**
 * Updates the `filter` reactive variable.
 * @param {string} value - The new value of the search filter.
 */
const handleChangeFilterValue = (value: string) => {
  filter.value = value;
};
</script>
<style lang="scss">
.dialog-box {
  min-width: 80vw;
}

.dialog-header-font {
  font-size: 3vh;
  font-weight: bold;
}

.header-table-top {
  thead tr:first-child th {
    border-bottom: solid 1px;
  }
  thead tr:first-child th {
    /* bg color is important for th; just specify one */
    background-color: #fff !important;
  }
  thead tr:first-child th {
    font-weight: bold;
    font-size: 2vh;
  }
}
.q-table__top,
thead tr th {
  position: sticky;
  z-index: 1;
}
/* prevent scrolling behind sticky top row on focus */
tbody {
  /* height of all previous header rows */
  scroll-margin-top: 48px;
}

.row-sub-text-size {
  font-size: 1.5vh;
}
</style>
