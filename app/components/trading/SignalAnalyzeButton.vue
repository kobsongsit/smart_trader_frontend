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
    color="success"
    variant="elevated"
    :loading="props.loading"
    :disabled="props.disabled || props.loading"
    block
    size="large"
    rounded="lg"
    class="font-weight-bold text-body-1"
    style="letter-spacing: 0.05em;"
    @click="emit('analyze')"
  >
    <v-icon icon="mdi-flash" start />
    AI ANALYSIS
  </v-btn>
</template>
