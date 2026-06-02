<template>
  <q-table
    class="header-table q-mb-lg bg-grey-4"
    flat
    row-key="name"
    bordered
    :rows="filesListData"
    :columns="columns"
    :dense="$q.screen.lt.md"
    :filter="filter"
    virtual-scroll
    :virtual-scroll-item-size="10"
    :virtual-scroll-sticky-size-start="10"
    :rows-per-page-options="[0]"
    hide-bottom
    style="max-height: 50vh"
    :loading="filesListData === undefined"
  >
    <template v-slot:top-right>
      <q-input
        ref="searchInputElement"
        dense
        debounce="300"
        v-model="filter"
        placeholder="Search"
        @touchstart="
          virtualKeyboardStore.handleInputTouchStart(null, searchInputElement)
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
    <template v-slot:body="props">
      <q-tr
        :props="props"
        @click="onRowClick(props.row)"
        :class="[
          { 'bg-blue-grey-2': selectedFilename === props.row.file },
          'cursor-pointer',
        ]"
      >
        <q-td key="jobs" :props="props">
          <span class="row-sub-text-size">{{ props.row.file }}</span>
        </q-td>
        <q-td key="date" :props="props">
          <span class="row-sub-text-size">{{ props.row.date }}</span>
        </q-td>
        <q-td key="size" :props="props">
          <span class="row-sub-text-size">{{ props.row.size }} KB</span>
        </q-td>
        <q-td key="download" :props="props">
          <q-btn
            flat
            @click="onDownloadFile(props.row)"
            icon="download"
            size="2vh"
          />
        </q-td>
        <q-td key="delete" :props="props">
          <q-btn
            flat
            @click="onDeleteFile(props.row)"
            icon="delete_forever"
            size="2vh"
          />
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useJobsFilesManagementStore } from 'src/stores/jobs-files-management';
import { useUSBMonitorStore } from 'src/stores/usb-monitor';
import { QTableProps, useQuasar, QInput } from 'quasar';
import { ref } from 'vue';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { Constants } from 'src/constants';
import { useGcodePreviewStore } from 'src/stores/gcode-preview';
import { JobFileData } from 'src/interfaces/jobsFilesManagement.interface';
import { useVirtualKeyboardStore } from 'src/stores/virtual-keyboard';

/**
 * Defines the columns for the `QTable`.
 *
 * @type {QTableProps['columns']}
 */
const columns: QTableProps['columns'] = [
  {
    name: 'jobs',
    label: 'Loaded Jobs',
    align: 'left',
    sortable: true,
    required: true,
    field: (row) => row.file,
    format: (val) => `${val}`,
  },
  {
    name: 'date',
    label: 'Upload Date',
    align: 'center',
    sortable: true,
    required: false,
    sort: (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    field: (row) => row.date,
  },
  {
    name: 'size',
    label: 'Job Size',
    align: 'center',
    sortable: true,
    required: false,
    field: (row) => row.size,
  },
  {
    name: 'delete',
    label: '',
    align: 'center',
    sortable: false,
    required: true,
    field: 'delete',
  },
  {
    name: 'download',
    label: '',
    align: 'center',
    sortable: false,
    required: true,
    field: 'download',
  },
];

// Use Quasar's hook to access its plugins.
const $q = useQuasar();

/**
 * Reactive variables for component state.
 */
const filter = ref<string>('');
const searchInputElement = ref<QInput | null>(null);

// Access Pinia stores for job files, G-code preview, USB monitoring, and virtual keyboard.
const jobManagerStore = useJobsFilesManagementStore();
const gcodePreviewStore = useGcodePreviewStore();
const usbMonitorStore = useUSBMonitorStore();
const virtualKeyboardStore = useVirtualKeyboardStore();

/**
 * Destructures reactive properties from the stores using `storeToRefs`.
 */
const { filesListData, selectedFilename } = storeToRefs(jobManagerStore);

// Initialize the notification service.
const notifyMessage = showNotifyMessage();

/**
 * Handles the selection of a job file row in the table.
 * @param {JobFileData} row - The data of the clicked row.
 */
const onRowClick = (row: JobFileData) => {
  jobManagerStore.selectFile(row.file);
};

/**
 * Handles the deletion of a job file.
 *
 * It displays a confirmation dialog before calling the `deleteFile` action
 * from the store. On success, it shows a notification, checks for the file's
 * existence on the USB, and resets the G-code preview.
 *
 * @param {JobFileData} row - The data of the file to be deleted.
 */
const onDeleteFile = (row: JobFileData) => {
  $q.dialog({
    title: 'Confirm',
    color: 'primary',
    message: `Would you like to delete "${row.file}"?`,
    ok: {
      label: 'Yes',
      flat: true,
    },
    cancel: {
      label: 'No',
      flat: true,
    },
  }).onOk(() => {
    const filename = row.file;

    jobManagerStore
      .deleteFile(filename)
      .then(() => {
        notifyMessage.success(Constants.API_SUCCESS_MESSAGES.DELETE_MESSAGE);
        usbMonitorStore.checkIfDeletedFileExistInUSBJobFiles(filename);
        gcodePreviewStore.resetGraph();
      })
      .catch((error) => notifyMessage.error(error.message));
  });
};

/**
 * Handles the download of a job file.
 *
 * It displays a confirmation dialog before calling the `downloadFile` action
 * from the store. On success, it shows a notification.
 *
 * @param {JobFileData} row - The data of the file to be downloaded.
 */
const onDownloadFile = (row: JobFileData) => {
  $q.dialog({
    title: 'Confirm',
    color: 'primary',
    message: `Would you like to download "${row.file}"?`,
    ok: {
      label: 'Yes',
      flat: true,
    },
    cancel: {
      label: 'No',
      flat: true,
    },
  }).onOk(() => {
    jobManagerStore
      .downloadFile(row.file)
      .then(() =>
        notifyMessage.success(Constants.API_SUCCESS_MESSAGES.DOWNLOAD_MESSAGE)
      )
      .catch((error) => notifyMessage.error(error.message));
  });
};

/**
 * Updates the filter value for the table.
 * @param {string} value - The new filter value.
 */
const handleChangeFilterValue = (value: string) => {
  filter.value = value;
};
</script>

<style lang="scss">
.header-table {
  thead tr:first-child th {
    border-bottom: solid 1px;
  }
  thead tr:first-child th {
    /* bg color is important for th; just specify one */
    background-color: #e0e0e0 !important;
  }
  thead tr:first-child th {
    font-weight: bold;
    font-size: 2vh;
  }
}

.row-sub-text-size {
  font-size: 1.5vh;
}
thead tr:first-child th {
  top: 0;
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
</style>
