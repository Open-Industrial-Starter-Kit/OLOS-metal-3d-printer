<template>
  <div
    class="column side-tools-bar no-border-radius"
    v-show="selectedModel.object"
  >
    <q-btn
      dense
      square
      outline
      size="1rem"
      icon="open_with"
      :class="[{ 'bg-grey-5': isModelTranslating }]"
      @click="handleTranslatingModel"
    >
      <q-tooltip class="bg-grey" anchor="center right" self="center start"
        >Move</q-tooltip
      >
    </q-btn>
    <q-btn
      dense
      square
      outline
      size="1rem"
      icon="360"
      :class="[{ 'bg-grey-5': isModelRotating }]"
      @click="handleRotatingModel"
    >
      <q-tooltip class="bg-grey" anchor="center right" self="center start"
        >Rotate</q-tooltip
      >
    </q-btn>
    <q-btn
      dense
      square
      outline
      size="1rem"
      icon="open_in_full"
      :class="[{ 'bg-grey-5': isModelResizing }]"
      @click="handleResizingModel"
    >
      <q-tooltip class="bg-grey" anchor="center right" self="center start"
        >Resize</q-tooltip
      >
    </q-btn>
    <q-btn
      dense
      square
      outline
      size="1rem"
      icon="flip"
      :class="[{ 'bg-grey-5': isModelMirroring }]"
      @click="handleMirroringModel"
    >
      <q-tooltip class="bg-grey" anchor="center right" self="center start"
        >Mirror</q-tooltip
      >
    </q-btn>
    <q-btn
      dense
      square
      outline
      size="1rem"
      icon="compress"
      @click="handleDropOnPlatform"
    >
      <q-tooltip class="bg-grey" anchor="center right" self="center start"
        >Drop on Platform</q-tooltip
      >
    </q-btn>
    <q-btn
      dense
      square
      outline
      size="1rem"
      icon="my_location"
      @click="handleCentralizeModel"
    >
      <q-tooltip class="bg-grey" anchor="center right" self="center start"
        >Center</q-tooltip
      >
    </q-btn>
    <q-btn
      dense
      square
      outline
      size="1rem"
      icon="content_copy"
      @click="handleCloningModel"
    >
      <q-tooltip class="bg-grey" anchor="center right" self="center start"
        >Clone</q-tooltip
      >
    </q-btn>
    <q-btn
      dense
      square
      outline
      size="1rem"
      icon="reply"
      @click="handleUndoTransformCommand"
    >
      <q-tooltip class="bg-grey" anchor="center right" self="center start"
        >Undo</q-tooltip
      >
    </q-btn>
    <q-btn dense square outline size="1rem" @click="handleRedoTransformCommand">
      <q-icon name="reply" class="rotate-180" />
      <q-tooltip class="bg-grey" anchor="center right" self="center start"
        >Redo</q-tooltip
      >
    </q-btn>
    <q-btn
      dense
      square
      outline
      size="1rem"
      icon="delete"
      @click="handleDeletingModel"
    >
      <q-tooltip class="bg-grey" anchor="center right" self="center start"
        >Delete</q-tooltip
      >
    </q-btn>

    <q-menu
      v-model="isMenuVisible"
      anchor="top right"
      :offset="[5, 0]"
      persistent
      max-width="15rem"
    >
      <!-- Translate list -->
      <q-list v-if="isModelTranslating" class="q-pb-md q-gutter-y-md">
        <q-item dense class="text-red-10">
          <q-item-section class="col-1">X:</q-item-section>
          <q-item-section class="col">
            <q-input
              v-model="modelTranslateX"
              type="number"
              color="red"
              dense
              suffix="mm"
              @update:model-value="onTranslateMetricsChange"
            />
          </q-item-section>
        </q-item>
        <q-item dense class="text-green-10">
          <q-item-section class="col-1">Y:</q-item-section>
          <q-item-section class="col">
            <q-input
              v-model="modelTranslateY"
              type="number"
              color="green"
              dense
              suffix="mm"
              @update:model-value="onTranslateMetricsChange"
            />
          </q-item-section>
        </q-item>
        <q-item dense class="text-blue-10">
          <q-item-section class="col-1">Z:</q-item-section>
          <q-item-section class="col">
            <q-input
              v-model="modelTranslateZ"
              type="number"
              color="blue"
              dense
              suffix="mm"
              @update:model-value="onTranslateMetricsChange"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Rotation list -->
      <q-list v-if="isModelRotating" class="q-pb-md q-gutter-y-md">
        <q-item dense class="text-red-10">
          <q-item-section class="col-1">X:</q-item-section>
          <q-item-section class="col">
            <q-input
              v-model="modelRotateX"
              type="number"
              color="red"
              dense
              suffix="°"
              @update:model-value="onRotationMetricsChange"
            />
          </q-item-section>
        </q-item>
        <q-item dense class="text-green-10">
          <q-item-section class="col-1">Y:</q-item-section>
          <q-item-section class="col">
            <q-input
              v-model="modelRotateY"
              type="number"
              color="green"
              dense
              suffix="°"
              @update:model-value="onRotationMetricsChange"
            />
          </q-item-section>
        </q-item>
        <q-item dense class="text-blue-10">
          <q-item-section class="col-1">Z:</q-item-section>
          <q-item-section class="col">
            <q-input
              v-model="modelRotateZ"
              type="number"
              color="blue"
              dense
              suffix="°"
              @update:model-value="onRotationMetricsChange"
            />
          </q-item-section>
        </q-item>
        <q-item dense>
          <q-item-section>
            <q-btn
              unelevated
              color="dark"
              label="Reset Rotation"
              icon="refresh"
              size="sm"
              @click="resetRotation"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Resize list -->
      <q-list v-if="isModelResizing" class="q-pb-md q-gutter-y-md">
        <q-item dense class="text-red-10">
          <q-item-section class="col-1">X:</q-item-section>
          <q-item-section class="col">
            <q-input
              v-model="modelResizeX"
              type="number"
              color="red"
              dense
              suffix="mm"
              @update:model-value="onResizeMMChange('X')"
            />
          </q-item-section>
          <q-item-section class="col">
            <q-input
              v-model="modelResizePercentX"
              type="number"
              color="red"
              dense
              suffix="%"
              @update:model-value="onResizePercentChange('X')"
            />
          </q-item-section>
        </q-item>
        <q-item dense class="text-green-10">
          <q-item-section class="col-1">Y:</q-item-section>
          <q-item-section class="col">
            <q-input
              v-model="modelResizeY"
              type="number"
              color="green"
              dense
              suffix="mm"
              @update:model-value="onResizeMMChange('Y')"
            />
          </q-item-section>
          <q-item-section class="col">
            <q-input
              v-model="modelResizePercentY"
              type="number"
              color="green"
              dense
              suffix="%"
              @update:model-value="onResizePercentChange('Y')"
            />
          </q-item-section>
        </q-item>
        <q-item dense class="text-blue-10">
          <q-item-section class="col-1">Z:</q-item-section>
          <q-item-section class="col">
            <q-input
              v-model="modelResizeZ"
              type="number"
              color="blue"
              dense
              suffix="mm"
              @update:model-value="onResizeMMChange('Z')"
            />
          </q-item-section>
          <q-item-section class="col">
            <q-input
              v-model="modelResizePercentZ"
              type="number"
              color="blue"
              dense
              suffix="%"
              @update:model-value="onResizePercentChange('Z')"
            />
          </q-item-section>
        </q-item>
        <q-item dense>
          <q-item-section>
            <q-btn
              unelevated
              size="sm"
              :color="isResizeUniformed ? 'deep-orange-10' : 'orange-9'"
              @click="slicingStore.setUniformedResizing"
            >
              <template v-slot>
                <div
                  v-if="isResizeUniformed"
                  class="row flex-center q-gutter-x-md"
                >
                  <q-icon name="lock" />
                  <span>Uniform Resizing</span>
                </div>
                <div v-else class="row flex-center q-gutter-x-md">
                  <q-icon name="no_encryption" />
                  <span>Non-Uniform Resizing</span>
                </div>
              </template>
            </q-btn>
          </q-item-section>
        </q-item>
        <q-item dense>
          <q-item-section>
            <q-btn
              unelevated
              color="dark"
              label="Reset Resize"
              icon="refresh"
              size="sm"
              @click="resetResize"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Mirror list -->
      <q-list v-if="isModelMirroring" class="q-py-md q-gutter-y-md">
        <q-item dense>
          <q-item-section
            ><q-btn
              unelevated
              label="Flip X-axis"
              size="sm"
              color="red"
              @click="handleMirroringModel('x')"
          /></q-item-section>
        </q-item>
        <q-item dense>
          <q-item-section
            ><q-btn
              unelevated
              label="Flip Y-axis"
              size="sm"
              color="green"
              @click="handleMirroringModel('y')"
          /></q-item-section>
        </q-item>
        <q-item dense>
          <q-item-section
            ><q-btn
              unelevated
              label="Flip Z-axis"
              size="sm"
              color="blue"
              @click="handleMirroringModel('z')"
          /></q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import { computed, ref, watch } from 'vue';
