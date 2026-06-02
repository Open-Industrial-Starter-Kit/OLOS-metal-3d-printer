<template>
  <div
    v-if="isMachineContainsToolsChanger"
    class="column full-width q-gutter-sm bg-grey-4 rounded-borders"
  >
    <span v-if="machineToolsList" class="text-bold" style="font-size: 2vh">
      Tools Changer
    </span>
    <q-list class="row items-center justify-between q-gutter-md q-pa-md">
      <template v-for="(tool, index) in machineToolsList" :key="index">
        <q-btn
          :label="tool.name"
          color="white"
          text-color="black"
          class="button-size col-lg col-md col-sm-3 col-xs-3"
          push
          @click="toolsChangerStore.useTool(tool)"
          :disable="machineState !== Constants.IDLE"
        />
      </template>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { Config } from 'src/interfaces/configSettings.interface';
import { storeToRefs } from 'pinia';
import { Constants } from 'src/constants';
import { useMachineStatusStore } from 'src/stores/machine-status';
import { computed } from 'vue';
import { useToolsChangerStore } from 'src/stores/tools-changer';

/**
 * Props:
 * - config: Config | null — machine configuration, can be used to customize behavior based on machine type.
 */
const props = defineProps<{
  config: Config | null;
}>();

/**
 * Stores
 */
const machineStatusStore = useMachineStatusStore();
const toolsChangerStore = useToolsChangerStore();

/**
 * Extracted store state
 */
const { machineState } = storeToRefs(machineStatusStore);

/**
 * Computed property:
 * Returns `true` if the loaded configuration indicates that
 * the machine has a tool changer feature enabled.
 */
const isMachineContainsToolsChanger = computed(() => {
  if (
    (props.config?.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER &&
      props.config.laser_cutter_settings?.tool_changer) ||
    (props.config?.machine_type === Constants.MACHINE_TYPE.CNC &&
      props.config.cnc_settings?.tool_changer)
  ) {
    return true;
  }
  return false;
});

/**
 * Computed property:
 * Retrieves the list of tools available for the current machine type.
 * Returns an empty array if no matching machine type is found.
 */
const machineToolsList = computed(() => {
  if (props.config?.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER) {
    return props.config.laser_cutter_settings?.tools;
  } else if (props.config?.machine_type === Constants.MACHINE_TYPE.CNC) {
    return props.config.cnc_settings?.tools;
  } else return [];
});
</script>
<style scoped>
.button-size {
  font-size: 1.5vh;
  height: 7vh;
  max-width: max(15vh, 15vw);
}
</style>
