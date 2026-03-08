/**
 * Unit tests for useIndicators composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

let useIndicators: typeof import('../../../app/composables/useIndicators').useIndicators

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/useIndicators')
  useIndicators = mod.useIndicators
})

const mockRawResponse = {
  symbol: 'BTC-USD',
  symbolName: 'Bitcoin',
  interval: '15m' as const,
  indicators: {
    timestamp: '2024-01-01T00:00:00Z',
    movingAverages: { sma50: 49000, sma200: 45000, ema20: 49500 },
    macd: { line: 100, signal: 80, histogram: 20 },
    bollingerBands: { upper: 52000, middle: 50000, lower: 48000 },
    rsi: 55,
    stochastic: { k: 60, d: 55 },
    obv: 1000000,
    atr: 500,
    adx: { adx: 25, plusDI: 20, minusDI: 15 },
    ichimoku: { conversion: 50000, base: 49500, spanA: 49800, spanB: 49200 },
  },
}

const mockEnhancedResponse = {
  ...mockRawResponse,
  derivedSignals: {
    bollingerSqueeze: false,
    rsiDivergence: null,
    macdDivergence: null,
    smaCrossover: 'GOLDEN' as const,
    candlestickPattern: null,
    patternDirection: null,
  },
  bollingerPosition: { percentB: 65, position: 'UPPER_HALF' as const },
  ichimokuSignals: { tkCross: 'BULLISH' as const, priceVsCloud: 'ABOVE' as const, cloudColor: 'BULLISH' as const },
  summary: { bullish: 5, bearish: 1, neutral: 1, overall: 'BULLISH' as const },
}

describe('useIndicators', () => {
  describe('initial state', () => {
    it('should start with empty state', () => {
      const { error } = useIndicators()
      expect(error.value).toBeNull()
    })
  })

  describe('fetchIndicators', () => {
    it('should fetch and cache raw indicators', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockRawResponse },
      })

      const { fetchIndicators, getCached } = useIndicators()
      const result = await fetchIndicators(1, '15m')

      expect(result).toEqual(mockRawResponse)
      expect(getCached(1, '15m')).toEqual(mockRawResponse)
    })

    it('should use default interval 15m', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockRawResponse },
      })

      const { fetchIndicators } = useIndicators()
      await fetchIndicators(1)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('interval=15m'),
      )
    })

    it('should fetch enhanced mode when specified', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockEnhancedResponse },
      })

      const { fetchIndicators } = useIndicators()
      await fetchIndicators(1, '15m', { enhanced: true })

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('enhanced=true'),
      )
    })

    it('should return cached data without API call', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockRawResponse },
      })

      const { fetchIndicators } = useIndicators()
      await fetchIndicators(1, '15m')
      mockedAxios.get.mockClear()

      const result = await fetchIndicators(1, '15m')
      expect(result).toEqual(mockRawResponse)
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('should bypass cache with forceRefresh', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockRawResponse },
      })

      const { fetchIndicators } = useIndicators()
      await fetchIndicators(1, '15m')
      mockedAxios.get.mockClear()

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockRawResponse },
      })
      await fetchIndicators(1, '15m', { forceRefresh: true })
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    it('should prevent duplicate concurrent requests (loading guard)', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockImplementationOnce(() =>
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchIndicators, isLoading } = useIndicators()
      const p1 = fetchIndicators(1, '15m')

      expect(isLoading(1, '15m')).toBe(true)
      const result2 = await fetchIndicators(1, '15m')
      expect(result2).toBeNull()

      resolvePromise!({ data: { success: true, data: mockRawResponse } })
      await p1
    })

    it('should handle API error', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { error: { message: 'Server error' } } },
        message: 'Failed',
      })

      const { fetchIndicators, error } = useIndicators()
      const result = await fetchIndicators(1, '15m')

      expect(result).toBeNull()
      expect(error.value).toBe('Server error')
    })

    it('should manage loading state', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchIndicators, isLoading } = useIndicators()
      const promise = fetchIndicators(1, '15m')

      expect(isLoading(1, '15m')).toBe(true)

      resolvePromise!({ data: { success: true, data: mockRawResponse } })
      await promise

      expect(isLoading(1, '15m')).toBe(false)
    })

    it('should cache different intervals separately', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockRawResponse },
      })
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: { ...mockRawResponse, interval: '1h' } },
      })

      const { fetchIndicators, getCached } = useIndicators()
      await fetchIndicators(1, '15m')
      await fetchIndicators(1, '1h')

      expect(getCached(1, '15m')).toBeDefined()
      expect(getCached(1, '1h')).toBeDefined()
    })
  })

  describe('getSignalCount', () => {
    it('should compute bullish/bearish/neutral counts from raw indicators', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockRawResponse },
      })

      const { fetchIndicators, getSignalCount } = useIndicators()
      await fetchIndicators(1, '15m')

      const count = getSignalCount(1, '15m', 50000)
      expect(count.bullish).toBeGreaterThan(0)
      expect(count.bullish + count.bearish + count.neutral).toBe(7)
    })

    it('should return zeros when no cached data', () => {
      const { getSignalCount } = useIndicators()
      const count = getSignalCount(999, '15m')
      expect(count).toEqual({ bullish: 0, bearish: 0, neutral: 0 })
    })

    it('should handle null indicator values gracefully', async () => {
      const nullIndicators = {
        ...mockRawResponse,
        indicators: {
          ...mockRawResponse.indicators,
          movingAverages: { sma50: null, sma200: null, ema20: null },
          macd: { line: null, signal: null, histogram: null },
          rsi: null,
          stochastic: null,
          adx: null,
        },
      }
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: nullIndicators },
      })

      const { fetchIndicators, getSignalCount } = useIndicators()
      await fetchIndicators(1, '15m')

      const count = getSignalCount(1, '15m')
      // All should be neutral since values are null
      expect(count.neutral).toBe(7)
    })
  })

  describe('enhanced helpers', () => {
    it('getDerivedSignals should return signals from enhanced response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockEnhancedResponse },
      })

      const { fetchIndicators, getDerivedSignals } = useIndicators()
      await fetchIndicators(1, '15m', { enhanced: true })

      const signals = getDerivedSignals(1, '15m')
      expect(signals?.smaCrossover).toBe('GOLDEN')
    })

    it('getDerivedSignals should return null for raw response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockRawResponse },
      })

      const { fetchIndicators, getDerivedSignals } = useIndicators()
      await fetchIndicators(1, '15m')

      expect(getDerivedSignals(1, '15m')).toBeNull()
    })

    it('getBBPosition should return position from enhanced response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockEnhancedResponse },
      })

      const { fetchIndicators, getBBPosition } = useIndicators()
      await fetchIndicators(1, '15m', { enhanced: true })

      expect(getBBPosition(1, '15m')?.position).toBe('UPPER_HALF')
    })

    it('getServerSummary should return summary from enhanced response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockEnhancedResponse },
      })

      const { fetchIndicators, getServerSummary } = useIndicators()
      await fetchIndicators(1, '15m', { enhanced: true })

      expect(getServerSummary(1, '15m')?.overall).toBe('BULLISH')
    })

    it('getIchimokuSignals should return ichimoku from enhanced response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockEnhancedResponse },
      })

      const { fetchIndicators, getIchimokuSignals } = useIndicators()
      await fetchIndicators(1, '15m', { enhanced: true })

      expect(getIchimokuSignals(1, '15m')?.tkCross).toBe('BULLISH')
    })

    it('getIchimokuSignals should return null when no ichimoku data', async () => {
      const noIchimoku = { ...mockEnhancedResponse, ichimokuSignals: null }
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: noIchimoku },
      })

      const { fetchIndicators, getIchimokuSignals } = useIndicators()
      await fetchIndicators(1, '15m', { enhanced: true })

      expect(getIchimokuSignals(1, '15m')).toBeNull()
    })
  })

  describe('clearCache', () => {
    it('should clear specific symbol (all TFs)', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockRawResponse },
      })

      const { fetchIndicators, getCached, clearCache } = useIndicators()
      await fetchIndicators(1, '15m')
      await fetchIndicators(1, '1h')

      clearCache(1)
      expect(getCached(1, '15m')).toBeUndefined()
      expect(getCached(1, '1h')).toBeUndefined()
    })

    it('should clear all cache', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockRawResponse },
      })

      const { fetchIndicators, getCached, clearCache } = useIndicators()
      await fetchIndicators(1, '15m')
      await fetchIndicators(2, '1h')

      clearCache()
      expect(getCached(1, '15m')).toBeUndefined()
      expect(getCached(2, '1h')).toBeUndefined()
    })
  })
})
