<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <v-app>
    <NuxtRouteAnnouncer />

    <v-main class="pb-16">
      <NuxtPage />
    </v-main>

    <!-- Bottom Navigation for Mobile -->
    <v-bottom-navigation grow color="primary">
      <v-btn to="/" :active="route.path === '/'">
        <v-icon icon="mdi-shield-check" />
        <span class="text-caption">Validation</span>
      </v-btn>
      <v-btn to="/symbols" :active="route.path === '/symbols'">
        <v-icon icon="mdi-chart-multiple" />
        <span class="text-caption">Symbols</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
