<script setup lang="ts">
import { ref } from "vue";

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

  videoCardRef.value.updatePlayingTime(
    nowGroupTime.value,
    nowGroupDuration.value
  );
};

interface HotKey {
  keys: string[];
  repeat?: boolean;
  preventDefault?: boolean;
  handler: () => void;
}

interface HotKeyInfo {
  key: HotKey;
  info: string;
}

const hotkeysInfo = ref<HotKeyInfo[]>([
  {
    key: {
      keys: ["alt", "e"],
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
      keys: ["alt", "q"],
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
      keys: ["alt", "w"],
      preventDefault: true,
      handler() {
        videoCardRef.value?.togglePlay();
      },
    },
    info: "播放/暫停",
  },
  {
    key: {
      keys: ["alt", "r"],
      preventDefault: true,
      handler() {
        updateVideoTime();
      },
    },
    info: "套用目前字幕時間",
  },
  {
    key: {
      keys: ["alt", "a"],
      preventDefault: true,
      handler() {
        videoCardRef.value?.backward();
      },
    },
    info: "後退 (10s)",
  },
  {
    key: {
      keys: ["alt", "s"],
      preventDefault: true,
      handler() {
        videoCardRef.value?.togglePlaybackRate();
      },
    },
    info: "切換播放速度 (1x / 2x)",
  },
  {
    key: {
      keys: ["alt", "d"],
      preventDefault: true,
      handler() {
        videoCardRef.value?.forward();
      },
    },
    info: "前進 (5s)",
  },
  {
    key: {
      keys: ["alt", "z"],
      preventDefault: true,
      repeat: true,
      handler() {
        subtitleCardRef.value?.jumpToPrevGroup();
      },
    },
    info: "上一組字幕",
  },
  {
    key: {
      keys: ["alt", "x"],
      preventDefault: true,
      repeat: true,
      handler() {
        subtitleCardRef.value?.jumpToNextGroup();
      },
    },
    info: "下一組字幕",
  },
  {
    key: {
      keys: ["alt", "c"],
      preventDefault: true,
      handler() {
        subtitleCardRef.value?.copyNowGroup();
      },
    },
    info: "複製目前字幕到下一組",
  },
  {
    key: {
      keys: ["alt", "v"],
      preventDefault: true,
      handler() {
        const t =
          videoCardRef.value?.getNowPlayingTimeString() || "00:00:00.000";
        subtitleCardRef.value?.editCursorLineTime(t);
      },
    },
    info: "套用目前影片時間",
  },
  {
    key: {
      keys: ["alt", "n"],
      preventDefault: true,
      handler() {
        const t =
          videoCardRef.value?.getNowPlayingTimeString() || "00:00:00.000";
        subtitleCardRef.value?.createNewGroup(t);
      },
    },
    info: "以目前時間新增字幕",
  },
]);

const hotkeys = ref<HotKey[]>(hotkeysInfo.value.map((h) => h.key));

const toUpperKeys = (keys: string[]) => {
  return keys.map((k) => k.toUpperCase());
};

window.onbeforeunload = () => {
  return "Are you sure you want to leave?";
};

const holdingKeys = ref<Map<string, boolean>>(new Map());

const hotkeyDown = (e: KeyboardEvent) => {
  const key = e.key.toUpperCase();
  holdingKeys.value.set(key, e.repeat);

  for (const h of hotkeys.value) {
    if (toUpperKeys(h.keys).every((k) => holdingKeys.value.has(k))) {
      if (!e.repeat || h.repeat) {
        if (h.preventDefault) {
          e.preventDefault();
        }
        h.handler();
      }
    }
  }
};

const hotkeyUp = (e: KeyboardEvent) => {
  const key = e.key.toUpperCase();
  holdingKeys.value.delete(key);
};
</script>

<template>
  <v-container
    @keydown="hotkeyDown"
    @keyup="hotkeyUp"
  >
    <v-row
      align="center"
      justify="center"
    >
      <v-col
        cols="12"
        md="6"
      >
        <SubtitleCard
          ref="subtitleCardRef"
          @update-subtitle="updateSubtitle"
          @update-time="updateNowGroup"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <VideoCard ref="videoCardRef" />
      </v-col>
    </v-row>
    <v-container
      class="mt-5 fill-height"
      fluid
    >
      <v-card
        v-for="k in hotkeysInfo"
        :key="k.info"
        class="ma-2"
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
    </v-container>
  </v-container>
</template>

<style scoped></style>
