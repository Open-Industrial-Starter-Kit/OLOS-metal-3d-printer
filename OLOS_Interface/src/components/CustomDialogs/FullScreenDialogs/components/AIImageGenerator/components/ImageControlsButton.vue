<template>
  <q-carousel-control position="bottom-right" :offset="[18, 18]">
    <q-fab
      color="red-5"
      direction="up"
      :model-value="!isLoadingImages"
      :disable="isLoadingImages"
    >
      <template v-slot:icon="{ opened }">
        <q-icon
          :class="{
            'example-fab-animate--hover': opened !== true,
          }"
          name="keyboard_arrow_up"
        />
      </template>

      <template v-slot:active-icon="{ opened }">
        <q-icon
          :class="{ 'example-fab-animate': opened === true }"
          name="close"
        />
      </template>

      <q-fab-action
        color="secondary"
        external-label
        @click="handleFullScreen"
        :icon="isFullScreen ? 'fullscreen_exit' : 'fullscreen'"
        :label="isFullScreen ? 'Close Full Screen' : 'Full Screen'"
        label-position="left"
      />

      <q-fab-action
        color="positive"
        external-label
        @click="handleDownloadImage"
        label-position="left"
      >
        <template v-slot:icon>
          <q-icon name="download" />
        </template>
        <template v-slot:label> Download </template>
      </q-fab-action>

      <q-fab-action
        color="pink-4"
        external-label
        @click="handleSaveImage"
        icon="save"
        label="Save Image"
        label-position="left"
      />

      <q-fab-action
        color="warning"
        external-label
        @click="handleUseImage"
        icon="edit"
        label="Use Image"
        label-position="left"
      />
    </q-fab>
  </q-carousel-control>
</template>
<script setup lang="ts">
/**
 * Defines the props for the ImageControlsButton component.
 *
 * @property {boolean} isFullScreen - Indicates whether the image is currently in full-screen mode.
 * @property {boolean} isLoadingImages - Indicates whether images are currently being generated.
 * @property {Function} handleFullScreen - A callback function to toggle full-screen mode.
 * @property {Function} handleUseImage - A callback function to initiate the process of using the image.
 * @property {Function} handleSaveImage - A callback function to initiate the process of saving the image.
 * @property {Function} handleDownloadImage - A callback function to initiate the process of downloading the image.
 */
defineProps<{
  isFullScreen: boolean;
  isLoadingImages: boolean;
  handleFullScreen: () => void;
  handleUseImage: () => void;
  handleSaveImage: () => void;
  handleDownloadImage: () => void;
}>();
</script>
