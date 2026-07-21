<template>
  <div class="column q-gutter-y-md">
    <p class="title-text-size text-bold"><u>Main Settings:</u></p>

    <div class="row items-center justify-start q-gutter-x-md">
      <span class="sub-text-size">Material Name:</span>
      <q-select
        filled
        behavior="menu"
        v-model="selectedMaterial"
        :options="materialsList ? materialsList : []"
        clearable
        class="row col"
        dense
        @update:model-value="handleRemoveMaterialThickness"
      >
        <template v-slot:selected-item="scope">
          <q-item class="row full-width items-center justify-between">
            <q-item-section>
              <q-item-label class="title-text-size">{{
                scope.opt.materialName
              }}</q-item-label>
            </q-item-section>
            <q-item-section v-if="scope.opt.materialImage">
              <q-img :src="scope.opt.materialImage" class="material-img" />
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:option="scope">
          <q-item
            v-bind="scope.itemProps"
            class="row full-width items-center justify-between"
          >
            <q-item-section>
              <q-item-label class="title-text-size">{{
                scope.opt.materialName
              }}</q-item-label>
            </q-item-section>
            <q-item-section v-if="scope.opt.materialImage">
              <q-img :src="scope.opt.materialImage" class="material-img" />
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>

    <transition
      appear
      enter-active-class="animated slideInDown"
      v-if="selectedMaterial"
    >
      <div class="row items-center col col-xs-12">
        <span class="sub-text-size">Material Thickness:</span>
        <q-select
          filled
          behavior="menu"
          v-model="selectedMaterialThickness"
          :options="
            selectedMaterial.materialThicknesses
              ? selectedMaterial.materialThicknesses
              : []
          "
          clearable
          class="row col"
          @update:model-value="handleThicknessChange"
        >
          <template v-slot:selected-item="scope">
            <q-item-section>
              <q-item-label>{{ scope.opt.thicknessValue }} mm</q-item-label>
            </q-item-section>
          </template>
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.thicknessValue }} mm</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </transition>

    <transition
      appear
      enter-active-class="animated slideInDown"
      v-if="selectedMaterialThickness"
    >
      <div class="column q-gutter-y-md">
        <q-separator />

        <q-select
          v-model="selectedOperation"
          label="Pick Operations Settings"
          :options="
            selectedMaterialThickness.thicknessOperations
              ? selectedMaterialThickness.thicknessOperations
              : []
          "
          square
          outlined
          behavior="menu"
          class="settings-selector"
        >
          <template v-slot:selected-item="scope">
            <q-item-section>
              <q-item-label>{{ scope.opt.operationType }}</q-item-label>
            </q-item-section>
          </template>
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>{{ scope.opt.operationType }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>
    </transition>

    <transition
      appear
      enter-active-class="animated slideInDown"
      v-if="
        selectedMaterialThickness &&
        selectedOperation &&
        imageToGcodeConvertorStore.activeImage
      "
    >
      <div>
        <div
          v-if="
            selectedOperation.operationType === Constants.PROFILE_OPTIONS.CUT
          "
          class="column"
        >
          <p class="title-text-size text-bold"><u>Cutting Settings:</u></p>
          <operation-main-settings
            :config
            v-model:power="laserPowerCutting"
            v-model:speed="movementSpeedCutting"
            v-model:tool="laserToolCutting"
            v-model:is-valid-power="isValidLaserPowerCutting"
            v-model:is-valid-speed="isValidMovementSpeedCutting"
          />
        </div>

        <div
          v-else-if="
            selectedOperation.operationType === Constants.PROFILE_OPTIONS.MARK
          "
          class="column"
        >
          <p class="title-text-size text-bold"><u>Marking Settings:</u></p>
          <operation-main-settings
            :config
            v-model:power="laserPowerMarking"
            v-model:speed="movementSpeedMarking"
            v-model:tool="laserToolMarking"
            v-model:is-valid-power="isValidLaserPowerMarking"
            v-model:is-valid-speed="isValidMovementSpeedMarking"
          />
        </div>

        <div
          v-else-if="
            selectedOperation.operationType ===
            Constants.PROFILE_OPTIONS.ENGRAVE
          "
          class="column"
        >
          <p class="title-text-size text-bold">
            <u>Engraving Settings:</u>
          </p>

          <operation-main-settings
            :config
            v-model:power="laserPowerEngraving"
            v-model:speed="movementSpeedEngraving"
            v-model:tool="laserToolEngraving"
            v-model:is-valid-power="isValidLaserPowerEngraving"
            v-model:is-valid-speed="isValidMovementSpeedEngraving"
          />

          <!-- Engraving Mode Toggle -->
          <div class="row items-center q-gutter-x-md q-mt-md">
            <span class="sub-text-size">Engraving Mode:</span>
            <q-btn-toggle
              v-model="engravingMode"
              toggle-color="primary"
              :options="[
                { label: 'Vectoring', value: 'vectoring' },
                { label: 'Line by Line (Engraving)', value: 'engraving' },
              ]"
            />
          </div>

          <!-- Laser Compensation Settings (shown when engraving mode is selected) -->
          <transition
            appear
            enter-active-class="animated slideInDown"
            v-if="engravingMode === 'engraving'"
          >
            <div class="column q-gutter-y-md q-mt-md">
              <q-separator />
              <p class="title-text-size text-bold">
                <u>Laser Compensation (Line by Line):</u>
              </p>
              <p class="note sub-text-size">
                Configure laser in/out compensation for each layer type. Distance
                is calculated using: d = v²/(2a)
              </p>

              <!-- First Layer -->
              <div class="column q-gutter-y-sm">
                <p class="text-bold">First Layer:</p>
                <div class="row items-center q-gutter-x-md">
                  <span class="sub-text-size" style="min-width: 150px">
                    Acceleration (mm/s²):
                  </span>
                  <q-input
                    v-model.number="laserCompensationFirstAcceleration"
                    type="number"
                    filled
                    dense
                    class="col"
                    @update:model-value="
                      (val) => {
                        isValidLaserCompensationFirstAcceleration =
                          val != null && val > 0;
                      }
                    "
                  />
                </div>
                <div class="row items-center q-gutter-x-md">
                  <span class="sub-text-size" style="min-width: 150px">
                    Feedrate (mm/min):
                  </span>
                  <q-input
                    v-model.number="laserCompensationFirstFeedrate"
                    type="number"
                    filled
                    dense
                    class="col"
                    @update:model-value="
                      (val) => {
                        isValidLaserCompensationFirstFeedrate =
                          val != null && val >= 0;
                      }
                    "
                  />
                </div>
                <div class="row items-center q-gutter-x-md">
                  <span class="sub-text-size" style="min-width: 150px">
                    Calculated Distance (mm):
                  </span>
                  <span class="text-primary">
                    {{
                      calculateLaserDistance(
                        laserCompensationFirstFeedrate,
                        laserCompensationFirstAcceleration
                      )?.toFixed(4) ?? 'N/A'
                    }}
                  </span>
                </div>
              </div>

              <!-- Intermediate Layer -->
              <q-separator />
              <div class="column q-gutter-y-sm">
                <p class="text-bold">Intermediate Layers:</p>
                <div class="row items-center q-gutter-x-md">
                  <span class="sub-text-size" style="min-width: 150px">
                    Acceleration (mm/s²):
                  </span>
                  <q-input
                    v-model.number="laserCompensationIntermediateAcceleration"
                    type="number"
                    filled
                    dense
                    class="col"
                    @update:model-value="
                      (val) => {
                        isValidLaserCompensationIntermediateAcceleration =
                          val != null && val > 0;
                      }
                    "
                  />
                </div>
                <div class="row items-center q-gutter-x-md">
                  <span class="sub-text-size" style="min-width: 150px">
                    Feedrate (mm/min):
                  </span>
                  <q-input
                    v-model.number="laserCompensationIntermediateFeedrate"
                    type="number"
                    filled
                    dense
                    class="col"
                    @update:model-value="
                      (val) => {
                        isValidLaserCompensationIntermediateFeedrate =
                          val != null && val >= 0;
                      }
                    "
                  />
                </div>
                <div class="row items-center q-gutter-x-md">
                  <span class="sub-text-size" style="min-width: 150px">
                    Calculated Distance (mm):
                  </span>
                  <span class="text-primary">
                    {{
                      calculateLaserDistance(
                        laserCompensationIntermediateFeedrate,
                        laserCompensationIntermediateAcceleration
                      )?.toFixed(4) ?? 'N/A'
                    }}
                  </span>
                </div>
              </div>

              <!-- Bulk Layer -->
              <q-separator />
              <div class="column q-gutter-y-sm">
                <p class="text-bold">Bulk Layers:</p>
                <div class="row items-center q-gutter-x-md">
                  <span class="sub-text-size" style="min-width: 150px">
                    Acceleration (mm/s²):
                  </span>
                  <q-input
                    v-model.number="laserCompensationBulkAcceleration"
                    type="number"
                    filled
                    dense
                    class="col"
                    @update:model-value="
                      (val) => {
                        isValidLaserCompensationBulkAcceleration =
                          val != null && val > 0;
                      }
                    "
                  />
                </div>
                <div class="row items-center q-gutter-x-md">
                  <span class="sub-text-size" style="min-width: 150px">
                    Feedrate (mm/min):
                  </span>
                  <q-input
                    v-model.number="laserCompensationBulkFeedrate"
                    type="number"
                    filled
                    dense
                    class="col"
                    @update:model-value="
                      (val) => {
                        isValidLaserCompensationBulkFeedrate =
                          val != null && val >= 0;
                      }
                    "
                  />
                </div>
                <div class="row items-center q-gutter-x-md">
                  <span class="sub-text-size" style="min-width: 150px">
                    Calculated Distance (mm):
                  </span>
                  <span class="text-primary">
                    {{
                      calculateLaserDistance(
                        laserCompensationBulkFeedrate,
                        laserCompensationBulkAcceleration
                      )?.toFixed(4) ?? 'N/A'
                    }}
                  </span>
                </div>
              </div>
            </div>
          </transition>

          <engrave-dithering-settings
            :config
            v-model:algorithm="ditheringAlgorithm"
            v-model:resolution="ditheringResolution"
            v-model:grayShift="ditheringGrayShift"
            v-model:block-size="ditheringBlockSize"
            v-model:block-distance="ditheringBlockDistance"
            v-model:is-valid-resolution="isValidDitheringResolution"
            class="q-pt-md"
          />
        </div>
        <q-separator />
      </div>
    </transition>

    <div
      v-if="selectedMaterial && selectedMaterialThickness"
      class="column q-gutter-y-md"
    >
      <q-btn
        label="Save Settings"
        size="2vh"
        color="primary"
        unelevated
        icon="save"
        @click="handleSavingSettings"
        :loading="imageToGcodeConvertorStore.isImageLoading"
        :disable="
          isSaveButtonDisabled || imageToGcodeConvertorStore.isImageLoading
        "
      />
      <q-separator />
      <p class="note sub-text-size">
        Note: Changing the settings here will not modify the main material
        settings.
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Constants } from 'src/constants';
import { useImageToGcodeConvertor } from 'src/stores/image-to-gcode';
import { useMaterialLibraryStore } from 'src/stores/material-library';
import {
  MaterialData,
  MaterialThickness,
  ThicknessOperation,
} from 'src/interfaces/imageToGcode.interface';
import { computed, onMounted, ref } from 'vue';
import { showNotifyMessage } from 'src/services/notify.messages.service';
import { Config } from 'src/interfaces/configSettings.interface';
import OperationMainSettings from 'src/components/GcodeGeneratorTabComponent/components/components/OperationMainSettings.vue';
import EngraveDitheringSettings from 'src/components/GcodeGeneratorTabComponent/components/components/EngraveDitheringSettings.vue';

