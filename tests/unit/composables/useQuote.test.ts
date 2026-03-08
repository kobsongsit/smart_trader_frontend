/**
 * Unit tests for useQuote composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

let useQuote: typeof import('../../../app/composables/useQuote').useQuote

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/useQuote')
  useQuote = mod.useQuote
})

const mockQuote = {
  symbolId: 1,
  symbol: 'BTC-USD',
  price: 50000,
  change: 1000,
  changePercent: 2.04,
  high24h: 51000,
  low24h: 49000,
  volume24h: 1000000,
  timestamp: '2024-01-01T00:00:00Z',
}

describe('useQuote', () => {
  describe('fetchQuote', () => {
    it('should fetch and cache quote', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockQuote },
      })

      const { fetchQuote, getCachedQuote } = useQuote()
      const result = await fetchQuote(1)

      expect(result).toEqual(mockQuote)
      expect(getCachedQuote(1)).toEqual(mockQuote)
    })

    it('should return cached data without API call (same instance)', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockQuote },
      })

      // useQuote has instance-level state, so must use same instance
      const instance = useQuote()
      await instance.fetchQuote(1)
      mockedAxios.get.mockClear()

      const result = await instance.fetchQuote(1)
      expect(result).toEqual(mockQuote)
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('should bypass cache with forceRefresh (same instance)', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockQuote },
      })

      const instance = useQuote()
      await instance.fetchQuote(1)
      mockedAxios.get.mockClear()

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: { ...mockQuote, price: 55000 } },
      })
      const result = await instance.fetchQuote(1, true)
      expect(result!.price).toBe(55000)
    })

    it('should handle API error with response', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { error: 'Not found' } },
        message: 'Failed',
      })

      const { fetchQuote, getError } = useQuote()
      const result = await fetchQuote(1)

      expect(result).toBeNull()
      expect(getError(1)).toBe('Not found')
    })

    it('should handle network error without response', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchQuote, getError } = useQuote()
      const result = await fetchQuote(1)

      expect(result).toBeNull()
      expect(getError(1)).toBe('Network Error')
    })

    it('should handle success=false response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'Quote unavailable' },
      })

      const { fetchQuote, getError } = useQuote()
      const result = await fetchQuote(1)

      expect(result).toBeNull()
      expect(getError(1)).toBe('Quote unavailable')
    })

    it('should manage loading state', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchQuote, isLoadingSymbol, hasAnyLoading } = useQuote()
      const promise = fetchQuote(1)

      expect(isLoadingSymbol(1)).toBe(true)
      expect(hasAnyLoading.value).toBe(true)

      resolvePromise!({ data: { success: true, data: mockQuote } })
      await promise

      expect(isLoadingSymbol(1)).toBe(false)
      expect(hasAnyLoading.value).toBe(false)
    })
  })

  describe('fetchMultipleQuotes', () => {
    it('should fetch quotes for multiple symbols', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockQuote },
      })

      const { fetchMultipleQuotes, getCachedQuote } = useQuote()
      await fetchMultipleQuotes([1, 2])

      expect(getCachedQuote(1)).toBeDefined()
      expect(getCachedQuote(2)).toBeDefined()
    })
  })

  describe('clearCache', () => {
    it('should clear specific symbol', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockQuote },
      })

      const { fetchQuote, getCachedQuote, clearCache } = useQuote()
      await fetchQuote(1)
      clearCache(1)
      expect(getCachedQuote(1)).toBeUndefined()
    })

    it('should clear all', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockQuote },
      })

      const { fetchQuote, quotesCache, clearCache } = useQuote()
      await fetchQuote(1)
      await fetchQuote(2)
      clearCache()
      expect(quotesCache.value.size).toBe(0)
    })
  })
})
