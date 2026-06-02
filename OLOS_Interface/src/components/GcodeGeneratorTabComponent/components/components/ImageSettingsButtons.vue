<template>
  <q-btn-group class="full-width" push spread stretch>
    <q-btn
      stack
      icon="add_photo_alternate"
      label="Add New Image"
      color="grey-7"
      push
      size="1.5vh"
      @click="handleAddNewImage"
    />
    <q-btn
      stack
      icon="photo_library"
      label="Duplicate Selected Image"
      color="grey-7"
      push
      size="1.5vh"
      @click="handleDuplicateSelectedImage"
    />
    <q-btn
      stack
      icon="delete"
      label="Remove Selected Image"
      color="grey-7"
      push
      size="1.5vh"
      @click="handleRemoveSelectedImage"
    />
    <q-btn
      stack
      icon="tune"
      label="Reset Transformations"
      color="grey-7"
      push
      size="1.5vh"
      @click="handleResetTransformation"
    />
  </q-btn-group>
</template>
<script setup lang="ts">
import { Config } from 'src/interfaces/configSettings.interface';
import { useQuasar } from 'quasar';
import DuplicateImageDialog from 'src/components/CustomDialogs/DuplicateImageDialog.vue';
import { useMediaFilesManagementStore } from 'src/stores/media-files-management';
import { useImageToGcodeConvertor } from 'src/stores/image-to-gcode';
import { Constants } from 'src/constants';

/**
 * Defines the props for the component.
 * @property {Config | null} config - The machine's configuration settings.
 */
const props = defineProps<{
  config: Config | null;
}>();

// Use Quasar's hook to access its plugins.
const $q = useQuasar();

// Access the Pinia store instances.
const mediaFilesManagementStore = useMediaFilesManagementStore();
const imageToGcodeConvertorStore = useImageToGcodeConvertor();

/**
 * Handles the process of adding a new image.
 *
 * This function calls the `showAddNewMediaDialog` action from the `mediaFilesManagementStore`,
 * specifying that the media type is `IMAGES`.
 */
const handleAddNewImage = async () => {
  await mediaFilesManagementStore.showAddNewMediaDialog(
    Constants.MEDIA_TYPES.IMAGES
  );
};

/**
 * Handles the duplication of the currently selected image.
 *
 * This function opens a `DuplicateImageDialog` using Quasar's dialog plugin,
 * which prompts the user to specify how many copies to create.
 */
const handleDuplicateSelectedImage = async () => {
  $q.dialog({
    component: DuplicateImageDialog,
  });
};

/**
 * Handles the removal of the currently active image.
 *
 * This function calls the `removeActiveImage` action from the `imageToGcodeConvertorStore`.
 */
const handleRemoveSelectedImage = () => {
  imageToGcodeConvertorStore.removeActiveImage();
};

/**
 * Handles resetting the transformation of the selected image.
 *
 * This function checks if the configuration and the image's original settings
 * are available. If they are, it calls the `updateMetricsManually` method on the
 * `konvaHelper` to reset the image's position, rotation, and scale to its
 * original state.
 */
const handleResetTransformation = () => {
  if (
    props.config &&
    imageToGcodeConvertorStore.activeImage?.originalImageConfig
  ) {
    imageToGcodeConvertorStore.konvaHelper.updateMetricsManually(
      imageToGcodeConvertorStore.activeImage,
      imageToGcodeConvertorStore.activeImage?.originalImageConfig,
      props.config
    );
  }
};
</script>
