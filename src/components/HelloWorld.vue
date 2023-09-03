<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

import SubtitleCard from "@/components/SubtitleCard.vue";
import VideoCard from "@/components/VideoCard.vue";
import EditHotkeyOverlay from "@/components/EditHotkeyOverlay.vue";

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

const originHotkeyConfig = ref<Map<string, string>>(new Map());

const storeHotkeyConfigToLocalStorage = () => {
  hotkeysInfo.value.forEach((info) => {
    localStorage.setItem(info.info, JSON.stringify(info.key.keys));
  });
};

const restoreHotkeyConfigFromLocalStorage = () => {
  hotkeysInfo.value.forEach((info) => {
    const keys = localStorage.getItem(info.info);
    if (keys !== null) {
      info.key.keys = JSON.parse(keys);
    }
  });
};

const hotkeysInfo = ref<HotKeyInfo[]>([
  {
    key: {
      keys: ["alt", "w"],
      handler() {
        videoCardRef.value?.togglePlay();
      },
    },
    info: "播放/暫停",
  },
  {
    key: {
      keys: ["alt", "q"],
      handler() {
        videoCardRef.value?.backward();
      },
    },
    info: "後退 (5s)",
  },
  {
    key: {
      keys: ["alt", "e"],
      handler() {
        videoCardRef.value?.forward();
      },
    },
    info: "前進 (5s)",
  },
  {
    key: {
      keys: ["control", "alt", "w"],
      handler() {
        videoCardRef.value?.togglePlaybackRate();
      },
    },
    info: "切換播放速度 (1x / 2x)",
  },
  {
    key: {
      keys: ["control", "alt", "q"],
      repeat: true,
      handler() {
        videoCardRef.value?.previousFrame();
      },
    },
    info: "上一幀",
  },
  {
    key: {
      keys: ["control", "alt", "e"],
      repeat: true,
      handler() {
        videoCardRef.value?.nextFrame();
      },
    },
    info: "下一幀",
  },
  {
    key: {
      keys: ["alt", "s"],
      handler() {
        updateVideoTime();
      },
    },
    info: "套用目前字幕時間",
  },
  {
    key: {
      keys: ["alt", "a"],
      repeat: true,
      handler() {
        subtitleCardRef.value?.jumpToPrevGroup();
      },
    },
    info: "上一組字幕",
  },
  {
    key: {
      keys: ["alt", "d"],
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
      handler() {
        subtitleCardRef.value?.copyNowGroup(
          videoCardRef.value?.getNowPlayingTimeString() || "00:00:00.000"
        );
      },
    },
    info: "複製目前字幕到下一組",
  },
  {
    key: {
      keys: ["alt", "v"],
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
      handler() {
        const t =
          videoCardRef.value?.getNowPlayingTimeString() || "00:00:00.000";
        subtitleCardRef.value?.createNewGroup(t);
      },
    },
    info: "以目前時間新增字幕",
  },
  {
    key: {
      keys: ["control", "shift", "f2"],
      handler() {
        hotkeysInfo.value.forEach((h) => {
          h.key.keys =
            JSON.parse(originHotkeyConfig.value.get(h.info) || "[]") ||
            h.key.keys;
        });
        storeHotkeyConfigToLocalStorage();
      },
    },
    info: "恢復預設快捷鍵設定",
  },
]);

const hotkeys = computed(() => {
  return hotkeysInfo.value.map((h) => h.key);
});

const toUpperKeys = (keys: string[]) => {
  return keys.map((k) => k.toUpperCase());
};

window.onbeforeunload = () => {
  return "Are you sure you want to leave?";
};

const holdingKeysMap = ref<Map<string, boolean>>(new Map());

const holdingKeys = computed(() => {
  return Array.from(holdingKeysMap.value.keys());
});

const clearKeysMap = () => {
  holdingKeysMap.value.clear();
};

const hotkeyDown = (e: KeyboardEvent) => {
  const key = e.key.toUpperCase();
  holdingKeysMap.value.set(key, e.repeat);

  if (holdingKeysMap.value.has("ALT")) {
    e.preventDefault();
    e.stopPropagation();
  }

  for (const h of hotkeys.value) {
    if (
      h.keys.length === holdingKeysMap.value.size &&
      toUpperKeys(h.keys).every((k) => holdingKeysMap.value.has(k))
    ) {
      if (!e.repeat || h.repeat) {
        e.preventDefault();
        e.stopPropagation();

        if (!editingHotkey.value.isEditing) {
          h.handler();
        }
      }
    }
  }
};

const hotkeyUp = (e: KeyboardEvent) => {
  const key = e.key.toUpperCase();
  holdingKeysMap.value.delete(key);
};

const shouldBeDisabled = (keys: string[]) => {
  if (holdingKeysMap.value.size === 0 || editingHotkey.value.isEditing) {
    return false;
  }
  return !holdingKeys.value.every((k) => toUpperKeys(keys).includes(k));
};

const shouldBeGreen = (keys: string[]) => {
  if (holdingKeysMap.value.size === 0 || editingHotkey.value.isEditing) {
    return false;
  }
  return (
    keys.length === holdingKeysMap.value.size &&
    toUpperKeys(keys).every((k) => holdingKeysMap.value.has(k))
  );
};

const editingHotkey = ref<{
  isEditing: boolean;
  index: number;
  hotkey: HotKeyInfo;
}>({
  isEditing: false,
  index: -1,
  hotkey: {
    key: {
      keys: [],
      preventDefault: false,
      repeat: false,
      handler() {},
    },
    info: "",
  },
});

const startEditingHotkey = (index: number) => {
  editingHotkey.value.isEditing = true;
  editingHotkey.value.index = index;
  editingHotkey.value.hotkey = hotkeysInfo.value[index];
};

const updateHotkey = (index: number, keys: Set<string>) => {
  const h = hotkeysInfo.value[index];
  h.key.keys = Array.from(keys);
  hotkeysInfo.value.splice(index, 1, h);
  storeHotkeyConfigToLocalStorage();
};

onMounted(() => {
  originHotkeyConfig.value = hotkeysInfo.value.reduce((acc, cur) => {
    acc.set(cur.info, JSON.stringify(cur.key.keys));
    return acc;
  }, new Map());

  restoreHotkeyConfigFromLocalStorage();
});
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
          @on-editor-focus="clearKeysMap"
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
        :disabled="shouldBeDisabled(k.key.keys)"
        @click="startEditingHotkey(hotkeysInfo.indexOf(k))"
      >
        <v-card-text>
          <v-chip
            class="mr-1"
            :color="shouldBeGreen(k.key.keys) ? 'green' : 'primary'"
            label
          >
            {{ toUpperKeys(k.key.keys).join(" + ") }}
          </v-chip>
          {{ k.info }}
        </v-card-text>
      </v-card>
    </v-container>
    <EditHotkeyOverlay
      v-model="editingHotkey.isEditing"
      :originhotkey="editingHotkey.hotkey.key.keys"
      :description="editingHotkey.hotkey.info"
      :index="editingHotkey.index"
      :holdingkeys="holdingKeys"
      @update-hotkey="updateHotkey"
      @keydown="hotkeyDown"
      @keyup="hotkeyUp"
    />
  </v-container>
</template>

<style scoped></style>
