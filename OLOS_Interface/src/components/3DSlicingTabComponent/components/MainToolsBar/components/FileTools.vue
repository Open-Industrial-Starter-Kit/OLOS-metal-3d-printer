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
          <q-avatar icon="folder_open" color="dark" text-color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Open</q-item-label>
          <q-item-label caption>Start a new project</q-item-label>
        </q-item-section>
      </q-item>

      <q-item
        clickable
        @click="handleSaveModelsToSystem"
        :disable="isSlicingContainerEmpty"
      >
        <q-item-section avatar>
          <q-avatar icon="save" color="dark" text-color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Save</q-item-label>
          <q-item-label caption>Save models in system</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator inset spaced />

      <q-item clickable @click="handleAddNewModel" v-close-popup>
        <q-item-section avatar>
          <q-avatar icon="publish" color="dark" text-color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Import</q-item-label>
          <q-item-label caption>Add new model</q-item-label>
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
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar';
import { Constants } from 'src/constants';
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import { storeToRefs } from 'pinia';
import { useMediaFilesManagementStore } from 'src/stores/media-files-management';

/**
 * Quasar framework instance, used for dialogs and UI interactions.
 */
const $q = useQuasar();

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
</script>