// Access Pinia stores for application state management.
const imageToGcodeConvertorStore = useImageToGcodeConvertor();
const materialLibraryStore = useMaterialLibraryStore();

/**
 * Destructures reactive properties from the store using `storeToRefs`.
 */
const { materialsList } = storeToRefs(materialLibraryStore);

/**
 * Defines the props for the component.
 *
 * @property {Config | null} config - The machine's configuration settings.
 */
defineProps<{
  config: Config | null;
}>();

// Reactive variables for selected material, thickness, and operation.
const selectedMaterial = ref<MaterialData | null>();
const selectedMaterialThickness = ref<MaterialThickness | null>();
const selectedOperation = ref<ThicknessOperation | null>();

/**
 * Reactive variables for cutting settings.
 *
 * These are initialized with the values from the active image's G-code settings,
 * or defaults to `0` or an empty string if not available.
 */
const movementSpeedCutting = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.cuttingSettings.speed ??
    0
);
const laserPowerCutting = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.cuttingSettings.power ??
    0
);
const laserToolCutting = ref<string>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.cuttingSettings.tool ??
    ''
);

/**
 * Reactive variables for marking settings.
 *
 * Initialized with values from the active image's G-code settings.
 */
const movementSpeedMarking = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.markingSettings.speed ??
    0
);
const laserPowerMarking = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.markingSettings.power ??
    0
);
const laserToolMarking = ref<string>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.markingSettings.tool ??
    ''
);

