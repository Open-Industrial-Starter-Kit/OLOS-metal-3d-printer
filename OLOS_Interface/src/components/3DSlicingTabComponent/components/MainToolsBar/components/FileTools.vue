<template>
  <q-btn-dropdown
    title="File"
    label="File"
    no-caps
    menu-anchor="bottom left"
    menu-self="top start"
    flat
    dropdown-icon="none"
  >
    <q-list>
      <q-item clickable @click="handleStartNewProject" v-close-popup>
        <q-item-section avatar>
          <q-avatar icon="note_add" color="dark" text-color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>New Project</q-item-label>
          <q-item-label caption>Start with a new model</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable @click="handleOpenProject" v-close-popup>
        <q-item-section avatar>
          <q-avatar icon="folder_open" color="dark" text-color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Open Project</q-item-label>
          <q-item-label caption
            >Restore models and object settings</q-item-label
          >
        </q-item-section>
      </q-item>

      <q-item
        clickable
        @click="handleSaveProject"
        :disable="isSlicingContainerEmpty"
        v-close-popup
      >
        <q-item-section avatar>
          <q-avatar icon="save" color="dark" text-color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Save Project</q-item-label>
          <q-item-label caption>Keep every model and its settings</q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        clickable
        @click="handleExportPrintSettings"
        :disable="isSlicingContainerEmpty"
        v-close-popup
      >
        <q-item-section avatar>
          <q-avatar icon="description" color="dark" text-color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Export Print Settings</q-item-label>
          <q-item-label caption
            >Download every setting as ordered text</q-item-label
          >
        </q-item-section>
      </q-item>

      <q-separator inset spaced />

      <q-item
        clickable
        @click="handleSaveModelsToSystem"
        :disable="isSlicingContainerEmpty"
      >
        <q-item-section avatar>
          <q-avatar icon="save_alt" color="dark" text-color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Save Merged Model</q-item-label>
          <q-item-label caption>Save one STL in system media</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable @click="handleAddNewModel" v-close-popup>
        <q-item-section avatar>
          <q-avatar icon="publish" color="dark" text-color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Import</q-item-label>
          <q-item-label caption>Add new model</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable @click="handleImportGcode" v-close-popup>
        <q-item-section avatar>
          <q-avatar icon="upload_file" color="dark" text-color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Import G-code</q-item-label>
          <q-item-label caption>Upload .nc to preview</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable :disable="isSlicingContainerEmpty">
        <q-item-section avatar>
          <q-avatar icon="download" color="dark" text-color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Export</q-item-label>
          <q-item-label caption>Download all models</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right" />
        </q-item-section>
        <q-menu
          anchor="top end"
          self="top start"
          :no-parent-event="isSlicingContainerEmpty"
        >
          <q-list>
            <q-item
              clickable
              @click="
                handleExportAllModels(Constants.SLICING_FILES_FORMATE.OBJ)
              "
              v-close-popup
            >
              <q-item-section>{{
                Constants.SLICING_FILES_FORMATE.OBJ
              }}</q-item-section>
            </q-item>
            <q-item
              clickable
              @click="
                handleExportAllModels(Constants.SLICING_FILES_FORMATE.STL)
              "
              v-close-popup
            >
              <q-item-section>{{
                Constants.SLICING_FILES_FORMATE.STL
              }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>
    </q-list>
  </q-btn-dropdown>

  <input
    ref="projectFileInput"
    type="file"
    accept=".olos-project.json,application/json"
    class="hidden-file-input"
    @change="onProjectFileSelected"
  />

  <input
    ref="gcodeFileInput"
    type="file"
    accept=".nc,.gcode,.cnc"
    class="hidden-file-input"
    @change="onGcodeFileSelected"
  />
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar';
import { Constants } from 'src/constants';
import {
  SLICER_PROJECT_EXTENSION,
  use3DSlicingStore,
} from 'src/stores/3d-slicing';
import { storeToRefs } from 'pinia';
import { useMediaFilesManagementStore } from 'src/stores/media-files-management';
import { ref } from 'vue';
import PreviewSliceDialog from 'src/components/CustomDialogs/PreviewSliceDialog.vue';
import { showNotifyMessage } from 'src/services/notify.messages.service';

/**
 * Quasar framework instance, used for dialogs and UI interactions.
 */
const $q = useQuasar();
const notifyMessage = showNotifyMessage();

/**
 * 3D Slicing store manages models, meshes, and slicing operations
 * within the 3D scene.
 */
const slicingStore = use3DSlicingStore();

/**
 * Media files management store handles uploading and managing
 * media assets like 3D models.
 */
const mediaFilesManagementStore = useMediaFilesManagementStore();
const projectFileInput = ref<HTMLInputElement | null>(null);
const gcodeFileInput = ref<HTMLInputElement | null>(null);

/**
 * Reactive reference to check if the slicing container is empty.
 */
const { isSlicingContainerEmpty } = storeToRefs(slicingStore);

/**
 * Starts a new 3D project.
 *
 * If the slicing container is empty, it immediately adds a new model.
 * Otherwise, it shows a confirmation dialog before clearing the container
 * and adding a new model.
 */
const handleStartNewProject = () => {
  if (isSlicingContainerEmpty.value) {
    handleAddNewModel();
  } else {
    showConfirmNewProjectDialog().onOk(() => {
      slicingStore.clearSlicingContainer();
      isSlicingContainerEmpty.value = true;
      handleAddNewModel();
    });
  }
};

/**
 * Saves all current models in the slicing container to the system.
 *
 * Opens a dialog to prompt for the file name and saves the models
 * in the STL format by default.
 */
const handleSaveModelsToSystem = () => {
  showWriteFileNameDialog(Constants.SLICING_FILES_FORMATE.STL).onOk(
    async (filename) => {
      await slicingStore.saveModelsToSystem(filename);
    }
  );
};

/**
 * Opens the media file dialog to add a new 3D model to the scene.
 */
const handleAddNewModel = () => {
  mediaFilesManagementStore.showAddNewMediaDialog(
    Constants.MEDIA_TYPES.THREE_D_MODELS
  );
};

/** Downloads a complete multi-object slicer project. */
const handleSaveProject = () => {
  showWriteFileNameDialog(SLICER_PROJECT_EXTENSION).onOk(async (filename) => {
    try {
      await slicingStore.saveSlicerProjectLocally(filename);
      notifyMessage.success('Slicer project saved.');
    } catch (error: unknown) {
      notifyMessage.error(
        error instanceof Error
          ? error.message
          : 'Could not save the slicer project.'
      );
    }
  });
};

const handleOpenProject = () => {
  const chooseProject = () => projectFileInput.value?.click();
  if (isSlicingContainerEmpty.value) {
    chooseProject();
    return;
  }
  showConfirmOpenProjectDialog().onOk(chooseProject);
};

const handleExportPrintSettings = () => {
  try {
    const filename = slicingStore.exportPrintSettingsReport();
    notifyMessage.success(`${filename} saved to Downloads.`);
  } catch (error: unknown) {
    notifyMessage.error(
      error instanceof Error
        ? error.message
        : 'Could not export the print settings.'
    );
  }
};

const onProjectFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  try {
    await slicingStore.loadSlicerProjectFile(file);
    notifyMessage.success('Slicer project loaded.');
  } catch (error: unknown) {
    notifyMessage.error(
      error instanceof Error
        ? error.message
        : 'Could not load the slicer project.'
    );
  }
};

