/**
 * Unit tests for usePrice composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

let usePrice: typeof import('../../../app/composables/usePrice').usePrice

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/usePrice')
  usePrice = mod.usePrice
})

const mockPriceData = {
  symbolId: 1,
  symbol: 'BTC-USD',
  price: 50000,
  previousClose: 49000,
  change: 1000,
  changePercent: 2.04,
  timestamp: '2024-01-01T00:00:00Z',
}

describe('usePrice', () => {
  describe('initial state', () => {
    it('should start with empty cache and no loading', () => {
      const { priceCache, hasAnyLoading } = usePrice()
      expect(priceCache.value.size).toBe(0)
      expect(hasAnyLoading.value).toBe(false)
    })
  })

  describe('fetchPrice', () => {
    it('should fetch price and cache it', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPriceData },
      })

      const { fetchPrice, getCachedPrice } = usePrice()
      const result = await fetchPrice(1)

      expect(result).toEqual(mockPriceData)
      expect(getCachedPrice(1)).toEqual(mockPriceData)
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:9001/api/data/1/price')
    })

    it('should return cached data without calling API', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPriceData },
      })

      const { fetchPrice } = usePrice()
      await fetchPrice(1)
      mockedAxios.get.mockClear()

      const result = await fetchPrice(1)
      expect(result).toEqual(mockPriceData)
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('should bypass cache with forceRefresh', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockPriceData },
      })

      const { fetchPrice } = usePrice()
      await fetchPrice(1)
      mockedAxios.get.mockClear()

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: { ...mockPriceData, price: 51000 } },
      })

      const result = await fetchPrice(1, true)
      expect(result!.price).toBe(51000)
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    it('should prevent duplicate concurrent requests (loading guard)', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockImplementationOnce(() =>
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchPrice, isLoadingPrice } = usePrice()
      const p1 = fetchPrice(1)

      expect(isLoadingPrice(1)).toBe(true)
      const result2 = await fetchPrice(1) // should return null because already loading
      expect(result2).toBeNull()

      resolvePromise!({ data: { success: true, data: mockPriceData } })
      await p1
    })

    it('should handle API error and set error state', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { error: 'Server error' } },
        message: 'Request failed',
      })

      const { fetchPrice, getPriceError } = usePrice()
      const result = await fetchPrice(1)

      expect(result).toBeNull()
      expect(getPriceError(1)).toBe('Server error')
    })

    it('should handle network error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchPrice, getPriceError } = usePrice()
      const result = await fetchPrice(1)

      expect(result).toBeNull()
      expect(getPriceError(1)).toBe('Network Error')
    })

    it('should handle API returning success=false', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'Not found' },
      })

      const { fetchPrice, getPriceError } = usePrice()
      const result = await fetchPrice(1)

      expect(result).toBeNull()
      expect(getPriceError(1)).toBe('Not found')
    })

    it('should manage loading state correctly', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve
        }) as any,
      )

      const { fetchPrice, isLoadingPrice, hasAnyLoading } = usePrice()
      const promise = fetchPrice(1)

      expect(isLoadingPrice(1)).toBe(true)
      expect(hasAnyLoading.value).toBe(true)

      resolvePromise!({ data: { success: true, data: mockPriceData } })
      await promise

      expect(isLoadingPrice(1)).toBe(false)
      expect(hasAnyLoading.value).toBe(false)
    })
  })

  describe('clearPriceCache', () => {
    it('should clear cache for specific symbol', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPriceData },
      })

      const { fetchPrice, getCachedPrice, clearPriceCache } = usePrice()
      await fetchPrice(1)
      expect(getCachedPrice(1)).toBeDefined()

      clearPriceCache(1)
      expect(getCachedPrice(1)).toBeUndefined()
    })

    it('should clear all cache when no symbolId provided', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockPriceData },
      })

      const { fetchPrice, priceCache, clearPriceCache } = usePrice()
      await fetchPrice(1)
      await fetchPrice(2)

      clearPriceCache()
      expect(priceCache.value.size).toBe(0)
    })
  })

  describe('singleton pattern', () => {
    it('should share cache across multiple calls', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPriceData },
      })

      const inst1 = usePrice()
      await inst1.fetchPrice(1)

      const inst2 = usePrice()
      expect(inst2.getCachedPrice(1)).toEqual(mockPriceData)
    })
  })
})