/**
 * Reactive variables for engraving settings.
 *
 * Initialized with values from the active image's G-code settings. Includes
 * dithering parameters.
 */
const movementSpeedEngraving = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .speed ?? 0
);
const laserPowerEngraving = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .power ?? 0
);
const laserToolEngraving = ref<string>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .tool ?? ''
);
const engravingMode = ref<'vectoring' | 'engraving'>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .engravingMode ?? 'vectoring'
);
const ditheringAlgorithm = ref<string>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .dithering.algorithm ?? ''
);
const ditheringResolution = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .dithering.resolution ?? 0
);
const ditheringGrayShift = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .dithering.grayShift ?? 0
);
const ditheringBlockSize = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .dithering.blockSize ?? 0
);
const ditheringBlockDistance = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .dithering.blockDistance ?? 0
);

/**
 * Reactive variables for laser compensation settings (line-by-line engraving mode).
 * Each layer type (first, intermediate, bulk) has acceleration and feedrate.
 */
const laserCompensationFirstAcceleration = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .laserCompensation?.first.acceleration ?? 0
);
const laserCompensationFirstFeedrate = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .laserCompensation?.first.feedrate ?? 0
);
const laserCompensationIntermediateAcceleration = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .laserCompensation?.intermediate.acceleration ?? 0
);
const laserCompensationIntermediateFeedrate = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .laserCompensation?.intermediate.feedrate ?? 0
);
const laserCompensationBulkAcceleration = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .laserCompensation?.bulk.acceleration ?? 0
);
const laserCompensationBulkFeedrate = ref<number>(
  imageToGcodeConvertorStore.activeImage?.gcodeSettings.engravingSettings
    .laserCompensation?.bulk.feedrate ?? 0
);

