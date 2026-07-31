<template>
  <q-list bordered class="rounded-borders">
    <q-item>
      <q-item-section>
        <div class="row items-center justify-between no-wrap">
          <span class="text-bold text-caption">Solid Object</span>
          <q-toggle
            v-model="prusaSettings.solidModeEnabled"
            :color="colorTheme"
          />
        </div>
      </q-item-section>
    </q-item>

    <q-separator />
      <q-item v-if="prusaSettings.solidModeEnabled" dense>
        <q-item-section avatar>
          <q-icon name="view_in_ar" :color="colorTheme" />
        </q-item-section>
        <q-item-section>
          <q-item-label caption>Object settings</q-item-label>
          <q-item-label class="text-weight-medium">
            {{ selectedSolidObjectName }}
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="prusaSettings.solidModeEnabled" dense>
        <q-item-section>
          <q-btn
            label="Save Settings for Object"
            icon="save"
            no-caps
            unelevated
            :color="colorTheme"
            :disable="!selectedModel.object"
            @click="handleSaveObjectSettings"
          />
        </q-item-section>
      </q-item>
      <q-expansion-item
        :label="
          prusaSettings.solidModeEnabled
            ? 'Preparation'
            : 'Preparation: Anchor & Flange Transition'
        "
        icon="construction"
        default-opened
        header-class="bg-blue-grey-1 text-weight-medium"
      >
        <q-item>
          <q-item-section class="q-gutter-y-sm">
          <div class="row items-center justify-between no-wrap">
            <div class="row items-center q-gutter-x-xs no-wrap">
              <span class="text-bold text-caption">Sacrificial Anchor Pad</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip>
                  Adds engraved square layers beneath every disconnected model
                  before the model itself begins.
                </q-tooltip>
              </q-icon>
            </div>
            <q-toggle
              v-model="prusaSettings.solidAnchorPadEnabled"
              :color="colorTheme"
            />
          </div>

          <template v-if="prusaSettings.solidAnchorPadEnabled">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Anchor Pad Layers:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidAnchorPadLayers"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              step="1"
              :rules="[ (val: number) => Number.isInteger(val) && val >= 1
              || 'Layer count should be a whole number above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Square Size:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidAnchorPadSize"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0.01"
              step="0.1"
              suffix="mm x mm"
              :rules="[ (val: number) => val && val > 0
              || 'Square size should be above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Anchor Pad Power:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidAnchorPadPower"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              max="100"
              suffix="%"
              :rules="[ (val: number) => 0 <= val && val <= 100
              || 'Laser power should be between 0 and 100']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Anchor Pad Feed Rate:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidAnchorPadSpeed"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              suffix="mm/min"
              :rules="[ (val: number) => val && val > 0
              || 'Feed rate should be above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Anchor Pad Line Overlap:</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip>
                  Zero places adjacent engraved lines one estimated track
                  width apart.
                </q-tooltip>
              </q-icon>
            </div>
            <q-input
              v-model.number="prusaSettings.solidAnchorPadLineOverlap"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="-100"
              max="95"
              step="1"
              suffix="%"
              :rules="[ (val: number) => -100 <= val && val <= 95
              || 'Line overlap should be between -100 and 95']"
            />

            <div class="row items-center justify-between no-wrap">
              <div class="row items-center q-gutter-x-xs no-wrap">
                <span class="text-bold text-caption">Rotate Each Layer</span>
                <q-icon name="help" size="xs" color="blue-grey-9">
                  <q-tooltip>
                    Starts from the model pattern direction and rotates each
                    following anchor-pad layer by the selected angle.
                  </q-tooltip>
                </q-icon>
              </div>
              <q-toggle
                v-model="prusaSettings.solidAnchorPadRotateEachLayer"
                :color="colorTheme"
              />
            </div>

            <template v-if="prusaSettings.solidAnchorPadRotateEachLayer">
              <div class="row items-center justify-between">
                <span class="text-bold text-caption">
                  Rotation per Layer:
                </span>
              </div>
              <q-input
                v-model.number="prusaSettings.solidAnchorPadRotationPerLayer"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="-180"
                max="180"
                step="1"
                suffix="deg/layer"
                :rules="[ (val: number) => -180 <= val && val <= 180
                || 'Rotation should be between -180 and 180 degrees']"
              />
            </template>
          </template>
          <q-separator spaced />

          <div class="row items-center justify-between no-wrap">
            <div class="row items-center q-gutter-x-xs no-wrap">
              <span class="text-bold text-caption">
                {{
                  prusaSettings.solidModeEnabled
                    ? 'Transition Layers'
                    : 'Transition Layers & Internal Flange Support'
                }}
              </span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip>
                  {{
                    prusaSettings.solidModeEnabled
                      ? 'Adds engraved interface layers after the anchor pad and before the first model layer.'
                      : 'Adds engraved interface layers below the model, detects floors or flanges over enclosed hollows, and continues the same pattern only through the hollow space up to those features.'
                  }}
                </q-tooltip>
              </q-icon>
            </div>
            <q-toggle
              v-model="prusaSettings.solidTransitionEnabled"
              :color="colorTheme"
            />
          </div>

          <template v-if="prusaSettings.solidTransitionEnabled">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Transition Layers:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidTransitionLayers"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              max="1000"
              step="1"
              :rules="[ (val: number) => Number.isInteger(val)
              && 1 <= val && val <= 1000
              || 'Transition layers should be a whole number from 1 to 1000']"
            />
            <q-banner
              dense
              rounded
              class="bg-blue-grey-1 text-blue-grey-9 text-caption"
            >
              Base transition height:
              <strong>{{ transitionTotalHeight.toFixed(3) }} mm</strong>
              ({{ prusaSettings.solidTransitionLayers }} layers x
              {{ normalizedLayerHeight.toFixed(3) }} mm).
              <span
                v-if="
                  !prusaSettings.solidModeEnabled &&
                  prusaSettings.internalFloorSupportEnabled
                "
              >
                Internal transition support is extended automatically through
                enclosed hollow regions and stops directly below each detected
                floor or flange.
              </span>
              <span v-else-if="!prusaSettings.solidModeEnabled">
                Internal support is off, so these layers stop at the first
                model contact.
              </span>
            </q-banner>

            <template v-if="!prusaSettings.solidModeEnabled">
              <div class="row items-center justify-between no-wrap">
                <div class="row items-center q-gutter-x-xs no-wrap">
                  <span class="text-bold text-caption">
                    Support Internal Flanges
                  </span>
                  <q-icon name="help" size="xs" color="blue-grey-9">
                    <q-tooltip>
                      Off keeps the transition stack below the model and stops
                      at its first contact. On detects floors and flanges over
                      enclosed hollows, then continues this transition pattern
                      only inside those hollows until one layer below each
                      detected feature.
                    </q-tooltip>
                  </q-icon>
                </div>
                <q-toggle
                  v-model="prusaSettings.internalFloorSupportEnabled"
                  :color="colorTheme"
                />
              </div>
              <q-banner
                v-if="prusaSettings.internalFloorSupportEnabled"
                dense
                rounded
                class="bg-orange-1 text-blue-grey-9 text-caption"
              >
                Flange support is enabled. Power, feed rate, line or grid
                pattern, overlap, rotation, and optional contour use the
                transition settings below.
              </q-banner>
            </template>

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Transition Pattern:</span>
            </div>
            <q-btn-toggle
              v-model="prusaSettings.solidTransitionPattern"
              :options="[
                { label: 'Lines', value: 'lines' },
                { label: 'Grid', value: 'grid' }
              ]"
              color="primary"
              text-color="white"
              toggle-color="orange"
              class="full-width"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Pattern Direction:</span>
            </div>
            <q-btn-toggle
              v-model="prusaSettings.solidTransitionRasterDirection"
              :options="[
                { label: 'X', value: 'x' },
                { label: 'Y', value: 'y' },
                { label: '45 deg', value: 'diagonal' }
              ]"
              color="primary"
              text-color="white"
              toggle-color="orange"
              class="full-width"
            />

            <div class="row items-center justify-between no-wrap">
              <span class="text-bold text-caption">Rotate Each Layer</span>
              <q-toggle
                v-model="prusaSettings.solidTransitionRotateEachLayer"
                :color="colorTheme"
              />
            </div>

            <template v-if="prusaSettings.solidTransitionRotateEachLayer">
              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Rotation per Layer:</span>
              </div>
              <q-input
                v-model.number="prusaSettings.solidTransitionRotationPerLayer"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="-180"
                max="180"
                step="1"
                suffix="deg/layer"
                :rules="[ (val: number) => -180 <= val && val <= 180
                || 'Rotation should be between -180 and 180 degrees']"
              />
            </template>

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Transition Power:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidTransitionPower"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              max="100"
              suffix="%"
              :rules="[ (val: number) => 0 <= val && val <= 100
              || 'Laser power should be between 0 and 100']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Transition Feed Rate:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidTransitionSpeed"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              suffix="mm/min"
              :rules="[ (val: number) => val && val > 0
              || 'Feed rate should be above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Transition Track Width:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidTransitionTrackWidth"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0.01"
              step="0.01"
              suffix="mm"
              :rules="[ (val: number) => val && val > 0
              || 'Track width should be above 0']"
            />

            <div class="row items-center justify-between">
              <div class="row items-center q-gutter-x-xs no-wrap">
                <span class="text-bold text-caption">Line Overlap:</span>
                <q-icon name="help" size="xs" color="blue-grey-9">
                  <q-tooltip>
                    Zero places lines in a hatch bundle one estimated track
                    width apart.
                  </q-tooltip>
                </q-icon>
              </div>
            </div>
            <q-input
              v-model.number="prusaSettings.solidTransitionLineOverlap"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="-100"
              max="95"
              step="1"
              suffix="%"
              :rules="[ (val: number) => -100 <= val && val <= 95
              || 'Line overlap should be between -100 and 95']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Lines per Hatch:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidTransitionLineCount"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              max="25"
              step="1"
              :rules="[ (val: number) => Number.isInteger(val)
              && 1 <= val && val <= 25
              || 'Line count should be a whole number from 1 to 25']"
            />

            <template v-if="prusaSettings.solidTransitionPattern === 'lines'">
              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Hatch Spacing:</span>
              </div>
              <q-input
                v-model.number="prusaSettings.solidTransitionHatchSpacing"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0.01"
                step="0.1"
                suffix="mm"
                :rules="[ (val: number) => val && val > 0
                || 'Hatch spacing should be above 0']"
              />
            </template>

            <template v-else>
              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Grid Spacing:</span>
              </div>
              <q-input
                v-model.number="prusaSettings.solidTransitionGridSpacing"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0.01"
                step="0.1"
                suffix="mm"
                :rules="[ (val: number) => val && val > 0
                || 'Grid spacing should be above 0']"
              />

              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Grid Crossing Clearance:</span>
              </div>
              <q-input
                v-model.number="prusaSettings.solidTransitionGridClearance"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0"
                step="0.05"
                suffix="mm"
                :rules="[ (val: number) => val >= 0
                || 'Grid clearance cannot be negative']"
              />
            </template>

            <div class="row items-center justify-between no-wrap">
              <span class="text-bold text-caption">Transition Contour</span>
              <q-toggle
                v-model="prusaSettings.solidTransitionContourEnabled"
                :color="colorTheme"
              />
            </div>

            <template v-if="prusaSettings.solidTransitionContourEnabled">
              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Contour Power:</span>
              </div>
              <q-input
                v-model.number="prusaSettings.solidTransitionContourPower"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0"
                max="100"
                suffix="%"
                :rules="[ (val: number) => 0 <= val && val <= 100
                || 'Laser power should be between 0 and 100']"
              />

              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Contour Feed Rate:</span>
              </div>
              <q-input
                v-model.number="prusaSettings.solidTransitionContourSpeed"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="1"
                suffix="mm/min"
                :rules="[ (val: number) => val && val > 0
                || 'Feed rate should be above 0']"
              />

              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Contour Lines:</span>
              </div>
              <q-input
                v-model.number="prusaSettings.solidTransitionContourLineCount"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="1"
                max="25"
                step="1"
                :rules="[ (val: number) => Number.isInteger(val)
                && 1 <= val && val <= 25
                || 'Contour line count should be from 1 to 25']"
              />

              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Contour Overlap:</span>
              </div>
              <q-input
                v-model.number="prusaSettings.solidTransitionContourOverlap"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="-100"
                max="100"
                step="1"
                suffix="%"
                :rules="[ (val: number) => -100 <= val && val <= 100
                || 'Contour overlap should be between -100 and 100']"
              />
            </template>
          </template>
        </q-item-section>
      </q-item>
      </q-expansion-item>

      <q-expansion-item
        v-if="prusaSettings.solidModeEnabled"
        label="Model Settings"
        icon="view_in_ar"
      >
        <q-item>
          <q-item-section class="q-gutter-y-sm">
          <div class="row items-center justify-between no-wrap">
            <div class="row items-center q-gutter-x-xs no-wrap">
              <span class="text-bold text-caption">Merge Objects by Layer</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip>
                  Completes the current layer for every disconnected solid
                  before running the layer-change routine.
                </q-tooltip>
              </q-icon>
            </div>
            <q-toggle
              v-model="prusaSettings.solidMergeObjectsByLayer"
              :color="colorTheme"
            />
          </div>

          <q-separator spaced />

          <div class="row items-center justify-between no-wrap">
            <span class="text-bold text-caption">Alternate Solid Paths</span>
            <q-toggle
              v-model="prusaSettings.solidAlternateLines"
              :color="colorTheme"
            />
          </div>

          <q-btn-toggle
            v-if="prusaSettings.solidAlternateLines"
            v-model="prusaSettings.solidAlternateMode"
            :options="[
              { label: 'Two Passes', value: 'two-pass' },
              { label: 'Edge Interleave', value: 'edge-interleave' }
            ]"
            color="primary"
            text-color="white"
            toggle-color="orange"
            class="full-width"
          />

          <div class="row items-center justify-between no-wrap">
            <div class="row items-center q-gutter-x-xs no-wrap">
              <span class="text-bold text-caption">Island Scanning</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip>
                  Completes one fitted section of the solid layer before
                  moving to the next. Actual island dimensions are adjusted
                  so a whole number fits along each object axis.
                </q-tooltip>
              </q-icon>
            </div>
            <q-toggle
              v-model="prusaSettings.solidIslandScanningEnabled"
              :color="colorTheme"
            />
          </div>

          <template v-if="prusaSettings.solidIslandScanningEnabled">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Requested Island Size:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidIslandSize"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0.01"
              step="0.1"
              suffix="mm x mm"
              :rules="[ (val: number) => val && val > 0
              || 'Island size should be above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Island Line Strategy:</span>
            </div>
            <q-btn-toggle
              v-model="prusaSettings.solidIslandScanStrategy"
              :options="[
                { label: 'Normal', value: 'normal' },
                { label: 'Two Passes', value: 'two-pass' },
                { label: 'Edge Interleave', value: 'edge-interleave' }
              ]"
              color="primary"
              text-color="white"
              toggle-color="orange"
              class="full-width"
            />
          </template>

          <div class="row items-center justify-between no-wrap">
            <span class="text-bold text-caption">Close Top &amp; Bottom</span>
            <q-toggle
              v-model="prusaSettings.solidCloseTopBottomEnabled"
              :color="colorTheme"
              @update:model-value="initializeSolidClosureSettings"
            />
          </div>

          <template v-if="prusaSettings.solidCloseTopBottomEnabled">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Line-only Layers per Face:</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip>
                  The first and final layers fill to the object boundary using
                  lines only. Middle layers keep the configured contour.
                </q-tooltip>
              </q-icon>
            </div>
            <q-input
              v-model.number="prusaSettings.solidCloseTopBottomLayers"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              step="1"
              :rules="[ (val: number) => Number.isInteger(val) && val >= 1
              || 'Layer count should be a whole number above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Closure Power:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidCloseTopBottomPower"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              max="100"
              suffix="%"
              :rules="[ (val: number) => 0 <= val && val <= 100
              || 'Laser power should be between 0 and 100']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Closure Feed Rate:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidCloseTopBottomSpeed"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              suffix="mm/min"
              :rules="[ (val: number) => val && val > 0
              || 'Feed rate should be above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Closure Line Overlap:</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip>
                  Zero places adjacent closure tracks one estimated track
                  width apart.
                </q-tooltip>
              </q-icon>
            </div>
            <q-input
              v-model.number="prusaSettings.solidCloseTopBottomLineOverlap"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="-100"
              max="95"
              step="1"
              suffix="%"
              :rules="[ (val: number) => -100 <= val && val <= 95
              || 'Line overlap should be between -100 and 95']"
            />
          </template>

          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Estimated Track Width:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip>
                Estimated physical width of one solid-pattern laser track.
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="prusaSettings.solidTrackWidth"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0.01"
            max="2"
            step="0.01"
            suffix="mm"
            :rules="[ (val: number) => val && 0.01 <= val && val <= 2
            || 'Track width should be between 0.01 and 2 mm']"
          />

        </q-item-section>
      </q-item>

      <q-separator />
      <q-item-label header>First Layers</q-item-label>

      <q-item>
        <q-item-section class="q-gutter-y-sm">
          <div class="row items-center justify-between no-wrap">
            <span class="text-bold text-caption">Enable First Zone</span>
            <q-toggle
              v-model="prusaSettings.solidFirstZoneEnabled"
              :color="colorTheme"
            />
          </div>

          <template v-if="prusaSettings.solidFirstZoneEnabled">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Number of Layers:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidFirstLayersCount"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              step="1"
              :rules="[ (val: number) => Number.isInteger(val) && val >= 1
              || 'Layer count should be a whole number above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Method:</span>
            </div>
            <q-btn-toggle
              v-model="prusaSettings.solidFirstZoneEngravingEnabled"
              :options="[
                { label: 'Vectoring', value: false },
                { label: 'Engraving', value: true }
              ]"
              color="primary"
              text-color="white"
              toggle-color="orange"
              class="full-width"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Initial Pattern Power:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidFirstPower"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              max="100"
              suffix="%"
              :rules="[ (val: number) => 0 <= val && val <= 100
              || 'Laser power should be between 0 and 100']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Initial Pattern Feed Rate:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidFirstSpeed"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              suffix="mm/min"
              :rules="[ (val: number) => val && val > 0
              || 'Feed rate should be above 0']"
            />

            <template v-if="prusaSettings.solidFirstZoneEngravingEnabled">
              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Distance Between Engraved Lines:</span>
              </div>
              <q-input
                v-model.number="prusaSettings.solidFirstEngravingHatchSpacing"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0.001"
                step="0.01"
                suffix="mm"
                :rules="[ (val: number) => val && val > 0
                || 'Line distance should be above 0']"
              />
            </template>
          </template>
        </q-item-section>
      </q-item>

      <q-separator />
      <q-item-label header>Intermediate Layers</q-item-label>

      <q-item>
        <q-item-section class="q-gutter-y-sm">
          <div class="row items-center justify-between no-wrap">
            <span class="text-bold text-caption">Enable Intermediate Zone</span>
            <q-toggle
              v-model="prusaSettings.solidIntermediateZoneEnabled"
              :color="colorTheme"
            />
          </div>

          <template v-if="prusaSettings.solidIntermediateZoneEnabled">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Number of Layers:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidIntermediateLayersCount"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              step="1"
              :rules="[ (val: number) => Number.isInteger(val) && val >= 1
              || 'Layer count should be a whole number above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Method:</span>
            </div>
            <q-btn-toggle
              v-model="prusaSettings.solidIntermediateZoneEngravingEnabled"
              :options="[
                { label: 'Vectoring', value: false },
                { label: 'Engraving', value: true }
              ]"
              color="primary"
              text-color="white"
              toggle-color="orange"
              class="full-width"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Intermediate Pattern Power:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidIntermediatePower"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              max="100"
              suffix="%"
              :rules="[ (val: number) => 0 <= val && val <= 100
              || 'Laser power should be between 0 and 100']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Intermediate Pattern Feed Rate:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidIntermediateSpeed"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              suffix="mm/min"
              :rules="[ (val: number) => val && val > 0
              || 'Feed rate should be above 0']"
            />

            <template v-if="prusaSettings.solidIntermediateZoneEngravingEnabled">
              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Distance Between Engraved Lines:</span>
              </div>
              <q-input
                v-model.number="prusaSettings.solidIntermediateEngravingHatchSpacing"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0.001"
                step="0.01"
                suffix="mm"
                :rules="[ (val: number) => val && val > 0
                || 'Line distance should be above 0']"
              />
            </template>
          </template>
        </q-item-section>
      </q-item>

      <q-separator />
      <q-item-label header>Bulk Layers</q-item-label>

      <q-item>
        <q-item-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Pattern Direction:</span>
          </div>
          <q-btn-toggle
            v-model="prusaSettings.solidRasterDirection"
            :options="[
              { label: 'X', value: 'x' },
              { label: 'Y', value: 'y' },
              { label: '45 deg', value: 'diagonal' }
            ]"
            color="primary"
            text-color="white"
            toggle-color="orange"
            class="full-width"
          />

          <div class="row items-center justify-between no-wrap">
            <span class="text-bold text-caption">Cross Hatch Next Layer</span>
            <q-toggle
              v-model="prusaSettings.solidCrossHatch"
              :color="colorTheme"
            />
          </div>

          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Power:</span>
          </div>
          <q-input
            v-model.number="prusaSettings.solidPower"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            max="100"
            suffix="%"
            :rules="[ (val: number) => 0 <= val && val <= 100
            || 'Laser power should be between 0 and 100']"
          />

          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Feed Rate:</span>
          </div>
          <q-input
            v-model.number="prusaSettings.solidSpeed"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="1"
            suffix="mm/min"
            :rules="[ (val: number) => val && val > 0
            || 'Feed rate should be above 0']"
          />

          <template v-if="prusaSettings.solidContourEnabled">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Overlap with Contour:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidContourOverlap"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="-100"
              max="100"
              step="1"
              suffix="%"
              :rules="[ (val: number) => -100 <= val && val <= 100
              || 'Contour overlap should be between -100 and 100']"
            />
          </template>

          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Overlap Between Lines:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip>
                Zero places adjacent tracks one estimated track width apart.
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="prusaSettings.solidLineOverlap"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="-100"
            max="95"
            step="1"
            suffix="%"
            :rules="[ (val: number) => -100 <= val && val <= 95
            || 'Line overlap should be between -100 and 95']"
          />
        </q-item-section>
      </q-item>

      <q-separator />
      <q-item-label header>Contour</q-item-label>

      <q-item>
        <q-item-section class="q-gutter-y-sm">
          <div class="row items-center justify-between no-wrap">
            <span class="text-bold text-caption">Enable Vectored Contour</span>
            <q-toggle
              v-model="prusaSettings.solidContourEnabled"
              :color="colorTheme"
            />
          </div>

          <template v-if="prusaSettings.solidContourEnabled">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Contour Power:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidContourPower"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              max="100"
              suffix="%"
              :rules="[ (val: number) => 0 <= val && val <= 100
              || 'Laser power should be between 0 and 100']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Contour Feed Rate:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidContourSpeed"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              suffix="mm/min"
              :rules="[ (val: number) => val && val > 0
              || 'Feed rate should be above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Number of Contour Lines:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.solidContourLineCount"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              max="25"
              step="1"
              :rules="[ (val: number) => Number.isInteger(val)
              && 1 <= val && val <= 25
              || 'Contour lines should be between 1 and 25']"
            />
          </template>
        </q-item-section>
      </q-item>
      </q-expansion-item>

      <q-expansion-item
        v-if="prusaSettings.solidModeEnabled"
        label="Machine"
        icon="precision_manufacturing"
      >
        <q-item>
          <q-item-section class="q-gutter-y-sm">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Layer Height:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.layerHeight"
              type="number"
              outlined
              :color="colorTheme"
              dense
              suffix="mm"
              step="0.01"
              min="0.001"
              :rules="[ (val: number) => val && val > 0
              || 'Layer height should be above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Layer Z Travel Speed:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.layerSpeed"
              type="number"
              outlined
              :color="colorTheme"
              dense
              suffix="mm/min"
              min="1"
              :rules="[ (val: number) => val && val > 0
              || 'Feed rate should be above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">No-Routine First Layers:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.noRoutineFirstLayers"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              step="1"
              :rules="[ (val: number) => Number.isInteger(val) && val >= 0
              || 'Layer count should be a whole number of 0 or above']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Reservoir Lift per Layer:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.reservoirLiftPerLayer"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              step="0.05"
              suffix="mm"
              :rules="[ (val: number) => val >= 0
              || 'Lift should be 0 or above']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Recoater Feed Rate:</span>
            </div>
            <q-input
              v-model.number="prusaSettings.recoaterFeedRate"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              step="100"
              suffix="mm/min"
              :rules="[ (val: number) => val && val > 0
              || 'Feed rate should be above 0']"
            />

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Return-Pass Bed Clearance:</span>
              <div class="row items-center q-gutter-x-sm">
                <q-icon name="help" size="xs" color="blue-grey-9">
                  <q-tooltip>
                    After the forward recoater stroke, dip the build bed for the
                    return stroke, then restore scan height with a backlash-safe
                    final approach.
                  </q-tooltip>
                </q-icon>
                <q-toggle
                  v-model="prusaSettings.recoaterReturnBedDropEnabled"
                  :color="colorTheme"
                />
              </div>
            </div>

            <template v-if="prusaSettings.recoaterReturnBedDropEnabled">
              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Bed Dip Distance:</span>
              </div>
              <q-input
                v-model.number="prusaSettings.recoaterReturnBedDropDistance"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0.001"
                step="0.01"
                suffix="mm"
                :rules="[ (val: number) => val && val > 0
                || 'Dip distance should be above 0']"
              />

              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Bed Z Feed Rate:</span>
              </div>
              <q-input
                v-model.number="prusaSettings.recoaterReturnBedFeedRate"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="1"
                step="10"
                suffix="mm/min"
                :rules="[ (val: number) => val && val > 0
                || 'Feed rate should be above 0']"
              />
            </template>

            <div class="row items-center justify-between">
              <span class="text-bold text-caption">XY Gantry Acceleration:</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip>
                  Machine acceleration used to compensate engraving line ends.
                </q-tooltip>
              </q-icon>
            </div>
            <q-input
              v-model.number="prusaSettings.engravingAcceleration"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              step="10"
              suffix="mm/s^2"
              :rules="[ (val: number) => val && val >= 1
              || 'Acceleration should be at least 1 mm/s^2']"
            />

            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input
                  v-model.number="prusaSettings.bedOffsetX"
                  label="Bed Offset X"
                  type="number"
                  outlined
                  :color="colorTheme"
                  dense
                  suffix="mm"
                />
              </div>
              <div class="col-6">
                <q-input
                  v-model.number="prusaSettings.bedOffsetY"
                  label="Bed Offset Y"
                  type="number"
                  outlined
                  :color="colorTheme"
                  dense
                  suffix="mm"
                />
              </div>
            </div>
          </q-item-section>
        </q-item>
      </q-expansion-item>

    <template v-if="!prusaSettings.solidModeEnabled">
    <q-item>
      <q-item-section>
        <div class="row items-center justify-between">
          <span class="text-bold text-caption">Remaining Layers Mode:</span>
          <q-icon name="help" size="xs" color="blue-grey-9">
            <q-tooltip
              anchor="center right"
              self="center left"
              :offset="[10, 10]"
            >
              Selects the mode used after the first and intermediate zones.
              Those zones can independently override this mode below.
            </q-tooltip>
          </q-icon>
        </div>
        <q-btn-toggle
          v-model="prusaSettings.engravingMode"
          :options="[
            { label: 'Vectoring', value: 'vectoring' },
            { label: 'Engraving', value: 'engraving' }
          ]"
          color="primary"
          text-color="white"
          toggle-color="orange"
          class="full-width"
        />
      </q-item-section>
    </q-item>

    <q-item v-if="hasAnyEngravingLayers">
      <q-item-section class="q-gutter-y-sm">
        <div class="row items-center justify-between">
          <span class="text-bold text-caption">Raster Direction:</span>
          <q-icon name="help" size="xs" color="blue-grey-9">
            <q-tooltip>
              X scans horizontal rows. Y scans vertical columns. Both use the
              same spacing, power, feedrate, and lead compensation.
            </q-tooltip>
          </q-icon>
        </div>
        <q-btn-toggle
          v-model="prusaSettings.engravingRasterDirection"
          :options="[
            { label: 'X Direction', value: 'x' },
            { label: 'Y Direction', value: 'y' }
          ]"
          color="primary"
          text-color="white"
          toggle-color="orange"
          class="full-width"
        />
        <div class="row items-center justify-between">
          <span class="text-bold text-caption">XY Gantry Acceleration:</span>
          <q-icon name="help" size="xs" color="blue-grey-9">
            <q-tooltip>
              Used to calculate laser-off lead-in and lead-out distance:
              d = (F / 60)^2 / (2a).
            </q-tooltip>
          </q-icon>
        </div>
        <q-input
          v-model.number="prusaSettings.engravingAcceleration"
          type="number"
          outlined
          :color="colorTheme"
          dense
          min="1"
          step="10"
          suffix="mm/s^2"
          :rules="[ (val: number) => val && val > 0
          || 'Acceleration must be above 0 mm/s^2']"
        />
        <q-markup-table dense flat bordered>
          <thead>
            <tr>
              <th class="text-left">Zone</th>
              <th class="text-left">Path</th>
              <th class="text-right">F</th>
              <th class="text-right">v</th>
              <th class="text-right">Lead</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="zone in compensationDistances" :key="zone.name">
              <td>{{ zone.zone }}</td>
              <td>{{ zone.path }}</td>
              <td class="text-right">{{ zone.feedrate }} mm/min</td>
              <td class="text-right">{{ zone.velocity }} mm/s</td>
              <td class="text-right">{{ zone.lead }} mm</td>
            </tr>
          </tbody>
        </q-markup-table>
        <div class="text-caption text-grey-7">
          Feedrate is divided by 60 before the compensation distance is
          calculated.
        </div>
        <q-banner dense rounded class="bg-orange-1 text-orange-10">
          Use the XY acceleration configured or measured on the real
          controller. An estimated value changes the lead distance and may
          place laser switching before or after the intended geometry.
        </q-banner>
        <q-banner dense rounded class="bg-blue-1 text-blue-10">
          Engraving scans
          {{
            prusaSettings.engravingRasterDirection === 'y'
              ? 'vertical columns along Y'
              : 'horizontal rows along X'
          }}.
          Layer boundaries, holes, and disconnected geometry split each scan
          into independently compensated laser segments.
        </q-banner>
      </q-item-section>
    </q-item>

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
            v-model.number="prusaSettings.layerHeight"
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
            v-model.number="prusaSettings.layerSpeed"
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

    <q-expansion-item
      v-if="!isEngravingMode"
      label="Contour/Wall Settings"
      icon="border_style"
    >
      <q-card bordered>
        <q-card-section v-if="!isEngravingMode" class="q-gutter-y-sm">
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
            v-model.number="prusaSettings.contourSpeed"
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
            v-model.number="prusaSettings.contourPower"
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
        <q-card-section v-if="!isEngravingMode" class="q-gutter-y-sm">
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
            v-model.number="prusaSettings.contourLineCount"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="1"
            max="25"
            :rules="[ (val: number) => val && 1 <= val && val <= 25
            || 'Contour line count should be between 1 and 25']"
          />
          <q-toggle
            v-model="prusaSettings.autoContourLineCountEnabled"
            :color="colorTheme"
            label="Auto body contour shell fill"
          />
          <q-banner
            v-if="prusaSettings.autoContourLineCountEnabled"
            dense
            rounded
            class="bg-blue-grey-1 text-blue-grey-9 text-caption"
          >
            Minimum body contour width per side:
            {{ calculatedVectorWallWidth.toFixed(3) }} mm. With inner and
            outer contours this covers about
            {{ (calculatedVectorWallWidth * 2).toFixed(3) }} mm of shell.
            Auto mode rounds each sliced shell up to the next contour-line
            count that covers it and writes the selected width into G-code
            comments.
          </q-banner>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item label="Infill Settings" icon="texture">
      <q-card bordered>
        <q-card-section v-if="!isEngravingMode" class="q-gutter-y-sm">
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
                    .PRUSA_INFILL_TYPE
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-select
            v-model="prusaSettings.infillType"
            :options="Object.values(Constants.PRUSA_INFILL_TYPES)"
            outlined
            :color="colorTheme"
            dense
            emit-value
            map-options
          />
          <div class="text-caption text-grey-7">
            Normal vector infill pattern used outside roof-only and engraved
            zones.
          </div>
        </q-card-section>

        <q-separator />


        <q-card-section v-if="hasAnyEngravingLayers">
          <q-toggle
            v-model="prusaSettings.fillEnclosedHollows"
            label="Engraved interior grid fill"
            class="full-width justify-between"
            left-label
            :color="colorTheme"
          >
            <q-tooltip
              anchor="center right"
              self="center left"
              :offset="[10, 10]"
            >
              On engraved layers, the slicer rasters only the perimeter shell.
              Enable this to fill the remaining interior core with the
              configured grid, including ordinary solid/open contour interiors.
            </q-tooltip>
          </q-toggle>
          <q-banner
            v-if="prusaSettings.fillEnclosedHollows"
            dense
            rounded
            class="q-mt-sm bg-blue-1 text-blue-10"
          >
            Engraved layers will use a rastered contour shell and a grid-filled
            interior core. Vector layers retain their normal infill behavior.
          </q-banner>
        </q-card-section>

        <q-card-section v-if="!isEngravingMode" class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Normal Hatch Angle:</span>
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
            v-model.number="prusaSettings.infillAngle"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            suffix="deg"
            :rules="[ (val: number) => 0 <= val && val <= 360
            || 'Infill angle should be between 0 and 360 degrees']"
          />
          <div class="text-caption text-grey-7">
            Direction of the normal infill hatch lines before any layer
            rotation is applied.
          </div>
        </q-card-section>

        <q-card-section v-if="!isEngravingMode" class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Normal Hatch Rotation per Layer:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PRUSA_HATCH_ROTATION_PER_LAYER
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="prusaSettings.hatchRotationPerLayer"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            suffix="deg"
            :rules="[ (val: number) => 0 <= val && val <= 360
            || 'Hatch rotation should be between 0 and 360 degrees']"
          />
          <div class="text-caption text-grey-7">
            Adds this angle to each new layer. Use 0 deg if every layer should
            use the same hatch direction.
          </div>
        </q-card-section>

        <q-card-section v-if="!isEngravingMode" class="q-gutter-y-sm">
          <q-toggle
            v-model="prusaSettings.hatchRotationGroupingEnabled"
            label="Group Hatch Directions"
            class="full-width justify-between"
            left-label
            :color="colorTheme"
          >
            <q-tooltip>
              Keeps the same hatch angle for multiple layers before applying
              the configured rotation step.
            </q-tooltip>
          </q-toggle>
          <q-select
            v-if="prusaSettings.hatchRotationGroupingEnabled"
            v-model.number="prusaSettings.hatchRotationGroupLayers"
            :options="[1, 2, 3, 4, 5, 6, 8, 10]"
            label="Layers per Direction"
            outlined
            :color="colorTheme"
            dense
            emit-value
            map-options
          />
        </q-card-section>

        <q-card-section v-if="!isEngravingMode" class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Lines per Hatch Bundle:</span>
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
            v-model.number="prusaSettings.infillLineCount"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="1"
            max="10"
            :rules="[ (val: number) => val && 1 <= val && val <= 10
            || 'Infill line count should be between 1 and 10']"
          />
          <div class="text-caption text-grey-7">
            Number of parallel laser lines in each normal hatch bundle.
            Approx. bundle width:
            {{ bundleWidth(prusaSettings.infillLineCount).toFixed(3) }} mm.
          </div>
        </q-card-section>

        <q-card-section v-if="hasAnyEngravingLayers" class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">
              Measured Single-Track Width:
            </span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip>
                Physical width of one lasered line. Measure
                this from a representative coupon made with the intended
                power, speed, focus, powder, and layer settings.
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="prusaSettings.nominalVectorTrackWidth"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0.01"
            max="2"
            step="0.01"
            suffix="mm"
            :rules="[ (val: number) => val && 0.01 <= val && val <= 2
            || 'Vector track width should be between 0.01 and 2 mm']"
          />

          <div class="row items-center justify-between">
            <span class="text-bold text-caption">
              Line Center Spacing:
            </span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip>
                Center-to-center distance between adjacent contour bundle
                lines. The visible bundle width is calculated from this value,
                the measured single-track width, and the contour line count.
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="prusaSettings.lineBundleSpacing"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0.01"
            max="5"
            step="0.01"
            suffix="mm"
            :rules="[ (val: number) => val && 0.01 <= val && val <= 5
            || 'Line center spacing should be between 0.01 and 5 mm']"
          />

          <div class="row items-center justify-between">
            <span class="text-caption">Calculated Contour Bundle Width:</span>
            <strong>{{ calculatedVectorWallWidth.toFixed(3) }} mm</strong>
          </div>
          <div class="text-caption text-grey-7">
            ({{ prusaSettings.contourLineCount }} - 1) x
            {{ normalizedLineBundleSpacing.toFixed(3) }} mm +
            {{ normalizedVectorTrackWidth.toFixed(3) }} mm measured track width
          </div>

          <q-toggle
            v-model="prusaSettings.matchEngravedShellToVectorWall"
            :color="colorTheme"
            label="Use calculated bundle width for engraved shell"
          />

          <div class="row items-center justify-between">
            <span class="text-bold text-caption">
              Engraved Contour Shell Width:
            </span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip>
                Width rastered inward from every outer and inner contour
                boundary. Material farther inside becomes the optional
                grid-filled core.
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-if="!prusaSettings.matchEngravedShellToVectorWall"
            v-model.number="prusaSettings.engravingContourThickness"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0.1"
            max="10"
            step="0.1"
            suffix="mm"
            :rules="[ (val: number) => val && 0.1 <= val && val <= 10
            || 'Contour shell width should be between 0.1 and 10 mm']"
          />
          <q-banner
            v-if="prusaSettings.matchEngravedShellToVectorWall"
            dense
            rounded
            class="bg-blue-grey-1 text-blue-grey-9 text-caption"
          >
            Effective engraved shell: {{ calculatedVectorWallWidth.toFixed(3) }}
            mm. Infill/preview track width follows the measured single-track
            width, so there is no separate nominal hatch-width field here.
          </q-banner>
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Contour/Infill Overlap:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PRUSA_CONTOUR_INFILL_OVERLAP
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="prusaSettings.contourInfillOverlap"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="-100"
            max="100"
            suffix="%"
            :rules="[ (val: number) => -100 <= val && val <= 100
            || 'Overlap should be between -100 and 100% of line spacing']"
          />
          <div class="text-caption text-grey-7">
            Controls how far normal infill hatch lines reach into the nearest
            contour shell. Positive values overlap; negative values leave a
            gap.
          </div>
        </q-card-section>

        <q-card-section v-if="hasAnyEngravingLayers" class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">
              Remaining Engraving Hatch Spacing:
            </span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                Vertical distance between horizontal engraving rows. A smaller
                value creates more scanlines; a larger value creates fewer.
                Each row is clipped into separate laser-on segments by the
                actual layer geometry.
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="prusaSettings.scanlineSpacing"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0.01"
            suffix="mm"
            step="0.05"
            :rules="[ (val: number) => val && 0.01 <= val
            || 'Scanline spacing should be at least 0.01 mm']"
          />
          <div class="text-caption text-grey-7">
            Lower spacing increases the number of engraving lines.
          </div>
        </q-card-section>

        <q-card-section v-if="!isEngravingMode" class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Normal Hatch Bundle Spacing:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PRUSA_INFILL_HATCH_SPACING
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="prusaSettings.infillHatchSpacing"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0.2"
            suffix="mm"
            step="0.1"
            :rules="[ (val: number) => val && 0.2 <= val
            || 'Hatch spacing should be at least 0.2 mm']"
          />
          <div class="text-caption text-grey-7">
            Distance between repeated normal infill hatch bundles. This is not
            the width of one laser line.
          </div>
        </q-card-section>

        <q-card-section v-if="!isEngravingMode" class="q-gutter-y-sm">
          <q-toggle
            v-model="prusaSettings.surfaceSkinEnabled"
            :color="colorTheme"
            label="Roof/deck hatch skin"
          />
          <q-banner
            v-if="prusaSettings.surfaceSkinEnabled"
            dense
            rounded
            class="bg-green-1 text-green-10 text-caption"
          >
            Roof skin means dense hatch lines on exposed top surfaces. In the
            roof area the roof hatch replaces normal infill; other areas of
            the same layer keep normal infill.
          </q-banner>
          <q-toggle
            v-model="prusaSettings.surfaceSkinEngravingEnabled"
            :color="colorTheme"
            label="Raster flat roof hatch"
            :disable="!prusaSettings.surfaceSkinEnabled"
          />
          <q-toggle
            v-model="prusaSettings.surfaceSkinAlternateLines"
            :color="colorTheme"
            label="Alternate roof skin paths"
            :disable="!prusaSettings.surfaceSkinEnabled"
          />
          <q-btn-toggle
            v-if="prusaSettings.surfaceSkinAlternateLines"
            v-model="prusaSettings.surfaceSkinAlternateMode"
            :options="[
              { label: 'Two Passes', value: 'two-pass' },
              { label: 'Edge Interleave', value: 'edge-interleave' }
            ]"
            color="primary"
            text-color="white"
            toggle-color="orange"
            class="full-width"
            :disable="!prusaSettings.surfaceSkinEnabled"
          />
          <q-toggle
            v-model="prusaSettings.roofHollowInfillEnabled"
            :color="colorTheme"
            label="Fill roofed internal hollows"
            :disable="!prusaSettings.surfaceSkinEnabled"
          />
          <q-input
            v-if="prusaSettings.roofHollowInfillEnabled"
            v-model.number="prusaSettings.roofHollowInfillOverlap"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="-100"
            max="100"
            step="1"
            suffix="%"
            label="Hollow infill overlap"
            :disable="!prusaSettings.surfaceSkinEnabled"
            :rules="[ (val: number) => -100 <= val && val <= 100
            || 'Overlap should be between -100% and 100%']"
          />
          <q-toggle
            v-model="prusaSettings.variableGridInfillEnabled"
            :color="colorTheme"
            label="Variable grid support before roof"
            :disable="!prusaSettings.surfaceSkinEnabled"
          />
          <template v-if="prusaSettings.variableGridInfillEnabled">
            <q-banner dense rounded class="bg-blue-1 text-blue-10 text-caption">
              Variable grid uses different hatch/grid settings only in the
              layers directly below a roof. The closest band to the roof is
              printed last before the roof.
            </q-banner>
            <q-option-group
              v-model="prusaSettings.variableGridTarget"
              :options="[
                {
                  label: 'Hollow only',
                  value: 'hollow',
                  disable: !prusaSettings.roofHollowInfillEnabled,
                },
                {
                  label: prusaSettings.roofHollowInfillEnabled
                    ? 'Main + hollow'
                    : 'Main only',
                  value: 'both',
                },
              ]"
              :color="colorTheme"
              type="radio"
              inline
              dense
              :disable="!prusaSettings.surfaceSkinEnabled"
            />
            <q-input
              v-model.number="prusaSettings.variableGridInfillLayersBeforeRoof"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              step="1"
              label="Closest band layers before roof"
              :disable="!prusaSettings.surfaceSkinEnabled"
              :rules="[ (val: number) => Number.isInteger(Number(val)) && 1 <= val
              || 'Use at least 1 layer']"
            />
            <q-input
              v-model.number="prusaSettings.variableGridHatchRotationPerLayer"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="-180"
              max="180"
              step="1"
              suffix="deg/layer"
              label="Variable grid hatch rotation per layer"
              :disable="!prusaSettings.surfaceSkinEnabled"
              :rules="[ (val: number) => -180 <= val && val <= 180
              || 'Rotation should be between -180 and 180 degrees per layer']"
            />
            <div class="row q-col-gutter-sm">
              <q-input
                v-model.number="prusaSettings.variableGridSpacing"
                class="col"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0.2"
                suffix="mm"
                step="0.1"
                label="Vector grid pitch"
                :disable="!prusaSettings.surfaceSkinEnabled"
                :rules="[ (val: number) => val && 0.2 <= val
                || 'Grid spacing should be at least 0.2 mm']"
              />
              <q-input
                v-model.number="prusaSettings.variableGridHatchSpacing"
                class="col"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0.2"
                suffix="mm"
                step="0.1"
                label="Vector hatch spacing"
                :disable="!prusaSettings.surfaceSkinEnabled"
                :rules="[ (val: number) => val && 0.2 <= val
                || 'Hatch spacing should be at least 0.2 mm']"
              />
            </div>
            <div class="row q-col-gutter-sm">
              <q-input
                v-model.number="prusaSettings.variableGridClearance"
                class="col"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0"
                suffix="mm"
                step="0.01"
                label="Grid crossing gap"
                :disable="!prusaSettings.surfaceSkinEnabled"
                :rules="[ (val: number) => 0 <= val
                || 'Clearance cannot be negative']"
              />
              <q-input
                v-model.number="prusaSettings.variableGridLineCount"
                class="col"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="1"
                step="1"
                label="Lines per grid member"
                :disable="!prusaSettings.surfaceSkinEnabled"
                :rules="[ (val: number) => Number.isInteger(Number(val)) && 1 <= val
                || 'Use at least 1 line']"
              />
            </div>
            <div
              v-if="hasAnyEngravingLayers || prusaSettings.roofHollowInfillEnabled"
              class="row q-col-gutter-sm"
            >
              <q-input
                v-model.number="prusaSettings.variableEngravingGridSpacing"
                class="col"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0.2"
                suffix="mm"
                step="0.1"
                label="Engraved/hollow grid pitch"
                :disable="!prusaSettings.surfaceSkinEnabled"
                :rules="[ (val: number) => val && 0.2 <= val
                || 'Grid spacing should be at least 0.2 mm']"
              />
              <q-input
                :model-value="variableGridMemberWidth.toFixed(3)"
                class="col"
                outlined
                :color="colorTheme"
                dense
                suffix="mm"
                label="Engraved grid member width"
                readonly
              />
            </div>
            <div class="text-caption text-grey-7">
              Vector grid pitch spaces the large grid members. Vector hatch
              spacing spaces repeated hatch bundles inside that band. Lines per
              grid member controls how many parallel laser lines make one
              member. Engraved grid member width is calculated from the same
              line count, line center spacing, and measured track width.
            </div>
            <q-toggle
              v-model="prusaSettings.multiVariableGridEnabled"
              :color="colorTheme"
              label="Add second variable grid band"
              :disable="!prusaSettings.surfaceSkinEnabled"
            />
            <template v-if="prusaSettings.multiVariableGridEnabled">
              <q-banner dense rounded class="bg-blue-grey-1 text-blue-grey-9 text-caption">
                Band 2 is farther below the roof than the closest band. Use it
                for a coarser or stronger transition before the final roof
                support band.
              </q-banner>
              <q-input
                v-model.number="prusaSettings.secondaryVariableGridLayersBeforeRoof"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="1"
                step="1"
                label="Band 2 layers before roof"
                :disable="!prusaSettings.surfaceSkinEnabled"
                :rules="[ (val: number) => Number.isInteger(Number(val)) && 1 <= val
                || 'Use at least 1 layer']"
              />
              <div class="row q-col-gutter-sm">
                <q-input
                  v-model.number="prusaSettings.secondaryVariableGridSpacing"
                  class="col"
                  type="number"
                  outlined
                  :color="colorTheme"
                  dense
                  min="0.2"
                  suffix="mm"
                  step="0.1"
                  label="Band 2 vector grid pitch"
                  :disable="!prusaSettings.surfaceSkinEnabled"
                  :rules="[ (val: number) => val && 0.2 <= val
                  || 'Grid spacing should be at least 0.2 mm']"
                />
                <q-input
                  v-model.number="prusaSettings.secondaryVariableGridHatchSpacing"
                  class="col"
                  type="number"
                  outlined
                  :color="colorTheme"
                  dense
                  min="0.2"
                  suffix="mm"
                  step="0.1"
                  label="Band 2 vector hatch spacing"
                  :disable="!prusaSettings.surfaceSkinEnabled"
                  :rules="[ (val: number) => val && 0.2 <= val
                  || 'Hatch spacing should be at least 0.2 mm']"
                />
              </div>
              <div class="row q-col-gutter-sm">
                <q-input
                  v-model.number="prusaSettings.secondaryVariableGridClearance"
                  class="col"
                  type="number"
                  outlined
                  :color="colorTheme"
                  dense
                  min="0"
                  suffix="mm"
                  step="0.01"
                  label="Band 2 grid crossing gap"
                  :disable="!prusaSettings.surfaceSkinEnabled"
                  :rules="[ (val: number) => 0 <= val
                  || 'Clearance cannot be negative']"
                />
                <q-input
                  v-model.number="prusaSettings.secondaryVariableGridLineCount"
                  class="col"
                  type="number"
                  outlined
                  :color="colorTheme"
                  dense
                  min="1"
                  step="1"
                  label="Band 2 lines per grid member"
                  :disable="!prusaSettings.surfaceSkinEnabled"
                  :rules="[ (val: number) => Number.isInteger(Number(val)) && 1 <= val
                  || 'Use at least 1 line']"
                />
              </div>
              <div
                v-if="hasAnyEngravingLayers || prusaSettings.roofHollowInfillEnabled"
                class="row q-col-gutter-sm"
              >
                <q-input
                  v-model.number="prusaSettings.secondaryVariableEngravingGridSpacing"
                  class="col"
                  type="number"
                  outlined
                  :color="colorTheme"
                  dense
                  min="0.2"
                  suffix="mm"
                  step="0.1"
                  label="Band 2 engraved/hollow grid pitch"
                  :disable="!prusaSettings.surfaceSkinEnabled"
                  :rules="[ (val: number) => val && 0.2 <= val
                  || 'Grid spacing should be at least 0.2 mm']"
                />
                <q-input
                  :model-value="secondaryVariableGridMemberWidth.toFixed(3)"
                  class="col"
                  outlined
                  :color="colorTheme"
                  dense
                  suffix="mm"
                  label="Band 2 engraved grid member width"
                  readonly
                />
              </div>
              <q-toggle
                v-model="prusaSettings.tertiaryVariableGridEnabled"
                :color="colorTheme"
                label="Add third variable grid band"
                :disable="!prusaSettings.surfaceSkinEnabled"
              />
              <template v-if="prusaSettings.tertiaryVariableGridEnabled">
                <q-banner dense rounded class="bg-blue-grey-1 text-blue-grey-9 text-caption">
                  Band 3 is the farthest variable grid band below the roof.
                </q-banner>
                <q-input
                  v-model.number="prusaSettings.tertiaryVariableGridLayersBeforeRoof"
                  type="number"
                  outlined
                  :color="colorTheme"
                  dense
                  min="1"
                  step="1"
                  label="Band 3 layers before roof"
                  :disable="!prusaSettings.surfaceSkinEnabled"
                  :rules="[ (val: number) => Number.isInteger(Number(val)) && 1 <= val
                  || 'Use at least 1 layer']"
                />
                <div class="row q-col-gutter-sm">
                  <q-input
                    v-model.number="prusaSettings.tertiaryVariableGridSpacing"
                    class="col"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0.2"
                    suffix="mm"
                    step="0.1"
                    label="Band 3 vector grid pitch"
                    :disable="!prusaSettings.surfaceSkinEnabled"
                    :rules="[ (val: number) => val && 0.2 <= val
                    || 'Grid spacing should be at least 0.2 mm']"
                  />
                  <q-input
                    v-model.number="prusaSettings.tertiaryVariableGridHatchSpacing"
                    class="col"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0.2"
                    suffix="mm"
                    step="0.1"
                    label="Band 3 vector hatch spacing"
                    :disable="!prusaSettings.surfaceSkinEnabled"
                    :rules="[ (val: number) => val && 0.2 <= val
                    || 'Hatch spacing should be at least 0.2 mm']"
                  />
                </div>
                <div class="row q-col-gutter-sm">
                  <q-input
                    v-model.number="prusaSettings.tertiaryVariableGridClearance"
                    class="col"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    suffix="mm"
                    step="0.01"
                    label="Band 3 grid crossing gap"
                    :disable="!prusaSettings.surfaceSkinEnabled"
                    :rules="[ (val: number) => 0 <= val
                    || 'Clearance cannot be negative']"
                  />
                  <q-input
                    v-model.number="prusaSettings.tertiaryVariableGridLineCount"
                    class="col"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="1"
                    step="1"
                    label="Band 3 lines per grid member"
                    :disable="!prusaSettings.surfaceSkinEnabled"
                    :rules="[ (val: number) => Number.isInteger(Number(val)) && 1 <= val
                    || 'Use at least 1 line']"
                  />
                </div>
                <div
                  v-if="hasAnyEngravingLayers || prusaSettings.roofHollowInfillEnabled"
                  class="row q-col-gutter-sm"
                >
                  <q-input
                    v-model.number="prusaSettings.tertiaryVariableEngravingGridSpacing"
                    class="col"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0.2"
                    suffix="mm"
                    step="0.1"
                    label="Band 3 engraved/hollow grid pitch"
                    :disable="!prusaSettings.surfaceSkinEnabled"
                    :rules="[ (val: number) => val && 0.2 <= val
                    || 'Grid spacing should be at least 0.2 mm']"
                  />
                  <q-input
                    :model-value="tertiaryVariableGridMemberWidth.toFixed(3)"
                    class="col"
                    outlined
                    :color="colorTheme"
                    dense
                    suffix="mm"
                    label="Band 3 engraved grid member width"
                    readonly
                  />
                </div>
              </template>
            </template>
            <q-banner dense rounded class="bg-orange-1 text-orange-10">
              The first variable band is closest to the roof. The optional
              farther bands apply before that, so the stack can be 5x5,
              then 4x4, then 3x3 before roof.
            </q-banner>
          </template>
          <div class="text-bold text-caption q-mt-sm">Flat Roof Hatch</div>
          <q-btn-toggle
            v-model="prusaSettings.flatSurfaceSkinRasterDirection"
            :options="[
              { label: 'X', value: 'x' },
              { label: 'Y', value: 'y' },
              { label: '45 deg', value: 'diagonal' }
            ]"
            color="primary"
            text-color="white"
            toggle-color="orange"
            class="full-width"
            :disable="!prusaSettings.surfaceSkinEnabled"
          />
          <q-toggle
            v-model="prusaSettings.flatSurfaceSkinCrossHatch"
            :color="colorTheme"
            label="Cross-hatch flat roof layers"
            :disable="!prusaSettings.surfaceSkinEnabled || prusaSettings.flatSurfaceSkinPattern !== 'hatch'"
          />
          <q-btn-toggle
            v-model="prusaSettings.flatSurfaceSkinPattern"
            :options="[
              { label: 'Hatch', value: 'hatch' },
              { label: 'Spiral', value: 'spiral' }
            ]"
            color="primary"
            text-color="white"
            toggle-color="orange"
            class="full-width"
            :disable="!prusaSettings.surfaceSkinEnabled"
          />
          <q-btn-toggle
            v-if="prusaSettings.flatSurfaceSkinPattern === 'spiral'"
            v-model="prusaSettings.flatSurfaceSkinSpiralDirection"
            :options="[
              { label: 'Outside In', value: 'outside-in' },
              { label: 'Inside Out', value: 'inside-out' }
            ]"
            color="primary"
            text-color="white"
            toggle-color="orange"
            class="full-width"
            :disable="!prusaSettings.surfaceSkinEnabled"
          />
          <q-btn-toggle
            v-if="prusaSettings.flatSurfaceSkinPattern === 'hatch'"
            v-model="prusaSettings.flatSurfaceSkinBoundaryMode"
            :options="[
              { label: 'Engrave Shell', value: 'engrave' },
              { label: 'Vector Shell', value: 'vector' },
              { label: 'Contour Shell', value: 'contour' },
              { label: 'No Shell', value: 'none' }
            ]"
            color="primary"
            text-color="white"
            toggle-color="orange"
            class="full-width"
            :disable="!prusaSettings.surfaceSkinEnabled"
          />
          <div
            v-if="
              prusaSettings.flatSurfaceSkinPattern === 'hatch' &&
              prusaSettings.flatSurfaceSkinBoundaryMode !== 'none'
            "
            class="row q-col-gutter-sm"
          >
            <q-input
              v-model.number="prusaSettings.flatSurfaceSkinContourLineCount"
              class="col"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              step="1"
              label="Roof contour lines"
              :disable="!prusaSettings.surfaceSkinEnabled"
              :rules="[ (val: number) => Number.isInteger(Number(val)) && 1 <= val
              || 'Use at least 1 contour line']"
            />
            <q-input
              v-model.number="prusaSettings.flatSurfaceSkinContourOverlap"
              class="col"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="-100"
              max="100"
              step="1"
              suffix="%"
              label="Roof contour overlap"
              :disable="!prusaSettings.surfaceSkinEnabled"
              :rules="[ (val: number) => -100 <= val && val <= 100
              || 'Overlap should be between -100% and 100%']"
            />
          </div>
          <div class="row q-col-gutter-sm">
            <q-input
              v-model.number="prusaSettings.flatSurfaceSkinLayers"
              class="col"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              step="1"
              label="Flat layers"
              :disable="!prusaSettings.surfaceSkinEnabled"
              :rules="[ (val: number) => Number.isInteger(Number(val)) && 1 <= val
              || 'Use at least 1 skin layer']"
            />
            <q-input
              v-model.number="prusaSettings.flatSurfaceSkinHatchOverlap"
              class="col"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="-100"
              max="95"
              suffix="%"
              step="1"
              label="Roof line overlap"
              :disable="!prusaSettings.surfaceSkinEnabled"
              :rules="[ (val: number) => -100 <= val && val <= 95
              || 'Overlap should be between -100% and 95%']"
            />
          </div>
          <q-banner
            v-if="prusaSettings.surfaceSkinEnabled"
            dense
            rounded
            class="bg-blue-grey-1 text-blue-grey-9 text-caption"
          >
            Effective flat roof line spacing:
            {{ flatRoofEffectiveHatchSpacing.toFixed(3) }} mm.
            0% means adjacent tracks using the nominal track width;
            positive values overlap, negative values leave a gap.
          </q-banner>
          <div class="row q-col-gutter-sm">
            <q-input
              v-model.number="prusaSettings.flatSurfaceSkinSpeed"
              class="col"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              suffix="mm/min"
              step="100"
              label="Flat roof hatch feedrate"
              :disable="!prusaSettings.surfaceSkinEnabled"
              :rules="[ (val: number) => val && 0 < val
              || 'Skin feed rate must be above 0 mm/min']"
            />
            <q-input
              v-model.number="prusaSettings.flatSurfaceSkinPower"
              class="col"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              max="100"
              suffix="%"
              label="Flat roof hatch power"
              :disable="!prusaSettings.surfaceSkinEnabled"
              :rules="[ (val: number) => 0 <= val && val <= 100
              || 'Skin power should be between 0 and 100']"
            />
          </div>
          <q-toggle
            v-model="prusaSettings.flatSurfaceSkinSecondPassEnabled"
            :color="colorTheme"
            label="Flat roof second pass"
            :disable="!prusaSettings.surfaceSkinEnabled"
          />
          <template v-if="prusaSettings.flatSurfaceSkinSecondPassEnabled">
            <q-btn-toggle
              v-model="prusaSettings.flatSurfaceSkinSecondPassRasterDirection"
              :options="[
                { label: 'Pass 2 X', value: 'x' },
                { label: 'Pass 2 Y', value: 'y' },
                { label: 'Pass 2 45 deg', value: 'diagonal' }
              ]"
              color="primary"
              text-color="white"
              toggle-color="orange"
              class="full-width"
              :disable="!prusaSettings.surfaceSkinEnabled"
            />
            <q-toggle
              v-model="prusaSettings.flatSurfaceSkinSecondPassCrossHatch"
              :color="colorTheme"
              label="Cross-hatch flat roof second pass"
              :disable="!prusaSettings.surfaceSkinEnabled || prusaSettings.flatSurfaceSkinPattern !== 'hatch'"
            />
            <q-btn-toggle
              v-if="prusaSettings.flatSurfaceSkinPattern === 'hatch'"
              v-model="prusaSettings.flatSurfaceSkinSecondPassBoundaryMode"
              :options="[
                { label: 'Pass 2 Engrave Shell', value: 'engrave' },
                { label: 'Pass 2 Vector Shell', value: 'vector' },
                { label: 'Pass 2 Contour Shell', value: 'contour' },
                { label: 'Pass 2 No Shell', value: 'none' }
              ]"
              color="primary"
              text-color="white"
              toggle-color="orange"
              class="full-width"
              :disable="!prusaSettings.surfaceSkinEnabled"
            />
            <div
              v-if="
                prusaSettings.flatSurfaceSkinPattern === 'hatch' &&
                prusaSettings.flatSurfaceSkinSecondPassBoundaryMode !== 'none'
              "
              class="row q-col-gutter-sm"
            >
              <q-input
                v-model.number="prusaSettings.flatSurfaceSkinSecondPassContourLineCount"
                class="col"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="1"
                step="1"
                label="Pass 2 contour lines"
                :disable="!prusaSettings.surfaceSkinEnabled"
                :rules="[ (val: number) => Number.isInteger(Number(val)) && 1 <= val
                || 'Use at least 1 contour line']"
              />
              <q-input
                v-model.number="prusaSettings.flatSurfaceSkinSecondPassContourOverlap"
                class="col"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="-100"
                max="100"
                step="1"
                suffix="%"
                label="Pass 2 contour overlap"
                :disable="!prusaSettings.surfaceSkinEnabled"
                :rules="[ (val: number) => -100 <= val && val <= 100
                || 'Overlap should be between -100% and 100%']"
              />
            </div>
            <div class="row q-col-gutter-sm">
              <q-input
                v-model.number="prusaSettings.flatSurfaceSkinSecondPassHatchOverlap"
                class="col"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="-100"
                max="95"
                suffix="%"
                step="1"
                label="Pass 2 line overlap"
                :disable="!prusaSettings.surfaceSkinEnabled"
                :rules="[ (val: number) => -100 <= val && val <= 95
                || 'Overlap should be between -100% and 95%']"
              />
              <q-input
                v-model.number="prusaSettings.flatSurfaceSkinSecondPassSpeed"
                class="col"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="1"
                suffix="mm/min"
                step="100"
                label="Pass 2 feed rate"
                :disable="!prusaSettings.surfaceSkinEnabled"
                :rules="[ (val: number) => val && 0 < val
                || 'Skin feed rate must be above 0 mm/min']"
              />
            </div>
            <q-input
              v-model.number="prusaSettings.flatSurfaceSkinSecondPassPower"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              max="100"
              suffix="%"
              label="Pass 2 power"
              :disable="!prusaSettings.surfaceSkinEnabled"
              :rules="[ (val: number) => 0 <= val && val <= 100
              || 'Skin power should be between 0 and 100']"
            />
            <q-banner dense rounded class="bg-blue-grey-1 text-blue-grey-9 text-caption">
              Effective pass 2 line spacing:
              {{ flatRoofSecondPassEffectiveHatchSpacing.toFixed(3) }} mm.
            </q-banner>
          </template>

          <div class="text-bold text-caption q-mt-sm">Slanted Roof Hatch</div>
          <q-toggle
            v-model="prusaSettings.slantedSurfaceSkinEnabled"
            :color="colorTheme"
            label="Enable slanted roof hatch"
            :disable="!prusaSettings.surfaceSkinEnabled"
          />
          <q-btn-toggle
            v-model="prusaSettings.slantedSurfaceSkinRasterDirection"
            :options="[
              { label: 'X', value: 'x' },
              { label: 'Y', value: 'y' },
              { label: '45 deg', value: 'diagonal' }
            ]"
            color="primary"
            text-color="white"
            toggle-color="orange"
            class="full-width"
            :disable="!prusaSettings.surfaceSkinEnabled || !prusaSettings.slantedSurfaceSkinEnabled"
          />
          <q-toggle
            v-model="prusaSettings.slantedSurfaceSkinCrossHatch"
            :color="colorTheme"
            label="Cross-hatch slanted roof layers"
            :disable="!prusaSettings.surfaceSkinEnabled || !prusaSettings.slantedSurfaceSkinEnabled"
          />
          <div class="row q-col-gutter-sm">
            <q-input
              v-model.number="prusaSettings.slantedSurfaceSkinLayers"
              class="col"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              step="1"
              label="Slanted layers"
              :disable="!prusaSettings.surfaceSkinEnabled || !prusaSettings.slantedSurfaceSkinEnabled"
              :rules="[ (val: number) => Number.isInteger(Number(val)) && 1 <= val
              || 'Use at least 1 skin layer']"
            />
            <q-input
              v-model.number="prusaSettings.slantedSurfaceSkinHatchSpacing"
              class="col"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0.01"
              suffix="mm"
              step="0.05"
              label="Slanted hatch line spacing"
              :disable="!prusaSettings.surfaceSkinEnabled || !prusaSettings.slantedSurfaceSkinEnabled"
              :rules="[ (val: number) => val && 0.01 <= val
              || 'Skin hatch spacing should be at least 0.01 mm']"
            />
            <div class="text-caption text-grey-7">
              Distance between hatch lines on slanted roof/deck skin. This
              remains an explicit spacing because slanted skin is built
              layer-by-layer.
            </div>
          </div>
          <div class="row q-col-gutter-sm">
            <q-input
              v-model.number="prusaSettings.slantedSurfaceSkinSpeed"
              class="col"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="1"
              suffix="mm/min"
              step="100"
              label="Slanted hatch feedrate"
              :disable="!prusaSettings.surfaceSkinEnabled || !prusaSettings.slantedSurfaceSkinEnabled"
              :rules="[ (val: number) => val && 0 < val
              || 'Skin feed rate must be above 0 mm/min']"
            />
            <q-input
              v-model.number="prusaSettings.slantedSurfaceSkinPower"
              class="col"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0"
              max="100"
              suffix="%"
              label="Slanted hatch power"
              :disable="!prusaSettings.surfaceSkinEnabled || !prusaSettings.slantedSurfaceSkinEnabled"
              :rules="[ (val: number) => 0 <= val && val <= 100
              || 'Skin power should be between 0 and 100']"
            />
          </div>
        </q-card-section>

        <q-card-section
          v-if="
            !isEngravingMode &&
            (prusaSettings.infillType === Constants.PRUSA_INFILL_TYPES.GRID ||
              prusaSettings.hatchRotationGroupingEnabled)
          "
          class="q-gutter-y-sm"
        >
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Normal Grid Pitch:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PRUSA_GRID_SPACING
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="prusaSettings.gridSpacing"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0.2"
            suffix="mm"
            step="0.1"
            :rules="[ (val: number) => val && 0.2 <= val
            || 'Grid spacing should be at least 0.2 mm']"
          />
          <div class="text-caption text-grey-7">
            Distance between the large crossing members of normal grid infill.
            This is separate from hatch bundle spacing.
          </div>
        </q-card-section>

        <q-card-section
          v-if="hasAnyEngravingLayers && prusaSettings.fillEnclosedHollows"
          class="q-gutter-y-sm"
        >
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Engraved Grid Pitch:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip>
                Grid spacing used only for engraved contour interior fill.
                Vector grid infill keeps using Grid Line Spacing.
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="prusaSettings.engravingGridSpacing"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0.2"
            suffix="mm"
            step="0.1"
            :rules="[ (val: number) => val && 0.2 <= val
            || 'Engraved grid spacing should be at least 0.2 mm']"
          />
          <div class="text-caption text-grey-7">
            Distance between grid members when an engraved layer fills its
            interior core with a rastered grid.
          </div>
        </q-card-section>

        <q-card-section
          v-if="
            (!isEngravingMode &&
              prusaSettings.infillType === Constants.PRUSA_INFILL_TYPES.GRID) ||
            (hasAnyEngravingLayers && prusaSettings.fillEnclosedHollows)
          "
          class="q-gutter-y-sm"
        >
          <q-toggle
            v-model="prusaSettings.useCustomGridClearance"
            label="Manual grid crossing gap"
            class="full-width justify-between"
            left-label
            :color="colorTheme"
            @update:model-value="handleCustomGridClearanceToggle"
          >
            <q-tooltip
              anchor="center right"
              self="center left"
              :offset="[10, 10]"
            >
              {{
                Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                  .PRUSA_GRID_CLEARANCE
              }}
            </q-tooltip>
          </q-toggle>
          <q-input
            v-if="prusaSettings.useCustomGridClearance"
            v-model.number="prusaSettings.gridClearance"
            label="Manual grid crossing gap"
            type="number"
            outlined
            :color="colorTheme"
            dense
            min="0"
            suffix="mm"
            step="0.01"
            :rules="[ (val: number) => 0 <= val
            || 'Grid clearance cannot be negative']"
          />
          <q-input
            v-else
            :model-value="
              hasAnyEngravingLayers
                ? prusaSettings.scanlineSpacing.toFixed(3)
                : (
                    Math.abs(prusaSettings.contourInfillOverlap) * 0.002
                  ).toFixed(3)
            "
            label="Automatic grid crossing gap"
            outlined
            :color="colorTheme"
            dense
            suffix="mm"
            readonly
          />
          <div v-if="hasAnyEngravingLayers" class="text-caption text-grey-7">
            The crossing gap avoids overburn where grid members cross. Automatic
            gap follows the engraving hatch spacing.
          </div>
        </q-card-section>

        <template
          v-if="hasAnyEngravingLayers && prusaSettings.fillEnclosedHollows"
        >
          <q-card-section class="q-gutter-y-sm">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Inherited Grid Angle:</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip>
                  Uses the same infill angle and hatch rotation as vector
                  bulk infill. The engraved shell still uses horizontal
                  material scanlines.
                </q-tooltip>
              </q-icon>
            </div>
            <q-input
              :model-value="engravedGridAngleLabel"
              outlined
              :color="colorTheme"
              dense
              suffix="deg"
              readonly
            />
          </q-card-section>

          <q-card-section class="q-gutter-y-sm">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Engraved Grid Member Width:</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip>
                  Finished width of each diagonal grid member. The slicer
                  converts this band into horizontal engraving strokes using
                  Vertical Scanline Spacing.
                </q-tooltip>
              </q-icon>
            </div>
            <q-input
              v-model.number="prusaSettings.engravingGridLineThickness"
              type="number"
              outlined
              :color="colorTheme"
              dense
              min="0.1"
              max="10"
              step="0.1"
              suffix="mm"
              :rules="[ (val: number) => val && 0.1 <= val && val <= 10
              || 'Grid line thickness should be between 0.1 and 10 mm']"
            />
            <div class="text-caption text-grey-7">
              Finished width of each rastered grid member inside engraved
              contour shells.
            </div>
          </q-card-section>

          <q-banner dense rounded class="q-ma-md bg-green-1 text-green-10">
            Grid bands are shown in green in the slice preview. Each band is
            engraved as automatically clipped horizontal strokes and uses the
            same per-zone power and feedrate as the ring.
          </q-banner>
        </template>

        <q-card-section>
          <q-toggle
            v-model="prusaSettings.optimizeScanOrder"
            label="Optimize Hatch Scan Order"
            class="full-width justify-between"
            left-label
            :color="colorTheme"
          >
            <q-tooltip
              anchor="center right"
              self="center left"
              :offset="[10, 10]"
            >
              {{
                Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                  .PRUSA_OPTIMIZE_SCAN_ORDER
              }}
            </q-tooltip>
          </q-toggle>
        </q-card-section>

        <q-card-section v-if="!isEngravingMode" class="q-gutter-y-sm">
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
                v-model.number="prusaSettings.infillImageSettings.x"
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
                v-model.number="prusaSettings.infillImageSettings.y"
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
            <span class="text-bold text-caption">
              {{ isEngravingMode ? 'Scanline Feedrate:' : 'Infill Speed:' }}
            </span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                <template v-if="isEngravingMode">
                  Feedrate used by every powered engraving dash in the bulk
                  layer zone.
                </template>
                <template v-else>
                  {{
                    Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES.INFILL_SPEED
                  }}
                </template>
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="prusaSettings.infillSpeed"
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
            <span class="text-bold text-caption">
              {{ isEngravingMode ? 'Scanline Power:' : 'Infill Power:' }}
            </span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip
                anchor="center right"
                self="center left"
                :offset="[10, 10]"
              >
                <template v-if="isEngravingMode">
                  Laser power used by every powered engraving dash in the bulk
                  layer zone.
                </template>
                <template v-else>
                  {{
                    Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES.INFILL_POWER
                  }}
                </template>
              </q-tooltip>
            </q-icon>
          </div>
          <q-input
            v-model.number="prusaSettings.infillPower"
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

        <q-card-section v-if="!isEngravingMode" class="q-gutter-y-sm">
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
            v-model.number="prusaSettings.infillImageSettings.noise"
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

        <q-card-section v-if="!isEngravingMode" class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <div class="q-gutter-x-sm">
              <span class="text-bold text-caption">Infill Image Size:</span>
              <q-toggle
                v-model="prusaSettings.infillImageSettings.isImageSizeSettings"
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
            v-if="prusaSettings.infillImageSettings.isImageSizeSettings"
          >
            <div class="row flex-center q-gutter-x-sm">
              <span>Width:</span>
              <q-input
                v-model.number="prusaSettings.infillImageSettings.width"
                type="number"
                outlined
                :color="colorTheme"
                dense
                suffix="mm per pixel"
                min="0"
                :rules="[ (val: number) => val && 0 < val && val < 1000 || `Image Size between 0 and 1000`]"
                :disable="
                  !prusaSettings.infillImageSettings.isImageSizeSettings
                "
              />
            </div>
            <div class="row flex-center q-gutter-x-sm">
              <span>Height:</span>
              <q-input
                v-model.number="prusaSettings.infillImageSettings.height"
                type="number"
                outlined
                :color="colorTheme"
                dense
                suffix="mm per pixel"
                min="0"
                :rules="[ (val: number) => val && 0 < val && val < 1000 || `Image Size between 0 and 1000`]"
                :disable="
                  !prusaSettings.infillImageSettings.isImageSizeSettings
                "
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item v-if="false" label="Hollowing Settings" icon="all_out">
      <q-card bordered>
        <q-card-section>
          <q-toggle
            v-model="prusaSettings.isHollowingEnabled"
            label="Hollowing"
            class="full-width justify-between"
            left-label
            :color="colorTheme"
          />
          <div v-if="prusaSettings.isHollowingEnabled">
            <q-card-section class="q-gutter-y-sm">
              <div class="row items-center justify-between">
                <span class="text-bold text-caption"
                  >Hollowing Wall Thickness:</span
                >
                <q-icon name="help" size="xs" color="blue-grey-9">
                  <q-tooltip
                    anchor="center right"
                    self="center left"
                    :offset="[10, 10]"
                  >
                    {{
                      Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                        .HOLLOWING_WALL_THICKNESS
                    }}
                  </q-tooltip>
                </q-icon>
              </div>
              <q-input
                v-model.number="prusaSettings.hollowingWallThickness"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0"
                max="10"
                suffix="mm"
                step="0.1"
                :rules="[ (val: number) => val && 0 <= val && val <= 10
            || 'Wall thickness should be between 0 and 10']"
              />
            </q-card-section>

            <q-card-section class="q-gutter-y-sm">
              <div class="row items-center justify-between">
                <span class="text-bold text-caption"
                  >Hollowing Closing Distance:</span
                >
                <q-icon name="help" size="xs" color="blue-grey-9">
                  <q-tooltip
                    anchor="center right"
                    self="center left"
                    :offset="[10, 10]"
                  >
                    {{
                      Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                        .HOLLOWING_CLOSING_DISTANCE
                    }}
                  </q-tooltip>
                </q-icon>
              </div>
              <q-input
                v-model.number="prusaSettings.hollowingClosingDistance"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0"
                max="10"
                suffix="mm"
                step="0.1"
                :rules="[ (val: number) => val && 0 <= val && val <= 10
            || 'Closing Distance should be between 0 and 10']"
              />
            </q-card-section>

            <q-card-section class="q-gutter-y-sm">
              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Hollowing Quality:</span>
                <q-icon name="help" size="xs" color="blue-grey-9">
                  <q-tooltip
                    anchor="center right"
                    self="center left"
                    :offset="[10, 10]"
                  >
                    {{
                      Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                        .HOLLOWING_QUALITY
                    }}
                  </q-tooltip>
                </q-icon>
              </div>
              <q-input
                v-model.number="prusaSettings.hollowingQuality"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0"
                max="1"
                step="0.1"
                :rules="[ (val: number) => val && 0 <= val && val <= 1
            || 'Quality should be between 0 and 1']"
              />
            </q-card-section>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item v-if="false" label="Support Settings" icon="foundation">
      <q-card bordered>
        <q-card-section>
          <q-toggle
            v-model="prusaSettings.isSupportEnabled"
            label="Support"
            class="full-width justify-between"
            left-label
            :color="colorTheme"
          />

          <div v-if="prusaSettings.isSupportEnabled">
            <q-card-section class="q-gutter-y-sm">
              <div class="row items-center justify-between">
                <div class="q-gutter-x-sm">
                  <span class="text-bold text-caption">Enforced Support:</span>
                  <q-checkbox
                    v-model="prusaSettings.isSupportEnforced"
                    :color="colorTheme"
                    @update:model-value="handleChangeIsSupportEnforced"
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
                        .SUPPORT_ENFORCED
                    }}
                  </q-tooltip>
                </q-icon>
              </div>
            </q-card-section>

            <q-expansion-item label="Support Head">
              <q-card bordered>
                <q-card-section class="q-gutter-y-sm">
                  <div class="row items-center justify-between">
                    <span class="text-bold text-caption">Pinhead Width:</span>
                    <q-icon name="help" size="xs" color="blue-grey-9">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]"
                      >
                        {{
                          Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                            .SUPPORT_PINHEAD_WIDTH
                        }}
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <q-input
                    v-model.number="prusaSettings.supportPinheadWidth"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    max="20"
                    suffix="mm"
                    step="0.1"
                    :rules="[ (val: number) => val && 0 <= val && val <= 20
              || 'Pinhead width should be between 0 and 20']"
                  />
                </q-card-section>

                <q-card-section class="q-gutter-y-sm">
                  <div class="row items-center justify-between">
                    <span class="text-bold text-caption"
                      >Pinhead front diameter:</span
                    >
                    <q-icon name="help" size="xs" color="blue-grey-9">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]"
                      >
                        {{
                          Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                            .SUPPORT_PINHEAD_FRONT_DIAMETER
                        }}
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <q-input
                    v-model.number="prusaSettings.supportPinheadFrontDiameter"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    :max="prusaSettings.supportPinheadWidth"
                    suffix="mm"
                    step="0.1"
                    :rules="[ (val: number) => val && 0 <= val && val <= prusaSettings.supportPinheadWidth
              || 'Pinhead front diameter should be between 0 and pinhead width value']"
                  />
                </q-card-section>

                <q-card-section class="q-gutter-y-sm">
                  <div class="row items-center justify-between">
                    <span class="text-bold text-caption"
                      >Pinhead Penetration:</span
                    >
                    <q-icon name="help" size="xs" color="blue-grey-9">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]"
                      >
                        {{
                          Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                            .SUPPORT_PINHEAD_PENETRATION
                        }}
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <q-input
                    v-model.number="prusaSettings.supportPinheadPenetration"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    :max="prusaSettings.supportPinheadWidth"
                    suffix="mm"
                    step="0.1"
                    :rules="[ (val: number) => val && 0 <= val && val <= prusaSettings.supportPinheadWidth
              || 'Pinhead front diameter should be between 0 and pinhead width value']"
                  />
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <q-expansion-item label="Support Pillar">
              <q-card bordered>
                <q-card-section class="q-gutter-y-sm">
                  <div class="row items-center justify-between">
                    <span class="text-bold text-caption">Pillar Diameter:</span>
                    <q-icon name="help" size="xs" color="blue-grey-9">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]"
                      >
                        {{
                          Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                            .SUPPORT_PILLAR_DIAMETER
                        }}
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <q-input
                    v-model.number="prusaSettings.supportPillarDiameter"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    max="15"
                    suffix="mm"
                    step="0.1"
                    :rules="[ (val: number) => val && 0 <= val && val <= 15
              || 'Pillar diameter should be between 0 and 15']"
                  />
                </q-card-section>

                <q-card-section>
                  <div class="row items-center justify-between">
                    <div class="q-gutter-x-sm">
                      <span class="text-bold text-caption"
                        >Support on Build Plate:</span
                      >
                      <q-checkbox
                        v-model="prusaSettings.isSupportOnBuildPlate"
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
                            .SUPPORT_ON_BUILD_PLATE
                        }}
                      </q-tooltip>
                    </q-icon>
                  </div>
                </q-card-section>

                <q-card-section class="q-gutter-y-sm">
                  <div class="row items-center justify-between">
                    <span class="text-bold text-caption"
                      >Support Base Diameter:</span
                    >
                    <q-icon name="help" size="xs" color="blue-grey-9">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]"
                      >
                        {{
                          Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                            .SUPPORT_BASE_DIAMETER
                        }}
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <q-input
                    v-model.number="prusaSettings.supportBaseDiameter"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    max="30"
                    suffix="mm"
                    step="0.1"
                    :rules="[ (val: number) => val && 0 <= val && val <= 30
              || 'Base diameter should be between 0 and 30']"
                  />
                </q-card-section>

                <q-card-section class="q-gutter-y-sm">
                  <div class="row items-center justify-between">
                    <span class="text-bold text-caption"
                      >Support Base Height:</span
                    >
                    <q-icon name="help" size="xs" color="blue-grey-9">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]"
                      >
                        {{
                          Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                            .SUPPORT_BASE_HEIGHT
                        }}
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <q-input
                    v-model.number="prusaSettings.supportBaseHeight"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    max="30"
                    suffix="mm"
                    step="0.1"
                    :rules="[ (val: number) => val && 0 <= val && val <= 30
              || 'Base height should be between 0 and 30']"
                  />
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <q-expansion-item label="Connections of the Support Sticks">
              <q-card bordered>
                <q-card-section class="q-gutter-y-sm">
                  <div class="row items-center justify-between">
                    <span class="text-bold text-caption"
                      >Max Bridge Length:</span
                    >
                    <q-icon name="help" size="xs" color="blue-grey-9">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]"
                      >
                        {{
                          Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                            .SUPPORT_MAX_BRIDGE_LENGTH
                        }}
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <q-input
                    v-model.number="prusaSettings.supportMaxBridgeLength"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    max="30"
                    suffix="mm"
                    :rules="[ (val: number) => val && 0 <= val && val <= 30
              || 'Max bridge length should be between 0 and 30']"
                  />
                </q-card-section>

                <q-card-section class="q-gutter-y-sm">
                  <div class="row items-center justify-between">
                    <span class="text-bold text-caption"
                      >Max Pillar Linking Distance:</span
                    >
                    <q-icon name="help" size="xs" color="blue-grey-9">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]"
                      >
                        {{
                          Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                            .SUPPORT_MAX_PILLAR_LINK_DISTANCE
                        }}
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <q-input
                    v-model.number="prusaSettings.supportMaxPillarDistance"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    max="30"
                    suffix="mm"
                    :rules="[ (val: number) => val && 0 <= val && val <= 30
              || 'Max pillar distance should be between 0 and 30']"
                  />
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <q-expansion-item label="Automatic Generation">
              <q-card bordered>
                <q-card-section class="q-gutter-y-sm">
                  <div class="row items-center justify-between">
                    <span class="text-bold text-caption"
                      >Support Points Density:</span
                    >
                    <q-icon name="help" size="xs" color="blue-grey-9">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]"
                      >
                        {{
                          Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                            .SUPPORT_POINTS_DENSITY
                        }}
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <q-input
                    v-model.number="prusaSettings.supportPointsDensity"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    suffix="%"
                    :rules="[ (val: number) => val && 0 <= val
              || 'Points density should be above 0']"
                  />
                </q-card-section>

                <q-card-section class="q-gutter-y-sm">
                  <div class="row items-center justify-between">
                    <span class="text-bold text-caption"
                      >Minimal Distance of the Support Points:</span
                    >
                    <q-icon name="help" size="xs" color="blue-grey-9">
                      <q-tooltip
                        anchor="center right"
                        self="center left"
                        :offset="[10, 10]"
                      >
                        {{
                          Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                            .SUPPORT_POINTS_MINIMAL_DISTANCE
                        }}
                      </q-tooltip>
                    </q-icon>
                  </div>
                  <q-input
                    v-model.number="prusaSettings.supportPointsMinimalDistance"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    suffix="mm"
                    :rules="[ (val: number) => val && 0 <= val
              || 'Minimal distance should be above 0']"
                  />
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <!-- ================================================================ -->
    <!--          PER-ZONE LASER EXPOSURE  (first + intermediate)           -->
    <!-- ================================================================ -->
    <q-expansion-item label="Per-Zone Exposure" icon="layers" default-opened>
      <q-card bordered>
        <q-banner
          v-if="hasAnyEngravingLayers"
          dense
          rounded
          class="q-ma-md bg-blue-1 text-blue-10"
        >
          Engraving mode rasters a configurable contour shell. Its interior is
          left empty or grid-filled, and all powered dashes use the scanline
          power and feedrate for their current layer zone.
        </q-banner>

        <!-- ============ FIRST LAYERS ============ -->
        <q-card-section>
          <div class="text-bold text-subtitle2 q-mb-sm" style="color: var(--q-orange)">
            First Layers (adhesion zone)
          </div>

          <q-card-section class="q-gutter-y-sm">
            <q-toggle
              v-model="prusaSettings.firstZoneEngravingEnabled"
              label="Engrave First Layers"
              class="full-width justify-between"
              left-label
              :color="colorTheme"
            >
              <q-tooltip>
                Engraves these layers as compensated horizontal scanlines.
                When off, the first layers use contour and hatch vectors.
              </q-tooltip>
            </q-toggle>
          </q-card-section>

          <q-card-section class="q-gutter-y-sm">
            <div class="row items-center justify-between">
              <span class="text-bold text-caption">Number of First Layers:</span>
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip anchor="center right" self="center left" :offset="[10,10]">
                  Number of bottom layers using the FIRST exposure values.
                  Set to 0 to disable this zone.
                </q-tooltip>
              </q-icon>
            </div>
            <q-input v-model.number="prusaSettings.firstLayersCount"
              type="number" outlined :color="colorTheme" dense min="0"
              :rules="[(val: number) => val >= 0 || 'Must be 0 or above']" />
          </q-card-section>

          <q-card-section class="q-gutter-y-sm">
            <span class="text-bold text-caption">
              {{
                firstZoneIsEngraving
                  ? 'First Layer Scanline Power:'
                  : 'First Layer Infill Power:'
              }}
            </span>
            <q-input v-model.number="prusaSettings.firstInfillPower"
              type="number" outlined :color="colorTheme" dense suffix="%"
              :rules="[(val: number) => val >= 0 && val <= 100 || 'Must be 0–100']" />
          </q-card-section>

          <q-card-section class="q-gutter-y-sm">
            <span class="text-bold text-caption">
              {{
                firstZoneIsEngraving
                  ? 'First Layer Scanline Feedrate:'
                  : 'First Layer Infill Speed:'
              }}
            </span>
            <q-input v-model.number="prusaSettings.firstInfillSpeed"
              type="number" outlined :color="colorTheme" dense suffix="mm/min"
              :rules="[(val: number) => val > 0 || 'Must be above 0']" />
          </q-card-section>

          <q-expansion-item
            v-if="firstZoneIsEngraving"
            label="Engraving Infill"
            icon="grid_on"
            dense
            class="q-mx-md q-mb-md"
          >
            <q-card bordered flat>
              <q-card-section class="q-gutter-y-sm">
                <q-banner dense rounded class="bg-blue-1 text-blue-10">
                  This zone uses its own hatch spacing. Grid fill and crossing
                  clearance are shared across engraved zones.
                </q-banner>
                <q-toggle
                  v-model="prusaSettings.fillEnclosedHollows"
                  label="Engraved interior grid fill"
                  class="full-width justify-between"
                  left-label
                  :color="colorTheme"
                />
                <q-btn-toggle
                  v-model="prusaSettings.engravingRasterDirection"
                  :options="[
                    { label: 'Raster X', value: 'x' },
                    { label: 'Raster Y', value: 'y' }
                  ]"
                  color="primary"
                  text-color="white"
                  toggle-color="orange"
                  class="full-width"
                />
                <q-input
                  v-if="!prusaSettings.matchEngravedShellToVectorWall"
                  v-model.number="prusaSettings.engravingContourThickness"
                  label="Manual Contour Shell Width"
                  type="number"
                  outlined
                  :color="colorTheme"
                  dense
                  min="0.1"
                  max="10"
                  step="0.1"
                  suffix="mm"
                />
                <div
                  v-if="prusaSettings.matchEngravedShellToVectorWall"
                  class="text-caption text-positive"
                >
                  Matched to vector wall:
                  {{ calculatedVectorWallWidth.toFixed(3) }} mm
                </div>
                <q-input
                  v-model.number="prusaSettings.firstEngravingHatchSpacing"
                  label="First-layer engraving hatch spacing"
                  type="number"
                  outlined
                  :color="colorTheme"
                  dense
                  min="0.01"
                  step="0.05"
                  suffix="mm"
                />
                <template v-if="prusaSettings.fillEnclosedHollows">
                  <q-input
                    v-model.number="prusaSettings.engravingGridSpacing"
                    label="Engraved grid pitch"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0.2"
                    step="0.1"
                    suffix="mm"
                  />
                  <q-input
                    v-model.number="prusaSettings.engravingGridLineThickness"
                    label="Engraved grid member width"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0.1"
                    step="0.1"
                    suffix="mm"
                  />
                  <q-input
                    v-model.number="prusaSettings.engravingGridAngle"
                    label="Grid Angle"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    max="180"
                    step="1"
                    suffix="deg"
                  />
                  <q-toggle
                    v-model="prusaSettings.useCustomGridClearance"
                    label="Manual grid crossing gap"
                    class="full-width justify-between"
                    left-label
                    :color="colorTheme"
                    @update:model-value="handleCustomGridClearanceToggle"
                  />
                  <q-input
                    v-if="prusaSettings.useCustomGridClearance"
                    v-model.number="prusaSettings.gridClearance"
                    label="Shared grid crossing gap"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0"
                    step="0.01"
                    suffix="mm"
                  />
                  <q-input
                    v-else
                    :model-value="
                      prusaSettings.firstEngravingHatchSpacing.toFixed(3)
                    "
                    label="Automatic shared crossing gap"
                    outlined
                    :color="colorTheme"
                    dense
                    suffix="mm"
                    readonly
                  />
                </template>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <q-card-section v-if="!firstZoneIsEngraving" class="q-gutter-y-sm">
            <span class="text-bold text-caption">First Layer Contour Power:</span>
            <q-input v-model.number="prusaSettings.firstContourPower"
              type="number" outlined :color="colorTheme" dense suffix="%"
              :rules="[(val: number) => val >= 0 && val <= 100 || 'Must be 0–100']" />
          </q-card-section>

          <q-card-section v-if="!firstZoneIsEngraving" class="q-gutter-y-sm">
            <span class="text-bold text-caption">First Layer Contour Speed:</span>
            <q-input v-model.number="prusaSettings.firstContourSpeed"
              type="number" outlined :color="colorTheme" dense suffix="mm/min"
              :rules="[(val: number) => val > 0 || 'Must be above 0']" />
          </q-card-section>
        </q-card-section>

        <q-separator />

        <!-- ============ INTERMEDIATE LAYERS (toggle) ============ -->
        <q-card-section>
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-bold text-subtitle2" style="color: var(--q-orange)">
              Intermediate Layers (bulk zone)
            </div>
            <q-toggle v-model="prusaSettings.intermediateZoneEnabled"
              :color="colorTheme" label="Enable" />
          </div>

          <div v-if="prusaSettings.intermediateZoneEnabled">
            <q-card-section class="q-gutter-y-sm">
              <q-toggle
                v-model="prusaSettings.intermediateZoneEngravingEnabled"
                label="Engrave Intermediate Layers"
                class="full-width justify-between"
                left-label
                :color="colorTheme"
              >
                <q-tooltip>
                  Engraves the transition layers before the remaining-layer
                  mode takes over. When off, this zone is vectored.
                </q-tooltip>
              </q-toggle>
            </q-card-section>

            <q-card-section class="q-gutter-y-sm">
              <span class="text-bold text-caption">Number of Intermediate Layers:</span>
              <q-input v-model.number="prusaSettings.intermediateLayersCount"
                type="number" outlined :color="colorTheme" dense min="0"
                :rules="[(val: number) => val >= 0 || 'Must be 0 or above']" />
            </q-card-section>

            <q-card-section class="q-gutter-y-sm">
              <span class="text-bold text-caption">
                {{
                  intermediateZoneIsEngraving
                    ? 'Intermediate Scanline Power:'
                    : 'Intermediate Infill Power:'
                }}
              </span>
              <q-input v-model.number="prusaSettings.intermediateInfillPower"
                type="number" outlined :color="colorTheme" dense suffix="%"
                :rules="[(val: number) => val >= 0 && val <= 100 || 'Must be 0–100']" />
            </q-card-section>

            <q-card-section class="q-gutter-y-sm">
              <span class="text-bold text-caption">
                {{
                  intermediateZoneIsEngraving
                    ? 'Intermediate Scanline Feedrate:'
                    : 'Intermediate Infill Speed:'
                }}
              </span>
              <q-input v-model.number="prusaSettings.intermediateInfillSpeed"
                type="number" outlined :color="colorTheme" dense suffix="mm/min"
                :rules="[(val: number) => val > 0 || 'Must be above 0']" />
            </q-card-section>

            <q-expansion-item
              v-if="intermediateZoneIsEngraving"
              label="Engraving Infill"
              icon="grid_on"
              dense
              class="q-mx-md q-mb-md"
            >
              <q-card bordered flat>
                <q-card-section class="q-gutter-y-sm">
                  <q-banner dense rounded class="bg-blue-1 text-blue-10">
                    This zone uses its own hatch spacing. Grid fill and
                    crossing clearance are shared across engraved zones.
                  </q-banner>
                  <q-toggle
                    v-model="prusaSettings.fillEnclosedHollows"
                    label="Engraved interior grid fill"
                    class="full-width justify-between"
                    left-label
                    :color="colorTheme"
                  />
                  <q-btn-toggle
                    v-model="prusaSettings.engravingRasterDirection"
                    :options="[
                      { label: 'Raster X', value: 'x' },
                      { label: 'Raster Y', value: 'y' }
                    ]"
                    color="primary"
                    text-color="white"
                    toggle-color="orange"
                    class="full-width"
                  />
                  <q-input
                    v-if="!prusaSettings.matchEngravedShellToVectorWall"
                    v-model.number="prusaSettings.engravingContourThickness"
                    label="Manual Contour Shell Width"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0.1"
                    max="10"
                    step="0.1"
                    suffix="mm"
                  />
                  <div
                    v-if="prusaSettings.matchEngravedShellToVectorWall"
                    class="text-caption text-positive"
                  >
                    Matched to vector wall:
                    {{ calculatedVectorWallWidth.toFixed(3) }} mm
                  </div>
                  <q-input
                    v-model.number="prusaSettings.intermediateEngravingHatchSpacing"
                    label="Intermediate engraving hatch spacing"
                    type="number"
                    outlined
                    :color="colorTheme"
                    dense
                    min="0.01"
                    step="0.05"
                    suffix="mm"
                  />
                  <template v-if="prusaSettings.fillEnclosedHollows">
                    <q-input
                      v-model.number="prusaSettings.engravingGridSpacing"
                      label="Engraved grid pitch"
                      type="number"
                      outlined
                      :color="colorTheme"
                      dense
                      min="0.2"
                      step="0.1"
                      suffix="mm"
                    />
                    <q-input
                      v-model.number="prusaSettings.engravingGridLineThickness"
                      label="Engraved grid member width"
                      type="number"
                      outlined
                      :color="colorTheme"
                      dense
                      min="0.1"
                      step="0.1"
                      suffix="mm"
                    />
                    <q-input
                      v-model.number="prusaSettings.engravingGridAngle"
                      label="Grid Angle"
                      type="number"
                      outlined
                      :color="colorTheme"
                      dense
                      min="0"
                      max="180"
                      step="1"
                      suffix="deg"
                    />
                    <q-toggle
                      v-model="prusaSettings.useCustomGridClearance"
                      label="Manual grid crossing gap"
                      class="full-width justify-between"
                      left-label
                      :color="colorTheme"
                      @update:model-value="handleCustomGridClearanceToggle"
                    />
                    <q-input
                      v-if="prusaSettings.useCustomGridClearance"
                      v-model.number="prusaSettings.gridClearance"
                      label="Shared grid crossing gap"
                      type="number"
                      outlined
                      :color="colorTheme"
                      dense
                      min="0"
                      step="0.01"
                      suffix="mm"
                    />
                    <q-input
                      v-else
                      :model-value="
                        prusaSettings.intermediateEngravingHatchSpacing.toFixed(3)
                      "
                      label="Automatic shared crossing gap"
                      outlined
                      :color="colorTheme"
                      dense
                      suffix="mm"
                      readonly
                    />
                  </template>
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <q-card-section v-if="!intermediateZoneIsEngraving" class="q-gutter-y-sm">
              <span class="text-bold text-caption">Intermediate Contour Power:</span>
              <q-input v-model.number="prusaSettings.intermediateContourPower"
                type="number" outlined :color="colorTheme" dense suffix="%"
                :rules="[(val: number) => val >= 0 && val <= 100 || 'Must be 0–100']" />
            </q-card-section>

            <q-card-section v-if="!intermediateZoneIsEngraving" class="q-gutter-y-sm">
              <span class="text-bold text-caption">Intermediate Contour Speed:</span>
              <q-input v-model.number="prusaSettings.intermediateContourSpeed"
                type="number" outlined :color="colorTheme" dense suffix="mm/min"
                :rules="[(val: number) => val > 0 || 'Must be above 0']" />
            </q-card-section>
          </div>
        </q-card-section>


      </q-card>
    </q-expansion-item>

    <!-- ================================================================ -->
    <!--           MACHINE / ROUTINE SETTINGS (OLSK-specific)              -->
    <!-- ================================================================ -->
    <q-expansion-item label="Machine Routine" icon="precision_manufacturing">
      <q-card bordered>
        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">No-Routine First Layers:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip anchor="center right" self="center left" :offset="[10,10]">
                How many of the first N layers should be printed WITHOUT the
                powder-feed / recoater routine in between. Used to repeatedly
                expose the first layer for better adhesion. Set to 0 to apply
                the routine between every layer.
              </q-tooltip>
            </q-icon>
          </div>
          <q-input v-model.number="prusaSettings.noRoutineFirstLayers"
            type="number" outlined :color="colorTheme" dense min="0"
            :rules="[(val: number) => val >= 0 || 'Must be 0 or above']" />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Reservoir Lift per Layer:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip anchor="center right" self="center left" :offset="[10,10]">
                {{
                  Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                    .PRUSA_RESERVOIR_LIFT_PER_LAYER
                }}
              </q-tooltip>
            </q-icon>
          </div>
          <q-input v-model.number="prusaSettings.reservoirLiftPerLayer"
            type="number" outlined :color="colorTheme" dense min="0"
            suffix="mm" step="0.05"
            :rules="[(val: number) => val >= 0 || 'Must be 0 or above']" />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Recoater Feed Rate:</span>
            <q-icon name="help" size="xs" color="blue-grey-9">
              <q-tooltip anchor="center right" self="center left" :offset="[10,10]">
                Feedrate used for the B-axis recoater sweep inside the
                generated machine routine.
              </q-tooltip>
            </q-icon>
          </div>
          <q-input v-model.number="prusaSettings.recoaterFeedRate"
            type="number" outlined :color="colorTheme" dense min="1"
            suffix="mm/min" step="100"
            :rules="[(val: number) => val > 0 || 'Must be above 0']" />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Return-Pass Bed Clearance:</span>
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="help" size="xs" color="blue-grey-9">
                <q-tooltip anchor="center right" self="center left" :offset="[10,10]">
                  After the forward recoater stroke, dip the build bed for the
                  return stroke, then restore scan height with a backlash-safe
                  final approach.
                </q-tooltip>
              </q-icon>
              <q-toggle
                v-model="prusaSettings.recoaterReturnBedDropEnabled"
                :color="colorTheme"
              />
            </div>
          </div>
        </q-card-section>

        <template v-if="prusaSettings.recoaterReturnBedDropEnabled">
          <q-card-section class="q-gutter-y-sm">
            <span class="text-bold text-caption">Bed Dip Distance:</span>
            <q-input
              v-model.number="prusaSettings.recoaterReturnBedDropDistance"
              type="number" outlined :color="colorTheme" dense min="0.001"
              suffix="mm" step="0.01"
              :rules="[(val: number) => val > 0 || 'Must be above 0']"
            />
          </q-card-section>

          <q-card-section class="q-gutter-y-sm">
            <span class="text-bold text-caption">Bed Z Feed Rate:</span>
            <q-input
              v-model.number="prusaSettings.recoaterReturnBedFeedRate"
              type="number" outlined :color="colorTheme" dense min="1"
              suffix="mm/min" step="10"
              :rules="[(val: number) => val > 0 || 'Must be above 0']"
            />
          </q-card-section>
        </template>

        <q-card-section class="q-gutter-y-sm">
          <span class="text-bold text-caption">Bed Offset X:</span>
          <q-input v-model.number="prusaSettings.bedOffsetX"
            type="number" outlined :color="colorTheme" dense suffix="mm" />
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <span class="text-bold text-caption">Bed Offset Y:</span>
          <q-input v-model.number="prusaSettings.bedOffsetY"
            type="number" outlined :color="colorTheme" dense suffix="mm" />
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item v-if="false" label="Pad Settings" icon="padding">
      <q-card bordered>
        <q-card-section>
          <q-toggle
            v-model="prusaSettings.isPadEnabled"
            label="Pad"
            class="full-width justify-between"
            left-label
            :color="colorTheme"
          />
          <div v-if="prusaSettings.isPadEnabled">
            <q-card-section class="q-gutter-y-sm">
              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Pad Wall Thickness:</span>
                <q-icon name="help" size="xs" color="blue-grey-9">
                  <q-tooltip
                    anchor="center right"
                    self="center left"
                    :offset="[10, 10]"
                  >
                    {{
                      Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                        .PAD_WALL_THICKNESS
                    }}
                  </q-tooltip>
                </q-icon>
              </div>
              <q-input
                v-model.number="prusaSettings.padWallThickness"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0"
                max="30"
                suffix="mm"
                step="0.1"
                :rules="[ (val: number) => val && 0 <= val && val <= 30
              || 'Wall thickness should be between 0 and 30']"
              />
            </q-card-section>

            <q-card-section class="q-gutter-y-sm">
              <div class="row items-center justify-between">
                <span class="text-bold text-caption">Pad Brim Size:</span>
                <q-icon name="help" size="xs" color="blue-grey-9">
                  <q-tooltip
                    anchor="center right"
                    self="center left"
                    :offset="[10, 10]"
                  >
                    {{
                      Constants.PRINTING_SETTINGS_ASSISTANT_MESSAGES
                        .PAD_BRIM_SIZE
                    }}
                  </q-tooltip>
                </q-icon>
              </div>
              <q-input
                v-model.number="prusaSettings.padBrimSize"
                type="number"
                outlined
                :color="colorTheme"
                dense
                min="0"
                max="10"
                suffix="mm"
                step="0.1"
                :rules="[ (val: number) => val && 0 <= val && val <= 10
              || 'Brim Size should be between 0 and 10']"
              />
            </q-card-section>

            <q-card-section class="q-gutter-y-sm">
              <div class="row items-center justify-between">
                <div class="q-gutter-x-sm">
                  <span class="text-bold text-caption">Pad Around Object:</span>
                  <q-checkbox
                    v-model="prusaSettings.isPadAroundObject"
                    :color="colorTheme"
                    @update:model-value="handleChangePadAroundObject"
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
                        .PAD_AROUND_OBJECT
                    }}
                  </q-tooltip>
                </q-icon>
              </div>
            </q-card-section>

            <q-card-section
              class="q-gutter-y-sm"
              v-if="prusaSettings.isPadAroundObject"
            >
              <div class="row items-center justify-between">
                <div class="q-gutter-x-sm">
                  <span class="text-bold text-caption"
                    >Pad Around Object Everywhere:</span
                  >
                  <q-checkbox
                    v-model="prusaSettings.isPadAroundObjectEverywhere"
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
                        .PAD_AROUND_OBJECT_EVERYWHERE
                    }}
                  </q-tooltip>
                </q-icon>
              </div>
            </q-card-section>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>
    </template>
  </q-list>
