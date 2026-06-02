<template>
  <div class="column fit col items-center justify-evenly q-gutter-y-sm q-px-md">
    <div class="row full-width justify-between q-gutter-sm">
      <critical-buttons :config />
      <jog-step :config />
      <jog-speed :config />
    </div>
    <jog-buttons :config />
    <tools-changer
      v-if="config?.machine_type !== Constants.MACHINE_TYPE.VINYL_CUTTER"
      :config="config"
    />
    <override-file-settings :config="config" />
  </div>
</template>

<script setup lang="ts">
import CriticalButtons from './components/CriticalButtonsComponent/CriticalButtons.vue';
import JogStep from './components/JogStepComponent/JogStep.vue';
import JogSpeed from './components/JogSpeedComponent/JogSpeed.vue';
import JogButtons from './components/JogButtonsComponent/JogButtons.vue';
import OverrideFileSettings from './components/OverrideSettingsComponent/OverrideSettings.vue';
import ToolsChanger from './components/ToolsChangerComponent/ToolsChanger.vue';
import { onMounted, ref } from 'vue';
import { Config } from 'src/interfaces/configSettings.interface';
import { configurationSettings } from 'src/services/configuration.loader.service';
import { Constants } from 'src/constants';

/**
 * Reactive reference to hold the machine configuration.
 */
const config = ref<Config | null>(null);

/**
 * Lifecycle hook:
 * Fetch the machine configuration when the component mounts.
 */
onMounted(async () => {
  config.value = await configurationSettings();
});
</script>
