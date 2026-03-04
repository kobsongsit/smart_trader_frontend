<script setup lang="ts">
const route = useRoute()
const { connect } = useSocket()

const isHome = computed(() => route.path === '/')
const isCalendar = computed(() => route.path === '/market-holidays')
const isAnalysis = computed(() => route.path === '/analysis-tools')

// ─── WebSocket: connect once at app level ───
// Socket เชื่อมต่อครั้งเดียวตอน app load
// แต่ละหน้าจัดการ subscribeSymbol/unsubscribeSymbol เอง
onMounted(() => {
  connect()
})
</script>

<template>
  <v-app>
    <NuxtRouteAnnouncer />
    <v-main class="pb-14">
      <!-- key=route.fullPath → force destroy + recreate page on every route change -->
      <!-- ป้องกัน Vue reuse component เก่าตอน navigate back -->
      <NuxtPage :key="route.fullPath" />
    </v-main>

    <!-- Bottom Navigation -->
    <v-bottom-navigation grow color="primary" bg-color="#1E1E1E">
      <v-btn to="/" :active="isHome">
        <v-icon icon="mdi-view-grid-outline" />
        <span class="text-uppercase text-caption">Markets</span>
      </v-btn>

      <v-btn to="/market-holidays" :active="isCalendar">
        <v-icon icon="mdi-calendar-blank" />
        <span class="text-uppercase text-caption">Calendar</span>
      </v-btn>

      <v-btn to="/analysis-tools" :active="isAnalysis">
        <v-icon icon="mdi-chart-line-variant" />
        <span class="text-uppercase text-caption">Analysis</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
