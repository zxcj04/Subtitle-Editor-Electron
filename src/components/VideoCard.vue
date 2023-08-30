<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";

import { VideoPlayer } from "@videojs-player/vue";
import type { VideoPlayerState } from "@videojs-player/vue";

const videoPlayerRef = ref<InstanceType<typeof VideoPlayer> | null>(null);
const videoPlayerElement = ref<HTMLVideoElement | null>(null);
const videoPlayerState = ref<VideoPlayerState | null>(null);

const videoPlayerTracks = ref<Array<unknown>>([]);

const nowPlayingTime = ref<number>(0);
const nowPlayingTimeString = ref<string>("00:00:00.000");

const lastBlobURL = ref("");

const videoFiles = ref<Array<File>>([]);

const onVideoFilesChange = () => {
  if (videoPlayerElement.value === null) {
    return false;
  }

  const fileURL = URL.createObjectURL(videoFiles.value[0]);
  videoPlayerElement.value.src = fileURL;
  videoPlayerElement.value.currentTime = 0;

  updateNowPlayingTrack(lastBlobURL.value);
};

const formatTime = (number: number) => {
  return number.toString().padStart(2, "0");
};

const formatMilliseconds = (number: number) => {
  return number.toString().padStart(3, "0");
};

const animationFrameTask = ref<number | null>(null);

const onVideoTimeUpdate = () => {
  if (videoPlayerElement.value === null) {
    return false;
  }
  const currentTime = videoPlayerElement.value.currentTime;
  nowPlayingTime.value = currentTime;

  const hours = Math.floor(currentTime / 3600);
  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60);
  const milliseconds = Math.floor((currentTime * 1000) % 1000);

  nowPlayingTimeString.value = `${formatTime(hours)}:${formatTime(
    minutes
  )}:${formatTime(seconds)},${formatMilliseconds(milliseconds)}`;

  if(videoPlayerElement.value.currentTime > stopVideoTime.value) {
    videoPlayerElement.value.pause();
    stopVideoTime.value = Number.MAX_SAFE_INTEGER;
  }

  animationFrameTask.value = requestAnimationFrame(onVideoTimeUpdate);
};

animationFrameTask.value = requestAnimationFrame(onVideoTimeUpdate);

watch(videoFiles, onVideoFilesChange);

const onVideoMounted = (c: {
  video: HTMLVideoElement;
  player: unknown;
  state: VideoPlayerState;
}) => {
  videoPlayerElement.value = c.video;
  videoPlayerState.value = c.state;
};

const updateNowPlayingTrack = (blobURL: string) => {
  const track = {
    kind: "subtitles",
    src: blobURL,
    default: true,
  };

  videoPlayerTracks.value = [track];

  nowPlayingTime.value = videoPlayerElement.value?.currentTime ?? 0;

  if (videoPlayerElement.value !== null) {
    videoPlayerElement.value.pause();
    videoPlayerElement.value.load();
    videoPlayerElement.value.currentTime = nowPlayingTime.value;
  }
};

const updateSubtitle = (subtitle: string) => {
  const blob = new Blob([subtitle], { type: "text/vtt" });
  const blobURL = URL.createObjectURL(blob);
  lastBlobURL.value = blobURL;

  updateNowPlayingTrack(blobURL);
};

const stopVideoTime = ref<number>(Math.max());

const updatePlayingTime = async (start: number, duration: number) => {
  if (videoPlayerElement.value !== null) {
    videoPlayerElement.value.currentTime = start;
    await videoPlayerElement.value.play();

    stopVideoTime.value = videoPlayerElement.value.currentTime + duration;
  }
};

const pause = () => {
  if (videoPlayerElement.value !== null) {
    videoPlayerElement.value.pause();
  }
};

const play = () => {
  if (videoPlayerElement.value !== null) {
    videoPlayerElement.value.play();
  }
};

const togglePlay = () => {
  if (videoPlayerElement.value !== null) {
    if (videoPlayerElement.value.paused) {
      videoPlayerElement.value.play();
    } else {
      videoPlayerElement.value.pause();
    }
  }
};

