<template>
  <q-card
    v-if="isVisible"
    class="print-height-control column items-center q-pa-sm"
    flat
    bordered
  >
    <q-toggle
      :model-value="isPrintHeightLimited"
      color="orange"
      icon="content_cut"
      aria-label="Limit print height"
      @update:model-value="setEnabled"
    >
      <q-tooltip>Limit print height</q-tooltip>
    </q-toggle>

    <template v-if="isPrintHeightLimited">
      <div class="text-caption text-weight-medium q-mb-xs">Print range</div>
      <div class="row no-wrap q-gutter-sm">
        <div class="column items-center">
          <q-slider
            :model-value="printHeightLowerLimit"
            class="height-slider"
            color="green"
            vertical
            label
            label-always
            :label-value="`${printHeightLowerLimit.toFixed(3)} mm`"
            :min="0"
            :max="maximumLowerHeight"
            :step="layerStep"
            @update:model-value="setLowerHeight"
            @change="commitLowerHeight"
          />
          <q-input
            :model-value="printHeightLowerLimit"
            class="height-input"
            dense
            outlined
            type="number"
            suffix="mm"
            :min="0"
            :max="maximumLowerHeight"
            :step="layerStep"
            @update:model-value="setLowerHeight"
            @change="commitLowerHeight"
          />
          <div class="text-caption text-grey-6 q-mt-xs">From</div>
        </div>
        <div class="column items-center">
          <q-slider
            :model-value="printHeightLimit"
            class="height-slider"
            color="orange"
            vertical
            label
            label-always
            :label-value="`${printHeightLimit.toFixed(3)} mm`"
            :min="minimumUpperHeight"
            :max="maximumPrintHeight"
            :step="layerStep"
            @update:model-value="setHeight"
            @change="commitHeight"
          />
          <q-input
            :model-value="printHeightLimit"
            class="height-input"
            dense
            outlined
            type="number"
            suffix="mm"
            :min="minimumUpperHeight"
            :max="maximumPrintHeight"
            :step="layerStep"
            @update:model-value="setHeight"
            @change="commitHeight"
          />
          <div class="text-caption text-grey-6 q-mt-xs">To</div>
        </div>
      </div>
      <div class="text-caption text-grey-6 q-mt-xs">
        {{ layerCount }} layers
      </div>
    </template>
  </q-card>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { Constants } from 'src/constants';
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import { useSliceInfoStore } from 'src/stores/slice-info';

const slicingStore = use3DSlicingStore();
const sliceInfoStore = useSliceInfoStore();
const {
  isSlicingContainerEmpty,
  selectedSlicerLib,
  prusaSettings,
  isPrintHeightLimited,
  maximumPrintHeight,
  printHeightLowerLimit,
  printHeightLimit,
  estimatedPrintTimeSeconds,
} = storeToRefs(slicingStore);
const { isSlicingDone, isSlicingProcess } = storeToRefs(sliceInfoStore);
const shouldReslice = ref(false);

const isVisible = computed(
  () =>
    !isSlicingContainerEmpty.value &&
    selectedSlicerLib.value === Constants.SLICING_LIBRARIES.PRUSA_SLICER
);

const layerStep = computed(() =>
  Math.max(0.001, Number(prusaSettings.value.layerHeight) || 0.001)
);

const minimumUpperHeight = computed(() =>
  Math.min(
    printHeightLowerLimit.value + layerStep.value,
    maximumPrintHeight.value
  )
);

const maximumLowerHeight = computed(() =>
  Math.max(0, printHeightLimit.value - layerStep.value)
);

const layerCount = computed(() =>
  Math.max(
    1,
    Math.floor(
      (printHeightLimit.value - printHeightLowerLimit.value) /
        layerStep.value +
        1e-9
    )
  )
);

const snapHeight = (value: number, allowZero = false) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return allowZero ? printHeightLowerLimit.value : printHeightLimit.value;
  }
  const layers = allowZero
    ? Math.max(0, Math.floor(numericValue / layerStep.value + 1e-9))
    : Math.max(1, Math.floor(numericValue / layerStep.value + 1e-9));
  return Math.min(maximumPrintHeight.value, layers * layerStep.value);
};

const setEnabled = (enabled: boolean) => {
  shouldReslice.value =
    isSlicingDone.value || estimatedPrintTimeSeconds.value !== null;
  slicingStore.setPrintHeightLimitEnabled(enabled);
  void resliceIfNeeded();
};

const setHeight = (value: string | number | null) => {
  if (value == null) return;
  if (isSlicingDone.value || estimatedPrintTimeSeconds.value !== null) {
    shouldReslice.value = true;
  }
  const snapped = snapHeight(Number(value));
  slicingStore.setPrintHeightLimit(
    Math.max(snapped, printHeightLowerLimit.value + layerStep.value)
  );
};

const commitHeight = (value: string | number | null) => {
  setHeight(value);
  void resliceIfNeeded();
};

const setLowerHeight = (value: string | number | null) => {
  if (value == null) return;
  if (isSlicingDone.value || estimatedPrintTimeSeconds.value !== null) {
    shouldReslice.value = true;
  }
  const snapped = snapHeight(Number(value), true);
  slicingStore.setPrintHeightLowerLimit(
    Math.min(snapped, printHeightLimit.value - layerStep.value)
  );
};

const commitLowerHeight = (value: string | number | null) => {
  setLowerHeight(value);
  void resliceIfNeeded();
};

const resliceIfNeeded = async () => {
  if (!shouldReslice.value || isSlicingProcess.value) return;
  shouldReslice.value = false;
  sliceInfoStore.startSliceProgress();
  try {
    await slicingStore.sliceAllSceneModels();
  } catch {
    sliceInfoStore.restSliceProgress();
  }
};

watch(
  () => prusaSettings.value.engravingMode,
  () => {
    if (isPrintHeightLimited.value) {
      slicingStore.setPrintHeightLowerLimit(printHeightLowerLimit.value);
      slicingStore.setPrintHeightLimit(printHeightLimit.value);
    }
  }
);
</script>

<style scoped lang="scss">
.print-height-control {
  position: absolute;
  top: 50%;
  right: 1.2rem;
  z-index: 5;
  width: 14rem;
  border-radius: 6px;
  transform: translateY(-50%);
  background: rgba(28, 28, 28, 0.97);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
}

.height-slider {
  height: 12rem;
}

.height-input {
  width: 5.75rem;
}
</style>
