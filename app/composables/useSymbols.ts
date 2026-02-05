import type { Symbol, ApiResponse } from '../../types/trading'

/**
 * Composable สำหรับจัดการ Symbols
 */
export function useSymbols() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl || 'http://localhost:3000'

  // State
  const symbols = ref<Symbol[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Fetch active symbols
  async function fetchSymbols(options?: { type?: string; isActive?: boolean }) {
    isLoading.value = true
    error.value = null

    try {
      const params = new URLSearchParams()
      if (options?.type) params.append('type', options.type)
      if (options?.isActive !== undefined) params.append('isActive', String(options.isActive))

      const url = `${baseUrl}/api/symbols${params.toString() ? '?' + params.toString() : ''}`
      const response = await $fetch<ApiResponse<Symbol[]>>(url)

      if (response.success) {
        symbols.value = response.data
      } else {
        throw new Error(response.error || 'Failed to fetch symbols')
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch symbols'
      console.error('Error fetching symbols:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Fetch active symbols only
  async function fetchActiveSymbols() {
    return fetchSymbols({ isActive: true })
  }

  // Get symbol by ID
  function getSymbolById(id: number): Symbol | undefined {
    return symbols.value.find(s => s.id === id)
  }

  // Computed
  const activeSymbols = computed(() => symbols.value.filter(s => s.isActive))
  const cryptoSymbols = computed(() => symbols.value.filter(s => s.type === 'CRYPTO'))
  const stockSymbols = computed(() => symbols.value.filter(s => s.type === 'STOCK'))
  const forexSymbols = computed(() => symbols.value.filter(s => s.type === 'FOREX'))

  return {
    // State
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
