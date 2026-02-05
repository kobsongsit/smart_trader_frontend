<script setup lang="ts">
// SEO Meta
useHead({
  title: 'Symbols & Indicators - Smart Trader',
  meta: [
    {
      name: 'description',
      content: 'View active trading symbols and their technical indicators'
    }
  ]
})
</script>

<template>
  <v-container fluid class="symbols-page pa-4">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">
          <v-icon icon="mdi-chart-multiple" class="mr-2" color="primary" />
          Symbols
        </h1>
        <p class="text-caption text-medium-emphasis mt-1">
          Active trading symbols with technical indicators
        </p>
      </div>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        size="small"
        @click="() => {}"
      />
    </div>

    <!-- Symbol List -->
    <TradingSymbolList />
  </v-container>
</template>

<style scoped>
.symbols-page {
  max-width: 600px;
  margin: 0 auto;
}

@media (min-width: 960px) {
  .symbols-page {
    max-width: 800px;
  }
}
</style>