/**
 * Reactive flags for validating the input fields.
 * They are all initialized to `true` to enable the save button by default.
 */
const isValidLaserPowerCutting = ref<boolean>(true);
const isValidMovementSpeedCutting = ref<boolean>(true);
const isValidLaserPowerMarking = ref<boolean>(true);
const isValidMovementSpeedMarking = ref<boolean>(true);
const isValidLaserPowerEngraving = ref<boolean>(true);
const isValidMovementSpeedEngraving = ref<boolean>(true);
const isValidDitheringResolution = ref<boolean>(true);
const isValidLaserCompensationFirstAcceleration = ref<boolean>(true);
const isValidLaserCompensationFirstFeedrate = ref<boolean>(true);
const isValidLaserCompensationIntermediateAcceleration = ref<boolean>(true);
const isValidLaserCompensationIntermediateFeedrate = ref<boolean>(true);
const isValidLaserCompensationBulkAcceleration = ref<boolean>(true);
const isValidLaserCompensationBulkFeedrate = ref<boolean>(true);

/**
 * Calculates the laser in/out distance using the formula: d = v²/(2a)
 * where v is the velocity (feedrate) and a is the acceleration.
 *
 * @param feedrate - Feedrate in mm/min (converted to mm/s)
 * @param acceleration - Acceleration in mm/s²
 * @returns - The calculated distance in mm, or null if inputs are invalid
 */
