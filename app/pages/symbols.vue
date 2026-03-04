<script setup lang="ts">
import { getSymbolTypeColor } from '../../types/trading'

/**
 * Symbols Page
 *
 * APIs (via composables):
 * - useSymbols().fetchActiveSymbols()  → list active symbols
 * - useWatchlist()                     → watchlist operations
 *
 * No cache, no analysis, no WebSocket.
 */

useHead({ title: 'Symbols — Smart Trader' })

const { symbols, isLoading, error: loadError, fetchActiveSymbols } = useSymbols()
const { fetchWatchlist, isInWatchlist, toggleWatchlist } = useWatchlist()

// ── State ──
const togglingIds = ref<Set<number>>(new Set())

// ── Fetch on mount ──
onMounted(async () => {
  await Promise.all([
    fetchActiveSymbols(),
    fetchWatchlist(),
  ])
})

// ── Toggle watchlist ──
async function handleToggleWatchlist(symbolId: number) {
  togglingIds.value.add(symbolId)
  try {
    await toggleWatchlist(symbolId)
  } finally {
    togglingIds.value.delete(symbolId)
  }
}

// ── Refresh ──
const isRefreshing = ref(false)

async function handleRefresh() {
  isRefreshing.value = true
  try {
    await Promise.all([
      fetchActiveSymbols(),
      fetchWatchlist(),
    ])
  } finally {
    isRefreshing.value = false
  }
}
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">

    <!-- Header -->
    <div class="d-flex align-center ga-3 mb-1">
      <v-avatar color="primary" size="40" rounded="lg">
        <v-icon icon="mdi-format-list-bulleted" color="white" size="22" />
      </v-avatar>
      <span class="text-h5 font-weight-bold">Symbols</span>
      <v-spacer />
      <v-btn
        icon
        variant="text"
        size="small"
        :loading="isRefreshing"
        @click="handleRefresh"
      >
        <v-icon icon="mdi-sync" size="26" class="text-label-muted" />
      </v-btn>
    </div>
    <p class="text-caption font-weight-medium text-label-muted mb-4">
      Active symbols &middot; tap star to add to watchlist
    </p>

    <v-divider class="mb-4" />

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="40" />
      <div class="text-caption mt-3 text-label-muted">Loading symbols...</div>
    </div>

    <!-- Error -->
    <v-alert v-else-if="loadError" type="error" variant="tonal" class="mb-4">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" size="small" @click="handleRefresh">Retry</v-btn>
      </template>
    </v-alert>

    <!-- Empty -->
    <div v-else-if="symbols.length === 0" class="text-center py-12 text-medium-emphasis">
      <v-icon icon="mdi-database-off-outline" size="48" class="mb-2" />
      <div>No active symbols found</div>
    </div>

    <!-- Symbol List -->
    <div v-else>
      <div class="text-caption font-weight-bold text-uppercase text-label-muted mb-3">
        {{ symbols.length }} Symbols
      </div>

      <v-card
        v-for="sym in symbols"
        :key="sym.id"
        elevation="0"
        rounded="lg"
        class="mb-3 glass-card"
        style="cursor: pointer;"
        @click="navigateTo(`/symbol/${sym.id}`)"
      >
        <v-card-text class="py-3">
          <div class="d-flex align-center">

            <!-- Avatar -->
            <v-avatar
              :color="getSymbolTypeColor(sym.type)"
              variant="tonal"
              size="44"
              rounded="lg"
              class="mr-3 flex-shrink-0"
            >
              <span class="text-white font-weight-bold text-body-1">
                {{ sym.name?.charAt(0)?.toUpperCase() || '?' }}
              </span>
            </v-avatar>

            <!-- Info -->
            <div style="min-width: 0;" class="flex-grow-1">
              <div class="d-flex align-center ga-2">
                <span class="font-weight-bold text-truncate" style="font-size: 16px;">
                  {{ sym.symbol }}
                </span>
                <v-chip
                  size="x-small"
                  variant="tonal"
                  :color="getSymbolTypeColor(sym.type)"
                  rounded="lg"
                  class="font-weight-bold"
                >
                  {{ sym.type }}
                </v-chip>
              </div>
              <div class="text-caption text-label-muted text-truncate">
                {{ sym.name }}
                <span v-if="sym.exchange"> &middot; {{ sym.exchange }}</span>
              </div>
            </div>

            <!-- Watchlist Toggle -->
            <v-btn
              icon
              variant="text"
              size="small"
              :loading="togglingIds.has(sym.id)"
              @click.stop="handleToggleWatchlist(sym.id)"
            >
              <v-icon
                :icon="isInWatchlist(sym.id) ? 'mdi-star' : 'mdi-star-outline'"
                :color="isInWatchlist(sym.id) ? 'amber' : 'grey'"
                size="24"
              />
            </v-btn>

          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Footer -->
    <v-sheet color="transparent" class="pa-3 text-center mt-4">
      <div class="text-caption text-medium-emphasis">
        <v-icon icon="mdi-shield-check" size="14" class="mr-1" />
        Smart Trader — AI-Powered Trading Signal Bot
      </div>
    </v-sheet>

    <!-- FAB: Create Symbol -->
    <v-btn
      icon
      color="primary"
      size="large"
      elevation="8"
      position="fixed"
      location="bottom end"
      class="mb-4 mr-4"
      @click="navigateTo('/symbol/create')"
    >
      <v-icon icon="mdi-plus" size="28" />
      <v-tooltip activator="parent" location="start">Add Symbol</v-tooltip>
    </v-btn>

  </v-container>
</template>
