<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
    :persistent="true"
    backdrop-filter="blur(4px)"
  >
    <q-card class="q-dialog-plugin dialog-box">
      <div class="column fit q-gutter-md q-pa-md">
        <q-btn
          v-if="isEditMaterial"
          icon="delete"
          color="negative"
          unelevated
          @click="handleDeleteMaterial"
          text-color="white"
          class="row self-end"
          size="1.5vh"
        >
          <q-tooltip>Delete Material</q-tooltip>
        </q-btn>
        <div class="row items-center justify-start">
          <span class="title-text-size q-pr-md">Material Name:</span>
          <q-input
            ref="materialInputElement"
            v-model="materialName"
            clear-icon="close"
            filled
            color="primary"
            class="row col"
            error-message="This material already exist"
            :error="!isValidMaterialName"
            @touchstart="handleInputTouchStart"
            @blur="handleInputBlur"
            @change="(value: string)=> materialName = value"
            data-kioskboard-specialcharacters="true"
          />
        </div>

        <div class="row items-center justify-start">
          <span class="title-text-size q-pr-md">Material image:</span>
          <q-file
            v-if="!materialImage"
            filled
            label="Pick an image file"
            accept=".svg,.jpg,.png,.jpeg"
            label-color="blue"
            use-chips
            input-class="sub-text-size"
            :max-file-size="Constants.MAX_MEDIA_FILE_SIZE"
            @rejected="onRejected"
            v-model="materialImageFile"
            @update:model-value="handleUploadMaterialImage"
          >
            <template v-slot:append>
              <q-icon name="attachment" color="primary" />
            </template>
          </q-file>

          <div v-else class="material-img-container relative-position">
            <q-btn
              icon="cancel"
              size="0.8vh"
              flat
              class="absolute-top-right"
              style="z-index: 1"
              @click="handleRemoveImage"
            />
            <q-img :src="materialImage" class="material-img" />
          </div>
        </div>

        <div class="row items-center justify-between">
          <span class="title-text-size">Material thicknesses:</span>
          <q-btn
            icon="add"
            color="primary"
            unelevated
            size="1.5vh"
            @click="handleAddNewThickness"
            :disable="!materialName"
          >
            <q-tooltip>Add Thickness</q-tooltip>
          </q-btn>
        </div>

        <q-scroll-area class="thickness-list-box">
          <div
            v-for="thickness in materialThicknesses"
            :key="thickness.thicknessId"
          >
            <div class="row items-center justify-between q-gutter-y-sm">
              <span class="title-text-size q-pl-sm"
                >{{ thickness.thicknessValue }} mm</span
              >
              <div>
                <q-btn
                  icon="settings"
                  color="primary"
                  size="1.5vh"
                  flat
                  @click="handleUpdateThickness(thickness.thicknessValue)"
                >
                  <q-tooltip>Edit Thickness</q-tooltip>
                </q-btn>
                <q-btn
                  icon="remove"
                  color="negative"
                  size="1.5vh"
                  flat
                  @click="handleDeleteThickness(thickness.thicknessValue)"
                >
                  <q-tooltip>Delete Thickness</q-tooltip>
                </q-btn>
              </div>
            </div>
            <q-separator />
          </div>
        </q-scroll-area>

        <q-card-actions align="right">
          <q-btn
            color="gray-6"
            flat
            label="Cancel"
            @click="onDialogCancel"
            size="1.5vh"
          />

          <q-btn
            v-if="isEditMaterial"
            color="positive"
            label="Update Material"
            unelevated
            size="2vh"
            @click="handleUpdateMaterial"
            :disable="!isValidMaterialData"
          />

          <q-btn
            v-else
            color="positive"
            label="Add Material"
            unelevated
            size="1.5vh"
            @click="handleAddNewMaterial"
            :disable="!isValidMaterialData"
          />
        </q-card-actions>
      </div>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref, onMounted, computed } from 'vue';
import { useDialogPluginComponent, useQuasar, QInput } from 'quasar';
import { Constants } from 'src/constants';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import {
  MaterialData,
  MaterialThickness,
  RejectedFileEntry,
} from 'src/interfaces/imageToGcode.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { Config } from 'src/interfaces/configSettings.interface';
import { useMaterialLibraryStore } from 'src/stores/material-library';
import AddNewThicknessDialog from 'src/components/CustomDialogs/MaterialLibraryDialog/components/AddNewThicknessDialog.vue';
import { VirtualKeyboard } from 'src/services/virtual.keyboard.service';

// Use Quasar's hook to access its plugins.
const $q = useQuasar();
// The `useDialogPluginComponent` provides the necessary methods for a Quasar dialog.
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
defineEmits([...useDialogPluginComponent.emits]);

// Access the Pinia store for the material library.
const materialLibraryStore = useMaterialLibraryStore();
const { materialsList } = storeToRefs(materialLibraryStore);
// Utility function for showing notifications.
const notifyMessage = showNotifyMessage();

