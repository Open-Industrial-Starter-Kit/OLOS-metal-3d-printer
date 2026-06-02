import axios, { AxiosError } from 'axios';
import { defineStore } from 'pinia';
import { Constants } from 'src/constants';
import {
  GcodeGeneratorImageData,
  MaterialData,
  ThicknessOperation,
} from 'src/interfaces/imageToGcode.interface';
import API from 'src/services/API.service';
import { shallowRef } from 'vue';
import { useImageToGcodeConvertor } from './image-to-gcode';

/**
 * Pinia store for managing the material library and related G-code settings.
 */
export const useMaterialLibraryStore = defineStore('materialLibrary', {
  state: () => ({
    /**
     * List of available materials in the library.
     * @type {import('vue').Ref<MaterialData[]>}
     */
    materialsList: shallowRef<Array<MaterialData>>([]),

    /**
     * Reference to the Image to G-code converter store.
     */
    imageToGcodeConvertorStore: useImageToGcodeConvertor(),
  }),

  actions: {
    /**
     * Fetches the material library data from the API and updates the store.
     * @returns {Promise<void>}
     * @throws {Error} Throws an error if the API request fails.
     */
    async fetchMaterialLibraryData() {
      await API.getMaterialsList()
        .then((response) => {
          const materialsListData = response.data.data.materialsList;
          this.materialsList = JSON.parse(materialsListData);
        })
        .catch((error: AxiosError | unknown) => {
          if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data.detail);
          }
        });
    },

    /**
     * Adds a new material to the library via the API and updates the store.
     * @param {MaterialData} material - The material to add.
     * @returns {Promise<void>}
     * @throws {Error} Throws an error if the API request fails.
     */
    async addNewMaterial(material: MaterialData) {
      await API.addNewMaterial(material)
        .then((response) => {
          const materialsListData = response.data.data.materialsList;
          this.materialsList = JSON.parse(materialsListData);
        })
        .catch((error: AxiosError | unknown) => {
          if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data.detail);
          }
        });
    },

    /**
     * Updates an existing material via the API and updates the store.
     * If the updated material matches the active image's material,
     * updates the G-code settings accordingly.
     * @param {MaterialData} material - The material with updated data.
     * @returns {Promise<void>}
     * @throws {Error} Throws an error if the API request fails.
     */
    async updateMaterial(material: MaterialData) {
      await API.updateMaterial(material)
        .then((response) => {
          const materialsListData = response.data.data.materialsList;
          this.materialsList = JSON.parse(materialsListData);

          const activeMaterial =
            this.imageToGcodeConvertorStore.activeImage?.gcodeSettings
              .mainSettings.material;

          if (material.materialName === activeMaterial) {
            this.updateGcodeFileSettings(material);
          }
        })
        .catch((error: AxiosError | unknown) => {
          if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data.detail);
          }
        });
    },

    /**
     * Deletes a material by ID from the API and updates the store.
     * If the deleted material is used in the active image's settings,
     * resets the G-code settings to default.
     * @param {number} materialId - The ID of the material to delete.
     * @returns {Promise<void>}
     * @throws {Error} Throws an error if the API request fails.
     */
    async deleteMaterial(materialId: number) {
      // Find material name to check if currently used in active image
      const materialName = this.materialsList.find(
        (material) => material.materialId === materialId
      )?.materialName;

      if (materialName) {
        this.updateGcodeFileSettings();
      }

      await API.deleteMaterial(materialId)
        .then((response) => {
          const materialsListData = response.data.data.materialsList;
          this.materialsList = JSON.parse(materialsListData);
        })
        .catch((error: AxiosError | unknown) => {
          if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data.detail);
          }
        });
    },

    /**
     * Updates the G-code file settings based on the provided material.
     * If no material is given, defaults to the first material in the list.
     * @param {MaterialData | null} [material=null] - Material to apply settings for.
     * @returns {void}
     */
    updateGcodeFileSettings(material: MaterialData | null = null) {
      if (material) {
        this.setupGcodeSettings(material);
      } else if (this.materialsList.length) {
        this.setupGcodeSettings(this.materialsList[0]);
      }
    },

    /**
     * Sets up G-code settings for the active image using the specified material.
     * @param {MaterialData} material - Material to use for settings.
     * @returns {void}
     */
    setupGcodeSettings(material: MaterialData) {
      const activeImage = this.imageToGcodeConvertorStore
        .activeImage as GcodeGeneratorImageData;
      if (!activeImage) return;

      // Update main material setting
      activeImage.gcodeSettings.mainSettings.material = material.materialName;

      // Find matching thickness or fallback to first thickness available
      const thicknessSettings =
        material.materialThicknesses.find(
          (thickness) =>
            thickness.thicknessValue ===
            activeImage.gcodeSettings.mainSettings.thickness
        ) || material.materialThicknesses[0];

      if (thicknessSettings) {
        activeImage.gcodeSettings.mainSettings.thickness =
          thicknessSettings.thicknessValue;

        // Reset profile options
        activeImage.singleProfileOptions = [Constants.PROFILE_OPTIONS.NOTHING];
        activeImage.allProfileOptions = [Constants.PROFILE_ALL_OPTIONS.CUSTOM];

        // Apply each thickness operation to active image settings
        thicknessSettings.thicknessOperations.forEach((operation) =>
          this.applyOperationSettings(activeImage, operation)
        );
      } else {
        // If no thickness settings found, reset to default
        this.updateGcodeFileSettings();
      }
    },

    /**
     * Applies a thickness operation's settings to the active image's G-code settings.
     * @param {GcodeGeneratorImageData} activeImage - The active image to update.
     * @param {ThicknessOperation} operation - The thickness operation to apply.
     * @returns {void}
     */
    applyOperationSettings(
      activeImage: GcodeGeneratorImageData,
      operation: ThicknessOperation
    ) {
      const operationMapping: Record<string, () => void> = {
        [Constants.PROFILE_OPTIONS.CUT]: () => {
          activeImage.gcodeSettings.cuttingSettings = {
            power: operation.power,
            speed: operation.speed,
            tool: operation.tool,
          };
          activeImage.singleProfileOptions.push(Constants.PROFILE_OPTIONS.CUT);
          activeImage.allProfileOptions.push(
            Constants.PROFILE_ALL_OPTIONS.CUT_EVERYTHING
          );
        },
        [Constants.PROFILE_OPTIONS.MARK]: () => {
          activeImage.gcodeSettings.markingSettings = {
            power: operation.power,
            speed: operation.speed,
            tool: operation.tool,
          };
          activeImage.singleProfileOptions.push(Constants.PROFILE_OPTIONS.MARK);
          activeImage.allProfileOptions.push(
            Constants.PROFILE_ALL_OPTIONS.MARK_EVERYTHING
          );
        },
        [Constants.PROFILE_OPTIONS.ENGRAVE]: () => {
          activeImage.gcodeSettings.engravingSettings = {
            power: operation.power,
            speed: operation.speed,
            tool: operation.tool,
            dithering:
              operation.dithering ??
              Constants.DEFAULT_GCODE_GENERATOR_SETTINGS.ENGRAVING_SETTINGS
                .dithering,
          };
          activeImage.singleProfileOptions.push(
            Constants.PROFILE_OPTIONS.ENGRAVE
          );
          activeImage.allProfileOptions.push(
            Constants.PROFILE_ALL_OPTIONS.ENGRAVE_EVERYTHING
          );
        },
      };

      if (operation.operationType) {
        operationMapping[operation.operationType]?.();
      }
    },
  },
});