</template>
<script setup lang="ts">
import { Constants } from 'src/constants';
import { use3DSlicingStore } from 'src/stores/3d-slicing';
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { showNotifyMessage } from 'src/services/notify.messages.service';

/**
 * Access the 3D slicing store to manage slicing-related settings.
 */
const slicingStore = use3DSlicingStore();
const notifyMessage = showNotifyMessage();

/**
 * Reactive references to Prusa slicing settings and UI color theme.
 */
const { prusaSettings, colorTheme, selectedModel } =
  storeToRefs(slicingStore);

const selectedSolidObjectName = computed(
  () => selectedModel.value.object?.name || 'Select a model'
);

const normalizedLayerHeight = computed(() => {
  const height = Number(prusaSettings.value.layerHeight);
  return Number.isFinite(height) && height > 0 ? height : 0;
});

const transitionTotalHeight = computed(() => {
  const layers = Math.max(
    0,
    Number(prusaSettings.value.solidTransitionLayers) || 0
  );
  return layers * normalizedLayerHeight.value;
});

const handleSaveObjectSettings = () => {
  if (!selectedModel.value.object) return;
  slicingStore.saveSelectedSolidObjectSettings();
  notifyMessage.success(
    `Settings saved for ${selectedSolidObjectName.value}.`
  );
};