import { MathUtils } from 'three';
import { useQuasar } from 'quasar';
import * as THREE from 'three';

const $q = useQuasar();
const slicingStore = use3DSlicingStore();
const { selectedModel, isResizeUniformed } = storeToRefs(slicingStore);

/**
 * Computed property indicating whether the transformation menu should be visible.
 * It becomes `true` if any transform tool (translate, rotate, resize, mirror) is active.
 */
const isMenuVisible = computed({
  get() {
    return (
      isModelTranslating.value ||
      isModelRotating.value ||
      isModelResizing.value ||
      isModelMirroring.value
    );
  },
  set() {
    //
  },
});

/** State flags for active transformation modes */
const isModelTranslating = ref<boolean>(false);
const isModelRotating = ref<boolean>(false);
const isModelResizing = ref<boolean>(false);
const isModelMirroring = ref<boolean>(false);

/** Translation input fields for X, Y, Z axes */
const modelTranslateX = ref<string>('0');
const modelTranslateY = ref<string>('0');
const modelTranslateZ = ref<string>('0');

/** Rotation input fields for X, Y, Z axes (degrees) */
const modelRotateX = ref<string>('0');
const modelRotateY = ref<string>('0');
const modelRotateZ = ref<string>('0');

/** Resize values in percentage per axis */
const modelResizePercentX = ref<string>('0');
const modelResizePercentY = ref<string>('0');
const modelResizePercentZ = ref<string>('0');

