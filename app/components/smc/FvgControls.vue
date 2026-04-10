<script setup lang="ts">
// ─── Props & Emits ────────────────────────────────────────────
const props = defineProps<{
  minBodyRatio: number
  minGapRatio: number
  loading: boolean
}>()

const emit = defineEmits<{
  'update:minBodyRatio': [value: number]
  'update:minGapRatio': [value: number]
}>()
</script>

<template>
  <div class="fvg-controls">

    <!-- Sliders -->
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
  padding: 10px 16px;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
}

.sliders-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.slider-item {
  flex: 1;
  min-width: 160px;
}

.slider-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--ds-text-caption);
  font-weight: var(--ds-fw-semibold);
  color: var(--ds-text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.slider-value {
  font-size: var(--ds-text-label);
  color: var(--ds-success);
}

.slider-ctrl {
  margin-top: -4px;
}
</style>
