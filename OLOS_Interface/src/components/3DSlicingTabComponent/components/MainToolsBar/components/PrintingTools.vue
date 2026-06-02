<template>
  <q-btn-dropdown
    title="Printing Settings"
    label="Printing Settings"
    no-caps
    menu-anchor="bottom left"
    menu-self="top start"
    flat
    dropdown-icon="none"
    class="items-start full-width"
  >
    <q-list>
      <!-- Slicing Profiles -->
      <q-item class="row items-center q-gutter-x-sm">
        <span class="text-bold"><u>Slicing Profile:</u></span>

        <q-select
          outlined
          dense
          v-model="slicingProfileName"
          :options="profilesNameList"
          class="col"
          @update:model-value="handleSelectNewSlicingProfile"
        >
          <template v-slot:option="scope">
            <q-item
              v-bind="scope.itemProps"
              class="row full-width items-center justify-between"
            >
              <q-item-label>{{ scope.opt }}</q-item-label>
              <q-btn
                v-if="scope.opt !== Constants.DEFAULT_SLICING_PROFILE_NAME"
                icon="delete"
                flat
                dense
                color="negative"
                @click.stop.prevent="handleDeleteSlicingProfile(scope.opt)"
              />
            </q-item>
          </template>
        </q-select>

        <q-btn
          color="primary"
          flat
          icon="save"
          padding="xs"
          @click="handleAddNewSlicingProfile"
          :disable="!isValidSlicingSettings"
        >
          <q-tooltip
            anchor="center right"
            self="center left"
            :offset="[10, 10]"
          >
            Save Profile
          </q-tooltip>
        </q-btn>
        <q-btn
          color="brown-5"
          flat
          icon="refresh"
          padding="xs"
          @click="handleResetSlicingProfileSettings"
        >
          <q-tooltip
            anchor="center right"
            self="center left"
            :offset="[10, 10]"
          >
            Reset Profile Settings
          </q-tooltip>
        </q-btn>
      </q-item>
      <q-separator />

      <!-- Slicer Type -->
      <q-item>
        <q-item-section top class="q-gutter-y-md">
          <q-item-label class="text-bold"><u>Slicer Type:</u></q-item-label>
          <q-option-group
            :options="slicingOptions"
            type="radio"
            v-model="selectedSlicerLib"
            inline
            dense
            class="q-gutter-x-md"
          />
        </q-item-section>
        <q-item-section side top>
          <q-icon name="help" size="xs" color="blue-grey-9">
            <q-tooltip
              anchor="center right"
              self="center left"
              :offset="[10, 10]"
            >
              {{ Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES.SLICING_TYPE }}
            </q-tooltip>
          </q-icon>
        </q-item-section>
      </q-item>

      <q-separator />

      <!-- Slicing Settings -->
      <q-item>
        <q-item-section top class="q-gutter-y-md">
          <printing-configurations />
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import PrintingConfigurations from 'src/components/3DSlicingTabComponent/components/MainToolsBar/components/components/PrintingConfigurations/PrintingConfigurations.vue';
import { Constants } from 'src/constants';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import { computed, onMounted, ref } from 'vue';

/**
 * Quasar instance for dialogs and UI interactions.
 */
const $q = useQuasar();

/**
 * Notification service for showing success/error messages.
 */
const notifyMessage = showNotifyMessage();

/**
 * 3D Slicing store manages slicing profiles and 3D printing settings.
 */
const slicerStore = use3DSlicingStore();

/**
 * Reactive references from the slicing store:
 * - selectedSlicerLib: currently selected slicer library
 * - slicingProfileName: current active slicing profile name
 * - slicingProfilesList: list of all saved slicing profiles
 * - isValidSlicingSettings: flag to indicate if the current settings are valid
 */
const {
  selectedSlicerLib,
  slicingProfileName,
  slicingProfilesList,
  isValidSlicingSettings,
} = storeToRefs(slicerStore);

/**
 * Computed list of profile names for dropdowns or selection.
 */
const profilesNameList = computed(() =>
  slicingProfilesList.value.map((profile) => profile.profileName)
);

/**
 * Options for the available slicing libraries.
 * Each option can have a label, value, and optional color.
 */