/** Resize values in millimeters per axis */
const modelResizeX = ref<string>('0');
const modelResizeY = ref<string>('0');
const modelResizeZ = ref<string>('0');

/**
 * Activate translation mode for the selected model.
 */
const handleTranslatingModel = () => {
  resetAllTransformerTools();
  isModelTranslating.value = true;
  slicingStore.applyTranslatingTools();
};

/**
 * Activate rotation mode for the selected model.
 */
const handleRotatingModel = () => {
  resetAllTransformerTools();
  isModelRotating.value = true;
  slicingStore.applyRotatingTools();
};

/**
 * Activate resizing mode for the selected model.
 */
const handleResizingModel = () => {
  resetAllTransformerTools();
  isModelResizing.value = true;
  slicingStore.applyResizingTools();
};

/**
 * Activate mirroring mode for the selected model on a given axis.
 * @param {string} axis - Axis to mirror ('X', 'Y', or 'Z')
 */
const handleMirroringModel = (axis: string) => {
  resetAllTransformerTools();
  isModelMirroring.value = true;
  slicingStore.applyMirroringTools(axis);
  updateSelectedModelAfterTransform();
};

/**
 * Center the selected model on the platform.
 */
const handleCentralizeModel = () => {
  slicingStore.centralizeModel();
  updateSelectedModelAfterTransform();
};

/**
 * Drop the selected model onto the platform surface.
 */
const handleDropOnPlatform = () => {
  slicingStore.dropModelOnPlatform();
  updateSelectedModelAfterTransform();
};

/**
 * Clone the selected model.
 */
const handleCloningModel = () => {
  resetAllTransformerTools();
  slicingStore.cloneModel();
};

/** Undo last transformation command */
const handleUndoTransformCommand = () => {
  slicingStore.undoTransformCommand();
};

/** Redo last undone transformation command */
const handleRedoTransformCommand = () => {
  slicingStore.redoTransformCommand();
};

/**
 * Delete the selected model after confirmation.
 */
const handleDeletingModel = () => {
  showDeleteSelectedModelDialog().onOk(() => {
    resetAllTransformerTools();
    slicingStore.deleteModel();
  });
};

