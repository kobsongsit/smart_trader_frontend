/**
 * Unit tests for useSignals composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

let useSignals: typeof import('../../../app/composables/useSignals').useSignals

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/useSignals')
  useSignals = mod.useSignals
})

const mockSignal = {
  id: 1,
  timestamp: '2024-01-01T00:00:00Z',
  strategy: 'BUY' as const,
  strategyLabel: 'Buy',
  confidence: 85,
  confidenceLabel: 'High',
  prices: {
    entry: 50000, takeProfit: 55000, stopLoss: 48000,
    riskRewardRatio: '1:2.5', potentialProfit: 10, potentialLoss: 4,
    profitPips: 5000, lossPips: 2000,
  },
  levels: { support: [49000], resistance: [52000] },
  analysis: { summary: 'Bullish trend', keyFactors: ['RSI'], warnings: [] },
  performance: {
    status: 'ACTIVE' as const, statusLabel: 'Active',
    currentPrice: 50500, profitLoss: 500, profitLossPercent: 1,
    maxProfit: 600, maxDrawdown: 200, durationMinutes: 60,
  },
}

describe('useSignals', () => {
  describe('initial state', () => {
    it('should start with empty state', () => {
      const { currentSignal, signalHistory, isAnalyzing, isLoadingHistory, error } = useSignals()
      expect(currentSignal.value).toBeNull()
      expect(signalHistory.value).toEqual([])
      expect(isAnalyzing.value).toBe(false)
      expect(isLoadingHistory.value).toBe(false)
      expect(error.value).toBeNull()
    })
  })

  describe('analyzeSignal', () => {
    it('should call POST and update currentSignal', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: mockSignal },
      })

      const { analyzeSignal, currentSignal } = useSignals()
      const result = await analyzeSignal(1)

      expect(result).toEqual(mockSignal)
      expect(currentSignal.value).toEqual(mockSignal)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:9001/api/signals/analyze',
        { symbolId: 1, includeNews: false },
      )
    })

    it('should pass includeNews parameter', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: mockSignal },
      })

      const { analyzeSignal } = useSignals()
      await analyzeSignal(1, true)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:9001/api/signals/analyze',
        { symbolId: 1, includeNews: true },
      )
    })

    it('should handle API error with response data', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: { data: { error: 'Analysis failed' } },
        message: 'Failed',
      })

      const { analyzeSignal, error } = useSignals()
      const result = await analyzeSignal(1)

      expect(result).toBeNull()
      expect(error.value).toBe('Analysis failed')
    })

    it('should handle network error without response', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'))

      const { analyzeSignal, error } = useSignals()
      const result = await analyzeSignal(1)

      expect(result).toBeNull()
      expect(error.value).toBe('Network Error')
    })

    it('should manage isAnalyzing state', async () => {
      let resolvePromise: Function
      mockedAxios.post.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { analyzeSignal, isAnalyzing } = useSignals()
      const promise = analyzeSignal(1)

      expect(isAnalyzing.value).toBe(true)

      resolvePromise!({ data: { success: true, data: mockSignal } })
      await promise

      expect(isAnalyzing.value).toBe(false)
    })

    it('should handle success=false response', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: false, error: 'Insufficient data' },
      })

      const { analyzeSignal, error } = useSignals()
      const result = await analyzeSignal(1)

      expect(result).toBeNull()
      expect(error.value).toBe('Insufficient data')
    })

    it('should handle network error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'))

      const { analyzeSignal, error } = useSignals()
      const result = await analyzeSignal(1)

      expect(result).toBeNull()
      expect(error.value).toBe('Network Error')
    })
  })

  describe('fetchSignalHistory', () => {
    it('should fetch signal history', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [mockSignal] },
      })

      const { fetchSignalHistory, signalHistory } = useSignals()
      const result = await fetchSignalHistory(1)

      expect(result).toEqual([mockSignal])
      expect(signalHistory.value).toEqual([mockSignal])
    })

    it('should pass limit parameter', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [] },
      })

      const { fetchSignalHistory } = useSignals()
      await fetchSignalHistory(1, 5)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:9001/api/signals/1?limit=5',
      )
    })

    it('should handle network error and return empty array', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Failed'))

      const { fetchSignalHistory, error } = useSignals()
      const result = await fetchSignalHistory(1)

      expect(result).toEqual([])
      expect(error.value).toBe('Failed')
    })

    it('should handle error with response data', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { error: 'Rate limited' } },
        message: 'Too many requests',
      })

      const { fetchSignalHistory, error } = useSignals()
      const result = await fetchSignalHistory(1)

      expect(result).toEqual([])
      expect(error.value).toBe('Rate limited')
    })

    it('should handle success=false response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'No history' },
      })

      const { fetchSignalHistory, error } = useSignals()
      const result = await fetchSignalHistory(1)

      expect(result).toEqual([])
      expect(error.value).toBe('No history')
    })

    it('should use default limit of 10', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [] },
      })

      const { fetchSignalHistory } = useSignals()
      await fetchSignalHistory(1)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:9001/api/signals/1?limit=10',
      )
    })

    it('should manage loading state', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchSignalHistory, isLoadingHistory } = useSignals()
      const promise = fetchSignalHistory(1)

      expect(isLoadingHistory.value).toBe(true)

      resolvePromise!({ data: { success: true, data: [] } })
      await promise

      expect(isLoadingHistory.value).toBe(false)
    })
  })

  describe('fetchLatestSignal', () => {
    it('should fetch and set currentSignal', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockSignal },
      })

      const { fetchLatestSignal, currentSignal } = useSignals()
      const result = await fetchLatestSignal(1)

      expect(result).toEqual(mockSignal)
      expect(currentSignal.value).toEqual(mockSignal)
    })

    it('should not set error on 404', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 404, data: { error: 'Not found' } },
        message: 'Not found',
      })

      const { fetchLatestSignal, error } = useSignals()
      const result = await fetchLatestSignal(1)

      expect(result).toBeNull()
      expect(error.value).toBeNull()
    })

    it('should set error on non-404 errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 500, data: { error: 'Server error' } },
        message: 'Server error',
      })

      const { fetchLatestSignal, error } = useSignals()
      const result = await fetchLatestSignal(1)

      expect(result).toBeNull()
      expect(error.value).toBe('Server error')
    })

    it('should handle success=false response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'Signal expired' },
      })

      const { fetchLatestSignal, error } = useSignals()
      const result = await fetchLatestSignal(1)

      expect(result).toBeNull()
      expect(error.value).toBe('Signal expired')
    })

    it('should handle network error without response', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchLatestSignal, error } = useSignals()
      const result = await fetchLatestSignal(1)

      expect(result).toBeNull()
      expect(error.value).toBe('Network Error')
    })
  })

  describe('clearSignal', () => {
    it('should clear all state', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: mockSignal },
      })

      const { analyzeSignal, clearSignal, currentSignal, signalHistory, error } = useSignals()
      await analyzeSignal(1)

      clearSignal()

      expect(currentSignal.value).toBeNull()
      expect(signalHistory.value).toEqual([])
      expect(error.value).toBeNull()
    })
  })
})
