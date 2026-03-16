<template>
  <NuxtRouteAnnouncer />
  <v-app>
    <v-main class="pb-14">
      <NuxtPage />
    </v-main>
    <v-bottom-navigation grow color="primary" bg-color="#1E1E1E">
      <v-btn to="/" value="dashboard">
        <v-icon icon="mdi-view-dashboard-outline" />
        <span class="text-caption text-uppercase">Dashboard</span>
      </v-btn>
      <v-btn to="/history" value="history">
        <v-icon icon="mdi-history" />
        <span class="text-caption text-uppercase">History</span>
      </v-btn>
      <v-btn to="/performance" value="performance">
        <v-icon icon="mdi-chart-line-variant" />
        <span class="text-caption text-uppercase">Performance</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
