/**
 * Unit tests for useValidation composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

let useValidation: typeof import('../../../app/composables/useValidation').useValidation

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/useValidation')
  useValidation = mod.useValidation
})

const mockValidationData = {
  isValid: true,
  overallStatus: 'pass' as const,
  overallStatusLabel: 'Passed',
  checks: {
    channelDetection: { passed: true, status: 'pass' as const, message: 'OK', detail: null },
    newHighLow: { passed: true, status: 'pass' as const, message: 'OK', detail: null },
    candleClose: { passed: true, status: 'pass' as const, message: 'OK', detail: null },
  },
  bollingerPosition: { upper: 100, middle: 95, lower: 90, pricePosition: 'middle', percentB: 50 },
  nextCandleClose: { timeframe: '15m', secondsRemaining: 300, minutesRemaining: 5 },
}

describe('useValidation', () => {
  describe('initial state', () => {
    it('should start with empty state', () => {
      const { validationCache, hasAnyLoading } = useValidation()
      expect(validationCache.value.size).toBe(0)
      expect(hasAnyLoading.value).toBe(false)
    })
  })

  describe('fetchValidation', () => {
    it('should fetch and cache validation data', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockValidationData },
      })

      const { fetchValidation, getCachedValidation } = useValidation()
      const result = await fetchValidation(1)

      expect(result).toEqual(mockValidationData)
      expect(getCachedValidation(1)).toEqual(mockValidationData)
    })

    it('should pass timeframe query param', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockValidationData },
      })

      const { fetchValidation } = useValidation()
      await fetchValidation(1, '1h')

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:9001/api/validation/1?timeframe=1h',
      )
    })

    it('should return cached data without API call', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockValidationData },
      })

      const { fetchValidation } = useValidation()
      await fetchValidation(1)
      mockedAxios.get.mockClear()

      const result = await fetchValidation(1)
      expect(result).toEqual(mockValidationData)
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('should bypass cache with forceRefresh', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockValidationData },
      })

      const { fetchValidation } = useValidation()
      await fetchValidation(1)
      mockedAxios.get.mockClear()

      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockValidationData },
      })
      await fetchValidation(1, '15m', true)
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    it('should prevent duplicate concurrent requests (loading guard)', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockImplementationOnce(() =>
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchValidation, isLoadingSymbol } = useValidation()
      const p1 = fetchValidation(1)

      expect(isLoadingSymbol(1)).toBe(true)
      const result2 = await fetchValidation(1)
      expect(result2).toBeNull()

      resolvePromise!({ data: { success: true, data: mockValidationData } })
      await p1
    })

    it('should handle API error with response', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { error: 'Server error' } },
        message: 'Failed',
      })

      const { fetchValidation, getError } = useValidation()
      const result = await fetchValidation(1)

      expect(result).toBeNull()
      expect(getError(1)).toBe('Server error')
    })

    it('should handle network error without response', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchValidation, getError } = useValidation()
      const result = await fetchValidation(1)

      expect(result).toBeNull()
      expect(getError(1)).toBe('Network Error')
    })

    it('should handle success=false response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'No validation' },
      })

      const { fetchValidation, getError } = useValidation()
      const result = await fetchValidation(1)

      expect(result).toBeNull()
      expect(getError(1)).toBe('No validation')
    })

    it('should manage loading state', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchValidation, isLoadingSymbol, hasAnyLoading } = useValidation()
      const promise = fetchValidation(1)

      expect(isLoadingSymbol(1)).toBe(true)
      expect(hasAnyLoading.value).toBe(true)

      resolvePromise!({ data: { success: true, data: mockValidationData } })
      await promise

      expect(isLoadingSymbol(1)).toBe(false)
    })
  })

  describe('fetchMultipleValidation', () => {
    it('should fetch validation for multiple symbols', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockValidationData },
      })

      const { fetchMultipleValidation, getCachedValidation } = useValidation()
      await fetchMultipleValidation([1, 2])

      expect(getCachedValidation(1)).toBeDefined()
      expect(getCachedValidation(2)).toBeDefined()
    })
  })

  describe('clearCache', () => {
    it('should clear specific symbol', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockValidationData },
      })

      const { fetchValidation, getCachedValidation, clearCache } = useValidation()
      await fetchValidation(1)
      clearCache(1)
      expect(getCachedValidation(1)).toBeUndefined()
    })

    it('should clear all', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { success: true, data: mockValidationData },
      })

      const { fetchValidation, validationCache, clearCache } = useValidation()
      await fetchValidation(1)
      await fetchValidation(2)
      clearCache()
      expect(validationCache.value.size).toBe(0)
    })
  })
})
