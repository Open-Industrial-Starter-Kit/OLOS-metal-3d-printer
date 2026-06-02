<template>
  <div class="column q-gutter-y-md q-pb-md">
    <div class="row items-center q-gutter-sm">
      <q-btn
        label="-10%"
        class="button-size"
        icon="fast_rewind"
        color="white"
        text-color="blue-grey-10"
        push
        stack
        @click="overrideSettingsStore.decreaseToolPowerTenPercent"
        :disable="toolPower < 10"
      />
      <q-btn
        class="button-size"
        color="white"
        text-color="blue-grey-10"
        push
        stack
        @click="overrideSettingsStore.decreaseToolPowerOnePercent"
        :disable="toolPower < 1"
      >
        <q-icon name="play_arrow" class="rotate-180" />
        <span>-1%</span>
      </q-btn>
      <div class="column items-center">
        <span
          v-if="config?.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER"
          class="small-font"
          >Laser Power</span
        >
        <span
          v-else-if="config?.machine_type === Constants.MACHINE_TYPE.CNC"
          class="small-font"
          >Spindle Speed</span
        >
        <span
          v-else-if="
            config?.machine_type === Constants.MACHINE_TYPE.VINYL_CUTTER
          "
          class="small-font"
          >Tool Power</span
        >
        <span
          v-else-if="
            config?.machine_type === Constants.MACHINE_TYPE.THREE_D_PRINTER
          "
          class="small-font"
          >Extruder Power</span
        >
        <span class="large-font">{{ toolPower }}%</span>
      </div>
      <q-btn
        label="+1%"
        class="button-size"
        icon="play_arrow"
        color="white"
        text-color="blue-grey-10"
        push
        stack
        @click="overrideSettingsStore.increaseToolPowerOnePercent"
        :disable="toolPower > 129"
      />
      <q-btn
        label="+10%"
        class="button-size"
        icon="fast_forward"
        color="white"
        text-color="blue-grey-10"
        push
        stack
        @click="overrideSettingsStore.increaseToolPowerTenPercent"
        :disable="toolPower > 120"
      />
    </div>
    <q-btn
      label="Default Tool Power"
      icon="restart_alt"
      color="white"
      class="full-width button-size"
      text-color="blue-grey-10"
      push
      stack
      @click="overrideSettingsStore.defaultToolPower"
    />
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { Config } from 'src/interfaces/configSettings.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { useOverrideSettingsStore } from 'src/stores/override-settings';
import { onMounted, ref } from 'vue';
import { Constants } from 'src/constants';

/**
 * Pinia store for managing override settings (e.g., tool power adjustments).
 */
const overrideSettingsStore = useOverrideSettingsStore();
const { toolPower } = storeToRefs(overrideSettingsStore); // Current tool power override value

/**
 * Holds the loaded machine configuration object.
 * Initially null until data is fetched.
 */
const config = ref<Config | null>(null);

/**
 * Lifecycle hook:
 * Loads the machine configuration from once the component is mounted.
 */
onMounted(async () => {
  config.value = await configurationSettings();
});
</script>