/**
 * Defines the props for the component.
 *
 * @property {boolean} isEditMaterial - A flag to indicate if the dialog is in "edit" mode.
 * @property {MaterialData} material - The material data to be edited (if in edit mode).
 */
const props = defineProps<{
  isEditMaterial: boolean;
  material: MaterialData;
}>();

/**
 * Reactive references for component state and form inputs.
 * @type {ref}
 */
const config = ref<Config | null>(null);
const virtualKeyboard = new VirtualKeyboard();
const materialName = ref<string>('');
const materialThicknesses = ref<Array<MaterialThickness>>([]);
const materialImage = ref<string | null>(null);
const materialImageFile = ref<File | null>(null);
const materialInputElement = ref<QInput | null>(null);

/**
 * A computed property that validates the material name.
 *
 * It checks if the entered material name already exists in the `materialsList`.
 * If in "edit" mode, it ignores the current material's name during the check.
 *
 * @returns {boolean} - `true` if the name is valid (unique), `false` otherwise.
 */
const isValidMaterialName = computed(
  () =>
    !materialsList.value
      .map((material) => {
        if (props.isEditMaterial) {
          if (props.material.materialName !== materialName.value)
            return material.materialName.toLowerCase();
        } else {
          return material.materialName.toLowerCase();
        }
      })
      .includes(materialName.value.toLowerCase())
);

/**
 * A computed property that determines the overall validity of the material data.
 *
 * It checks if the `materialName` is not an empty string and if it is valid
 * according to the `isValidMaterialName` computed property.
 *
 * @returns {boolean} - `true` if the material data is valid, `false` otherwise.
 */
const isValidMaterialData = computed(
  () => materialName.value !== '' && isValidMaterialName.value
);

/**
 * Handles the creation of a new material.
 *
 * It constructs a new `MaterialData` object from the component's state,
 * calls the `addNewMaterial` action on the store, and displays a success
 * or error notification. It then closes the dialog.
 */
const handleAddNewMaterial = () => {
  const newMaterialData = {
    materialName: materialName.value,
    materialImage: materialImage.value,
    materialThicknesses: materialThicknesses.value,
  } as MaterialData;
  materialLibraryStore
    .addNewMaterial(newMaterialData)
    .then(() => {
      notifyMessage.success('Material added successfully');
    })
    .catch(() => {
      notifyMessage.error('Something went wrong while adding the material');
    });

  onDialogOK();
};

/**
 * Handles the updating of an existing material.
 *
 * It constructs an updated `MaterialData` object, calls the `updateMaterial`
 * action on the store, and displays a success or error notification. It then
 * closes the dialog.
 */
const handleUpdateMaterial = () => {
  const updatedMaterialData = {
    ...props.material,
    materialName: materialName.value,
    materialImage: materialImage.value,
    materialThicknesses: materialThicknesses.value,
  } as MaterialData;
  materialLibraryStore
    .updateMaterial(updatedMaterialData)
    .then(() => {
      notifyMessage.success('Material updated successfully');
    })
    .catch(() => {
      notifyMessage.error('Something went wrong while updating the material');
    });

  onDialogOK();
};

/**
 * Handles the deletion of a material.
 *
 * It first shows a confirmation dialog to the user. If the user confirms, it
 * calls the `deleteMaterial` action on the store and displays a notification.
 * It then closes the dialog.
 */
const handleDeleteMaterial = () => {
  $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to delete the material?',
    cancel: true,
    persistent: true,
    color: 'primary',
  }).onOk(async () => {
    materialLibraryStore
      .deleteMaterial(props.material.materialId)
      .then(() => notifyMessage.success('Material deleted successfully'))
      .catch(() =>
        notifyMessage.error('Something went wrong while deleting the material')
      );
    onDialogOK();
  });
};

/**
 * Opens a new dialog to add a new thickness profile to the material.
 *
 * It passes the current `materialThicknesses` list and a callback function to
 * add the new thickness to the list.
 */
const handleAddNewThickness = () => {
  $q.dialog({
    component: AddNewThicknessDialog,
    componentProps: {
      materialThicknesses: materialThicknesses.value,
      thicknessData: null,
      isEditThickness: false,
      addThickness: (newThickness: MaterialThickness) => {
        materialThicknesses.value.push(newThickness);
      },
      updateThickness: null,
      virtualKeyboard,
    },
  });
};

/**
 * Opens a dialog to update an existing thickness profile.
 *
 * It finds the selected thickness profile and passes its data and an `updateThickness`
 * callback function to the dialog.
 *
 * @param {number} thicknessValue - The thickness value of the profile to be updated.
 */
