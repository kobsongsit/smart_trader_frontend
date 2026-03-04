import axios from 'axios'
import type { SymbolInfo, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับจัดการ Symbols
 *
 * ⚠️ Shared singleton — ทุก component ที่เรียก useSymbols() จะใช้ state/cache เดียวกัน
 * (module-level state เหมือน useWatchlist / useAnalysis)
 */

// ============================================================
// Shared state (module-level singleton)
// ============================================================
const symbols = ref<SymbolInfo[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useSymbols() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  // Fetch symbols with optional filters
  async function fetchSymbols(options?: { type?: string; isActive?: boolean }) {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (options?.type) params.append('type', options.type)
      if (options?.isActive !== undefined) params.append('isActive', String(options.isActive))

      const url = `${baseUrl}/api/symbols${params.toString() ? '?' + params.toString() : ''}`
      const { data: response } = await axios.get<ApiResponse<SymbolInfo[]>>(url)

      if (response.success) {
        symbols.value = response.data
      } else {
        throw new Error(response.error || 'Failed to fetch symbols')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch symbols'
    } finally {
      isLoading.value = false
    }
  }

  // Fetch active symbols only
  async function fetchActiveSymbols() {
    return fetchSymbols({ isActive: true })
  }

  // Get symbol by ID
  function getSymbolById(id: number): SymbolInfo | undefined {
    return symbols.value.find(s => s.id === id)
  }

  // Computed
  const activeSymbols = computed(() => symbols.value.filter(s => s.isActive))
  const cryptoSymbols = computed(() => symbols.value.filter(s => s.type === 'CRYPTO'))
  const stockSymbols = computed(() => symbols.value.filter(s => s.type === 'STOCK'))
  const forexSymbols = computed(() => symbols.value.filter(s => s.type === 'FOREX'))

  return {
    // State (readonly — ป้องกัน consumer แก้ตรง)
    symbols: readonly(symbols),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Computed
    activeSymbols,
    cryptoSymbols,
    stockSymbols,
    forexSymbols,

    // Actions
    fetchSymbols,
    fetchActiveSymbols,
    getSymbolById
  }
}