watch(
  prusaSettings,
  () => slicingStore.saveSelectedSolidObjectSettings(),
  { deep: true }
);

const initializeSolidClosureSettings = (enabled: boolean) => {
  if (!enabled) return;
  prusaSettings.value.solidCloseTopBottomPower =
    prusaSettings.value.solidPower;
  prusaSettings.value.solidCloseTopBottomSpeed =
    prusaSettings.value.solidSpeed;
  prusaSettings.value.solidCloseTopBottomLineOverlap =
    prusaSettings.value.solidLineOverlap;
};

const isEngravingMode = computed(
  () => prusaSettings.value.engravingMode === 'engraving'
);

const firstZoneIsEngraving = computed(
  () =>
    prusaSettings.value.firstLayersCount > 0 &&
    prusaSettings.value.firstZoneEngravingEnabled
);

const intermediateZoneIsEngraving = computed(
  () =>
    prusaSettings.value.intermediateZoneEnabled &&
    prusaSettings.value.intermediateLayersCount > 0 &&
    prusaSettings.value.intermediateZoneEngravingEnabled
);

const hasAnyEngravingLayers = computed(
  () =>
    isEngravingMode.value ||
    firstZoneIsEngraving.value ||
    intermediateZoneIsEngraving.value
);

const normalizedVectorTrackWidth = computed(() => {
  const width = Number(prusaSettings.value.nominalVectorTrackWidth);
  return Number.isFinite(width) && width > 0 ? width : 0.2;
});