/** Resets all transformation mode flags */
const resetAllTransformerTools = () => {
  isModelMirroring.value = false;
  isModelResizing.value = false;
  isModelTranslating.value = false;
  isModelRotating.value = false;
};

/**
 * Updates input field values with the selected model's position, rotation, and scale.
 */
const setupSelectedModelTransformerMetrics = () => {
  if (selectedModel.value.object) {
    const obj = selectedModel.value.object;

    // Translation
    modelTranslateX.value = obj.position.x.toFixed(2);
    modelTranslateY.value = obj.position.y.toFixed(2);
    modelTranslateZ.value = obj.position.z.toFixed(2);

    // Rotation
    modelRotateX.value = MathUtils.radToDeg(obj.rotation.x).toFixed(2);
    modelRotateY.value = MathUtils.radToDeg(obj.rotation.y).toFixed(2);
    modelRotateZ.value = MathUtils.radToDeg(obj.rotation.z).toFixed(2);

    // Percent scale
    modelResizePercentX.value = (obj.scale.x * 100).toFixed(2);
    modelResizePercentY.value = (obj.scale.y * 100).toFixed(2);
    modelResizePercentZ.value = (obj.scale.z * 100).toFixed(2);

    // Real dimensions
    const originalSize = obj.userData.originalSize;
    modelResizeX.value = (obj.scale.x * originalSize.x).toFixed(2);
    modelResizeY.value = (obj.scale.y * originalSize.y).toFixed(2);
    modelResizeZ.value = (obj.scale.z * originalSize.z).toFixed(2);
  }
};

/** Apply changes from translation inputs to the model */
const onTranslateMetricsChange = () => {
  modelTranslateX.value ||= '0';
  modelTranslateY.value ||= '0';
  modelTranslateZ.value ||= '0';

  selectedModel.value.object?.position.set(
    parseFloat(modelTranslateX.value),
    parseFloat(modelTranslateY.value),
    parseFloat(modelTranslateZ.value)
  );

  updateSelectedModelAfterTransform();
};

/** Apply changes from rotation inputs (degrees) to the model */
const onRotationMetricsChange = () => {
  modelRotateX.value ||= '0';
  modelRotateY.value ||= '0';
  modelRotateZ.value ||= '0';

  selectedModel.value.object?.rotation.set(
    MathUtils.degToRad(parseFloat(modelRotateX.value)),
    MathUtils.degToRad(parseFloat(modelRotateY.value)),
    MathUtils.degToRad(parseFloat(modelRotateZ.value))
  );

  updateSelectedModelAfterTransform();
};

/**
 * Apply resize changes in percentage form.
 * @param {string} [axis] - Axis to uniformly scale from (optional)
 */
const onResizePercentChange = (axis?: string) => {
  const obj = selectedModel.value.object;
  if (!obj) return;

  if (isResizeUniformed.value && axis) {
    setPercentageUniformScaleFromAxis(obj, axis);
  } else {
    obj.scale.set(
      parseFloat(modelResizePercentX.value) / 100,
      parseFloat(modelResizePercentY.value) / 100,
      parseFloat(modelResizePercentZ.value) / 100
    );
  }

  updateResizeRealDimensionsFromPercent();
  updateSelectedModelAfterTransform();
};

/**
 * Apply resize changes in millimeter form.
 * @param {string} axis - Axis to uniformly scale from
 */
const onResizeMMChange = (axis: string) => {
  const obj = selectedModel.value.object;
  if (!obj) return;

  const originalSize = obj.userData.originalSize;

  if (isResizeUniformed.value) {
    setMMUniformScaleFromAxis(obj, axis, originalSize);
  } else {
    obj.scale.set(
      parseFloat(modelResizeX.value) / originalSize.x,
      parseFloat(modelResizeY.value) / originalSize.y,
      parseFloat(modelResizeZ.value) / originalSize.z
    );
  }

  updateResizePercentFromRealDimensions();
  updateSelectedModelAfterTransform();
};

/**
 * Sets uniform percentage scale based on a specific axis.
 */
