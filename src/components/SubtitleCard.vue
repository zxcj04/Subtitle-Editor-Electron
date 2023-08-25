<script setup lang="ts">
import { ref, watch } from "vue";

import { toList, toSrt } from "@/lib/srtParser";
import { VFileInput } from "vuetify/components";

import SubtitleCodeMirror from "./SubtitleCodeMirror.vue";

const subtitleFileSelector = ref<VFileInput | null>(null);

const subtitleFile = ref<Array<File>>([]);
const subtitleText = ref<string>("");

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
    })
    .catch((error) => {
      alert(error);
    });
};

watch(subtitleFile, onSubtitleFileChange);

const updateNowGroup = (nowGroup: number) => {
  console.log("updateNowGroup", nowGroup);
};
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
        v-model:subtitle="subtitleText"
        @update-now-group="updateNowGroup"
      />
    </v-card-text>
  </v-card>
</template>

<style scoped></style>