const normalizedLineBundleSpacing = computed(() => {
  const spacing = Number(prusaSettings.value.lineBundleSpacing);
  return Number.isFinite(spacing) && spacing > 0 ? spacing : 0.2;
});

const calculatedVectorWallWidth = computed(() => {
  const count = Math.max(
    1,
    Math.min(25, Number(prusaSettings.value.contourLineCount) || 1)
  );
  return (
    (count - 1) * normalizedLineBundleSpacing.value +
    normalizedVectorTrackWidth.value
  );
});

const bundleWidth = (lineCount: number) => {
  const count = Math.max(1, Math.min(25, Number(lineCount) || 1));
  return (
    (count - 1) * normalizedLineBundleSpacing.value +
    normalizedVectorTrackWidth.value
  );
};

const variableGridMemberWidth = computed(() =>
  bundleWidth(prusaSettings.value.variableGridLineCount)
);

const secondaryVariableGridMemberWidth = computed(() =>
  bundleWidth(prusaSettings.value.secondaryVariableGridLineCount)
);

const tertiaryVariableGridMemberWidth = computed(() =>
  bundleWidth(prusaSettings.value.tertiaryVariableGridLineCount)
);

const flatRoofEffectiveHatchSpacing = computed(() => {
  const overlap = Math.max(
    -100,
    Math.min(95, Number(prusaSettings.value.flatSurfaceSkinHatchOverlap) || 0)
  );
  return normalizedVectorTrackWidth.value * (1 - overlap / 100);
});

