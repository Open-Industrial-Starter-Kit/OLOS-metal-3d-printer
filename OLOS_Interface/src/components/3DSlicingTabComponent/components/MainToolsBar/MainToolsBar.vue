<template>
  <q-toolbar class="tool-bar">
    <file-tools />
    <view-tools />
    <add-meshes-tools />
    <printing-tools />
  </q-toolbar>
</template>
<script setup lang="ts">
import FileTools from 'src/components/3DSlicingTabComponent/components/MainToolsBar/components/FileTools.vue';
import ViewTools from 'src/components/3DSlicingTabComponent/components/MainToolsBar/components/ViewTools.vue';
import AddMeshesTools from 'src/components/3DSlicingTabComponent/components/MainToolsBar/components/AddMeshesTools.vue';
import PrintingTools from 'src/components/3DSlicingTabComponent/components/MainToolsBar/components/PrintingTools.vue';
</script>

<style lang="scss" scoped>
.tool-bar {
  position: absolute;
  border-bottom: 2px solid $grey-5;
  color: white;
  background-color: black;
}
</style>