const handleUpdateThickness = (thicknessValue: number) => {
  $q.dialog({
    component: AddNewThicknessDialog,
    componentProps: {
      materialThicknesses: materialThicknesses.value,
      thicknessData: materialThicknesses.value.find(
        (thickness) => thickness.thicknessValue === thicknessValue
      ),
      isEditThickness: true,
      addThickness: (newThickness: MaterialThickness) => {
        materialThicknesses.value.push(newThickness);
      },
      updateThickness: (newThickness: MaterialThickness) => {
        const thicknessIndex = materialThicknesses.value.findIndex(
          (thickness) => thickness.thicknessValue === thicknessValue
        );
        materialThicknesses.value[thicknessIndex] = newThickness;
      },
      virtualKeyboard,
    },
  });
};

/**
 * Deletes a thickness profile from the material.
 *
 * It filters the `materialThicknesses` array to remove the selected profile.
 *
 * @param {number} thicknessValue - The thickness value of the profile to be deleted.
 */
const handleDeleteThickness = (thicknessValue: number) => {
  const selectedThicknessData = materialThicknesses.value.find(
    (thickness) => thickness.thicknessValue === thicknessValue
  );
  materialThicknesses.value = materialThicknesses.value.filter(
    (thickness) =>
      thickness.thicknessValue !== selectedThicknessData?.thicknessValue
  );
};

/**
 * Handles the upload of a material image.
 *
 * It reads the selected file as a data URL and sets it to the `materialImage`
 * reactive variable.
 */
const handleUploadMaterialImage = () => {
  if (materialImageFile.value) {
    const file = materialImageFile.value;
    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryString = event.target?.result;
      if (typeof binaryString === 'string') {
        materialImage.value = binaryString;
      }
    };
    reader.readAsDataURL(file);
  }
};

/**
 * Removes the material image from the component's state.
 */
const handleRemoveImage = () => {
  if (materialImage.value) {
    materialImage.value = null;
  }
  if (materialImageFile.value) {
    materialImageFile.value = null;
  }
};

/**
 * Handles rejected file uploads and displays appropriate notifications.
 *
 * This function is a handler for Quasar's file picker `onRejected` event.
 * It iterates through the rejected files and shows a user-friendly error
 * message based on the reason for rejection.
 *
 * @param {RejectedFileEntry[]} rejectedEntries - An array of rejected file objects.
 */
const onRejected = (rejectedEntries: RejectedFileEntry[]) => {
  rejectedEntries.forEach((entry) => {
    const notifyMessage = showNotifyMessage();
    switch (entry.failedPropValidation) {
      case Constants.UPLOAD_FILES_ERRORS.MAX_FILES.NAME:
        notifyMessage.error(Constants.UPLOAD_FILES_ERRORS.MAX_FILES.MESSAGE);
        break;
      case Constants.UPLOAD_FILES_ERRORS.MAX_FILE_SIZE.NAME:
        notifyMessage.error(
          Constants.UPLOAD_FILES_ERRORS.MAX_FILE_SIZE.MESSAGE
        );
        break;
      case Constants.UPLOAD_FILES_ERRORS.ACCEPT.NAME:
        notifyMessage.error(Constants.UPLOAD_FILES_ERRORS.ACCEPT.MESSAGE);
        break;
      case Constants.UPLOAD_FILES_ERRORS.DUPLICATE.NAME:
        notifyMessage.error(Constants.UPLOAD_FILES_ERRORS.DUPLICATE.MESSAGE);
        break;
      default:
        notifyMessage.error(Constants.UPLOAD_FILES_ERRORS.DEFAULT.MESSAGE);
    }
  });
};

/**
 * Sets up the virtual keyboard when the material name input is touched.
 */
const handleInputTouchStart = () => {
  virtualKeyboard.setUpInputBoxElements(null, materialInputElement.value);
  virtualKeyboard.show();
};

/**
 * Removes the virtual keyboard when the material name input loses focus.
 */
const handleInputBlur = () => {
  virtualKeyboard.remove();
};

/**
 * Lifecycle hook `onMounted`.
 *
 * This hook is called when the component is first mounted. It fetches the
 * application configuration and, if the dialog is in "edit" mode, initializes
 * the component's state with the data from the `material` prop. A deep copy
 * of the thickness array is created to prevent direct modification of the
 * original data.
 */
onMounted(async () => {
  config.value = await configurationSettings();
  if (props.material) {
    materialName.value = props.material.materialName;
    materialImage.value = props.material.materialImage;
    materialThicknesses.value = JSON.parse(
      JSON.stringify(props.material.materialThicknesses)
    );
  }
});
</script>
<style scoped>
.dialog-box {
  min-width: 80vw;
}

.material-img-container {
  width: max(15vh, 15vw);
}

.thickness-list-box {
  background-color: rgb(236, 236, 236);
  border: solid rgb(206, 206, 206) 2px;
  border-radius: 5px;
  height: 200px;
  width: 100%;
}
</style>
