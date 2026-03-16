<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">
    <!-- Header -->
    <div class="d-flex align-center ga-3 mb-1">
      <v-avatar color="primary" size="40" rounded="lg">
        <v-icon icon="mdi-flash" size="22" />
      </v-avatar>
      <div>
        <div class="text-h5 font-weight-bold">Smart Trader</div>
      </div>
    </div>
    <div class="text-caption text-label-muted mb-4">
      AI-Powered Trading Signal Dashboard
    </div>
    <v-divider class="mb-4" />

    <!-- Portfolio Overview -->
    <TradingPortfolioOverview />

    <div class="my-4" />

    <!-- Open Positions -->
    <TradingOpenPositions />

    <!-- Footer -->
    <div class="text-center mt-8">
      <div class="text-caption text-medium-emphasis">
        <v-icon icon="mdi-shield-check" size="12" class="mr-1" />
        KOB-Trade v2.0
      </div>
    </div>
  </v-container>
</template>
