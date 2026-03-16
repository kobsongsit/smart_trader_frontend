/**
 * Unit tests for useOpenPositions composable
 *
 * Requirement-First: tests written from acceptance criteria,
 * NOT from implementation details.
 *
 * Acceptance Criteria (Composable):
 *  1. Fetch data from GET /api/strategy/positions
 *  2. Return reactive state: positions (array), loading, error
 *  3. Handle error case (API fail)
 *  4. Handle success case (API return data)
 *  5. Handle empty array (no positions)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

// Re-import composable per test to reset module-level singleton state
let useOpenPositions: typeof import('../../../app/composables/useOpenPositions').useOpenPositions

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/useOpenPositions')
  useOpenPositions = mod.useOpenPositions
})

// ── Mock data (from requirement, not from code) ──
const mockPositions = [
  {
    symbol: 'USD-JPY',
    interval: '1h',
    action: 'BUY' as const,
    entryPrice: '149.250',
    currentPrice: '149.580',
    slPrice: '148.950',
    slLabel: 'Fixed 30p',
    entryTime: 'Mar 15 10:00',
    floatingPips: 33,
    slDistancePercent: 0,
    duration: '5h 20m',
  },
  {
    symbol: 'XAU-USD',
    interval: '4h',
    action: 'SELL' as const,
    entryPrice: '2,985.50',
    currentPrice: '2,995.30',
    slPrice: '2,995.30',
    slLabel: 'ATR×2.5',
    entryTime: 'Mar 14 16:00',
    floatingPips: -98,
    slDistancePercent: 82,
    duration: '18h 45m',
  },
]

describe('useOpenPositions', () => {
  // ── TC-C1: Correct API URL ──
  describe('AC #1: Fetch from GET /api/strategy/positions', () => {
    it('TC-C1: should call GET /api/strategy/positions', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPositions },
      })

      const { fetchPositions } = useOpenPositions()
      await fetchPositions()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:9001/api/strategy/positions',
      )
    })
  })

  // ── TC-C2: Reactive state with initial values ──
  describe('AC #2: Return reactive state (positions, loading, error)', () => {
    it('TC-C2: should return positions, loading, error as reactive refs with correct initial values', () => {
      const { positions, loading, error } = useOpenPositions()

      // They should be ref-like objects
      expect(positions).toHaveProperty('value')
      expect(loading).toHaveProperty('value')
      expect(error).toHaveProperty('value')

      // Initial state per requirement
      expect(positions.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })
  })

  // ── TC-C3 + TC-C4: Success case ──
  describe('AC #4: Handle success case', () => {
    it('TC-C3: should set positions from API response on success', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPositions },
      })

      const { fetchPositions, positions } = useOpenPositions()
      const result = await fetchPositions()

      expect(result).toEqual(mockPositions)
      expect(positions.value).toEqual(mockPositions)
    })

    it('TC-C4: should set loading = false after successful fetch', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPositions },
      })

      const { fetchPositions, loading } = useOpenPositions()
      await fetchPositions()

      expect(loading.value).toBe(false)
    })
  })

  // ── TC-C5 + TC-C6: Error cases ──
  describe('AC #3: Handle error case', () => {
    it('TC-C5: should set error message when API rejects', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { error: 'Server error' } },
        message: 'Request failed',
      })

      const { fetchPositions, error, positions } = useOpenPositions()
      const result = await fetchPositions()

      expect(result).toEqual([])
      expect(error.value).toBe('Server error')
      expect(positions.value).toEqual([])
    })

    it('TC-C6: should set error when API returns success=false', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'Positions not available' },
      })

      const { fetchPositions, error } = useOpenPositions()
      const result = await fetchPositions()

      expect(result).toEqual([])
      expect(error.value).toBe('Positions not available')
    })

    it('should handle network error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchPositions, error } = useOpenPositions()
      const result = await fetchPositions()

      expect(result).toEqual([])
      expect(error.value).toBe('Network Error')
    })
  })

  // ── TC-C7: Empty array ──
  describe('AC #5: Handle empty array (no positions)', () => {
    it('TC-C7: should handle empty positions array', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [] },
      })

      const { fetchPositions, positions, error } = useOpenPositions()
      const result = await fetchPositions()

      expect(result).toEqual([])
      expect(positions.value).toEqual([])
      expect(error.value).toBeNull()
    })
  })

  // ── TC-C8: Loading = true during fetch ──
  describe('AC #2: Loading state during fetch', () => {
    it('TC-C8: should set loading = true during fetch', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve
        }) as any,
      )

      const { fetchPositions, loading } = useOpenPositions()
      const promise = fetchPositions()

      // During fetch, loading should be true
      expect(loading.value).toBe(true)

      // Resolve and verify loading goes back to false
      resolvePromise!({ data: { success: true, data: mockPositions } })
      await promise

      expect(loading.value).toBe(false)
    })
  })

  // ── TC-C9: refresh() alias ──
  describe('refresh alias', () => {
    it('TC-C9: refresh() should work same as fetchPositions()', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPositions },
      })

      const { refresh, positions } = useOpenPositions()
      const result = await refresh()

      expect(result).toEqual(mockPositions)
      expect(positions.value).toEqual(mockPositions)
    })
  })

  // ── TC-C10: Error cleared on retry ──
  describe('Error cleared on retry', () => {
    it('TC-C10: should clear previous error when starting new fetch', async () => {
      // First: fail
      mockedAxios.get.mockRejectedValueOnce(new Error('First error'))
      const { fetchPositions, error } = useOpenPositions()
      await fetchPositions()
      expect(error.value).toBe('First error')

      // Second: success — error should be cleared
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPositions },
      })
      await fetchPositions()
      expect(error.value).toBeNull()
    })
  })
})