const flatRoofSecondPassEffectiveHatchSpacing = computed(() => {
  const overlap = Math.max(
    -100,
    Math.min(
      95,
      Number(prusaSettings.value.flatSurfaceSkinSecondPassHatchOverlap) || 0
    )
  );
  return normalizedVectorTrackWidth.value * (1 - overlap / 100);
});

const engravedGridAngleLabel = computed(() => {
  const baseAngle = Number(prusaSettings.value.infillAngle) || 0;
  if (!prusaSettings.value.hatchRotationGroupingEnabled) {
    return (baseAngle % 180).toFixed(1);
  }
  const rotation = Number(prusaSettings.value.hatchRotationPerLayer) || 0;
  const groupLayers = Math.max(
    1,
    Number(prusaSettings.value.hatchRotationGroupLayers) || 1
  );
  return `${(baseAngle % 180).toFixed(1)} + ${rotation.toFixed(
    1
  )} every ${groupLayers} layer${groupLayers === 1 ? '' : 's'}`;
});

const compensationDistance = (feedrate: number) => {
  const acceleration = Number(prusaSettings.value.engravingAcceleration);
  if (!Number.isFinite(acceleration) || acceleration <= 0) return '0.000';
  const velocity = Math.max(0, Number(feedrate)) / 60;
  return ((velocity * velocity) / (2 * acceleration)).toFixed(3);
};

