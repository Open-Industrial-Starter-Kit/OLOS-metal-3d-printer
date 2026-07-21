<template>
  <q-dialog
    ref="dialogRef"
    @show="onDialogShow"
    @hide="onDialogHide"
    :persistent="true"
    backdrop-filter="blur(10px)"
  >
    <q-card class="fit column dialog-card-size">
      <q-card-section class="full-width dialog-header">
        <div class="text-h6">Slice Preview</div>
        <q-space />
        <q-toggle
          v-model="showMachineCoordinates"
          dense
          dark
          color="warning"
          label="Machine coordinates"
          class="q-mr-sm"
        />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section v-if="isGcodeError" class="q-pa-md">
        <p class="text-h6 text-center">
          {{ Constants.PREVIEWER_GCODE_ERROR_MESSAGE }}
        </p>
      </q-card-section>

      <q-card-section v-else class="col q-pa-none q-ma-none">
        <div ref="sliceContainer" class="fit" style="overflow: hidden">
          <q-range
            v-if="!isSlicingGraphLoading"
            v-model="layers"
            :min="1"
            :max="numberOfLayers"
            :color="colorTheme"
            track-color="white"
            vertical
            reverse
            label-always
            class="layers-slider"
          />
        </div>
        <q-inner-loading :showing="isSlicingGraphLoading">
          <q-spinner-gears size="100" :color="colorTheme" />
          <p class="loading-text">Please wait...</p>
        </q-inner-loading>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useDialogPluginComponent } from 'quasar';
import { LayersRange } from 'src/interfaces/3D.slicing.interface';
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import { computed, ref, watch } from 'vue';
import { Constants } from 'src/constants';

// The `useDialogPluginComponent` provides the necessary methods for a Quasar dialog.
const { dialogRef, onDialogHide } = useDialogPluginComponent();
defineEmits([...useDialogPluginComponent.emits]);

// Access the Pinia store for 3D slicing.
const slicingStore = use3DSlicingStore();

/**
 * Destructures reactive properties from the store using `storeToRefs`.
 *
 * @property {string} colorTheme - The current color theme of the application.
 * @property {LayersRange} layersRange - An object containing the start and end layers for visibility.
 * @property {number} numberOfLayers - The total number of layers in the sliced model.
 */
const { colorTheme, layersRange, numberOfLayers } = storeToRefs(slicingStore);

/**
 * A reactive reference to the HTML element where the slicing graph will be rendered.
 * @type {ref<HTMLDivElement | null>}
 */
const sliceContainer = ref<HTMLDivElement | null>(null);

/**
 * A boolean flag to indicate if the slicing graph is currently loading.
 * @type {ref<boolean>}
 */
const isSlicingGraphLoading = ref<boolean>(true);

/**
 * A boolean flag to indicate if there was an error with the G-code.
 * @type {ref<boolean>}
 */
const isGcodeError = ref<boolean>(false);

const showMachineCoordinates = ref<boolean>(false);

/**
 * A computed property that acts as a two-way binding for the `layersRange`.
 *
 * The `get` function returns the current `layersRange` from the store.
 * The `set` function updates the layer visibility in the store whenever the
 * value is changed, for example, by a slider component.
 */
const layers = computed({
  get() {
    return layersRange.value;
  },
  set(newLayersRange: LayersRange) {
    slicingStore.setSlicedLayerVisibility(newLayersRange);
  },
});

/**
 * Handles the dialog's `onDialogShow` event.
 *
 * This function is called when the dialog becomes visible. It checks if the
 * `sliceContainer` element exists and then calls the `createSlicingResultGraph`
 * action on the store to render the G-code visualization. It updates the
 * `isSlicingGraphLoading` and `isGcodeError` flags based on the result.
 */
const onDialogShow = () => {
  if (sliceContainer.value) {
    slicingStore
      .createSlicingResultGraph(sliceContainer.value)
      .then(() => {
        slicingStore.setMachineCoordinateOverlayVisibility(
          showMachineCoordinates.value
        );
        isSlicingGraphLoading.value = false;
      })
      .catch((e) => {
        isGcodeError.value = true;
        throw Error(e);
      });
  }
};

watch(showMachineCoordinates, (isVisible) => {
  slicingStore.setMachineCoordinateOverlayVisibility(isVisible);
});
</script>
<style scoped lang="scss">
.dialog-card-size {
  max-width: 95vh;
  max-height: 95vh;
}

.dialog-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16px;
  background: $accent;
  color: white;
}

.layers-slider {
  position: absolute;
  right: 5%;
  top: 5%;
  height: 90%;
}
</style>
