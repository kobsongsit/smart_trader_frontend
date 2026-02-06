<script setup lang="ts">
const route = useRoute()

const navItems = [
  { title: 'Symbols', icon: 'mdi-chart-multiple', to: '/' },
  { title: 'Analysis', icon: 'mdi-book-open-variant', to: '/analysis-tools' },
]

const activeNav = computed(() => {
  const idx = navItems.findIndex(item => item.to === route.path)
  return idx >= 0 ? idx : 0
})
</script>

<template>
  <v-app>
    <NuxtRouteAnnouncer />
    <v-main class="pb-14">
      <NuxtPage />
    </v-main>

    <!-- Bottom Navigation -->
    <v-bottom-navigation
      :model-value="activeNav"
      grow
      color="primary"
    >
      <v-btn
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
      >
        <v-icon :icon="item.icon" />
        <span>{{ item.title }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
