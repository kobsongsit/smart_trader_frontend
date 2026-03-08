/**
 * Unit tests for useTrends composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

let useTrends: typeof import('../../../app/composables/useTrends').useTrends

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/useTrends')
  useTrends = mod.useTrends
})

const mockTrendsData = {
  timeframes: {
    '15m': { direction: 'BULLISH' as const, strength: 'STRONG' as const, adx: 30, plusDI: 25, minusDI: 15 },
    '1h': { direction: 'BULLISH' as const, strength: 'MODERATE' as const, adx: 25, plusDI: 22, minusDI: 18 },
  },
  analysis: {
    majorityTrend: 'BULLISH' as const,
    strength: 8,
    consensus: 'strong',
  },
}

describe('useTrends', () => {
  describe('initial state', () => {
    it('should start with empty state', () => {
      const { trendsCache, hasAnyLoading } = useTrends()
      expect(trendsCache.value.size).toBe(0)
      expect(hasAnyLoading.value).toBe(false)
    })
  })

  describe('fetchTrends', () => {
    it('should fetch and cache trends', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockTrendsData },
      })

      const { fetchTrends, getCachedTrends } = useTrends()
      const result = await fetchTrends(1)

      expect(result).toEqual(mockTrendsData)
      expect(getCachedTrends(1)).toEqual(mockTrendsData)
    })

    it('should return cached data without API call', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockTrendsData },
      })

      const { fetchTrends } = useTrends()
      await fetchTrends(1)
      mockedAxios.get.mockClear()

      const result = await fetchTrends(1)
      expect(result).toEqual(mockTrendsData)
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('should bypass cache with forceRefresh', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockTrendsData },
      })

      const { fetchTrends } = useTrends()
      await fetchTrends(1)
      mockedAxios.get.mockClear()

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockTrendsData },
      })

      await fetchTrends(1, true)
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    it('should prevent duplicate concurrent requests (loading guard)', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockImplementationOnce(() =>
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchTrends, isLoadingSymbol } = useTrends()
      const p1 = fetchTrends(1)

      // After starting p1, symbol 1 should be loading
      expect(isLoadingSymbol(1)).toBe(true)

      // p2 should detect loading and return cached (null)
      const result2 = await fetchTrends(1)
      expect(result2).toBeNull()

      resolvePromise!({ data: { success: true, data: mockTrendsData } })
      await p1
    })

    it('should handle API error with response', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { error: 'Server error' } },
        message: 'Failed',
      })

      const { fetchTrends, getError } = useTrends()
      const result = await fetchTrends(1)

      expect(result).toBeNull()
      expect(getError(1)).toBe('Server error')
    })

    it('should handle network error without response', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchTrends, getError } = useTrends()
      const result = await fetchTrends(1)

      expect(result).toBeNull()
      expect(getError(1)).toBe('Network Error')
    })

    it('should handle success=false response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'No trends' },
      })

      const { fetchTrends, getError } = useTrends()
      const result = await fetchTrends(1)

      expect(result).toBeNull()
      expect(getError(1)).toBe('No trends')
    })

    it('should manage loading state', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchTrends, isLoadingSymbol, hasAnyLoading } = useTrends()
      const promise = fetchTrends(1)

      expect(isLoadingSymbol(1)).toBe(true)
      expect(hasAnyLoading.value).toBe(true)

      resolvePromise!({ data: { success: true, data: mockTrendsData } })
      await promise

      expect(isLoadingSymbol(1)).toBe(false)
    })
  })

  describe('fetchMultipleTrends', () => {
    it('should fetch trends for multiple symbols', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockTrendsData },
      })

      const { fetchMultipleTrends, getCachedTrends } = useTrends()
      await fetchMultipleTrends([1, 2, 3])

      expect(getCachedTrends(1)).toBeDefined()
      expect(getCachedTrends(2)).toBeDefined()
      expect(getCachedTrends(3)).toBeDefined()
    })
  })

  describe('clearCache', () => {
    it('should clear specific symbol cache', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockTrendsData },
      })

      const { fetchTrends, getCachedTrends, clearCache } = useTrends()
      await fetchTrends(1)
      clearCache(1)
      expect(getCachedTrends(1)).toBeUndefined()
    })

    it('should clear all cache', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockTrendsData },
      })

      const { fetchTrends, trendsCache, clearCache } = useTrends()
      await fetchTrends(1)
      await fetchTrends(2)
      clearCache()
      expect(trendsCache.value.size).toBe(0)
    })
  })
})
