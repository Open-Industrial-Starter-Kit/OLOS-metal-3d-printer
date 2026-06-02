<template>
  <q-page>
    <gcode-generator
      v-if="config?.machine_type === Constants.MACHINE_TYPE.LASER_CUTTER"
    />
  </q-page>
</template>

<script setup lang="ts">
import GcodeGenerator from 'src/components/GcodeGeneratorTabComponent/GcodeGeneratorTabComponent.vue';
import { Constants } from 'src/constants';
import { Config } from 'src/interfaces/configSettings.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { onMounted, ref } from 'vue';

/**
 * A reactive variable to store the machine's configuration settings.
 * It's initialized to `null` and populated asynchronously on component mount.
 * @type {ref<Config | null>}
 */
const config = ref<Config | null>(null);

/**
 * The `onMounted` lifecycle hook is used here to perform asynchronous data fetching
 * as soon as the component is mounted to the DOM.
 *
 * This function calls the `configurationSettings` service to load the application's
 * configuration and assigns the result to the `config` ref. This ensures that
 * the configuration data is available for use by this component and its template.
 */
onMounted(async () => {
  config.value = await configurationSettings();
});
</script>