const velocityFromFeedrate = (feedrate: number) =>
  (Math.max(0, Number(feedrate)) / 60).toFixed(3);

const compensationRow = (
  zone: string,
  path: string,
  feedrate: number
) => ({
  name: `${zone}-${path}`,
  zone,
  path,
  feedrate,
  velocity: velocityFromFeedrate(feedrate),
  lead: compensationDistance(feedrate),
});

const compensationDistances = computed(() => {
  const rows = [];
  if (firstZoneIsEngraving.value) {
    rows.push(
      compensationRow(
        'First',
        'Material raster',
        prusaSettings.value.firstInfillSpeed
      )
    );
  }
  if (intermediateZoneIsEngraving.value) {
    rows.push(
      compensationRow(
        'Intermediate',
        'Material raster',
        prusaSettings.value.intermediateInfillSpeed
      )
    );
  }
  if (isEngravingMode.value) {
    rows.push(
      compensationRow('Remaining', 'Material raster', prusaSettings.value.infillSpeed)
    );
  }
  return rows;
});

watch(
  () => prusaSettings.value.roofHollowInfillEnabled,
  (enabled) => {
    if (!enabled && prusaSettings.value.variableGridTarget === 'hollow') {
      prusaSettings.value.variableGridTarget = 'both';
    }
  },
  { immediate: true }
);

