<template>
  <div class="q-pa-lg">
    <div
      v-if="config"
      class="column q-gutter-md"
      :class="{
        disabled:
          machineState === Constants.RUN || machineState === Constants.HOLD,
      }"
    >
      <image-viewer :config />

      <image-note-message v-if="imageToGcodeConvertorStore.activeImage" />

      <image-settings-box
        :key="imageToGcodeConvertorStore.activeImage?.imageId"
        :hidden="!imageToGcodeConvertorStore.activeImage"
        :config
      />
      <q-card
        v-if="imageToGcodeConvertorStore.activeImage"
        bordered
        square
        flat
        class="fit"
      >
        <q-splitter v-model="splitterModel" :horizontal="isMobile">
          <template v-slot:before>
            <q-tabs
              v-model="activeTab"
              class="text-grey border-bottom"
              active-color="primary"
              active-bg-color="grey-4"
              indicator-color="primary"
              :vertical="!isMobile"
              stretch
            >
              <q-tab name="mapping" icon="grid_on" label="Mapping" />
              <q-tab
                name="settings"
                icon="settings"
                label="Settings"
                class="col-grow"
              />
              <q-tab
                name="materials"
                icon="library_books"
                label="Materials"
                class="col-grow"
              />
            </q-tabs>
          </template>
          <template v-slot:after>
            <q-tab-panels
              v-model="activeTab"
              animated
              :vertical="!isMobile"
              transition-prev="jump-up"
              transition-next="jump-up"
            >
              <q-tab-panel name="mapping">
                <image-mapping
                  :key="imageToGcodeConvertorStore.activeImage?.imageId"
                />
              </q-tab-panel>

              <q-tab-panel name="settings">
                <gcode-file-settings
                  :config
                  :key="imageToGcodeConvertorStore.activeImage?.imageId"
                />
              </q-tab-panel>

              <q-tab-panel name="materials">
                <material-library
                  :key="imageToGcodeConvertorStore.activeImage?.imageId"
                />
              </q-tab-panel>
            </q-tab-panels>
          </template>
        </q-splitter>
      </q-card>

      <generate-gcode-button :config />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuasar } from 'quasar';
import ImageViewer from 'src/components/GcodeGeneratorTabComponent/components/ImageViewer.vue';
import ImageMapping from 'src/components/GcodeGeneratorTabComponent/components/ImageMapping.vue';
import ImageSettingsBox from 'src/components/GcodeGeneratorTabComponent/components/ImageSettingsBox.vue';
import ImageNoteMessage from 'src/components/GcodeGeneratorTabComponent/components/ImageNoteMessage.vue';
import materialLibrary from 'src/components/GcodeGeneratorTabComponent/components/MaterialLibrary.vue';
import GcodeFileSettings from 'src/components/GcodeGeneratorTabComponent/components/GcodeFileSettings.vue';
import GenerateGcodeButton from 'src/components/GcodeGeneratorTabComponent/components/GenerateGcodeButton.vue';
import { onMounted, ref, watch, computed } from 'vue';
import { useImageToGcodeConvertor } from 'src/stores/image-to-gcode';
import { storeToRefs } from 'pinia';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { Config } from 'src/interfaces/configSettings.interface';
import { Constants } from 'src/constants';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { useMaterialLibraryStore } from 'src/stores/material-library';
import { useTabsStore } from 'src/stores/active-tab';
import { useRouter } from 'vue-router';

// Get the Quasar instance
const $q = useQuasar();
// Get the Vue Router instance
const router = useRouter();

// Access Pinia stores for application state management.
const imageToGcodeConvertorStore = useImageToGcodeConvertor();
const materialLibraryStore = useMaterialLibraryStore();
const tabsStore = useTabsStore();
const machineStore = useMachineStatusStore();

/**
 * Destructures reactive properties from the stores using `storeToRefs`.
 *
 */
const { machineState } = storeToRefs(machineStore);
const { navList } = storeToRefs(tabsStore);

/**
 * Reactive variables for component state.
 */
const config = ref<Config | null>(null);
const splitterModel = ref(15);
const isMobile = ref($q.screen.lt.md);

/**
 * A computed property that synchronizes the active tab of the current image with the UI.
 *
 * It acts as a two-way binding, getting the active tab from the store's
 * `activeImage` and setting it when the user changes it in the UI.
 */
const activeTab = computed({
  get() {
    return imageToGcodeConvertorStore.activeImage?.activeTab;
  },
  set(newActiveTab) {
    if (newActiveTab && imageToGcodeConvertorStore.activeImage)
      imageToGcodeConvertorStore.activeImage.activeTab = newActiveTab;
  },
});

/**
 * A watcher that monitors the machine's state.
 *
 * If the machine state changes to `RUN` or `HOLD` and the user is not
 * already on the controls tab, it programmatically switches to the controls tab.
 * This provides a seamless user experience when a job starts.
 */
watch(machineState, (newState) => {
  if (
    (newState === Constants.RUN || newState === Constants.HOLD) &&
    router.currentRoute.value.path !== '/controls'
  ) {
    tabsStore.changeTab(navList.value.controls);
  }
});

/**
 * Lifecycle hook `onMounted`.
 *
 * This hook is called when the component is first mounted. It asynchronously
 * loads the application configuration and fetches the material library data
 * from the backend, making them available to child components.
 */
onMounted(async () => {
  config.value = await configurationSettings();
  await materialLibraryStore.fetchMaterialLibraryData();
});
</script>
<style>
::v-deep(.q-tab__icon) {
  font-size: 2.5vh;
}
::v-deep(.q-tab__label) {
  font-size: 2vh;
}
</style>