const calculateLaserDistance = (
  feedrate: number,
  acceleration: number
): number | null => {
  if (acceleration <= 0 || feedrate < 0) {
    return null;
  }
  // Convert feedrate from mm/min to mm/s
  const velocityMmPerSec = feedrate / 60;
  // Apply formula: d = v²/(2a)
  const distance = (velocityMmPerSec * velocityMmPerSec) / (2 * acceleration);
  return distance;
};

/**
 * Saves the current settings to the active image's G-code settings.
 *
 * This function updates the store's state with the values from the component's
 * reactive variables. It then calls `changeProfileOptions` and `applySettings`
 * to update the application state and visuals. A success notification is shown
 * to the user.
 */
const handleSavingSettings = () => {
  if (
    imageToGcodeConvertorStore.activeImage &&
    selectedMaterial.value &&
    selectedMaterialThickness.value
  ) {
    // main settings
    imageToGcodeConvertorStore.activeImage.gcodeSettings.mainSettings.material =
      selectedMaterial.value.materialName;
    imageToGcodeConvertorStore.activeImage.gcodeSettings.mainSettings.thickness =
      selectedMaterialThickness.value.thicknessValue;

    // cutting settings
    imageToGcodeConvertorStore.activeImage.gcodeSettings.cuttingSettings.speed =
      movementSpeedCutting.value;
    imageToGcodeConvertorStore.activeImage.gcodeSettings.cuttingSettings.power =
      laserPowerCutting.value;
    imageToGcodeConvertorStore.activeImage.gcodeSettings.cuttingSettings.tool =
      laserToolCutting.value;

    // marking settings
    imageToGcodeConvertorStore.activeImage.gcodeSettings.markingSettings.speed =
      movementSpeedMarking.value;
    imageToGcodeConvertorStore.activeImage.gcodeSettings.markingSettings.power =
      laserPowerMarking.value;
    imageToGcodeConvertorStore.activeImage.gcodeSettings.markingSettings.tool =
      laserToolMarking.value;

    // engraving settings
    imageToGcodeConvertorStore.activeImage.gcodeSettings.engravingSettings.speed =
      movementSpeedEngraving.value;
    imageToGcodeConvertorStore.activeImage.gcodeSettings.engravingSettings.power =
      laserPowerEngraving.value;
    imageToGcodeConvertorStore.activeImage.gcodeSettings.engravingSettings.tool =
      laserToolEngraving.value;
    imageToGcodeConvertorStore.activeImage.gcodeSettings.engravingSettings.engravingMode =
      engravingMode.value;
    imageToGcodeConvertorStore.activeImage.gcodeSettings.mainSettings.thickness =
      selectedMaterialThickness.value.thicknessValue;
    imageToGcodeConvertorStore.activeImage.gcodeSettings.engravingSettings.dithering =
      {
        algorithm: ditheringAlgorithm.value,
        resolution: ditheringResolution.value,
        grayShift: ditheringGrayShift.value,
        blockSize: ditheringBlockSize.value,
        blockDistance: ditheringBlockDistance.value,
      };

    // laser compensation settings for engraving mode
    if (engravingMode.value === 'engraving') {
      imageToGcodeConvertorStore.activeImage.gcodeSettings.engravingSettings.laserCompensation =
        {
          first: {
            layerType: 'first',
            acceleration: laserCompensationFirstAcceleration.value,
            feedrate: laserCompensationFirstFeedrate.value,
            calculatedDistance:
              calculateLaserDistance(
                laserCompensationFirstFeedrate.value,
                laserCompensationFirstAcceleration.value
              ) ?? 0,
          },
          intermediate: {
            layerType: 'intermediate',
            acceleration: laserCompensationIntermediateAcceleration.value,
            feedrate: laserCompensationIntermediateFeedrate.value,
            calculatedDistance:
              calculateLaserDistance(
                laserCompensationIntermediateFeedrate.value,
                laserCompensationIntermediateAcceleration.value
              ) ?? 0,
          },
          bulk: {
            layerType: 'bulk',
            acceleration: laserCompensationBulkAcceleration.value,
            feedrate: laserCompensationBulkFeedrate.value,
            calculatedDistance:
              calculateLaserDistance(
                laserCompensationBulkFeedrate.value,
                laserCompensationBulkAcceleration.value
              ) ?? 0,
          },
        };
    }

    changeProfileOptions();

    applySettings();

    const notifyMessage = showNotifyMessage();
    notifyMessage.success('Settings saved successfully');
  }
};

