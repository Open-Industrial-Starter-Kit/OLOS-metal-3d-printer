<template>
  <div v-if="imageToGcodeConvertorStore.activeImage" class="column">
    <q-table
      ref="mappingTable"
      :columns="getMappingColumns()"
      :rows="getFilteredElements()"
      :row-key="imageToGcodeConvertorStore.activeImage.tableFilterType"
      flat
      selection="multiple"
      v-model:selected="
        imageToGcodeConvertorStore.activeImage.tableSelectedElements
      "
      @selection="handleSelectingRowsProcess"
      virtual-scroll
      :virtual-scroll-item-size="10"
      :virtual-scroll-sticky-size-start="10"
      :rows-per-page-options="[0]"
      hide-bottom
      card-style="font-size: 1.5vh"
    >
      <template v-slot:top>
        <div class="row full-width items-center justify-between">
          <div class="row q-gutter-x-lg flex-center">
            <span class="text-bold">Filtered By:</span>

            <q-radio
              v-model="imageToGcodeConvertorStore.activeImage.tableFilterType"
              val="shape"
              label="Shape"
              size="4vh"
              @update:model-value="handleFilterChange"
            />
            <q-radio
              v-model="imageToGcodeConvertorStore.activeImage.tableFilterType"
              val="color"
              label="Color"
              size="4vh"
              @update:model-value="handleFilterChange"
            />
          </div>
          <div class="row q-gutter-x-lg flex-center">
            <span class="text-bold">All Profiles:</span>
            <q-select
              square
              outlined
              dense
              input-style="font-size: 10px !important"
              behavior="menu"
              :options="
                imageToGcodeConvertorStore.activeImage.allProfileOptions
              "
              v-model="
                imageToGcodeConvertorStore.activeImage.tableProfileAllModels
              "
              @update:model-value="handleChangeOfAllProfiles"
            />
          </div>
        </div>
      </template>

      <template v-slot:header-selection="scope">
        <q-checkbox
          v-model="scope.selected"
          :disable="
            imageToGcodeConvertorStore.activeImage.tableProfileAllModels !==
            Constants.PROFILE_ALL_OPTIONS.CUSTOM
          "
        ></q-checkbox>
      </template>

      <template v-slot:body-selection="scope">
        <q-checkbox
          v-model="scope.selected"
          :disable="scope.row.disable"
        ></q-checkbox>
      </template>

      <template v-slot:body-cell-color="props">
        <q-td key="color" :props="props">
          <div class="row full-width flex-center">
            <div
              class="color-boxes"
              :style="{
                'background-color': props.row.color,
              }"
            ></div>
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-shapeProfile="props">
        <q-td key="color" :props="props">
          <div class="row full-width flex-center">
            <q-select
              square
              outlined
              dense
              behavior="menu"
              v-model="
                imageToGcodeConvertorStore.activeImage.tableProfileModels[
                  props.row.shape
                ]
              "
              :options="
                imageToGcodeConvertorStore.activeImage.singleProfileOptions
              "
              :disable="props.row.disable"
              @update:model-value="handleChangeOfSVGElementProfile(props)"
            />
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-colorProfile="props">
        <q-td key="color" :props="props">
          <div class="row full-width flex-center">
            <q-select
              square
              outlined
              behavior="menu"
              v-model="
                imageToGcodeConvertorStore.activeImage.tableProfileModels[
                  props.row.color
                ]
              "
              :options="
                imageToGcodeConvertorStore.activeImage.singleProfileOptions
              "
              style="width: 8vw"
              :disable="props.row.disable"
              @update:model-value="handleChangeOfSVGElementProfile(props)"
            />
          </div>
        </q-td>
      </template>
    </q-table>
  </div>
</template>
<script setup lang="ts">
import { INode } from 'svgson';
import { useImageToGcodeConvertor } from 'src/stores/image-to-gcode';
import { ref, toRaw } from 'vue';
import { QTableProps, QTableSlots } from 'quasar';
import { Constants } from 'src/constants';
import { SelectedElementType } from 'src/interfaces/imageToGcode.interface';

// Access the Pinia store for image-to-G-code conversion.
const imageToGcodeConvertorStore = useImageToGcodeConvertor();

/**
 * A reactive reference to the Quasar QTable component instance.
 * @type {ref<QTableProps | null>}
 */
const mappingTable = ref<QTableProps | null>(null);

/**
 * Columns configuration for the QTable when filtering by color.
 *
 * @type {QTableProps['columns']}
 */
const mappingColorColumns: QTableProps['columns'] = [
  {
    name: 'color',
    required: true,
    label: 'Color',
    align: 'center',
    field: (row) => row.color,
  },
  {
    name: 'counter',
    align: 'center',
    label: 'Number of Elements',
    field: (row) => row.elements.length,
    required: false,
  },
  {
    name: 'colorProfile',
    align: 'center',
    label: 'Profile',
    field: '',
    required: false,
  },
];

/**
 * Columns configuration for the QTable when filtering by shape.
 *
 * @type {QTableProps['columns']}
 */
