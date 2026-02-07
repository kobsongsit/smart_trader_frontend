<script setup lang="ts">
const route = useRoute()

const isHome = computed(() => route.path === '/')
const isAnalysis = computed(() => route.path === '/analysis-tools')
</script>

<template>
  <v-app>
    <NuxtRouteAnnouncer />
    <v-main class="pb-14">
      <NuxtPage />
    </v-main>

    <!-- Bottom Navigation -->
    <v-bottom-navigation grow color="primary" bg-color="#0A0F1C">
      <v-btn to="/" :active="isHome">
        <v-icon icon="mdi-view-grid-outline" />
        <span class="text-uppercase text-caption">Markets</span>
      </v-btn>

      <v-btn to="/analysis-tools" :active="isAnalysis">
        <v-icon icon="mdi-chart-line-variant" />
        <span class="text-uppercase text-caption">Analysis</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
