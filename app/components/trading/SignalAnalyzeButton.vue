<script setup lang="ts">
interface Props {
  loading?: boolean
  disabled?: boolean
  includeNews?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
  includeNews: false
})

const emit = defineEmits<{
  analyze: [includeNews: boolean]
}>()

const localIncludeNews = ref(props.includeNews)

function handleAnalyze() {
  emit('analyze', localIncludeNews.value)
}
</script>

<template>
  <div>
    <v-btn
      color="primary"
      variant="elevated"
      :loading="props.loading"
      :disabled="props.disabled || props.loading"
      block
      size="large"
      rounded="lg"
      @click="handleAnalyze"
    >
      <v-icon icon="mdi-robot" start />
      AI Analysis
    </v-btn>

    <v-checkbox
      v-model="localIncludeNews"
      label="Include News Analysis"
      density="compact"
      hide-details
      class="mt-2"
      :disabled="props.loading"
    />
  </div>
</template>
