<template>
  <q-card class="error-box">
    <div class="row flex-center">
      <q-icon name="warning" color="warning" size="md" class="col-2" />
      <div class="column items-start q-pa-sm col">
        <span class="text-h7 text-bold">ERROR:</span>
        <span>
          An object outside the print area was detected. Resolve the current
          problem to continue slicing.
        </span>
      </div>
    </div>
  </q-card>
</template>
<style scoped lang="scss">
.error-box {
  position: absolute;
  top: 8vh;
  right: 0.5vw;
  max-width: 30vw;
  background-color: $red-6;
  color: white;
}
</style>
