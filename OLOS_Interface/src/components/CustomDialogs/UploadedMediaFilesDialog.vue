<template>
  <q-dialog
    v-model="isUploadedMediaDialogShown"
    transition-show="scale"
    transition-hide="scale"
    persistent
  >
    <q-card class="dialog-box">
      <div class="column fit">
        <q-bar
          class="row full-width text-white bg-brown-5 items-center justify-between q-py-lg"
        >
          <span class="dialog-header-font">Uploaded {{ mediaType }}</span>
          <q-btn
            dense
            flat
            icon="close"
            size="2.5vh"
            @click="mediaFilesManagementStore.closeUploadedMediaFilesDialog"
          >
            <q-tooltip>Close</q-tooltip>
          </q-btn>
        </q-bar>
        <q-table
          class="header-table-top bg-white fit"
          flat
          row-key="file"
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
              color="brown-5"
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
              v-if="selectedMediaFiles.length && specificMediaList.length"
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
                label="Download Selected Files"
                size="1.5vh"
                color="info"
                outline
                @click="handleDownloadMultipleMediaFiles"
              />
              <q-btn
                label="Delete Selected Files"
                size="1.5vh"
                color="negative"
                outline
                @click="handleDeleteMultipleMediaFiles"
              />
            </div>
          </template>

          <template v-slot:header-selection="scope">
            <q-checkbox v-model="scope.selected" color="brown-5"></q-checkbox>
          </template>

          <template v-slot:body="props">
            <q-tr :props="props" class="bg-white cursor-pointer">
              <q-td>
                <q-checkbox
                  v-model="props.selected"
                  color="brown-5"
                ></q-checkbox>
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
                <q-spinner
                  v-if="props.row.loading"
                  color="positive"
                  size="2vh"
                  :thickness="5"
                />
                <q-btn
                  v-else
                  flat
                  @click="handleUseMediaFile(props.row)"
                  icon="edit"
                  size="2vh"
                />
              </q-td>

              <q-td key="download" :props="props">
                <q-spinner
                  v-if="props.row.downloaded"
                  color="positive"
                  size="2vh"
                  :thickness="5"
                />
                <q-btn
                  v-else
                  flat
                  @click="handleDownloadMedia(props.row)"
                  icon="download"
                  size="2vh"
                />
              </q-td>

              <q-td key="rename" :props="props">
                <q-btn
                  flat
                  @click="handleRenameMedia(props.row)"
                  icon="edit_square"
                  size="2vh"
                />
              </q-td>

              <q-td key="delete" :props="props">
                <q-btn
                  flat
                  @click="handleDeleteMedia(props.row)"
                  icon="delete_forever"
                  size="2vh"
                />
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
import { computed, onBeforeMount, ref } from 'vue';
import { useQuasar, QTableProps, QInput } from 'quasar';
import { useMediaFilesManagementStore } from 'src/stores/media-files-management';
import { useImageToGcodeConvertor } from 'src/stores/image-to-gcode';
import { useMaterialLibraryStore } from 'src/stores/material-library';
import { useUSBMonitorStore } from 'src/stores/usb-monitor';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';
import { MediaFileData } from 'src/interfaces/mediaFilesManagement.interface';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { Constants } from 'src/constants';
import RenameFileDialog from 'src/components/CustomDialogs/RenameFileDialog.vue';
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
    name: 'file',
    label: 'File',
    align: 'left',
    sortable: true,
    required: true,
    field: (row) => row.file,
    format: (val) => `${val}`,
    style: 'max-width: max(15vh, 15vw);',
  },
  {
    name: 'date',
    label: 'Upload Date',
    align: 'center',
    sortable: true,
    required: false,
    sort: (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    field: (row) => row.date,
    style: 'width: min(5vh, 5vw);',
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
    name: 'download',
    label: '',
    align: 'center',
    sortable: false,
    required: false,
    field: (row) => row.download,
    style: 'width: max(5vh, 5vw);',
  },
  {
    name: 'rename',
    label: '',
    align: 'center',
    sortable: false,
    required: false,
    field: (row) => row.rename,
    style: 'width: max(5vh, 5vw);',
  },
  {
    name: 'delete',
    label: '',
    align: 'center',
    sortable: false,
    required: false,
    field: (row) => row.delete,
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
const mediaFilesManagementStore = useMediaFilesManagementStore();
const imageToGcodeConvertorStore = useImageToGcodeConvertor();
const sliceStore = use3DSlicingStore();
const materialLibraryStore = useMaterialLibraryStore();
const usbMonitorStore = useUSBMonitorStore();
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Destructures reactive properties from the store using `storeToRefs`.
 * @property {boolean} isUploadedMediaDialogShown - Controls the visibility of the media dialog.
 * @property {Array<MediaFileData>} mediaListData - The list of all media files from the system.
 */
const { isUploadedMediaDialogShown, mediaListData } = storeToRefs(
  mediaFilesManagementStore
);

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
 * Reactive variable to store the selected media files from the table.
 * @type {ref<Array<MediaFileData>>}
 */
const selectedMediaFiles = ref<Array<MediaFileData>>([]);

/**
 * A computed property that filters `mediaListData` based on `props.mediaType`.
 * This ensures that the table only displays files of the correct type (images or 3D models).
 * @returns {Array<MediaFileData>} - The filtered list of media files.
 */
const specificMediaList = computed(() => {
  return mediaListData.value.filter((media: MediaFileData) => {
    if (props.mediaType === Constants.MEDIA_TYPES.IMAGES) {
      return Constants.MEDIA_FILES_EXTENSIONS.IMAGES.some((ext) =>
        media.file.endsWith(ext)
      );
    } else if (props.mediaType === Constants.MEDIA_TYPES.THREE_D_MODELS) {
      return Constants.MEDIA_FILES_EXTENSIONS.THREE_D_MODELS.some((ext) =>
        media.file.endsWith(ext)
      );
    }
    return [];
  });
});

/**
 * Handles the downloading of multiple selected media files.
 * It iterates through `selectedMediaFiles` and calls `handleDownloadMedia` for each.
 */
const handleDownloadMultipleMediaFiles = () => {
  selectedMediaFiles.value.forEach((file) => handleDownloadMedia(file));
};

/**
 * Displays a confirmation dialog before downloading a single media file.
 * If the user confirms, it calls the `downloadMedia` function.
 * @param {MediaFileData} mediaData - The data of the media file to download.
 */
const handleDownloadMedia = (mediaData: MediaFileData) => {
  $q.dialog({
    title: 'Confirm',
    color: 'primary',
    message: `Would you like to download "${mediaData.file}"?`,
    style: {
      backdropFilter: 'none',
    },
    ok: {
      label: 'Yes',
      flat: true,
    },
    cancel: {
      label: 'No',
      flat: true,
    },
  }).onOk(() => downloadMedia(mediaData));
};

/**
 * Handles the usage of multiple selected media files.
 * It iterates through `selectedMediaFiles` and calls `handleUseMediaFile` for each.
 */
const handleUseMultipleMediaFiles = () => {
  selectedMediaFiles.value.forEach((file) => handleUseMediaFile(file));
};

/**
 * Displays a confirmation dialog before deleting a single media file.
 * If the user confirms, it calls the `deleteMedia` function.
 * @param {MediaFileData} mediaData - The data of the media file to delete.
 */
const handleDeleteMedia = (mediaData: MediaFileData) => {
  $q.dialog({
    title: 'Confirm',
    color: 'primary',
    message: `Would you like to delete "${mediaData.file}"?`,
    ok: {
      label: 'Yes',
      flat: false,
      color: 'negative',
    },
    cancel: {
      label: 'No',
      flat: true,
    },
  }).onOk(() => deleteMedia(mediaData));
};

/**
 * Handles the deletion of multiple selected media files.
 * It iterates through `selectedMediaFiles` and calls `handleDeleteMedia` for each.
 */
const handleDeleteMultipleMediaFiles = () => {
  selectedMediaFiles.value.forEach((file) => handleDeleteMedia(file));
};

/**
 * Handles the process of "using" a media file.
 * This involves fetching the file content from the system and then passing it
 * to the appropriate store (image-to-gcode or 3d-slicing) based on `props.mediaType`.
 * It also handles success/error notifications and dialog closure.
 * @param {MediaFileData} mediaData - The data of the media file to use.
 */
const handleUseMediaFile = (mediaData: MediaFileData) => {
  mediaData.loading = true;
  mediaFilesManagementStore
    .fetchMediaFile(mediaData.file)
    .then(async (file) => {
      if (file) {
        if (props.mediaType === Constants.MEDIA_TYPES.IMAGES) {
          await imageToGcodeConvertorStore.addNewImageData(file);
          materialLibraryStore.updateGcodeFileSettings();
        } else {
          sliceStore.addNew3DModelToSlicingContainer(file);
        }
      }
      mediaFilesManagementStore.closeUploadedMediaFilesDialog();
      mediaFilesManagementStore.closeAddNewMediaDialog();
      mediaData.loading = false;
    })
    .catch((error) => {
      notifyMessage.error(error.message);
      mediaData.loading = false;
    });
};

/**
 * Displays a rename dialog for a single media file.
 * It passes the necessary data and the `renameMedia` function as a callback.
 * @param {MediaFileData} mediaData - The data of the media file to rename.
 */
const handleRenameMedia = (mediaData: MediaFileData) => {
  $q.dialog({
    component: RenameFileDialog,
    componentProps: {
      filesListData: specificMediaList.value,
      filename: mediaData.file,
      mediaData,
      renameMedia,
    },
  });
};

/**
 * Renames a media file on the system.
 * It calls the `renameMediaFile` action on the store and handles notifications.
 * @param {string} newMediaName - The new name for the media file.
 * @param {MediaFileData} mediaData - The data of the media file to rename.
 */
const renameMedia = (newMediaName: string, mediaData: MediaFileData) => {
  mediaFilesManagementStore
    .renameMediaFile(mediaData.file, newMediaName)
    .then(() => {
      notifyMessage.success(Constants.API_SUCCESS_MESSAGES.RENAME_MESSAGE);
    })
    .catch((error) => {
      notifyMessage.error(error.message);
    });
};

/**
 * Deletes a media file from the system.
 * It calls the `deleteMediaFile` action on the store, updates the selected files list,
 * and handles notifications.
 * @param {MediaFileData} mediaData - The data of the media file to delete.
 */
const deleteMedia = (mediaData: MediaFileData) => {
  mediaData.loading = true;
  mediaFilesManagementStore
    .deleteMediaFile(mediaData.file)
    .then(() => {
      usbMonitorStore.checkIfDeletedMediaExistInUSBMediaFiles(mediaData.file);
      const deletedMediaIndex = selectedMediaFiles.value.indexOf(mediaData);
      selectedMediaFiles.value.splice(deletedMediaIndex, 1);
      notifyMessage.success(Constants.API_SUCCESS_MESSAGES.DELETE_MESSAGE);
      mediaData.loading = false;
    })
    .catch((error) => {
      notifyMessage.error(error.message);
      mediaData.loading = false;
    });
};

/**
 * Downloads a media file from the system.
 * It calls the `downloadMediaFile` action on the store and handles notifications.
 * @param {MediaFileData} mediaData - The data of the media file to download.
 */
const downloadMedia = (mediaData: MediaFileData) => {
  mediaData.downloaded = true;
  mediaFilesManagementStore
    .downloadMediaFile(mediaData.file)
    .then(() => {
      notifyMessage.success(Constants.API_SUCCESS_MESSAGES.DOWNLOAD_MESSAGE);
      mediaData.downloaded = false;
    })
    .catch((error) => {
      notifyMessage.error(error.message);
      mediaData.downloaded = false;
    });
};

/**
 * Updates the `filter` reactive variable.
 * @param {string} value - The new value of the search filter.
 */
const handleChangeFilterValue = (value: string) => {
  filter.value = value;
};

/**
 * Lifecycle hook `onBeforeMount`.
 * This hook is called before the component is mounted. It fetches the list of
 * all media files from the system to populate the table.
 */
onBeforeMount(async () => {
  await mediaFilesManagementStore.listMedia();
});
</script>

<style scoped lang="scss">
.dialog-box {
  min-width: 90vw;
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