const slicingOptions = ref<Array<Record<string, string>>>([
  {
    label: Constants.SLICING_LIBRARIES.SLIC3R,
    value: Constants.SLICING_LIBRARIES.SLIC3R,
  },
  {
    label: Constants.SLICING_LIBRARIES.PRUSA_SLICER,
    value: Constants.SLICING_LIBRARIES.PRUSA_SLICER,
    color: 'orange',
  },
  {
    label: Constants.SLICING_LIBRARIES.PYSLM,
    value: Constants.SLICING_LIBRARIES.PYSLM,
    color: 'green',
  },
]);

/**
 * Handles adding a new slicing profile.
 *
 * If the name matches the current profile, a confirmation dialog
 * for modifying is shown. Otherwise, a new profile is created.
 */
const handleAddNewSlicingProfile = () => {
  showWriteProfileNameDialog().onOk((profileName) => {
    if (profileName === slicingProfileName.value) {
      showConfirmModifyingProfileDialog(profileName).onOk(() => {
        slicerStore
          .modifySlicingProfile()
          .then(() =>
            notifyMessage.success(
              Constants.API_SUCCESS_MESSAGES.UPDATE_SLICING_PROFILE
            )
          )
          .catch((error) => notifyMessage.error(error.message));
      });
    } else {
      slicerStore
        .addSlicingProfile(profileName)
        .then(() =>
          notifyMessage.success(
            Constants.API_SUCCESS_MESSAGES.ADD_SLICING_PROFILE
          )
        )
        .catch((error) => notifyMessage.error(error.message));
    }
  });
};

/**
 * Handles deleting a slicing profile after confirmation.
 *
 * @param profileName - Name of the profile to delete
 */
const handleDeleteSlicingProfile = (profileName: string) => {
  showConfirmDeleteSlicingProfileDialog(profileName).onOk(() => {
    const profileId = slicingProfilesList.value.find(
      (profile) => profile.profileName === profileName
    )?.profileId;
    if (profileId) {
      slicerStore
        .deleteSlicingProfile(profileId, profileName)
        .then(() =>
          notifyMessage.success(
            Constants.API_SUCCESS_MESSAGES.DELETE_SLICING_PROFILE
          )
        )
        .catch((error) => notifyMessage.error(error.message));
    }
  });
};

/**
 * Sets a new slicing profile as active.
 *
 * @param profileName - Name of the profile to activate
 */
const handleSelectNewSlicingProfile = (profileName: string) => {
  setSlicingProfileSettings(profileName);
};

/**
 * Resets the slicing settings to the currently active profile.
 */
const handleResetSlicingProfileSettings = () => {
  setSlicingProfileSettings(slicingProfileName.value);
};

/**
 * Opens a dialog prompting the user to enter a slicing profile name.
 *
 * @returns Quasar dialog instance for confirmation handling
 */
const showWriteProfileNameDialog = () => {
  return $q.dialog({
    title: 'Profile Name',
    message: 'Give your profile a name?',
    prompt: {
      model: `${
        slicingProfileName.value !== Constants.DEFAULT_SLICING_PROFILE_NAME
          ? slicingProfileName.value
          : ''
      }`,
      type: 'text',
      isValid: (val) => !!val && val !== Constants.DEFAULT_SLICING_PROFILE_NAME,
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
 * Shows a confirmation dialog before modifying an existing profile.
 *
 * @param profileName - Name of the profile to modify
 */
const showConfirmModifyingProfileDialog = (profileName: string) => {
  return $q.dialog({
    title: 'Confirm',
    message: `Are you sure want to modify "${profileName}" profile?`,
    cancel: true,
    persistent: true,
    color: 'dark',
  });
};

/**
 * Shows a confirmation dialog before deleting a profile.
 *
 * @param profileName - Name of the profile to delete
 */
const showConfirmDeleteSlicingProfileDialog = (profileName: string) => {
  return $q.dialog({
    title: 'Confirm',
    message: `Are you sure want to delete "${profileName}" profile?`,
    ok: {
      push: true,
      color: 'negative',
    },
    cancel: true,
    persistent: true,
    color: 'dark',
  });
};

/**
 * Sets the slicing settings in the store based on the selected profile.
 *
 * @param profileName - Name of the profile to apply
 */
const setSlicingProfileSettings = (profileName: string) => {
  const selectedSlicingProfile = slicingProfilesList.value.find(
    (profile) => profile.profileName === profileName
  );
  if (selectedSlicingProfile) {
    slicerStore.setSlicingProfileSettings(selectedSlicingProfile);
  }
};

/**
 * Fetches the list of saved slicing profiles when the component mounts.
 */
onMounted(() => {
  slicerStore.fetchSlicingProfilesList();
});
</script>
