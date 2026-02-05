<script setup lang="ts">
import type { ValidationTimelineEvent, ValidationAction, ValidationPhase } from '../../../types/validation'

interface Props {
  events: ValidationTimelineEvent[]
  maxItems?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxItems: 10,
  loading: false
})

const displayedEvents = computed(() => props.events.slice(0, props.maxItems))

function getActionColor(action: ValidationAction): string {
  const colors: Record<ValidationAction, string> = {
    REJECT: 'error',
    WARNING: 'warning',
    SKIP: 'grey',
    PASS: 'success'
  }
  return colors[action] || 'grey'
}

function getActionIcon(action: ValidationAction): string {
  const icons: Record<ValidationAction, string> = {
    REJECT: 'mdi-close-circle',
    WARNING: 'mdi-alert',
    SKIP: 'mdi-skip-next',
    PASS: 'mdi-check-circle'
  }
  return icons[action] || 'mdi-help-circle'
}

function getPhaseLabel(phase: ValidationPhase): string {
  const labels: Record<ValidationPhase, string> = {
    phase1_trend_analysis: 'Phase 1: Trend Analysis',
    phase2_proindicator: 'Phase 2: ProIndicator'
  }
  return labels[phase] || phase
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short'
  })
}
</script>

<template>
  <v-card elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon
        icon="mdi-timeline-clock"
        class="mr-2"
        color="primary"
      />
      Validation Timeline
      <v-spacer />
      <v-chip
        color="primary"
        size="small"
        variant="flat"
      >
        {{ props.events.length }} events
      </v-chip>
    </v-card-title>

    <v-card-text class="pa-0">
      <v-skeleton-loader
        v-if="props.loading"
        type="list-item@5"
      />

      <v-list
        v-else-if="displayedEvents.length > 0"
        lines="three"
        density="compact"
        class="timeline-list"
      >
        <template
          v-for="(event, index) in displayedEvents"
          :key="event.id"
        >
          <v-list-item class="timeline-item">
            <template #prepend>
              <div class="timeline-dot-container">
                <v-avatar
                  :color="getActionColor(event.action)"
                  size="36"
                >
                  <v-icon
                    :icon="getActionIcon(event.action)"
                    size="20"
                    color="white"
                  />
                </v-avatar>
                <div
                  v-if="index < displayedEvents.length - 1"
                  class="timeline-line"
                  :style="{ backgroundColor: `var(--v-theme-${getActionColor(event.action)})` }"
                />
              </div>
            </template>

            <v-list-item-title class="font-weight-medium d-flex align-center">
              {{ event.checkName }}
              <v-chip
                :color="getActionColor(event.action)"
                size="x-small"
                variant="flat"
                class="ml-2"
              >
                {{ event.action }}
              </v-chip>
            </v-list-item-title>

            <v-list-item-subtitle class="text-caption">
              <v-chip
                size="x-small"
                variant="outlined"
                class="mr-1"
              >
                {{ getPhaseLabel(event.phase) }}
              </v-chip>
            </v-list-item-subtitle>

            <v-list-item-subtitle class="mt-1">
              {{ event.reason }}
            </v-list-item-subtitle>

            <template #append>
              <div class="text-right text-caption text-medium-emphasis">
                <div>{{ formatTime(event.timestamp) }}</div>
                <div>{{ formatDate(event.timestamp) }}</div>
              </div>
            </template>
          </v-list-item>

          <v-divider
            v-if="index < displayedEvents.length - 1"
            inset
          />
        </template>
      </v-list>

      <div
        v-else
        class="text-center py-8 text-medium-emphasis"
      >
        <v-icon
          icon="mdi-timeline-clock-outline"
          size="48"
          class="mb-2"
        />
        <div>No validation events yet</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.timeline-list {
  max-height: 400px;
  overflow-y: auto;
}

.timeline-item {
  position: relative;
}

.timeline-dot-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-line {
  width: 2px;
  height: 100%;
  position: absolute;
  top: 36px;
  opacity: 0.3;
}
</style>
