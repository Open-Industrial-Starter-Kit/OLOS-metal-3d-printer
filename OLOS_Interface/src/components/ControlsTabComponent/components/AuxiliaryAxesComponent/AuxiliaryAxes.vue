<template>
  <div
    class="column full-width bg-grey-4 rounded-borders q-pa-md q-gutter-y-md"
  >
    <div class="row items-center justify-between">
      <span class="text-bold auxiliary-title">Powder system axes</span>
      <q-badge color="blue-grey-8" label="Relative movement" />
    </div>

    <div class="routine-panel row items-end q-col-gutter-md">
      <div class="col-12 col-sm-3">
        <q-input
          v-model.number="routineReservoirLift"
          dense
          outlined
          type="number"
          min="0.001"
          step="0.05"
          label="Routine A move"
          suffix="mm"
          :disable="isDisabled"
        />
      </div>
      <div class="col-12 col-sm-3">
        <q-input
          v-model.number="routineRecoaterOut"
          dense
          outlined
          type="number"
          step="1"
          label="Recoater B out"
          suffix="mm"
          :disable="isDisabled"
        />
      </div>
      <div class="col-12 col-sm-3">
        <q-input
          v-model.number="routineRecoaterHome"
          dense
          outlined
          type="number"
          step="0.5"
          label="Recoater B home"
          suffix="mm"
          :disable="isDisabled"
        />
      </div>
      <div class="col-12 col-sm-3">
        <q-input
          v-model.number="routineRecoaterFeed"
          dense
          outlined
          type="number"
          min="1"
          step="100"
          label="Recoater feed"
          suffix="mm/min"
          :disable="isDisabled"
        />
      </div>
      <div class="col-12">
        <q-btn
          class="full-width"
          icon="sync"
          label="Run complete recoating routine"
          color="deep-orange-8"
          :disable="
            isDisabled ||
            !isValid(routineReservoirLift, DEFAULT_RESERVOIR_FEED) ||
            !isValidCoordinate(routineRecoaterOut) ||
            !isValidCoordinate(routineRecoaterHome) ||
            !isValidFeed(routineRecoaterFeed)
          "
          @click="routineConfirmationOpen = true"
        >
          <q-tooltip>
            Park X/Y, lift the reservoir and bed, then sweep the recoater
          </q-tooltip>
        </q-btn>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <div class="axis-panel column q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold">A - Reservoir</span>
            <span class="text-caption">Default feed: 50 mm/min</span>
          </div>

          <div class="row q-col-gutter-sm">
            <q-input
              v-model.number="aStep"
              class="col"
              dense
              outlined
              type="number"
              min="0.001"
              step="0.1"
              label="Step"
              suffix="mm"
              :disable="isDisabled"
            />
            <q-input
              v-model.number="aFeed"
              class="col"
              dense
              outlined
              type="number"
              min="1"
              step="10"
              label="Feed"
              suffix="mm/min"
              :disable="isDisabled"
            />
          </div>

          <div class="row q-gutter-sm">
            <q-btn
              class="col"
              icon="arrow_upward"
              label="Reservoir up"
              color="blue-grey-8"
              :disable="isDisabled || !isValid(aStep, aFeed)"
              @click="moveAxis('A', -aStep, aFeed)"
            >
              <q-tooltip>Send a negative relative A-axis move</q-tooltip>
            </q-btn>
            <q-btn
              class="col"
              icon="arrow_downward"
              label="Reservoir down"
              color="blue-grey-8"
              :disable="isDisabled || !isValid(aStep, aFeed)"
              @click="moveAxis('A', aStep, aFeed)"
            >
              <q-tooltip>Send a positive relative A-axis move</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6">
        <div class="axis-panel column q-gutter-y-sm">
          <div class="row items-center justify-between">
            <span class="text-bold">B - Recoater</span>
            <span class="text-caption">Default feed: 3000 mm/min</span>
          </div>

          <div class="row q-col-gutter-sm">
            <q-input
              v-model.number="bStep"
              class="col"
              dense
              outlined
              type="number"
              min="0.001"
              step="1"
              label="Step"
              suffix="mm"
              :disable="isDisabled"
            />
            <q-input
              v-model.number="bFeed"
              class="col"
              dense
              outlined
              type="number"
              min="1"
              step="100"
              label="Feed"
              suffix="mm/min"
              :disable="isDisabled"
            />
          </div>

          <div class="row q-gutter-sm">
            <q-btn
              class="col"
              icon="arrow_back"
              label="B negative"
              color="blue-grey-8"
              :disable="isDisabled || !isValid(bStep, bFeed)"
              @click="moveAxis('B', -bStep, bFeed)"
            >
              <q-tooltip>Send a negative relative B-axis move</q-tooltip>
            </q-btn>
            <q-btn
              class="col"
              icon="arrow_forward"
              label="B positive"
              color="blue-grey-8"
              :disable="isDisabled || !isValid(bStep, bFeed)"
              @click="moveAxis('B', bStep, bFeed)"
            >
              <q-tooltip>Send a positive relative B-axis move</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <div class="text-caption text-blue-grey-8">
      Controls are enabled only while the machine reports Idle. Start with a
      small step and verify the physical direction before using a larger move.
    </div>

    <q-dialog v-model="routineConfirmationOpen" persistent>
      <q-card class="routine-confirmation">
        <q-card-section>
          <div class="text-h6">Run complete recoating routine?</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          This turns the laser off, parks the laser head, moves A by
          -{{ routineReservoirLift }} mm, moves Z by 0.075 mm, completes the
          B-axis recoater sweep from {{ routineRecoaterOut }} to
          {{ routineRecoaterHome }} at {{ routineRecoaterFeed }} mm/min, and
          leaves the laser head at the recoater parking position. Confirm that
          the full machine path is clear.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" color="blue-grey-8" />
          <q-btn
            v-close-popup
            unelevated
            label="Run routine"
            color="deep-orange-8"
            @click="runRoutine"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Constants } from 'src/constants';
