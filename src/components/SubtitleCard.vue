<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";

import { Srt, toList, toSrt } from "@/lib/srtParser";
import { VFileInput } from "vuetify/components";

import SubtitleCodeMirror from "./SubtitleCodeMirror.vue";

const subtitleFileSelector = ref<VFileInput | null>(null);
const subtitleCodeMirrorRef = ref<InstanceType<
  typeof SubtitleCodeMirror
> | null>(null);

const subtitleFile = ref<Array<File>>([]);
const subtitleText = ref<string>("");
const subtitleList = computed<Array<Srt>>(() => toList(subtitleText.value));

const emit = defineEmits(["update-subtitle", "update-time", "onEditorFocus"]);

const readFile = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text === "string") {
        resolve(text);
      } else {
        reject("Error reading file");
      }
    };
    reader.onerror = reject;
    return reader.readAsText(file);
  });
};

const onSubtitleFileChange = async () => {
  if (subtitleFile.value.length === 0) {
    return false;
  }

  subtitleText.value = "";

  const file = subtitleFile.value[0];
  await readFile(file)
    .then((result) => {
      subtitleText.value = toSrt(toList(result));
      // emit("update-subtitle", subtitleText.value);
    })
    .catch((error) => {
      alert(error);
    });
};

watch(subtitleFile, onSubtitleFileChange);
watch(subtitleText, () => {
  emit("update-subtitle", subtitleText.value);
  updateNowGroup(lastGroup.value);
});

const lastGroup = ref<number>(0);

const updateNowGroup = (nowGroup: number) => {
  if (subtitleList.value.length <= nowGroup) {
    return false;
  }

  lastGroup.value = nowGroup;

  if (subtitleList.value.length === 0) {
    return false;
  }

  let t = subtitleList.value[nowGroup].startSeconds;
  if (t < 0) t = 0;

  const duration =
    subtitleList.value[nowGroup].endSeconds -
    subtitleList.value[nowGroup].startSeconds;

  emit("update-time", t, duration);
};

const initWithoutFile = () => {
  subtitleCodeMirrorRef.value?.initWithoutFile();
};

const createNewGroup = async (t: string) => {
  if (subtitleCodeMirrorRef.value === null) return;

  if (subtitleList.value.length == 0) {
    initWithoutFile();
    return;
  }

  const id = subtitleList.value[lastGroup.value].id;

  subtitleCodeMirrorRef.value.createNewGroup({
    index: id,
    start: t,
    end: t,
    text: "",
  });

  await nextTick();
};

const copyNowGroup = async (nowTimeString: string) => {
  if (subtitleCodeMirrorRef.value === null) return;

  const lastSubtitle = subtitleList.value[lastGroup.value];

  subtitleCodeMirrorRef.value.copyNowGroup(
    {
      index: lastSubtitle.id,
      start: lastSubtitle.startTime,
      end: lastSubtitle.endTime,
      text: lastSubtitle.text,
    },
    nowTimeString
  );

  await nextTick();
};

const jumpToNextGroup = () => {
  if (subtitleCodeMirrorRef.value === null) return;

  subtitleCodeMirrorRef.value.jumpToNextGroup();
};

const jumpToPrevGroup = () => {
  if (subtitleCodeMirrorRef.value === null) return;

  subtitleCodeMirrorRef.value.jumpToPrevGroup();
};

const editCursorLineTime = (time: string) => {
  if (subtitleCodeMirrorRef.value === null) return;

  subtitleCodeMirrorRef.value.editCursorLineTime(time);
};

defineExpose({
  jumpToNextGroup,
  jumpToPrevGroup,
  createNewGroup,
  copyNowGroup,
  editCursorLineTime,
});
</script>

<template>
  <v-card max-height="70vh">
    <v-card-text>
      <v-file-input
        ref="subtitleFileSelector"
        v-model="subtitleFile"
        accept=".srt"
        label="匯入字幕檔"
        :multiple="false"
        :clearable="false"
      />
      <SubtitleCodeMirror
        ref="subtitleCodeMirrorRef"
        v-model:subtitle="subtitleText"
        @update-now-group="updateNowGroup"
        @onfocus="emit('onEditorFocus')"
      />
    </v-card-text>
  </v-card>
</template>

<style scoped></style>