const setPercentageUniformScaleFromAxis = (
  obj: THREE.Object3D,
  axis: string
) => {
  let scaleFactor = 1;
  if (axis === 'X') scaleFactor = parseFloat(modelResizePercentX.value) / 100;
  else if (axis === 'Y')
    scaleFactor = parseFloat(modelResizePercentY.value) / 100;
  else if (axis === 'Z')
    scaleFactor = parseFloat(modelResizePercentZ.value) / 100;

  modelResizePercentX.value =
    modelResizePercentY.value =
    modelResizePercentZ.value =
      (scaleFactor * 100).toFixed(2);
  obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
};

/**
 * Sets uniform mm scale based on a specific axis.
 */
const setMMUniformScaleFromAxis = (
  obj: THREE.Object3D,
  axis: string,
  originalSize: THREE.Vector3
) => {
  let scaleFactor = 1;
  if (axis === 'X')
    scaleFactor = parseFloat(modelResizeX.value) / originalSize.x;
  else if (axis === 'Y')
    scaleFactor = parseFloat(modelResizeY.value) / originalSize.y;
  else if (axis === 'Z')
    scaleFactor = parseFloat(modelResizeZ.value) / originalSize.z;

  modelResizeX.value = (originalSize.x * scaleFactor).toFixed(2);
  modelResizeY.value = (originalSize.y * scaleFactor).toFixed(2);
  modelResizeZ.value = (originalSize.z * scaleFactor).toFixed(2);

  obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
};

/** Update mm values from percentage scale */
const updateResizeRealDimensionsFromPercent = () => {
  const obj = selectedModel.value.object;
  if (obj) {
    const originalSize = obj.userData.originalSize;
    modelResizeX.value = (obj.scale.x * originalSize.x).toFixed(2);
    modelResizeY.value = (obj.scale.y * originalSize.y).toFixed(2);
    modelResizeZ.value = (obj.scale.z * originalSize.z).toFixed(2);
  }
};

/** Update percentage values from mm scale */
const updateResizePercentFromRealDimensions = () => {
  const obj = selectedModel.value.object;
  if (obj) {
    const originalSize = obj.userData.originalSize;
    modelResizePercentX.value = (
      (parseFloat(modelResizeX.value) / originalSize.x) *
      100
    ).toFixed(2);
    modelResizePercentY.value = (
      (parseFloat(modelResizeY.value) / originalSize.y) *
      100
    ).toFixed(2);
    modelResizePercentZ.value = (
      (parseFloat(modelResizeZ.value) / originalSize.z) *
      100
    ).toFixed(2);
  }
};

/** Reset rotation to default (-90° X, 0° Y, 0° Z) */
const resetRotation = () => {
  modelRotateX.value = (-90).toFixed(2);
  modelRotateY.value = modelRotateZ.value = (0).toFixed(2);
  onRotationMetricsChange();
};

/** Reset scale to 100% */
const resetResize = () => {
  modelResizePercentX.value =
    modelResizePercentY.value =
    modelResizePercentZ.value =
      (100).toFixed(2);
  onResizePercentChange();
};

/** Sync model state after transformations */
const updateSelectedModelAfterTransform = () => {
  slicingStore.checkIfModelOutsidePlatform();
  slicingStore.checkIfModelBelowPlatform();
  slicingStore.addNewTransformCommand();
  selectedModel.value.helperBox?.update();
  slicingStore.refreshPrintHeightRange();
};

/** Shows confirmation dialog before deleting the selected model */
const showDeleteSelectedModelDialog = () => {
  return $q.dialog({
    title: 'Confirm',
    message: 'Are you sure you want to delete the selected model?',
    cancel: true,
    persistent: true,
    ok: { color: 'red-10' },
    color: 'dark',
  });
};

/** Watch for model deselection to reset tools */
watch(
  () => selectedModel.value.object,
  (newSelectedModelObject) => {
    if (!newSelectedModelObject) {
      resetAllTransformerTools();
    }
  }
);

/** Watch for any selected model changes to update metrics */
watch(
  selectedModel,
  () => {
    setupSelectedModelTransformerMetrics();
  },
  { immediate: true }
);
</script>
<style lang="scss">
.side-tools-bar {
  position: absolute;
  top: 30vh;
  left: 0.5vw;
  max-width: fit-content;
  // max-height: 40vh;
  background-color: #fff;
  border-radius: 10px;
}
</style>
