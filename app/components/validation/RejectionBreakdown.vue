<script setup lang="ts">
interface RejectionItem {
  label: string
  value: number
  color: string
  icon: string
}

interface Props {
  title: string
  items: RejectionItem[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0))

function getPercentage(value: number): number {
  if (total.value === 0) return 0
  return (value / total.value) * 100
}
</script>

<template>
  <v-card elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon
        icon="mdi-chart-pie"
        class="mr-2"
        color="primary"
      />
      {{ props.title }}
      <v-spacer />
      <v-chip
        color="error"
        size="small"
        variant="flat"
      >
        Total: {{ total }}
      </v-chip>
    </v-card-title>

    <v-card-text>
      <v-skeleton-loader
        v-if="props.loading"
        type="list-item@3"
      />

      <v-list
        v-else
        lines="two"
        density="compact"
      >
        <v-list-item
          v-for="item in props.items"
          :key="item.label"
          class="px-0"
        >
          <template #prepend>
            <v-avatar
              :color="item.color"
              size="40"
              variant="tonal"
            >
              <v-icon
                :icon="item.icon"
                :color="item.color"
              />
            </v-avatar>
          </template>

          <v-list-item-title class="font-weight-medium">
            {{ item.label }}
          </v-list-item-title>

          <v-list-item-subtitle>
            <v-progress-linear
              :model-value="getPercentage(item.value)"
              :color="item.color"
              height="6"
              rounded
              class="mt-1"
            />
          </v-list-item-subtitle>

          <template #append>
            <div class="text-right">
              <div class="text-h6 font-weight-bold">
                {{ item.value }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ getPercentage(item.value).toFixed(1) }}%
              </div>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
