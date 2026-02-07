<script setup lang="ts">
/**
 * Skeleton layout matching SignalResult.vue structure
 * Shown while AI is analyzing the signal
 */
</script>

<template>
  <v-sheet rounded="xl" class="glass-card pa-4">

    <!-- Header - Strategy & Confidence skeleton -->
    <div class="d-flex align-center justify-space-between mb-3">
      <div>
        <v-skeleton-loader type="button" width="120" height="40" class="rounded-lg" />
        <v-skeleton-loader type="text" width="80" class="mt-2" />
      </div>
      <v-skeleton-loader type="avatar" width="70" height="70" />
    </div>

    <!-- Price Levels skeleton -->
    <v-row dense class="mb-3">
      <v-col cols="4" class="d-flex">
        <v-sheet rounded="lg" class="glass-sheet pa-3 flex-fill">
          <v-skeleton-loader type="text" width="50" class="mb-1" />
          <v-skeleton-loader type="text" width="80" />
        </v-sheet>
      </v-col>
      <v-col cols="4" class="d-flex">
        <v-sheet rounded="lg" class="glass-sheet pa-3 flex-fill">
          <v-skeleton-loader type="text" width="70" class="mb-1" />
          <v-skeleton-loader type="text" width="80" />
          <v-skeleton-loader type="text" width="50" />
        </v-sheet>
      </v-col>
      <v-col cols="4" class="d-flex">
        <v-sheet rounded="lg" class="glass-sheet pa-3 flex-fill">
          <v-skeleton-loader type="text" width="60" class="mb-1" />
          <v-skeleton-loader type="text" width="80" />
          <v-skeleton-loader type="text" width="50" />
        </v-sheet>
      </v-col>
    </v-row>

    <!-- Risk/Reward chips skeleton -->
    <div class="d-flex flex-wrap ga-2 mb-4">
      <v-skeleton-loader type="chip" width="80" />
      <v-skeleton-loader type="chip" width="60" />
      <v-skeleton-loader type="chip" width="60" />
    </div>

    <!-- Analysis Summary skeleton -->
    <v-sheet rounded="lg" class="glass-sheet pa-3 mb-3">
      <v-skeleton-loader type="text" width="140" class="mb-2" />
      <v-skeleton-loader type="paragraph" />
    </v-sheet>

    <!-- Timestamp skeleton -->
    <div class="text-center mt-3">
      <v-skeleton-loader type="text" width="120" class="mx-auto" />
    </div>
  </v-sheet>
</template>
