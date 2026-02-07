<script setup lang="ts">
interface Props {
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
})

const emit = defineEmits<{
  analyze: []
}>()
</script>

<template>
  <v-btn
    :color="props.loading ? 'primary' : 'success'"
    variant="elevated"
    :disabled="props.disabled || props.loading"
    block
    size="large"
    rounded="lg"
    class="font-weight-bold text-body-1"
    style="letter-spacing: 0.05em;"
    @click="emit('analyze')"
  >
    <template v-if="props.loading">
      <v-progress-circular indeterminate size="18" width="2" class="mr-2" />
      กำลังวิเคราะห์...
    </template>
    <template v-else>
      <v-icon icon="mdi-flash" start />
      AI ANALYSIS
    </template>
  </v-btn>
</template>
