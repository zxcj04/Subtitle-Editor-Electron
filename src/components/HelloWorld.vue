<script setup lang="ts">
import SubtitleCard from "@/components/SubtitleCard.vue";
import VideoCard from "@/components/VideoCard.vue";

</script>

<template>
  <v-container>
    <v-row
      align="center"
      justify="center"
    >
      <v-col
        cols="12"
        md="6"
      >
        <SubtitleCard />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <VideoCard />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
