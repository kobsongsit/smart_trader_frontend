<script setup lang="ts">
import type { MetricCardData } from '../../../types/validation'

interface Props {
  data: MetricCardData
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})
</script>

<template>
  <v-card
    :color="props.data.color"
    variant="tonal"
    class="metric-card"
    elevation="2"
  >
    <v-card-text class="d-flex align-center">
      <v-avatar
        :color="props.data.color"
        size="56"
        class="mr-4"
      >
        <v-icon
          :icon="props.data.icon"
          size="28"
          color="white"
        />
      </v-avatar>

      <div class="flex-grow-1">
        <div class="text-caption text-medium-emphasis mb-1">
          {{ props.data.title }}
        </div>
        <div class="d-flex align-center">
          <v-skeleton-loader
            v-if="props.loading"
            type="text"
            width="60"
          />
          <span
            v-else
            class="text-h4 font-weight-bold"
          >
            {{ props.data.value }}
          </span>

          <v-chip
            v-if="props.data.trend"
            :color="props.data.trend.direction === 'up' ? 'success' : props.data.trend.direction === 'down' ? 'error' : 'grey'"
            size="x-small"
            class="ml-2"
            variant="flat"
          >
            <v-icon
              :icon="props.data.trend.direction === 'up' ? 'mdi-arrow-up' : props.data.trend.direction === 'down' ? 'mdi-arrow-down' : 'mdi-minus'"
              size="12"
              start
            />
            {{ Math.abs(props.data.trend.value) }}%
          </v-chip>
        </div>

        <div
          v-if="props.data.subtitle"
          class="text-caption text-medium-emphasis mt-1"
        >
          {{ props.data.subtitle }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.metric-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
</style>