import { useJogControlsStore } from 'src/stores/jog-controls';
import { useMachineStatusStore } from 'src/stores/machine-status';

const jogControlsStore = useJogControlsStore();
const machineStatusStore = useMachineStatusStore();
const { machineState } = storeToRefs(machineStatusStore);

const DEFAULT_RESERVOIR_FEED = 50;

const aStep = ref(0.2);
const aFeed = ref(DEFAULT_RESERVOIR_FEED);
const bStep = ref(1);
const bFeed = ref(3000);
const routineReservoirLift = ref(0.2);
const routineRecoaterOut = ref(-405);
const routineRecoaterHome = ref(-54.5);
const routineRecoaterFeed = ref(3000);
const routineConfirmationOpen = ref(false);

const isDisabled = computed(() => machineState.value !== Constants.IDLE);

const isValid = (step: number, feed: number) =>
  Number.isFinite(step) && step > 0 && Number.isFinite(feed) && feed > 0;
const isValidCoordinate = (value: number) => Number.isFinite(value);
const isValidFeed = (feed: number) => Number.isFinite(feed) && feed > 0;

const moveAxis = (axis: 'A' | 'B', distance: number, feed: number) => {
  if (!isDisabled.value && isValid(Math.abs(distance), feed)) {
    jogControlsStore.auxiliaryAxisJog(axis, distance, feed);
  }
};

const runRoutine = () => {
  if (
    !isDisabled.value &&
    isValid(routineReservoirLift.value, DEFAULT_RESERVOIR_FEED) &&
    isValidCoordinate(routineRecoaterOut.value) &&
    isValidCoordinate(routineRecoaterHome.value) &&
    isValidFeed(routineRecoaterFeed.value)
  ) {
    jogControlsStore.runPowderRoutine({
      reservoirLift: routineReservoirLift.value,
      recoaterOut: routineRecoaterOut.value,
      recoaterHome: routineRecoaterHome.value,
      recoaterFeed: routineRecoaterFeed.value,
    });
  }
};
</script>

<style scoped>
.auxiliary-title {
  font-size: 2vh;
}

.axis-panel {
  min-height: 150px;
}

.routine-panel {
  padding-bottom: 4px;
}

.routine-confirmation {
  width: min(520px, 90vw);
}
</style>
