<template>
  <q-dialog ref="dialogRef" persistent maximized @hide="onDialogHide">
    <q-card class="column no-wrap">
      <q-card-section class="row items-center justify-between q-py-sm">
        <div class="text-h6">{{ filename }}</div>
        <div class="row q-gutter-sm">
          <q-btn
            flat
            round
            icon="visibility"
            :disable="!editedContent"
            @click="previewChanges"
          >
            <q-tooltip>Preview changes</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            icon="save"
            :loading="isSaving"
            :disable="!hasChanges"
            @click="saveChanges"
          >
            <q-tooltip>Save G-code</q-tooltip>
          </q-btn>
          <q-btn flat round icon="close" @click="onDialogCancel">
            <q-tooltip>Close editor</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="col q-pa-none">
        <q-input
          v-model="editedContent"
          type="textarea"
          borderless
          autogrow
          spellcheck="false"
          input-class="gcode-editor-input"
          class="fit gcode-editor"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { useJobsFilesManagementStore } from 'src/stores/jobs-files-management';

const props = defineProps<{
  filename: string;
  fileContent: string;
  saveJob: (fileContent: string) => Promise<void>;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const jobManagerStore = useJobsFilesManagementStore();

const editedContent = ref(props.fileContent);
const isSaving = ref(false);

const hasChanges = computed(() => editedContent.value !== props.fileContent);

const previewChanges = () => {
  jobManagerStore.fileData.fileContent = editedContent.value;
};

const saveChanges = async () => {
  isSaving.value = true;
  try {
    await props.saveJob(editedContent.value);
    onDialogCancel();
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped lang="scss">
.gcode-editor {
  height: 100%;
  overflow: auto;
  background: #101418;
}

:deep(.gcode-editor-input) {
  min-height: calc(100vh - 74px);
  padding: 16px;
  color: #e8edf2;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.45;
  white-space: pre;
  overflow-wrap: normal;
}
</style>