watch(
  normalizedVectorTrackWidth,
  (width) => {
    prusaSettings.value.infillLineThickness = Number(width.toFixed(4));
  },
  { immediate: true }
);

watch(
  [calculatedVectorWallWidth, () => prusaSettings.value.matchEngravedShellToVectorWall],
  ([width, matched]) => {
    if (matched) {
      prusaSettings.value.engravingContourThickness = Number(width.toFixed(4));
    }
  },
  { immediate: true }
);

watch(
  variableGridMemberWidth,
  (width) => {
    prusaSettings.value.variableEngravingGridLineThickness = Number(
      width.toFixed(4)
    );
  },
  { immediate: true }
);

watch(
  secondaryVariableGridMemberWidth,
  (width) => {
    prusaSettings.value.secondaryVariableEngravingGridLineThickness = Number(
      width.toFixed(4)
    );
  },
  { immediate: true }
);

watch(
  tertiaryVariableGridMemberWidth,
  (width) => {
    prusaSettings.value.tertiaryVariableEngravingGridLineThickness = Number(
      width.toFixed(4)
    );
  },
  { immediate: true }
);

watch(
  () => prusaSettings.value.flatSurfaceSkinBoundaryMode,
  (mode) => {
    if (
      mode !== 'engrave' &&
      mode !== 'vector' &&
      mode !== 'contour' &&
      mode !== 'none'
    ) {
      prusaSettings.value.flatSurfaceSkinBoundaryMode = 'engrave';
    }
  },
  { immediate: true }
);

const handleCustomGridClearanceToggle = (enabled: boolean) => {
  if (enabled && hasAnyEngravingLayers.value) {
    prusaSettings.value.gridClearance =
      Number(prusaSettings.value.scanlineSpacing) || 0.2;
  }
};

/**
 * Handler for when the "Pad Around Object" setting changes.
 *
 * Business rule:
 * - If "Pad Around Object" is turned OFF, but "Support Enforced" is still ON,
 *   then automatically turn OFF "Support Enforced" to maintain valid configuration.
 */
const handleChangePadAroundObject = () => {
  if (
    !prusaSettings.value.isPadAroundObject &&
    prusaSettings.value.isSupportEnforced
  ) {
    prusaSettings.value.isSupportEnforced = false;
  }
};

/**
 * Handler for when the "Support Enforced" setting changes.
 *
 * Business rule:
 * - If "Support Enforced" is turned ON while "Pad Around Object" is OFF,
 *   then automatically enable "Pad Around Object" since enforced supports require a pad.
 */
const handleChangeIsSupportEnforced = () => {
  if (
    !prusaSettings.value.isPadAroundObject &&
    prusaSettings.value.isSupportEnforced
  ) {
    prusaSettings.value.isPadAroundObject = true;
  }
};
</script>
