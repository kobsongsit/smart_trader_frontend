/**
 * Unit tests for useSymbols composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

let useSymbols: typeof import('../../../app/composables/useSymbols').useSymbols

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/useSymbols')
  useSymbols = mod.useSymbols
})

const mockSymbols = [
  { id: 1, symbol: 'BTC-USD', name: 'Bitcoin', type: 'CRYPTO' as const, exchange: 'BINANCE', isActive: true },
  { id: 2, symbol: 'AAPL', name: 'Apple', type: 'STOCK' as const, exchange: 'NASDAQ', isActive: true },
  { id: 3, symbol: 'EUR-USD', name: 'Euro/Dollar', type: 'FOREX' as const, exchange: 'FOREX', isActive: false },
]

describe('useSymbols', () => {
  describe('initial state', () => {
    it('should start with empty state', () => {
      const { symbols, isLoading, error } = useSymbols()
      expect(symbols.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
    })
  })

  describe('fetchSymbols', () => {
    it('should fetch and store symbols', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockSymbols },
      })

      const { fetchSymbols, symbols } = useSymbols()
      await fetchSymbols()

      expect(symbols.value).toEqual(mockSymbols)
    })

    it('should pass type filter in query', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [mockSymbols[0]] },
      })

      const { fetchSymbols } = useSymbols()
      await fetchSymbols({ type: 'CRYPTO' })

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('type=CRYPTO'),
      )
    })

    it('should pass isActive filter in query', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockSymbols },
      })

      const { fetchSymbols } = useSymbols()
      await fetchSymbols({ isActive: true })

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('isActive=true'),
      )
    })

    it('should handle error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchSymbols, error } = useSymbols()
      await fetchSymbols()

      expect(error.value).toBe('Network Error')
    })

    it('should handle API success=false', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'No symbols found' },
      })

      const { fetchSymbols, error } = useSymbols()
      await fetchSymbols()

      expect(error.value).toBe('No symbols found')
    })

    it('should manage loading state', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchSymbols, isLoading } = useSymbols()
      const promise = fetchSymbols()

      expect(isLoading.value).toBe(true)

      resolvePromise!({ data: { success: true, data: mockSymbols } })
      await promise

      expect(isLoading.value).toBe(false)
    })
  })

  describe('fetchActiveSymbols', () => {
    it('should fetch only active symbols', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockSymbols.filter(s => s.isActive) },
      })

      const { fetchActiveSymbols } = useSymbols()
      await fetchActiveSymbols()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('isActive=true'),
      )
    })
  })

  describe('getSymbolById', () => {
    it('should return symbol by id', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockSymbols },
      })

      const { fetchSymbols, getSymbolById } = useSymbols()
      await fetchSymbols()

      expect(getSymbolById(1)?.symbol).toBe('BTC-USD')
      expect(getSymbolById(999)).toBeUndefined()
    })
  })

  describe('computed filters', () => {
    it('should compute activeSymbols correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockSymbols },
      })

      const { fetchSymbols, activeSymbols } = useSymbols()
      await fetchSymbols()

      expect(activeSymbols.value).toHaveLength(2)
    })

    it('should compute cryptoSymbols correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockSymbols },
      })

      const { fetchSymbols, cryptoSymbols } = useSymbols()
      await fetchSymbols()

      expect(cryptoSymbols.value).toHaveLength(1)
      expect(cryptoSymbols.value[0].type).toBe('CRYPTO')
    })

    it('should compute stockSymbols correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockSymbols },
      })

      const { fetchSymbols, stockSymbols } = useSymbols()
      await fetchSymbols()

      expect(stockSymbols.value).toHaveLength(1)
    })

    it('should compute forexSymbols correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockSymbols },
      })

      const { fetchSymbols, forexSymbols } = useSymbols()
      await fetchSymbols()

      expect(forexSymbols.value).toHaveLength(1)
    })
  })
})
