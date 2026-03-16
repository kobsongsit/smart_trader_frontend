/**
 * Unit tests for usePortfolio composable
 *
 * Requirement-First: tests are written from acceptance criteria,
 * NOT from implementation details.
 *
 * Acceptance Criteria (Composable):
 *  1. Fetch data from GET /api/strategy/portfolio
 *  2. Return reactive state: data, loading, error
 *  3. Handle error case (API fail)
 *  4. Handle success case (API return data)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

// Re-import composable per test to reset module-level singleton state
let usePortfolio: typeof import('../../../app/composables/usePortfolio').usePortfolio

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/usePortfolio')
  usePortfolio = mod.usePortfolio
})

// ── Mock data (from requirement, not from code) ──
const mockPortfolioData = {
  totalPips: 6492,
  wins: 85,
  losses: 32,
  totalTrades: 117,
  winRate: 73,
  profitFactor: 2.45,
  streak: 3,
  streakType: 'W' as const,
  openPositions: 4,
  since: 'Oct 1, 2025',
  maxDrawdown: -842,
  todayPips: 127,
  weekPips: 483,
}

describe('usePortfolio', () => {
  // ── TC-C1 + TC-C2: Success case — data set correctly, loading = false after ──
  describe('AC #4: Handle success case', () => {
    it('TC-C1: should set data from API response on success', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPortfolioData },
      })

      const { fetchPortfolio, data } = usePortfolio()
      const result = await fetchPortfolio()

      expect(result).toEqual(mockPortfolioData)
      expect(data.value).toEqual(mockPortfolioData)
    })

    it('TC-C2: should set loading = false after successful fetch', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPortfolioData },
      })

      const { fetchPortfolio, loading } = usePortfolio()
      await fetchPortfolio()

      expect(loading.value).toBe(false)
    })
  })

  // ── TC-C3: Error case — error message set ──
  describe('AC #3: Handle error case', () => {
    it('TC-C3: should set error message when API returns error response', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { error: 'Server error' } },
        message: 'Request failed',
      })

      const { fetchPortfolio, error, data } = usePortfolio()
      const result = await fetchPortfolio()

      expect(result).toBeNull()
      expect(error.value).toBe('Server error')
      expect(data.value).toBeNull()
    })

    it('should set error when API returns success=false', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'Portfolio not found' },
      })

      const { fetchPortfolio, error } = usePortfolio()
      const result = await fetchPortfolio()

      expect(result).toBeNull()
      expect(error.value).toBe('Portfolio not found')
    })

    it('should handle network error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchPortfolio, error } = usePortfolio()
      const result = await fetchPortfolio()

      expect(result).toBeNull()
      expect(error.value).toBe('Network Error')
    })
  })

  // ── TC-C4: Loading state during fetch ──
  describe('AC #2: Return reactive loading state', () => {
    it('TC-C4: should set loading = true during fetch', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve
        }) as any,
      )

      const { fetchPortfolio, loading } = usePortfolio()
      const promise = fetchPortfolio()

      // During fetch, loading should be true
      expect(loading.value).toBe(true)

      // Resolve and verify loading goes back to false
      resolvePromise!({ data: { success: true, data: mockPortfolioData } })
      await promise

      expect(loading.value).toBe(false)
    })

    it('should clear previous error when starting new fetch', async () => {
      // First: fail
      mockedAxios.get.mockRejectedValueOnce(new Error('First error'))
      const { fetchPortfolio, error } = usePortfolio()
      await fetchPortfolio()
      expect(error.value).toBe('First error')

      // Second: success — error should be cleared
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPortfolioData },
      })
      await fetchPortfolio()
      expect(error.value).toBeNull()
    })
  })

  // ── TC-C5: Correct API URL ──
  describe('AC #1: Fetch from GET /api/strategy/portfolio', () => {
    it('TC-C5: should call GET /api/strategy/portfolio', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPortfolioData },
      })

      const { fetchPortfolio } = usePortfolio()
      await fetchPortfolio()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:9001/api/strategy/portfolio',
      )
    })
  })

  // ── TC-C6: refresh() alias ──
  describe('refresh alias', () => {
    it('TC-C6: refresh() should work same as fetchPortfolio()', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockPortfolioData },
      })

      const { refresh, data } = usePortfolio()
      const result = await refresh()

      expect(result).toEqual(mockPortfolioData)
      expect(data.value).toEqual(mockPortfolioData)
    })
  })

  // ── Reactive state: data, loading, error are readonly ──
  describe('AC #2: Return reactive state (data, loading, error)', () => {
    it('should return data, loading, error as reactive refs', () => {
      const { data, loading, error } = usePortfolio()

      // They should be ref-like objects
      expect(data).toHaveProperty('value')
      expect(loading).toHaveProperty('value')
      expect(error).toHaveProperty('value')

      // Initial state
      expect(data.value).toBeNull()
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })
  })
})
