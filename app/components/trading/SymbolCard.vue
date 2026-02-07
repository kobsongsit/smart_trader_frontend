<script setup lang="ts">
import type { SymbolSummary, TrendDirection } from '../../../types/trading'
import {
  formatPrice,
  formatPriceChange,
  getTrendColor,
} from '../../../types/trading'

interface Props {
  summary: SymbolSummary
}

const props = defineProps<Props>()

// ─── Summary derived values (from props.summary — instant, no API call) ───
const majorityTrend = computed((): TrendDirection => props.summary.trend.direction)
const trendAvatarColor = computed(() => getTrendColor(majorityTrend.value))

const avatarLetter = computed(() => props.summary.name?.charAt(0)?.toUpperCase() || '?')

// Trend summary text from summary API
const trendSummaryText = computed(() => {
  const t = props.summary.trend
  if (t.direction === 'NEUTRAL') {
    return `NEUTRAL ${t.neutralCount}/${t.totalTimeframes}`
  }
  return `${t.direction} ${Math.max(t.upCount, t.downCount)}/${t.totalTimeframes}`
})

// Strength bar — uses trend counts
const strengthLabel = computed(() => {
  if (majorityTrend.value === 'UP') return 'UPTREND STRENGTH'
  if (majorityTrend.value === 'DOWN') return 'DOWNTREND STRENGTH'
  return 'NEUTRAL STRENGTH'
})
const strengthScore = computed(() => {
  const t = props.summary.trend
  if (t.totalTimeframes === 0) return 0
  if (t.direction === 'UP') return Math.round((t.upCount / t.totalTimeframes) * 100)
  if (t.direction === 'DOWN') return Math.round((t.downCount / t.totalTimeframes) * 100)
  return Math.round((t.neutralCount / t.totalTimeframes) * 100)
})
const strengthColor = computed(() => getTrendColor(majorityTrend.value))

// ─── Animated score (count-up + progress bar animate) ───
const animatedScore = ref(0)

function animateToValue(target: number, duration = 600) {
  const start = animatedScore.value
  const startTime = Date.now()

  const tick = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
    animatedScore.value = Math.round(start + (target - start) * eased)
    if (progress < 1) {
      requestAnimationFrame(tick)
    }
  }
  requestAnimationFrame(tick)
}

onMounted(() => {
  setTimeout(() => {
    animateToValue(strengthScore.value)
  }, 200)
})

watch(strengthScore, (val) => {
  animateToValue(val)
})

// ─── Navigate to detail page ───
function goToDetail() {
  navigateTo(`/symbol/${props.summary.id}`)
}
</script>

<template>
  <v-card
    elevation="0"
    rounded="lg"
    class="mb-3 glass-card"
    style="cursor: pointer;"
    @click="goToDetail"
  >
    <v-card-text class="pb-3">

      <!-- Row 1: Symbol Info + Price -->
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center" style="min-width: 0;">
          <v-avatar :color="trendAvatarColor" variant="tonal" size="46" rounded="lg" class="mr-3 flex-shrink-0" :style="{ border: `1px solid rgb(var(--v-theme-${trendAvatarColor}))` }">
            <span class="text-white font-weight-bold text-h6">{{ avatarLetter }}</span>
          </v-avatar>
          <div style="min-width: 0;">
            <div class="d-flex align-center ga-2">
              <span class="font-weight-bold text-truncate symbol-name">{{ props.summary.name }}</span>
              <v-chip size="x-small" variant="tonal" color="info" rounded="lg" class="font-weight-bold">{{ props.summary.type }}</v-chip>
            </div>
            <div class="text-caption text-label-muted text-truncate">
              {{ props.summary.price.updatedAgo }}
            </div>
          </div>
        </div>

        <!-- Price -->
        <div class="text-right flex-shrink-0 ml-2">
          <div class="text-h6 font-weight-bold font-mono">{{ formatPrice(props.summary.price.current) }}</div>
          <v-chip size="x-small" variant="tonal" color="primary" class="font-mono font-weight-bold text-caption">
            {{ formatPriceChange(props.summary.price.changePercent) }}
          </v-chip>
        </div>
      </div>

      <!-- Row 2: Strength Bar -->
      <div class="mb-3">
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption font-weight-medium text-uppercase text-primary">{{ strengthLabel }}</span>
          <span class="text-caption font-weight-medium font-mono">{{ animatedScore }}%</span>
        </div>
        <v-progress-linear
          :model-value="animatedScore"
          :color="strengthColor"
          rounded
          height="6"
          bg-color="#2A2A2A"
        />
      </div>

      <v-divider class="mb-3" />

      <!-- Row 3: Status Chips + Arrow -->
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex flex-wrap ga-1">
          <!-- Trend -->
          <v-chip :color="getTrendColor(majorityTrend)" size="x-small" variant="tonal" rounded="lg" class="font-weight-bold">
            {{ trendSummaryText }}
          </v-chip>

          <!-- Consensus -->
          <v-chip
            v-if="props.summary.trend.consensusLabel"
            size="x-small"
            variant="tonal"
            color="info"
            rounded="lg"
            class="font-weight-bold"
          >
            {{ props.summary.trend.consensusLabel }}
          </v-chip>
        </div>

        <!-- Navigate Arrow -->
        <v-icon icon="mdi-chevron-right" size="20" class="text-medium-emphasis" />
      </div>

    </v-card-text>
  </v-card>
</template>

<style scoped>
.symbol-name {
  font-size: 20px;
  line-height: 1.4;
}
</style>
