<script setup lang="ts">
import { ref } from "vue";
import useHotkey, { HotKey } from "vue3-hotkey";

import SubtitleCard from "@/components/SubtitleCard.vue";
import VideoCard from "@/components/VideoCard.vue";

const subtitleCardRef = ref<InstanceType<typeof SubtitleCard> | null>(null);
const videoCardRef = ref<InstanceType<typeof VideoCard> | null>(null);

function isValidSRT(content: string) {
  // 分割每一個段落
  const blocks = content.trim().split("\n\n");

  for (const block of blocks) {
    const lines = block.split("\n");

    // 檢查是否至少有3行 (序號、時間、字幕)
    if (lines.length < 3) {
      return false;
    }

    // 檢查序號是否為正整數
    if (!/^\d+$/.test(lines[0])) {
      return false;
    }

    // 檢查時間格式
    const timePattern = /^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/;
    if (!timePattern.test(lines[1])) {
      return false;
    }

    // 可以增加更多檢查，例如檢查開始時間是否小於結束時間等...
  }

  return true;
}

function convertSRTtoVTT(srtContent: string) {
  // Replace commas in timecodes with periods (for milliseconds)
  let vttContent = srtContent.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");

  // Add WEBVTT header
  vttContent = "WEBVTT\n\n" + vttContent;

  return vttContent;
}

const updateSubtitle = (s: string) => {
  if (videoCardRef.value === null) {
    return false;
  }

  videoCardRef.value.pause();

  if (!isValidSRT(s)) {
    return false;
  }

  videoCardRef.value.updateSubtitle(convertSRTtoVTT(s));
};

const nowGroupTime = ref<number>(0);
const nowGroupDuration = ref<number>(0);

const updateNowGroup = (time: number, duration: number) => {
  nowGroupTime.value = time;
  nowGroupDuration.value = duration;
};

const updateVideoTime = () => {
  if (videoCardRef.value === null) {
    return false;
  }

  videoCardRef.value.updatePlayingTime(nowGroupTime.value, nowGroupDuration.value);
};

interface HotKeyInfo {
  key: HotKey;
  info: string;
}

const hotkeysInfo = ref<HotKeyInfo[]>([
  {
    key: {
      keys: ["ctrl", "alt", "e"],
      repeat: true,
      preventDefault: true,
      handler() {
        videoCardRef.value?.nextFrame();
      },
    },
    info: "下一幀",
  },
  {
    key: {
      keys: ["ctrl", "alt", "q"],
      repeat: true,
      preventDefault: true,
      handler() {
        videoCardRef.value?.previousFrame();
      },
    },
    info: "上一幀",
  },
  {
    key: {
      keys: ["ctrl", "alt", "w"],
      preventDefault: true,
      handler() {
        videoCardRef.value?.togglePlay();
      },
    },
    info: "播放/暫停",
  },
  {
    key: {
      keys: ["ctrl", "alt", "r"],
      preventDefault: true,
      handler() {
        updateVideoTime();
      },
    },
    info: "套用目前字幕時間",
  },
  {
    key: {
      keys: ["ctrl", "alt", "a"],
      preventDefault: true,
      handler() {
        videoCardRef.value?.backward();
      },
    },
    info: "後退 (10s)",
  },
  {
    key: {
      keys: ["ctrl", "alt", "s"],
      preventDefault: true,
      handler() {
        videoCardRef.value?.togglePlaybackRate();
      },
    },
    info: "切換播放速度 (1x / 2x)",
  },
  {
    key: {
      keys: ["ctrl", "alt", "d"],
      preventDefault: true,
      handler() {
        videoCardRef.value?.forward();
      },
    },
    info: "前進 (5s)",
  },
  {
    key: {
      keys: ["ctrl", "alt", "z"],
      preventDefault: true,
      handler() {
        subtitleCardRef.value?.jumpToPrevGroup();
      },
    },
    info: "上一組字幕",
  },
  {
    key: {
      keys: ["ctrl", "alt", "x"],
      preventDefault: true,
      handler() {
        subtitleCardRef.value?.jumpToNextGroup();
      },
    },
    info: "下一組字幕",
  },
  {
    key: {
      keys: ["ctrl", "alt", "c"],
      preventDefault: true,
      handler() {
        subtitleCardRef.value?.createNewGroup();
      },
    },
    info: "複製目前字幕到下一組",
  },
  {
    key: {
      keys: ["ctrl", "alt", "v"],
      preventDefault: true,
      handler() {
        const t =
          videoCardRef.value?.getNowPlayingTimeString() || "00:00:00.000";
        subtitleCardRef.value?.editCursorLineTime(t);
      },
    },
    info: "套用目前影片時間",
  },
]);

const hotkeys = ref<HotKey[]>(hotkeysInfo.value.map((h) => h.key));

const toUpperKeys = (keys: string[]) => {
  return keys.map((k) => k.toUpperCase());
};

useHotkey(hotkeys.value);

window.onbeforeunload = () => {
  return "Are you sure you want to leave?";
};
</script>

<template>
  <v-container>
    <v-row
      align="center"
      justify="center"
    >
      <v-col
        cols="12"
        md="2"
      >
        <v-card
          v-for="k in hotkeysInfo"
          :key="k.info"
        >
          <v-card-text>
            <v-chip
              color="primary"
              label
            >
              {{ toUpperKeys(k.key.keys).join(" + ") }}
            </v-chip>
            {{ k.info }}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col
        cols="12"
        md="5"
      >
        <SubtitleCard
          ref="subtitleCardRef"
          @update-subtitle="updateSubtitle"
          @update-time="updateNowGroup"
        />
      </v-col>
      <v-col
        cols="12"
        md="5"
      >
        <VideoCard ref="videoCardRef" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
