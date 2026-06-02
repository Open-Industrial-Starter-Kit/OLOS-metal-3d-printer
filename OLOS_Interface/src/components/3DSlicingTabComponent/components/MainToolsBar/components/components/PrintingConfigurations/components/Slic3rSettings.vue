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
            v-model.number="slic3rSettings.layerHeight"
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
            v-model.number="slic3rSettings.layerSpeed"
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
            v-model.number="slic3rSettings.contourSpeed"
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
            v-model.number="slic3rSettings.contourPower"
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
      </q-card>
    </q-expansion-item>

    <q-expansion-item label="Infill Settings" icon="texture">
      <q-card bordered>
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
                v-model.number="slic3rSettings.infillImageSettings.x"
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
                v-model.number="slic3rSettings.infillImageSettings.y"
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
            v-model.number="slic3rSettings.infillSpeed"
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
            v-model.number="slic3rSettings.infillPower"
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
            v-model.number="slic3rSettings.infillImageSettings.noise"
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
            <div class="q-gutter-x-sm">
              <span class="text-bold text-caption">Infill Image Size:</span>
              <q-toggle
                v-model="slic3rSettings.infillImageSettings.isImageSizeSettings"
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
            v-if="slic3rSettings.infillImageSettings.isImageSizeSettings"
          >
            <div class="row flex-center q-gutter-x-sm">
              <span>Width:</span>
              <q-input
                v-model.number="slic3rSettings.infillImageSettings.width"
                type="number"
                outlined
                :color="colorTheme"
                dense
                suffix="mm per pixel"
                min="0"
                :rules="[ (val: number) => val && 0 < val && val < 1000 || `Image Size between 0 and 1000`]"
                :disable="
                  !slic3rSettings.infillImageSettings.isImageSizeSettings
                "
              />
            </div>
            <div class="row flex-center q-gutter-x-sm">
              <span>Height:</span>
              <q-input
                v-model.number="slic3rSettings.infillImageSettings.height"
                type="number"
                outlined
                :color="colorTheme"
                dense
                suffix="mm per pixel"
                min="0"
                :rules="[ (val: number) => val && 0 < val && val < 1000 || `Image Size between 0 and 1000`]"
                :disable="
                  !slic3rSettings.infillImageSettings.isImageSizeSettings
                "
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
  </q-list>
</template>
<script setup lang="ts">
import { Constants } from 'src/constants';
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import { storeToRefs } from 'pinia';
/**
 * Access the 3D slicing store to manage slicing-related settings.
 */
const slicingStore = use3DSlicingStore();

/**
 * Reactive references to Slic3r slicing settings and UI color theme.
 */
const { slic3rSettings, colorTheme } = storeToRefs(slicingStore);
</script>
