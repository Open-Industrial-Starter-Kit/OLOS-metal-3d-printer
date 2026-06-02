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
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item label="Infill Settings" icon="texture">
      <q-card bordered>
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
            v-model.number="prusaSettings.infillAngle"
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
            <span class="text-bold text-caption">Hatch Rotation per Layer:</span>
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
        </q-card-section>

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
        </q-card-section>

        <q-card-section class="q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold text-caption">Infill Hatch Spacing:</span>
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
        </q-card-section>

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

        <q-card-section class="q-gutter-y-sm">
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

    <q-expansion-item label="Hollowing Settings" icon="all_out">
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

    <q-expansion-item label="Support Settings" icon="foundation">
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

        <!-- ============ FIRST LAYERS ============ -->
        <q-card-section>
          <div class="text-bold text-subtitle2 q-mb-sm" style="color: var(--q-orange)">
            First Layers (adhesion zone)
          </div>

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
            <span class="text-bold text-caption">First Layer Infill Power:</span>
            <q-input v-model.number="prusaSettings.firstInfillPower"
              type="number" outlined :color="colorTheme" dense suffix="%"
              :rules="[(val: number) => val >= 0 && val <= 100 || 'Must be 0–100']" />
          </q-card-section>

          <q-card-section class="q-gutter-y-sm">
            <span class="text-bold text-caption">First Layer Infill Speed:</span>
            <q-input v-model.number="prusaSettings.firstInfillSpeed"
              type="number" outlined :color="colorTheme" dense suffix="mm/min"
              :rules="[(val: number) => val > 0 || 'Must be above 0']" />
          </q-card-section>

          <q-card-section class="q-gutter-y-sm">
            <span class="text-bold text-caption">First Layer Contour Power:</span>
            <q-input v-model.number="prusaSettings.firstContourPower"
              type="number" outlined :color="colorTheme" dense suffix="%"
              :rules="[(val: number) => val >= 0 && val <= 100 || 'Must be 0–100']" />
          </q-card-section>

          <q-card-section class="q-gutter-y-sm">
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
              <span class="text-bold text-caption">Number of Intermediate Layers:</span>
              <q-input v-model.number="prusaSettings.intermediateLayersCount"
                type="number" outlined :color="colorTheme" dense min="0"
                :rules="[(val: number) => val >= 0 || 'Must be 0 or above']" />
            </q-card-section>

            <q-card-section class="q-gutter-y-sm">
              <span class="text-bold text-caption">Intermediate Infill Power:</span>
              <q-input v-model.number="prusaSettings.intermediateInfillPower"
                type="number" outlined :color="colorTheme" dense suffix="%"
                :rules="[(val: number) => val >= 0 && val <= 100 || 'Must be 0–100']" />
            </q-card-section>

            <q-card-section class="q-gutter-y-sm">
              <span class="text-bold text-caption">Intermediate Infill Speed:</span>
              <q-input v-model.number="prusaSettings.intermediateInfillSpeed"
                type="number" outlined :color="colorTheme" dense suffix="mm/min"
                :rules="[(val: number) => val > 0 || 'Must be above 0']" />
            </q-card-section>

            <q-card-section class="q-gutter-y-sm">
              <span class="text-bold text-caption">Intermediate Contour Power:</span>
              <q-input v-model.number="prusaSettings.intermediateContourPower"
                type="number" outlined :color="colorTheme" dense suffix="%"
                :rules="[(val: number) => val >= 0 && val <= 100 || 'Must be 0–100']" />
            </q-card-section>

            <q-card-section class="q-gutter-y-sm">
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

    <q-expansion-item label="Pad Settings" icon="padding">
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
 * Reactive references to Prusa slicing settings and UI color theme.
 */
const { prusaSettings, colorTheme } = storeToRefs(slicingStore);

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