const handleImportGcode = () => {
  gcodeFileInput.value?.click();
};

const onGcodeFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';

  if (!file) return;

  try {
    await slicingStore.importGcodeFileToSlicer(file);
    notifyMessage.success(Constants.API_SUCCESS_MESSAGES.UPLOAD_MESSAGE);
    showPreviewSliceDialog();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Could not import G-code file.';
    notifyMessage.error(message);
  }
};

/**
 * Exports all models in the slicing container to the specified format.
 *
 * @param format - The file format to export the models to (e.g., "STL", "OBJ").
 */
const handleExportAllModels = (format: string) => {
  showWriteFileNameDialog(format).onOk((filename) =>
    slicingStore.exportAllModels(filename, format)
  );
};

const showPreviewSliceDialog = () => {
  return $q.dialog({
    component: PreviewSliceDialog,
  });
};

/**
 * Opens a dialog prompting the user to enter a file name.
 *
 * @param format - The file format suffix to display in the dialog (e.g., "STL").
 * @returns A Quasar dialog instance for handling user confirmation.
 */
const showWriteFileNameDialog = (format: string) => {
  return $q.dialog({
    title: 'File Name',
    message: 'Give your file a name?',
    prompt: {
      model: '',
      type: 'text',
      suffix: format,
    },
    ok: {
      push: true,
    },
    cancel: true,
    persistent: true,
    color: 'dark',
  });
};

/**
 * Opens a confirmation dialog before starting a new project.
 *
 * Warns the user that any unsaved data will be lost.
 * @returns A Quasar dialog instance for handling user confirmation.
 */
const showConfirmNewProjectDialog = () => {
  return $q.dialog({
    title: 'Confirm',
    message:
      'Any unsaved data will be lost. Are you sure you want to start new Project?',
    cancel: true,
    persistent: true,
    color: 'dark',
  });
};

const showConfirmOpenProjectDialog = () => {
  return $q.dialog({
    title: 'Open Project',
    message:
      'Opening a project replaces the models currently on the bed. Continue?',
    cancel: true,
    persistent: true,
    color: 'dark',
  });
};
</script>

<style scoped>
.hidden-file-input {
  display: none;
}
</style>