const mappingShapeColumns: QTableProps['columns'] = [
  {
    name: 'shape',
    required: true,
    label: 'Shape',
    align: 'center',
    field: (row) => row.shape,
  },
  {
    name: 'counter',
    align: 'center',
    label: 'Number of Elements',
    field: (row) => row.elements.length,
    required: false,
  },
  {
    name: 'shapeProfile',
    align: 'center',
    label: 'Profile',
    field: '',
    required: false,
  },
];

/**
 * Determines and returns the appropriate table columns based on the active image's filter type.
 *
 * @returns {QTableProps['columns'] | undefined} - The column definitions for the table.
 */
const getMappingColumns = () => {
  const activeImage = imageToGcodeConvertorStore.activeImage;
  if (!activeImage) return;
  if (activeImage.tableFilterType === Constants.SVG_ELEMENTS_FILTER.SHAPE) {
    return mappingShapeColumns;
  } else if (
    activeImage.tableFilterType === Constants.SVG_ELEMENTS_FILTER.COLOR
  ) {
    return mappingColorColumns;
  }
};

/**
 * Returns the filtered SVG elements data for the table, based on the active image's filter type.
 *
 * @returns {Array<IShapeElement | IColorElement>} - The array of elements grouped by color or shape.
 */
const getFilteredElements = () => {
  const activeImage = imageToGcodeConvertorStore.activeImage;
  if (!activeImage) return [];
  if (activeImage.tableFilterType === Constants.SVG_ELEMENTS_FILTER.SHAPE) {
    return activeImage.filteredElementsByShape;
  } else if (
    activeImage.tableFilterType === Constants.SVG_ELEMENTS_FILTER.COLOR
  ) {
    return activeImage.filteredElementsByColor;
  }
  return [];
};

/**
 * Handles the row selection event in the QTable.
 *
 * This function processes the selected rows, updates the list of SVG elements
 * to be modified in the store, and triggers a re-rendering of the SVG.
 *
 * @param {Parameters<NonNullable<QTableProps['onSelection']>>[0]} event - The selection event object from Quasar's QTable.
 */
const handleSelectingRowsProcess = (
  event: Parameters<NonNullable<QTableProps['onSelection']>>[0]
) => {
  const activeImage = imageToGcodeConvertorStore.activeImage;
  if (!activeImage) return;

  const selectedElements = event.rows?.reduce((elements, row) => {
    const selectedElement = getSelectedElementData(
      row[activeImage.tableFilterType],
      row.elements,
      event.added
    );
    elements.push(selectedElement);
    return elements;
  }, [] as SelectedElementType[]);

  imageToGcodeConvertorStore.setSvgElementsToModify(selectedElements);
  imageToGcodeConvertorStore.applySVGChanges();
};

/**
 * Handles the change of a profile for a single SVG element group.
 *
 * This function is triggered when a user changes the profile option for a specific row
 * in the table. It updates the profile for that element group and re-renders the SVG.
 *
 * @param {Parameters<QTableSlots['item']>[0]} props - The props object for the table row.
 */
const handleChangeOfSVGElementProfile = (
  props: Parameters<QTableSlots['item']>[0]
) => {
  const activeImage = imageToGcodeConvertorStore.activeImage;
  if (!activeImage || !props.selected) return;

  activeImage.tableProfileAllModels = Constants.PROFILE_ALL_OPTIONS.CUSTOM;

  const selectedElement = getSelectedElementData(
    props.row[activeImage.tableFilterType],
    props.row.elements,
    activeImage.tableProfileModels[props.row[activeImage.tableFilterType]] !==
      Constants.PROFILE_OPTIONS.NOTHING
  );

  imageToGcodeConvertorStore.setSvgElementsToModify([selectedElement]);
  imageToGcodeConvertorStore.applySVGChanges();
};

/**
 * Handles the change of the "profile all" option.
 *
 * This function is triggered when a user selects a global profile option (e.g., "Cut Everything").
 * It disables or enables individual row selection and then processes the profiling for all elements.
 */
const handleChangeOfAllProfiles = () => {
  const activeImage = imageToGcodeConvertorStore.activeImage;
  if (!activeImage) return;

  if (
    activeImage.tableProfileAllModels !== Constants.PROFILE_ALL_OPTIONS.CUSTOM
  ) {
    disableAllTableRows();
  } else {
    enableAllTableRows();
  }
  processProfiling();
};

/**
 * Disables all rows in the table.
 */
const disableAllTableRows = () => {
  mappingTable.value?.rows.forEach((row) => (row.disable = true));
};

/**
 * Enables all rows in the table.
 */
const enableAllTableRows = () => {
  mappingTable.value?.rows.forEach((row) => (row.disable = false));
};

/**
 * Main function to process the profiling based on the file type.
 *
 * It delegates the profiling logic to `processProfilingForSVGFile` or
 * `processProfilingForImageFile` based on whether the active image is an SVG or a raster image.
 */