const nextFrame = () => {
  pause();
  if (videoPlayerElement.value !== null) {
    videoPlayerElement.value.currentTime += 1 / 30;
  }
};

const previousFrame = () => {
  pause();
  if (videoPlayerElement.value !== null) {
    videoPlayerElement.value.currentTime -= 1 / 30;
  }
};

const holdNextFrameInterval = ref<NodeJS.Timeout | null>(null);

const holdNextFrame = () => {
  if (holdNextFrameInterval.value !== null) {
    clearInterval(holdNextFrameInterval.value);
    holdNextFrameInterval.value = null;
    return;
  }

  nextFrame();
  holdNextFrameInterval.value = setInterval(() => {
    nextFrame();
  }, 100);
};

const holdPreviousFrameInterval = ref<NodeJS.Timeout | null>(null);

const holdPreviousFrame = () => {
  if (holdPreviousFrameInterval.value !== null) {
    clearInterval(holdPreviousFrameInterval.value);
    holdPreviousFrameInterval.value = null;
    return;
  }

  previousFrame();
  holdPreviousFrameInterval.value = setInterval(() => {
    previousFrame();
  }, 100);
};

const fastPlaybackRate = () => {
  if (videoPlayerElement.value !== null) {
    videoPlayerElement.value.playbackRate = 2;
  }
};

const normalPlaybackRate = () => {
  if (videoPlayerElement.value !== null) {
    videoPlayerElement.value.playbackRate = 1;
  }
};

const slowPlaybackRate = () => {
  if (videoPlayerElement.value !== null) {
    videoPlayerElement.value.playbackRate = 0.5;
  }
};

const togglePlaybackRate = () => {
  if (videoPlayerElement.value !== null) {
    if (videoPlayerElement.value.playbackRate === 1) {
      videoPlayerElement.value.playbackRate = 2;
    } else {
      videoPlayerElement.value.playbackRate = 1;
    }
  }
};

const forward = () => {
  if (videoPlayerElement.value !== null) {
    videoPlayerElement.value.currentTime += 5;
  }
};

const backward = () => {
  if (videoPlayerElement.value !== null) {
    const t = videoPlayerElement.value.currentTime - 5;
    videoPlayerElement.value.currentTime = t < 0 ? 0 : t;
  }
};

const getNowPlayingTimeString = () => {
  return nowPlayingTimeString.value;
};

onBeforeUnmount(() => {
  if (animationFrameTask.value !== null) {
    cancelAnimationFrame(animationFrameTask.value);
  }
});

defineExpose({
  updatePlayingTime,
  updateSubtitle,
  nextFrame,
  previousFrame,
  holdNextFrame,
  holdPreviousFrame,
  play,
  pause,
  togglePlay,
  fastPlaybackRate,
  normalPlaybackRate,
  slowPlaybackRate,
  togglePlaybackRate,
  forward,
  backward,
  getNowPlayingTimeString,
});
</script>

<template>
  <v-card max-height="80vh">
    <v-card-text
      align="center"
      justify="center"
    >
      <v-file-input
        v-model="videoFiles"
        label="匯入影片檔"
        :multiple="false"
        :clearable="false"
      />
      <div class="time">
        {{ nowPlayingTimeString }}
      </div>
      <video-player
        ref="videoPlayerRef"
        controls
        :loop="false"
        :volume="0.05"
        style="height: 100%;"
        :fluid="true"
        :tracks="videoPlayerTracks"
        @mounted="onVideoMounted"
      />
    </v-card-text>
  </v-card>
</template>

<style scoped>
@font-face {
  font-family: "CursedTimerUlil";
  src: url("/fonts/CursedTimerUlil-Aznm.ttf");
}
.time {
  color: #17d4fe;
  font-family: CursedTimerUlil;
  font-size: 2.5em;
  white-space: nowrap;
  text-align: center;
  height: 2.5rem;
}
</style>
