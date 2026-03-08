/**
 * Vitest global setup
 *
 * Mocks Nuxt auto-imports (ref, computed, readonly, useRuntimeConfig, etc.)
 * so composables can be tested in isolation without full Nuxt runtime.
 */
import { vi } from 'vitest'
import { ref, computed, readonly, reactive, watch, watchEffect, toRef, toRefs, nextTick } from 'vue'

// ── Mock Nuxt auto-imports as globals ──
// Nuxt auto-imports these — in test we make them available globally

const _globalAny = globalThis as any

_globalAny.ref = ref
_globalAny.computed = computed
_globalAny.readonly = readonly
_globalAny.reactive = reactive
_globalAny.watch = watch
_globalAny.watchEffect = watchEffect
_globalAny.toRef = toRef
_globalAny.toRefs = toRefs
_globalAny.nextTick = nextTick

// ── Mock useRuntimeConfig ──
_globalAny.useRuntimeConfig = vi.fn(() => ({
  public: {
    apiBaseUrl: 'http://localhost:9001',
  },
}))

// ── Mock import.meta.client ──
// In test environment, simulate client-side
Object.defineProperty(import.meta, 'client', {
  value: true,
  writable: true,
  configurable: true,
})

Object.defineProperty(import.meta, 'server', {
  value: false,
  writable: true,
  configurable: true,
})