const processProfiling = () => {
  const activeImage = imageToGcodeConvertorStore.activeImage;
  if (!activeImage) return;

  if (activeImage.imageContent.startsWith('data:image/svg+xml;base64')) {
    processProfilingForSVGFile();
  } else {
    processProfilingForImageFile();
  }
};

/**
 * Processes profiling for an SVG file.
 *
 * This function sets the profile for all SVG elements based on the global `tableProfileAllModels`
 * option and triggers the application of changes.
 */
const processProfilingForSVGFile = () => {
  const activeImage = imageToGcodeConvertorStore.activeImage;
  if (!activeImage) return;

  let selectedElements: ReturnType<typeof processAllRows> = [];
  const profilingActions = {
    [Constants.PROFILE_ALL_OPTIONS.CUT_EVERYTHING]:
      Constants.PROFILE_OPTIONS.CUT,
    [Constants.PROFILE_ALL_OPTIONS.MARK_EVERYTHING]:
      Constants.PROFILE_OPTIONS.MARK,
    [Constants.PROFILE_ALL_OPTIONS.ENGRAVE_EVERYTHING]:
      Constants.PROFILE_OPTIONS.ENGRAVE,
  };
  const action = profilingActions[activeImage.tableProfileAllModels];

  if (action) {
    selectedElements = processAllRows(action, true);
  } else {
    selectedElements = processAllRows(Constants.PROFILE_OPTIONS.NOTHING, false);
    activeImage.tableSelectedElements = [];
  }

  imageToGcodeConvertorStore.setSvgElementsToModify(selectedElements);
  imageToGcodeConvertorStore.applySVGChanges();
};

/**
 * Processes all rows in the table with a specified profile option.
 *
 * It updates the `tableProfileModels` and `tableSelectedElements` in the store
 * and creates the `SelectedElementType` objects for all rows.
 *
 * @param {string} option - The profile option to apply ('cut', 'mark', 'engrave', 'nothing').
 * @param {boolean} isSelectAll - Flag to indicate if all rows should be selected.
 * @returns {SelectedElementType[]} - An array of objects representing the selected elements.
 */
const processAllRows = (option: string, isSelectAll: boolean) => {
  const activeImage = imageToGcodeConvertorStore.activeImage;
  if (activeImage) {
    const profileKeys = Object.keys(Constants.PROFILE_OPTIONS);
    const profile =
      profileKeys.find((key) => Constants.PROFILE_OPTIONS[key] === option) ||
      Constants.PROFILE_OPTIONS.NOTHING;

    activeImage.tableSelectedElements = mappingTable.value
      ?.rows as QTableProps['selected'];

    return activeImage.tableSelectedElements?.reduce((elements, row) => {
      activeImage.tableProfileModels[row[activeImage.tableFilterType]] =
        Constants.PROFILE_OPTIONS[profile];
      const selectedElement = getSelectedElementData(
        row[activeImage.tableFilterType],
        row.elements,
        isSelectAll
      );
      elements.push(selectedElement);
      return elements;
    }, []);
  }
  return [];
};

/**
 * Processes profiling for a raster image file.
 *
 * This function simply triggers the application of image changes for a raster image.
 */
const processProfilingForImageFile = () => {
  imageToGcodeConvertorStore.applyImageChanges();
};

/**
 * Handles the change of the filter type (color or shape).
 *
 * This function resets the table, image modifications, and canvas elements
 * to prepare for a new filtering view.
 */
const handleFilterChange = async () => {
  imageToGcodeConvertorStore.isImageLoading = true;
  imageToGcodeConvertorStore.resetMappingTable();
  imageToGcodeConvertorStore.resetAllImageModifications();
  if (imageToGcodeConvertorStore.activeImage)
    imageToGcodeConvertorStore.activeImage.svgElementsToModify = [];
  imageToGcodeConvertorStore.isImageLoading = false;
};

/**
 * Helper function to create a `SelectedElementType` object.
 *
 * It retrieves the necessary data for an element group and creates a deep copy
 * of the elements to prevent direct modification of the original data.
 *
 * @param {string} identifier - The unique identifier for the element group (e.g., color or shape name).
 * @param {INode[]} elements - The array of SVG nodes in the group.
 * @param {boolean} added - A flag indicating if the group was added or removed from selection.
 * @returns {SelectedElementType} - The structured object representing the selected element data.
 */
const getSelectedElementData = (
  identifier: string,
  elements: INode[],
  added: boolean
) => {
  if (imageToGcodeConvertorStore.activeImage) {
    const elementProfileType =
      imageToGcodeConvertorStore.activeImage.tableProfileModels[identifier];
    const selectedElement = {
      identifier,
      elements: structuredClone(toRaw(elements)),
      profileType: elementProfileType,
      added: added,
    };
    return selectedElement;
  }
  return {} as SelectedElementType;
};
</script>
<style scoped>
.color-boxes {
  width: 2rem;
  height: 2rem;
  border: solid black 1px;
  border-radius: 10px;
}

::v-deep(.q-field) {
  font-size: 1.5vh;
  max-width: max(15vh, 15vh);
}
</style>