/**
 * Applies the new settings to the active image in the Konva canvas.
 *
 * This function checks the file type and which settings have been modified
 * to call the appropriate application logic for rendering the changes.
 */
const applySettings = () => {
  if (
    imageToGcodeConvertorStore.activeImage?.imageFile?.type ===
      'image/svg+xml' &&
    (imageToGcodeConvertorStore.activeImage.modifiedSVGCutting ||
      imageToGcodeConvertorStore.activeImage.modifiedSVGMarking)
  ) {
    imageToGcodeConvertorStore.applySVGChanges();
  } else if (imageToGcodeConvertorStore.activeImage?.modifiedEngravingImage) {
    imageToGcodeConvertorStore.applyImageChanges();
  }
};

/**
 * Updates the available profile options based on the selected material thickness.
 *
 * This function clears the existing profile options and repopulates them based
 * on the operations (cut, mark, engrave) defined for the selected material thickness.
 */
const changeProfileOptions = () => {
  if (imageToGcodeConvertorStore.activeImage) {
    imageToGcodeConvertorStore.activeImage.singleProfileOptions = [
      Constants.PROFILE_OPTIONS.NOTHING,
    ];
    imageToGcodeConvertorStore.activeImage.allProfileOptions = [
      Constants.PROFILE_ALL_OPTIONS.CUSTOM,
    ];
    if (selectedMaterialThickness.value) {
      selectedMaterialThickness.value.thicknessOperations.forEach(
        (operation) => {
          switch (operation.operationType) {
            case Constants.PROFILE_OPTIONS.CUT:
              imageToGcodeConvertorStore.activeImage?.singleProfileOptions.push(
                Constants.PROFILE_OPTIONS.CUT
              );
              imageToGcodeConvertorStore.activeImage?.allProfileOptions.push(
                Constants.PROFILE_ALL_OPTIONS.CUT_EVERYTHING
              );
              break;
            case Constants.PROFILE_OPTIONS.MARK:
              imageToGcodeConvertorStore.activeImage?.singleProfileOptions.push(
                Constants.PROFILE_OPTIONS.MARK
              );
              imageToGcodeConvertorStore.activeImage?.allProfileOptions.push(
                Constants.PROFILE_ALL_OPTIONS.MARK_EVERYTHING
              );
              break;
            case Constants.PROFILE_OPTIONS.ENGRAVE:
              imageToGcodeConvertorStore.activeImage?.singleProfileOptions.push(
                Constants.PROFILE_OPTIONS.ENGRAVE
              );
              imageToGcodeConvertorStore.activeImage?.allProfileOptions.push(
                Constants.PROFILE_ALL_OPTIONS.ENGRAVE_EVERYTHING
              );
              break;
          }
        }
      );
    }
  }
};

/**
 * A computed property that determines if the "Save" button should be disabled.
 *
 * The button is disabled if any of the validation flags for laser power,
 * movement speed, dithering resolution, or laser compensation are `false`.
 *
 * @returns {boolean} - `true` if the button should be disabled, `false` otherwise.
 */
const isSaveButtonDisabled = computed(
  () =>
    !(
      isValidLaserPowerCutting.value &&
      isValidLaserPowerMarking.value &&
      isValidLaserPowerEngraving.value &&
      isValidMovementSpeedCutting.value &&
      isValidMovementSpeedMarking.value &&
      isValidMovementSpeedEngraving.value &&
      isValidDitheringResolution.value &&
      isValidLaserCompensationFirstAcceleration.value &&
      isValidLaserCompensationFirstFeedrate.value &&
      isValidLaserCompensationIntermediateAcceleration.value &&
      isValidLaserCompensationIntermediateFeedrate.value &&
      isValidLaserCompensationBulkAcceleration.value &&
      isValidLaserCompensationBulkFeedrate.value
    )
);

