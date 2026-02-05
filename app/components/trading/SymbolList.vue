<script setup lang="ts">
import type { Symbol } from '../../../types/trading'

const { symbols, isLoading, error, fetchActiveSymbols } = useSymbols()
const { fetchIndicators, getCachedIndicators, isLoadingSymbol, getError } = useIndicators()

// Fetch symbols on mount
onMounted(() => {
  fetchActiveSymbols()
})

// Handle expand - fetch indicators
async function handleExpand(symbolId: number) {
  await fetchIndicators(symbolId)
}

// Filter state
const searchQuery = ref('')
const selectedType = ref<string | null>(null)

const filteredSymbols = computed(() => {
  let result = symbols.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.displayName.toLowerCase().includes(query)
    )
  }

  if (selectedType.value) {
    result = result.filter(s => s.type === selectedType.value)
  }

  return result
})

const typeOptions = [
  { title: 'All', value: null },
  { title: 'Crypto', value: 'CRYPTO' },
  { title: 'Stock', value: 'STOCK' },
  { title: 'Forex', value: 'FOREX' }
]
</script>

<template>
  <div class="symbol-list">
    <!-- Search & Filter -->
    <div class="mb-4">
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        placeholder="Search symbols..."
        density="compact"
        variant="outlined"
        hide-details
        clearable
        class="mb-2"
      />
      <v-chip-group
        v-model="selectedType"
        selected-class="bg-primary"
      >
        <v-chip
          v-for="option in typeOptions"
          :key="option.title"
          :value="option.value"
          filter
          size="small"
        >
          {{ option.title }}
        </v-chip>
      </v-chip-group>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
      <div class="text-caption mt-2">Loading symbols...</div>
    </div>

    <!-- Error State -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ error }}
      <template #append>
        <v-btn
          variant="text"
          size="small"
          @click="fetchActiveSymbols"
        >
          Retry
        </v-btn>
      </template>
    </v-alert>

    <!-- Empty State -->
    <div
      v-else-if="filteredSymbols.length === 0"
      class="text-center py-8 text-medium-emphasis"
    >
      <v-icon icon="mdi-chart-box-outline" size="48" class="mb-2" />
      <div>No symbols found</div>
    </div>

    <!-- Symbol Cards -->
    <div v-else>
      <div class="text-caption text-medium-emphasis mb-2">
        {{ filteredSymbols.length }} symbol{{ filteredSymbols.length > 1 ? 's' : '' }}
      </div>
      <TradingSymbolCard
        v-for="symbol in filteredSymbols"
        :key="symbol.id"
        :symbol="symbol"
        :indicators="getCachedIndicators(symbol.id)"
        :loading="isLoadingSymbol(symbol.id)"
        :error="getError(symbol.id)"
        @expand="handleExpand"
      />
    </div>
  </div>
</template>
