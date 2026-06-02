<template>
  <q-list bordered class="rounded-borders">
    <q-expansion-item label="Layer Settings" icon="line_style">
      <q-card bordered>
        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Layer Height:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES.LAYER_HEIGHT
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.layerHeight"
            type="number"
            outlined
            :color="colorTheme"
            dense
            suffix="mm"
            step="0.1"
            min="0"
            :rules="[ (val: number) => val && 0 < val || 'Layer height should be above 0']"
          />
        </q-card-section>
        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Layer Z Travel Speed:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{ Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES.LAYER_SPEED }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.layerSpeed"
            type="number"
            outlined
            :color="colorTheme"
            dense
            suffix="mm/min"
            min="0"
            :rules="[ (val: number) => val && 0 < val || 'Feed rate should be above 0']"
          />
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item label="Contour/Wall Settings" icon="border_style">
      <q-card bordered>
        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Contour/Wall Speed:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES.CONTOUR_SPEED
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.contourSpeed"
            type="number"
            outlined
            :color="colorTheme"
            dense
            suffix="mm"
            min="0"
            :rules="[ (val: number) => val && 0 < val || 'Feed rate should be above 0']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Contour/Wall Power:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES.CONTOUR_POWER
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.contourPower"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            suffix="%"
            :rules="[ (val: number) => val && 0 <= val && val <= 100
            || 'Laser Power should be between 0 and 100']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Number of Outer Contour:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PYSLM_OUTER_CONTOUR
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.outerContour"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            numeric-keyboard-toggle
            :rules="[ (val: number) => val && 0 <= val && val <= 10
            || 'Number of outer contours should be between 0 and 10']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Contour Line Count:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PYSLM_CONTOUR_LINE_COUNT
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.contourLineCount"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="1"
            max="10"
            :rules="[ (val: number) => val && 1 <= val && val <= 10
            || 'Contour line count should be between 1 and 10']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Number of Inner Contour:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PYSLM_INNER_CONTOUR
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.innerContour"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            :rules="[ (val: number) => val && 0 <= val && val <= 10
            || 'Number of inner contours should be between 0 and 10']"
          />
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item label="Infill Settings" icon="texture">
      <q-card bordered>
        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Infill Type:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PYSLM_INFILL_TYPE
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-option-group
            :options="infillTypeOptions"
            type="radio"
            v-model="pyslmSettings.infillType"
            inline
            dense
            class="q-gutter-x-md"
            :color="colorTheme"
          />
        </q-card-section>

        <q-card-section
          v-if="pyslmSettings.infillType === Constants.PYSLM_INFILL_TYPES.STRIP"
          class="q-gutter-y-sm"
        >
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Infill Strip Width:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PYSLM_INFILL_STRIP_WIDTH
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.infillStripWidth"
            type="number"
            outlined
            :color="colorTheme"
            dense
            step="0.1"
            min="0"
            suffix="mm"
            :rules="[ (val: number) => val && 0 <= val && val <= 10
            || 'Infill Strip width value should be between 0 and 10']"
          />
        </q-card-section>

        <div
          v-if="
            pyslmSettings.infillType === Constants.PYSLM_INFILL_TYPES.ISLAND
          "
        >
          <q-card-section class="q-gutter-y-sm">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Infill Island Width:</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip
                  anchor="center right"
                  self="center left"
                  :offset="[10, 10]"
                >
                  {{
                    Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                      .PYSLM_INFILL_ISLAND_WIDTH
                  }}
                </q-tooltip>
              </q-icon>
            </div>
            <q-input
              v-model.number="pyslmSettings.infillIslandWidth"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              suffix="mm"
              :rules="[ (val: number) => val && 0 <= val
            || 'Infill Island width value should be above 0']"
            />
          </q-card-section>

          <q-card-section class="q-gutter-y-sm">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Infill Island Overlap:</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip
                  anchor="center right"
                  self="center left"
                  :offset="[10, 10]"
                >
                  {{
                    Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                      .PYSLM_INFILL_ISLAND_OVERLAP
                  }}
                </q-tooltip>
              </q-icon>
            </div>
            <q-input
              v-model.number="pyslmSettings.infillIslandOverlap"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              step="0.1"
              suffix="mm"
              :rules="[ (val: number) => val && 0 <= val && val <= 10
            || 'Infill Island overlap value should be between 0 and 10']"
            />
          </q-card-section>

          <q-card-section class="q-gutter-y-sm">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Infill Island Offset:</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip
                  anchor="center right"
                  self="center left"
                  :offset="[10, 10]"
                >
                  {{
                    Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                      .PYSLM_INFILL_ISLAND_OFFSET
                  }}
                </q-tooltip>
              </q-icon>
            </div>
            <q-input
              v-model.number="pyslmSettings.infillIslandOffset"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              step="0.1"
              suffix="mm"
              :rules="[ (val: number) => val && 0 <= val && val <= 10
            || 'Infill Island offset value should be between 0 and 10']"
            />
          </q-card-section>
        </div>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Infill Lines per Hatch:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PYSLM_INFILL_LINE_COUNT
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.infillLineCount"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="1"
            max="10"
            :rules="[ (val: number) => val && 1 <= val && val <= 10
            || 'Infill line count should be between 1 and 10']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Infill Angle:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PYSLM_INFILL_ANGLE
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.infillAngle"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            suffix="°"
            :rules="[ (val: number) => 0 <= val && val <= 360
            || 'Infill Angle (0-360)°']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Infill Volume Offset:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PYSLM_INFILL_VOLUME_OFFSET
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.infillVolumeOffset"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            suffix="mm"
            :rules="[ (val: number) => val && 0 <= val && val <= 10
            || 'Infill volume offset value should be between 0 and 10']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption"
              >Infill Spot Compensation:</span
            >
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PYSLM_INFILL_SPOT_COMPENSATION
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.infillSpotCompensation"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            suffix="mm"
            :rules="[ (val: number) => val && 0 <= val && val <= 10
            || 'Infill spot compensation value should be between 0 and 10']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Infill image pixel size:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .INFILL_IMAGE_PIXEL_SIZE
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <div class="row items-center justify-between q-gutter-x-sm">
            <div class="row flex-center q-gutter-x-sm">
              <span>X:</span>
              <q-input
                v-model.number="pyslmSettings.infillImageSettings.x"
                type="number"
                outlined
                :color="colorTheme"
                dense
                suffix="mm"
                step="0.1"
                min="0"
                :rules="[ (val: number) => val && 0 < val || 'Pixel size should be above 0']"
              />
            </div>
            <div class="row flex-center q-gutter-x-sm">
              <span>Y:</span>
              <q-input
                v-model.number="pyslmSettings.infillImageSettings.y"
                type="number"
                outlined
                :color="colorTheme"
                dense
                suffix="mm"
                step="0.1"
                min="0"
                :rules="[ (val: number) => val && 0 < val || 'Pixel size should be above 0']"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Infill Speed:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES.INFILL_SPEED
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.infillSpeed"
            type="number"
            outlined
            :color="colorTheme"
            dense
            suffix="mm/min"
            min="0"
            :rules="[ (val: number) => val && 0 < val || 'Feed rate should be above 0']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Infill Power:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES.INFILL_POWER
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.infillPower"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            suffix="%"
            :rules="[ (val: number) => val && 0 <= val && val <= 100
            || 'Laser Power should be between 0 and 100']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Infill Noise:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES.INFILL_NOISE
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.infillImageSettings.noise"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            max="255"
            :rules="[ (val: number) => val && 0 <= val && val <= 255
            || 'Noise should be a value between 0 and 255']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Infill Image Resolution:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PYSLM_INFILL_IMAGE_RESOLUTION
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.infillImageSettings.resolution"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            max="500"
            :rules="[ (val: number) => val && 0 < val && val <= 500
                    || 'Resolution value should be between 0 and 500']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <div class="q-gutter-x-sm">
              <span class="text-bold text-caption">Infill Image Size:</span>
              <q-toggle
                v-model="pyslmSettings.infillImageSettings.isImageSizeSettings"
                :color="colorTheme"
              />
            </div>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .INFILL_IMAGE_SIZE
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <div
            class="row items-center justify-between q-gutter-x-sm"
            v-if="pyslmSettings.infillImageSettings.isImageSizeSettings"
          >
            <div class="row flex-center q-gutter-x-sm">
              <span>Width:</span>
              <q-input
                v-model.number="pyslmSettings.infillImageSettings.width"
                type="number"
                outlined
                :color="colorTheme"
                dense
                suffix="mm per pixel"
                min="0"
                :rules="[ (val: number) => val && 0 < val && val < 1000 || `Image Size between 0 and 1000`]"
                :disable="
                  !pyslmSettings.infillImageSettings.isImageSizeSettings
                "
              />
            </div>
            <div class="row flex-center q-gutter-x-sm">
              <span>Height:</span>
              <q-input
                v-model.number="pyslmSettings.infillImageSettings.height"
                type="number"
                outlined
                :color="colorTheme"
                dense
                suffix="mm per pixel"
                min="0"
                :rules="[ (val: number) => val && 0 < val && val < 1000 || `Image Size between 0 and 1000`]"
                :disable="
                  !pyslmSettings.infillImageSettings.isImageSizeSettings
                "
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item label="Machine Routine" icon="precision_manufacturing">
      <q-card bordered>
        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">No-Routine First Layers:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                Skip the powder-feed and recoater routine before the first N
                printed layers.
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="pyslmSettings.noRoutineFirstLayers"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            :rules="[(val: number) => val >= 0 || 'Must be 0 or above']"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <span class="text-bold text-caption">Bed Offset X:</span>
          <q-input
            v-model.number="pyslmSettings.bedOffsetX"
            type="number"
            outlined
            :color="colorTheme"
            dense
            suffix="mm"
          />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <span class="text-bold text-caption">Bed Offset Y:</span>
          <q-input
            v-model.number="pyslmSettings.bedOffsetY"
            type="number"
            outlined
            :color="colorTheme"
            dense
            suffix="mm"
          />
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </q-list>
</template>
<script setup lang="ts">
import { Constants } from 'src/constants';
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

/**
 * Access the 3D slicing store, which holds all slicing-related settings
 * including PySLM configuration.
 */
const slicingStore = use3DSlicingStore();

/**
 * Reactive references to:
 * - `pyslmSettings` → current PySLM-specific slicing settings
 * - `colorTheme`    → active color theme for UI styling
 */
const { pyslmSettings, colorTheme } = storeToRefs(slicingStore);

/**
 * Available infill type options for the PySLM slicing library.
 *
 * These are mapped to an array of objects with `label` and `value`
 * so they can be directly used in `<q-select>` or similar UI components.
 *
 * The constants are imported from `Constants.PYSLM_INFILL_TYPES` to ensure
 * consistency across the app.
 */
const infillTypeOptions = ref<Array<Record<string, string>>>([
  {
    label: Constants.PYSLM_INFILL_TYPES.BASIC,
    value: Constants.PYSLM_INFILL_TYPES.BASIC,
  },
  {
    label: Constants.PYSLM_INFILL_TYPES.STRIP,
    value: Constants.PYSLM_INFILL_TYPES.STRIP,
  },
  {
    label: Constants.PYSLM_INFILL_TYPES.ISLAND,
    value: Constants.PYSLM_INFILL_TYPES.ISLAND,
  },
]);
</script>