/**
 * Handles the removal of a selected material thickness.
 *
 * This function sets `selectedMaterialThickness` to `null`.
 */
const handleRemoveMaterialThickness = () => {
  selectedMaterialThickness.value = null;
};

/**
 * Handles the change event for the material thickness selection.
 *
 * When a new thickness is selected, this function updates the component's
 * reactive variables for laser power, speed, and dithering settings based on
 * the operations defined for that thickness.
 *
 * @param {MaterialThickness | null} thickness - The newly selected material thickness object.
 */
const handleThicknessChange = (thickness: MaterialThickness | null) => {
  if (thickness) {
    selectedOperation.value = null;
    thickness.thicknessOperations.forEach((operation) => {
      switch (operation.operationType) {
        case Constants.PROFILE_OPTIONS.CUT:
          laserPowerCutting.value = operation.power;
          movementSpeedCutting.value = operation.speed;
          laserToolCutting.value = operation.tool;
          break;
        case Constants.PROFILE_OPTIONS.MARK:
          laserPowerMarking.value = operation.power;
          movementSpeedMarking.value = operation.speed;
          laserToolMarking.value = operation.tool;
          break;
        case Constants.PROFILE_OPTIONS.ENGRAVE:
          laserPowerEngraving.value = operation.power;
          movementSpeedEngraving.value = operation.speed;
          laserToolEngraving.value = operation.tool;
          if (operation.dithering) {
            ditheringAlgorithm.value = operation.dithering.algorithm;
            ditheringResolution.value = operation.dithering.resolution;
            ditheringGrayShift.value = operation.dithering.grayShift;
            ditheringBlockSize.value = operation.dithering.blockSize;
            ditheringBlockDistance.value = operation.dithering.blockDistance;
          }
          // Load engraving mode and laser compensation if available
          if ('engravingMode' in operation) {
            engravingMode.value = (operation as any).engravingMode ?? 'vectoring';
          }
          if ((operation as any).laserCompensation) {
            const compensation = (operation as any).laserCompensation;
            if (compensation.first) {
              laserCompensationFirstAcceleration.value =
                compensation.first.acceleration;
              laserCompensationFirstFeedrate.value = compensation.first.feedrate;
            }
            if (compensation.intermediate) {
              laserCompensationIntermediateAcceleration.value =
                compensation.intermediate.acceleration;
              laserCompensationIntermediateFeedrate.value =
                compensation.intermediate.feedrate;
            }
            if (compensation.bulk) {
              laserCompensationBulkAcceleration.value =
                compensation.bulk.acceleration;
              laserCompensationBulkFeedrate.value = compensation.bulk.feedrate;
            }
          }
          break;
      }
    });
  }
};

/**
 * Sets up the initial settings based on the G-code settings of the active image.
 *
 * This function runs on component mount and synchronizes the local reactive
 * variables with the state of the active image in the store. This ensures
 * that the UI reflects the current settings of the image when the component
 * is first loaded.
 */
const setupSettingBasedOnGcodeSettings = () => {
  if (materialsList.value) {
    selectedMaterial.value = materialsList.value.find(
      (material) =>
        material.materialName ===
        imageToGcodeConvertorStore.activeImage?.gcodeSettings.mainSettings
          .material
    );
    selectedMaterialThickness.value =
      selectedMaterial.value?.materialThicknesses.find(
        (thickness) =>
          thickness.thicknessValue ===
          imageToGcodeConvertorStore.activeImage?.gcodeSettings.mainSettings
            .thickness
      );
  }
};

/**
 * Lifecycle hook `onMounted`.
 *
 * This hook is called when the component is first mounted. It calls
 * `setupSettingBasedOnGcodeSettings` to initialize the component's state.
 */
onMounted(() => {
  setupSettingBasedOnGcodeSettings();
});
</script>
<style scoped>
.settings-selector {
  max-width: max(20vh, 20vw);
}
.material-img {
  flex-direction: row;
  align-self: self-end;
  max-width: max(4vh, 4vw);
  max-height: max(4vh, 4vw);
}
.note {
  color: red;
}

::v-deep(.q-field) {
  font-size: 2vh;
}
</style>
