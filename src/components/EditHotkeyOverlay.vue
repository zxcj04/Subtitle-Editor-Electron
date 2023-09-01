<script setup lang="ts">
import { watch } from "vue";
import { ref, computed, PropType } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  originhotkey: {
    type: Array as PropType<string[]>,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  holdingkeys: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const emit = defineEmits([
  "update:modelValue",
  "update-hotkey",
  "keyup",
  "keydown",
]);

const openOverlay = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  },
});

const hotkey = ref<Set<string>>(new Set());

watch(
  () => props.originhotkey,
  (value) => {
    hotkey.value = new Set(value);
  }
);

const onSave = () => {
  emit("update-hotkey", props.index, hotkey.value);
  inputingNewHotkey.value = false;
  openOverlay.value = false;
};

const onCancel = () => {
  inputingNewHotkey.value = false;
  openOverlay.value = false;
};

const toUpperKeys = (keys: Set<string>) => {
  return Array.from(keys).map((k) => k.toUpperCase());
};

const inputingNewHotkey = ref(false);

const toggleInputingNewHotkey = () => {
  inputingNewHotkey.value = !inputingNewHotkey.value;

  if (inputingNewHotkey.value) {
    hotkey.value = new Set();
  }
};

watch(
  () => props.holdingkeys,
  (value) => {
    if (!props.modelValue) {
      return;
    }
    if (!inputingNewHotkey.value && value.length > 0) {
      hotkey.value = new Set(value);
      inputingNewHotkey.value = true;
    } else if (inputingNewHotkey.value && value.length === 0) {
      inputingNewHotkey.value = false;
    } else if (inputingNewHotkey.value) {
      hotkey.value.add(value[value.length - 1]);
    }
  }
);

const hotkeyDown = (e: KeyboardEvent) => {
  if (!props.modelValue) {
    return;
  }
  emit("keydown", e);
};

const hotkeyUp = (e: KeyboardEvent) => {
  if (!props.modelValue) {
    return;
  }
  emit("keyup", e);
};
</script>

<template>
  <v-dialog
    v-model="openOverlay"
    align="center"
    persistent
    @keydown="hotkeyDown"
    @keyup="hotkeyUp"
  >
    <v-card
      class="ma-auto py-4"
      width="500"
    >
      <v-card-title>{{ props.description }}</v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-chip
              v-for="k in toUpperKeys(hotkey)"
              :key="k"
              class="mx-2"
              label
              outlined
              color="primary"
            >
              {{ k }}
            </v-chip>
            <v-spacer />
            <v-chip
              class="mx-2"
              label
              :color="inputingNewHotkey ? 'green' : 'error'"
              @click="toggleInputingNewHotkey"
            >
              {{ inputingNewHotkey ? "開始輸入" : "修改快捷鍵" }}
              <v-icon class="ml-2">
                {{
                  inputingNewHotkey
                    ? "mdi-record-circle-outline"
                    : "mdi-backspace"
                }}
              </v-icon>
            </v-chip>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          :disabled="inputingNewHotkey"
          color="primary"
          @click="onCancel"
        >
          取消
        </v-btn>
        <v-btn
          :disabled="inputingNewHotkey"
          color="primary"
          @click="onSave"
        >
          儲存
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
