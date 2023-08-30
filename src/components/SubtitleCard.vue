<script setup lang="ts">
import { ref, watch, computed } from "vue";

import { Srt, toList, toSrt } from "@/lib/srtParser";
import { VFileInput } from "vuetify/components";

import SubtitleCodeMirror from "./SubtitleCodeMirror.vue";
import { nextTick } from "vue";

const subtitleFileSelector = ref<VFileInput | null>(null);
const subtitleCodeMirrorRef = ref<InstanceType<
  typeof SubtitleCodeMirror
> | null>(null);

const subtitleFile = ref<Array<File>>([]);
const subtitleText = ref<string>("");
const subtitleList = computed<Array<Srt>>(() => toList(subtitleText.value));

const emit = defineEmits(["update-subtitle", "update-time"]);

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
});

const lastGroup = ref<number>(0);

const updateNowGroup = (nowGroup: number) => {
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

const createNewGroup = async () => {
  if (subtitleCodeMirrorRef.value === null) return;

  const lastSubtitle = subtitleList.value[lastGroup.value];

  subtitleCodeMirrorRef.value.createNewGroup({
    index: parseInt(lastSubtitle.id) + 1 + "",
    start: lastSubtitle.startTime,
    end: lastSubtitle.endTime,
    text: lastSubtitle.text,
  });

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
  editCursorLineTime,
});
</script>

<template>
  <v-card max-height="90vh">
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
      />
    </v-card-text>
  </v-card>
</template>

<style scoped></style>
