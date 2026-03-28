<script setup lang="ts">
import type { SymbolItem } from '../../../types/trading'

// ─── Props & Emits ────────────────────────────────────────────
const props = defineProps<{
  symbols: SymbolItem[]
  symbolsLoading: boolean
  symbol: string
  interval: string
  from: string
  to: string
  minBodyRatio: number
  minGapRatio: number
  loading: boolean
}>()

const emit = defineEmits<{
  'update:symbol': [value: string]
  'update:interval': [value: string]
  'update:from': [value: string]
  'update:to': [value: string]
  'update:minBodyRatio': [value: number]
  'update:minGapRatio': [value: number]
}>()

// ─── Interval options ─────────────────────────────────────────
const intervalOptions = [
  { title: '1m',  value: '1m'  },
  { title: '5m',  value: '5m'  },
  { title: '15m', value: '15m' },
  { title: '1h',  value: '1h'  },
  { title: '4h',  value: '4h'  },
  { title: '1d',  value: '1d'  },
  { title: '1mn', value: '1mn' },
]

// ─── Symbol options (เฉพาะ active) ───────────────────────────
const symbolOptions = computed(() =>
  props.symbols
    .filter(s => s.isActive)
    .map(s => ({ title: s.symbol, value: s.symbol, subtitle: s.name }))
)
</script>

<template>
  <div class="fvg-controls">

    <!-- Row 1: Symbol + Interval + Dates -->
    <div class="controls-row">

      <!-- Symbol Selector -->
      <v-select
        :model-value="symbol"
        :items="symbolOptions"
        item-title="title"
        item-value="value"
        label="Symbol"
        density="compact"
        variant="outlined"
        hide-details
        :loading="symbolsLoading"
        :disabled="loading"
        class="ctrl-select ctrl-symbol"
        @update:model-value="emit('update:symbol', $event)"
      >
        <template #item="{ item, props: itemProps }">
          <v-list-item v-bind="itemProps">
            <template #subtitle>
              <span class="text-caption text-label-muted">{{ item.raw.subtitle }}</span>
            </template>
          </v-list-item>
        </template>
      </v-select>

      <!-- Interval Selector -->
      <v-select
        :model-value="interval"
        :items="intervalOptions"
        item-title="title"
        item-value="value"
        label="Timeframe"
        density="compact"
        variant="outlined"
        hide-details
        :disabled="loading"
        class="ctrl-select ctrl-interval"
        @update:model-value="emit('update:interval', $event)"
      />

      <!-- Date From -->
      <v-text-field
        :model-value="from"
        type="date"
        label="From"
        density="compact"
        variant="outlined"
        hide-details
        :disabled="loading"
        class="ctrl-select ctrl-date"
        @update:model-value="emit('update:from', $event)"
      />

      <!-- Date To -->
      <v-text-field
        :model-value="to"
        type="date"
        label="To"
        density="compact"
        variant="outlined"
        hide-details
        :disabled="loading"
        class="ctrl-select ctrl-date"
        @update:model-value="emit('update:to', $event)"
      />

    </div>

    <!-- Row 2: Sliders -->
    <div class="sliders-row">

      <!-- minBodyRatio slider -->
      <div class="slider-item">
        <div class="slider-label">
          <span>Body Ratio</span>
          <span class="slider-value font-mono">{{ minBodyRatio.toFixed(1) }}</span>
        </div>
        <v-slider
          :model-value="minBodyRatio"
          :min="0.5"
          :max="3.0"
          :step="0.1"
          color="primary"
          track-color="rgba(51,65,85,0.6)"
          thumb-color="primary"
          hide-details
          :disabled="loading"
          class="slider-ctrl"
          @update:model-value="emit('update:minBodyRatio', $event)"
        />
      </div>

      <!-- minGapRatio slider -->
      <div class="slider-item">
        <div class="slider-label">
          <span>Gap Ratio</span>
          <span class="slider-value font-mono">{{ minGapRatio.toFixed(2) }}</span>
        </div>
        <v-slider
          :model-value="minGapRatio"
          :min="0.05"
          :max="0.5"
          :step="0.05"
          color="info"
          track-color="rgba(51,65,85,0.6)"
          thumb-color="info"
          hide-details
          :disabled="loading"
          class="slider-ctrl"
          @update:model-value="emit('update:minGapRatio', $event)"
        />
      </div>

    </div>

  </div>
</template>

<style scoped>
.fvg-controls {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}

/* ─── Row 1: Inputs ─── */
.controls-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.ctrl-select {
  min-width: 0;
}

.ctrl-symbol {
  flex: 1.5;
  min-width: 120px;
}

.ctrl-interval {
  flex: 0.8;
  min-width: 80px;
}

.ctrl-date {
  flex: 1;
  min-width: 120px;
}

/* ─── Row 2: Sliders ─── */
.sliders-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.slider-item {
  flex: 1;
  min-width: 200px;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.68rem;
  font-weight: 600;
  color: rgb(148, 163, 184);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.slider-value {
  font-size: 0.72rem;
  color: rgb(74, 222, 128);
}

.slider-ctrl {
  margin-top: -4px;
}
</style>
