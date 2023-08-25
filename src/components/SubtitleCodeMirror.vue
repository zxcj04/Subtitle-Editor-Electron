<script setup lang="ts">
import { shallowRef, computed } from "vue";

import { Codemirror } from "vue-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorState } from "@codemirror/state";
import { EditorView } from "codemirror";
import { ViewUpdate } from "@codemirror/view";

const props = defineProps({
  subtitle: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:subtitle", "update-now-group"]);

const subtitle = computed({
  get() {
    return props.subtitle;
  },
  set(value) {
    emit("update:subtitle", value);
  },
});

const extensions = [oneDark];

// Codemirror EditorView instance ref
const view = shallowRef<EditorView>();
const handleReady = (payload: {
  view: EditorView;
  state: EditorState;
  container: HTMLDivElement;
}) => {
  console.log(payload);
  view.value = payload.view;
};

const onViewUpdate = (cm: ViewUpdate) => {
  const line = cm.state.doc.lineAt(cm.state.selection.main.head).number - 1;
  const nowGroup = Math.floor(line / 4);
  emit("update-now-group", nowGroup);
};
</script>

<template>
  <codemirror
    v-model="subtitle"
    placeholder="空空如也~~"
    :style="{ height: '70vh' }"
    :indent-with-tab="true"
    :tab-size="2"
    :extensions="extensions"
    @ready="handleReady"
    @update="onViewUpdate"
  />
</template>

<style scoped>
.textarea {
  width: 100%;
  min-height: 100px;
  height: max-content;
  overflow: auto;
  white-space: pre-wrap; /* 設定換行的行為像是 <pre> */
  padding: 5px;
}
</style>
