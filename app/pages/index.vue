<script setup lang="ts">
useHead({
  title: 'Smart Trader - AI Trading Signals',
  meta: [
    { name: 'description', content: 'AI-Powered Trading Signal Bot with Technical Analysis' }
  ]
})
</script>

<template>
  <v-container fluid class="dashboard-page pa-3 pa-sm-4">

    <!-- Header -->
    <div class="mb-4">
      <h1 class="text-h6 text-sm-h5 font-weight-bold">
        <v-icon icon="mdi-chart-multiple" color="primary" class="mr-1" />
        Smart Trader
      </h1>
      <p class="text-caption text-medium-emphasis mt-1">
        AI-Powered Trading Signal Bot
      </p>
    </div>

    <!-- Quick Info Bar -->
    <v-sheet class="mb-4 pa-2" rounded="lg" color="grey-darken-4">
      <v-chip-group>
        <v-chip size="small" variant="tonal" color="primary" prepend-icon="mdi-robot">
          GPT-5.1
        </v-chip>
        <v-chip size="small" variant="tonal" color="info" prepend-icon="mdi-chart-line">
          9 Indicators
        </v-chip>
        <v-chip size="small" variant="tonal" color="secondary" prepend-icon="mdi-clock-outline">
          5 Timeframes
        </v-chip>
        <v-chip size="small" variant="tonal" color="warning" prepend-icon="mdi-newspaper">
          News Sentiment
        </v-chip>
      </v-chip-group>
    </v-sheet>

    <!-- Symbol List -->
    <TradingSymbolList />

    <!-- Footer -->
    <v-sheet color="transparent" class="pa-3 text-center mt-4">
      <div class="text-caption text-medium-emphasis">
        <v-icon icon="mdi-shield-check" size="14" class="mr-1" />
        Smart Trader — AI-Powered Trading Signal Bot
      </div>
      <div class="text-caption text-medium-emphasis mt-1">
        ข้อมูลเพื่อประกอบการตัดสินใจเท่านั้น ไม่ใช่คำแนะนำการลงทุน
      </div>
    </v-sheet>

  </v-container>
</template>

<style scoped>
.dashboard-page {
  max-width: 800px;
  margin: 0 auto;
}
</style>
