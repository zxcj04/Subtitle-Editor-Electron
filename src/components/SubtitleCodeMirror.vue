<script setup lang="ts">
import { ref, shallowRef, computed } from "vue";

import { Codemirror } from "vue-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "codemirror";
import { ViewUpdate } from "@codemirror/view";
import { srt } from "codemirror-lang-srt";

const codemirrorRef = ref<InstanceType<typeof Codemirror> | null>(null);

const props = defineProps({
  subtitle: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:subtitle", "update-now-group", "onfocus"]);

const subtitle = computed({
  get() {
    return props.subtitle;
  },
  set(value) {
    emit("update:subtitle", value);
  },
});

const extensions = [oneDark, srt()];

// Codemirror EditorView instance ref
const view = shallowRef<EditorView>();
const container = shallowRef<HTMLDivElement | null>(null);
const handleReady = (cm: {
  view: EditorView;
  state: EditorState;
  container: HTMLDivElement;
}) => {
  view.value = cm.view;
  container.value = cm.container;
};

const lastGroup = shallowRef<number>(0);

const onGroupUpdate = (nowGroup: number, state: EditorState) => {
  if (nowGroup !== lastGroup.value) {
    lastGroup.value = nowGroup;
    emit("update-now-group", nowGroup);

    if (view.value !== undefined) {
      const nowLineTop = view.value.lineBlockAt(state.selection.main.head).top;
      view.value.scrollDOM.scroll({
        top: nowLineTop - view.value.defaultLineHeight * 5,
        behavior: "smooth",
      });
    }
  }
};

const sumUpGroupLines = () => {
  const groups = subtitle.value.split("\n\n");
  const groupsLines = groups.map((g) => g.split("\n").length);
  return groupsLines.reduce((prev, cur) => {
    if (prev.length > 0) prev.push(cur + prev[prev.length - 1] + 1);
    else prev.push(cur + 1);
    return prev;
  }, Array<number>(0));
};

const whichGroup = (line: number) => {
  const groupSumLines = sumUpGroupLines();
  const index = groupSumLines.findIndex((g) => g > line - 1);
  return index >= 0 ? index : 0;
};

const whichLine = (group: number) => {
  const groupSumLines = sumUpGroupLines();
  if (groupSumLines.length < 1) return [1, 0];
  const groupLine = group !== 0 ? groupSumLines[group - 1] + 1 : 1;
  const gorupLineCount =
    group !== 0
      ? groupSumLines[group] - groupSumLines[group - 1]
      : groupSumLines[group];
  return [groupLine, gorupLineCount];
};

const onViewUpdate = (update: ViewUpdate) => {
  const line = update.state.doc.lineAt(update.state.selection.main.head).number;
  const nowGroup = whichGroup(line);

  onGroupUpdate(nowGroup, update.state);
};

const jumpToLine = (line: number) => {
  if (view.value !== undefined) {
    const pos = view.value.state.doc.line(line).from;
    view.value.dispatch({
      selection: EditorSelection.cursor(pos),
    });
  }
};

interface group {
  index: string;
  start: string;
  end: string;
  text: string;
}

const initWithoutFile = () => {
  if (view.value !== undefined) {
    view.value.dispatch({
      changes: {
        from: 0,
        insert: "1\n00:00:00,000 --> 00:00:00,000\n\n\n",
      },
      selection: EditorSelection.cursor(0),
    });
  }

  const group = whichGroup(0);
  onGroupUpdate(group, view.value!.state);
};

const createNewGroup = (g: group) => {
  if (view.value === undefined) {
    return;
  }

  const [lastGroupLine, lastGroupLineCount] = whichLine(lastGroup.value);
  const nextGroup = lastGroup.value + 1;

  const pos = view.value.state.doc.line(
    lastGroupLine + lastGroupLineCount - 1
  ).to;
  view.value.dispatch({
    changes: {
      from: pos,
      insert: `\n\n${g.index}\n${g.start} --> ${g.end}\n${g.text}`,
    },
    selection: EditorSelection.cursor(pos),
  });

  onGroupUpdate(nextGroup, view.value.state);
};

const copyNowGroup = (g: group, nowTimeString: string) => {
  if (view.value === undefined) {
    return;
  }

  const line = view.value.state.doc.lineAt(
    view.value.state.selection.main.head
  );
  const posInLine = view.value.state.selection.main.head - line.from;
  const lineText = line.text;

  const [lastGroupLine, lastGroupLineCount] = whichLine(lastGroup.value);
  const nextGroup = lastGroup.value + 1;

  console.log(lastGroupLine, lastGroupLineCount);

  let oldText = g.text;
  let newText = g.text;

  let isSplit = true;

  if (line.number >= lastGroupLine && line.number <= lastGroupLine + 1)
    isSplit = false;

  if (isSplit) {
    oldText = lineText.slice(0, posInLine).trim();
    newText = lineText.slice(posInLine).trim();
  }

  const oldGroupPos = view.value.state.doc.line(lastGroupLine).from;
  const newGroupPos = view.value.state.doc.line(
    lastGroupLine + lastGroupLineCount - 1
  ).to;

  view.value.dispatch({
    changes: {
      from: oldGroupPos,
      to: newGroupPos,
      insert: `${g.index}\n${g.start} --> ${nowTimeString}\n${oldText}\n\n${g.index}\n${nowTimeString} --> ${g.end}\n${newText}\n`,
    },
    selection: EditorSelection.cursor(oldGroupPos),
  });

  onGroupUpdate(nextGroup, view.value.state);
};

const jumpToNextGroup = () => {
  if (view.value === undefined) {
    return;
  }

  const nextGroup = lastGroup.value + 1;
  const nextGroupLine = nextGroup * 4 + 2;
  const maxLines = view.value.state.doc.lines || 0;
  if (nextGroupLine < maxLines) {
    jumpToLine(nextGroupLine);
    onGroupUpdate(nextGroup, view.value.state);
  }
};

const jumpToPrevGroup = () => {
  if (view.value === undefined) {
    return;
  }

  const prevGroup = lastGroup.value - 1;
  if (prevGroup >= 0) {
    const prevGroupLine = prevGroup * 4 + 2;
    jumpToLine(prevGroupLine);
    onGroupUpdate(prevGroup, view.value.state);
  }
};

const editCursorLineTime = (t: string) => {
  if (view.value === undefined) {
    return;
  }

  const line = view.value.state.doc.lineAt(
    view.value.state.selection.main.head
  );
  const posInLine = view.value.state.selection.main.head - line.from;
  const lineText = line.text;

  const [lastGroupLine, _] = whichLine(lastGroup.value);

  if (line.number !== lastGroupLine + 1)
    return;

  const isStart = posInLine < 12;
  const isEnd = posInLine >= 17;

  if (isStart || isEnd) {
    const newLineText = isStart
      ? `${t} --> ${lineText.slice(17)}`
      : `${lineText.slice(0, 12)} --> ${t}`;
    const pos = view.value.state.doc.line(line.number).from;
    const posEnd = view.value.state.doc.line(line.number).to;
    view.value.dispatch({
      changes: {
        from: pos,
        to: posEnd,
        insert: newLineText,
      },
      selection: EditorSelection.cursor(pos + posInLine),
    });
  }
};

const forceFocusOnEditor = () => {
  if (view.value !== undefined) {
    view.value.focus();
  }
};

const emitFocus = () => {
  emit("onfocus");
};

defineExpose({
  jumpToLine,
  jumpToNextGroup,
  jumpToPrevGroup,
  initWithoutFile,
  createNewGroup,
  copyNowGroup,
  editCursorLineTime,
  forceFocusOnEditor,
});
</script>

<template>
  <codemirror
    ref="codemirrorRef"
    v-model="subtitle"
    placeholder="空空如也~~"
    :style="{ height: '60vh' }"
    :indent-with-tab="true"
    :tab-size="2"
    :extensions="extensions"
    :autofocus="true"
    @ready="handleReady"
    @update="onViewUpdate"
    @focus="emitFocus"
  />
</template>

<style scoped></style>
