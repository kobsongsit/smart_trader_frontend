/**
 * Unit tests for useTradeHistory composable
 *
 * Requirement-First: tests written from acceptance criteria,
 * NOT from implementation details.
 *
 * Acceptance Criteria:
 *  AC #1: API /api/strategy/history supports filters: symbol, interval, month/year, result, exitReason, sort, pagination
 *  AC #2: API returns summary stats: totalTrades, wins, losses, winRate, totalPips, profitFactor, avgWinPips, avgLossPips
 *  AC #3: API returns trades array: id, symbol, interval, strategyName, action, entryPrice, entryTime, exitPrice, exitTime, exitReason, profitPips, duration
 *  AC #4: API returns pagination: page, limit, total, hasMore
 *  AC #5: Composable useTradeHistory: fetchHistory, loadMore, reset, filter state management
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

// Re-import composable per test to reset module-level singleton state
let useTradeHistory: typeof import('../../../app/composables/useTradeHistory').useTradeHistory

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  const mod = await import('../../../app/composables/useTradeHistory')
  useTradeHistory = mod.useTradeHistory
})

// ── Mock data (from requirement, not from code) ──

const mockSummary = {
  totalTrades: 45,
  wins: 30,
  losses: 15,
  winRate: 66.7,
  totalPips: 1250,
  profitFactor: 2.1,
  avgWinPips: 55,
  avgLossPips: -28,
}

const mockTrade = {
  id: 1,
  symbol: 'USD-JPY',
  interval: '1h',
  strategyName: 'Trend Follow',
  action: 'BUY' as const,
  entryPrice: '149.250',
  entryTime: '2026-03-10T10:00:00Z',
  exitPrice: '149.580',
  exitTime: '2026-03-10T15:30:00Z',
  exitReason: 'TP' as const,
  profitPips: 33,
  duration: '5h 30m',
}

const mockTrade2 = {
  id: 2,
  symbol: 'XAU-USD',
  interval: '4h',
  strategyName: 'Mean Reversion',
  action: 'SELL' as const,
  entryPrice: '2985.50',
  entryTime: '2026-03-09T08:00:00Z',
  exitPrice: '2995.30',
  exitTime: '2026-03-09T20:00:00Z',
  exitReason: 'SL' as const,
  profitPips: -98,
  duration: '12h 0m',
}

const mockPagination = {
  page: 1,
  limit: 20,
  total: 45,
  hasMore: true,
}

const mockHistoryData = {
  summary: mockSummary,
  trades: [mockTrade, mockTrade2],
  pagination: mockPagination,
}

describe('useTradeHistory', () => {
  // ============================================================
  // AC #5: Composable returns reactive state
  // ============================================================
  describe('AC #5: Return reactive state (data, loading, error, filters)', () => {
    it('TC-H1: should return data, loading, error, filters as reactive refs with correct initial values', () => {
      const { data, loading, error, filters } = useTradeHistory()

      expect(data).toHaveProperty('value')
      expect(loading).toHaveProperty('value')
      expect(error).toHaveProperty('value')
      expect(filters).toHaveProperty('value')

      // Initial state
      expect(data.value).toBeNull()
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('TC-H2: filters should have correct default values', () => {
      const { filters } = useTradeHistory()

      expect(filters.value.symbol).toBe('')
      expect(filters.value.interval).toBe('')
      expect(filters.value.month).toBe('')
      expect(filters.value.year).toBe('')
      expect(filters.value.result).toBe('')
      expect(filters.value.exitReason).toBe('')
      expect(filters.value.sort).toBe('newest')
      expect(filters.value.page).toBe(1)
      expect(filters.value.limit).toBe(20)
    })

    it('TC-H3: should return fetchHistory, loadMore, reset functions', () => {
      const composable = useTradeHistory()

      expect(typeof composable.fetchHistory).toBe('function')
      expect(typeof composable.loadMore).toBe('function')
      expect(typeof composable.reset).toBe('function')
    })
  })

  // ============================================================
  // AC #1: API supports filters via query params
  // ============================================================
  describe('AC #1: API /api/strategy/history supports filters', () => {
    it('TC-H4: should call GET /api/strategy/history with default params', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory } = useTradeHistory()
      await fetchHistory()

      const calledUrl = mockedAxios.get.mock.calls[0][0]
      expect(calledUrl).toContain('/api/strategy/history')
      expect(calledUrl).toContain('page=1')
      expect(calledUrl).toContain('limit=20')
      expect(calledUrl).toContain('sort=newest')
    })

    it('TC-H5: should pass symbol filter as query param', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory } = useTradeHistory()
      await fetchHistory({ symbol: 'USD-JPY' })

      const calledUrl = mockedAxios.get.mock.calls[0][0]
      expect(calledUrl).toContain('symbol=USD-JPY')
    })

    it('TC-H6: should pass interval filter as query param', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory } = useTradeHistory()
      await fetchHistory({ interval: '4h' })

      const calledUrl = mockedAxios.get.mock.calls[0][0]
      expect(calledUrl).toContain('interval=4h')
    })

    it('TC-H7: should pass month and year filter as query params', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory } = useTradeHistory()
      await fetchHistory({ month: '3', year: '2026' })

      const calledUrl = mockedAxios.get.mock.calls[0][0]
      expect(calledUrl).toContain('month=3')
      expect(calledUrl).toContain('year=2026')
    })

    it('TC-H8: should pass result filter (win/loss) as query param', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory } = useTradeHistory()
      await fetchHistory({ result: 'win' })

      const calledUrl = mockedAxios.get.mock.calls[0][0]
      expect(calledUrl).toContain('result=win')
    })

    it('TC-H9: should pass exitReason filter as query param', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory } = useTradeHistory()
      await fetchHistory({ exitReason: 'TP' })

      const calledUrl = mockedAxios.get.mock.calls[0][0]
      expect(calledUrl).toContain('exitReason=TP')
    })

    it('TC-H10: should pass sort param (newest/oldest)', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory } = useTradeHistory()
      await fetchHistory({ sort: 'oldest' })

      const calledUrl = mockedAxios.get.mock.calls[0][0]
      expect(calledUrl).toContain('sort=oldest')
    })

    it('TC-H11: should pass page and limit for pagination', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory } = useTradeHistory()
      await fetchHistory({ page: 2, limit: 10 })

      const calledUrl = mockedAxios.get.mock.calls[0][0]
      expect(calledUrl).toContain('page=2')
      expect(calledUrl).toContain('limit=10')
    })
  })

  // ============================================================
  // AC #2: API returns summary stats
  // ============================================================
  describe('AC #2: Summary stats returned and stored', () => {
    it('TC-H12: should store summary with all required fields from API response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory, data } = useTradeHistory()
      await fetchHistory()

      expect(data.value).not.toBeNull()
      const summary = data.value!.summary
      expect(summary.totalTrades).toBe(45)
      expect(summary.wins).toBe(30)
      expect(summary.losses).toBe(15)
      expect(summary.winRate).toBe(66.7)
      expect(summary.totalPips).toBe(1250)
      expect(summary.profitFactor).toBe(2.1)
      expect(summary.avgWinPips).toBe(55)
      expect(summary.avgLossPips).toBe(-28)
    })
  })

  // ============================================================
  // AC #3: API returns trades array
  // ============================================================
  describe('AC #3: Trades array returned and stored', () => {
    it('TC-H13: should store trades with all required fields', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory, data } = useTradeHistory()
      await fetchHistory()

      expect(data.value).not.toBeNull()
      const trades = data.value!.trades
      expect(trades).toHaveLength(2)

      const trade = trades[0]
      expect(trade.id).toBe(1)
      expect(trade.symbol).toBe('USD-JPY')
      expect(trade.interval).toBe('1h')
      expect(trade.strategyName).toBe('Trend Follow')
      expect(trade.action).toBe('BUY')
      expect(trade.entryPrice).toBe('149.250')
      expect(trade.entryTime).toBe('2026-03-10T10:00:00Z')
      expect(trade.exitPrice).toBe('149.580')
      expect(trade.exitTime).toBe('2026-03-10T15:30:00Z')
      expect(trade.exitReason).toBe('TP')
      expect(trade.profitPips).toBe(33)
      expect(trade.duration).toBe('5h 30m')
    })
  })

  // ============================================================
  // AC #4: API returns pagination
  // ============================================================
  describe('AC #4: Pagination returned and stored', () => {
    it('TC-H14: should store pagination with all required fields', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory, data } = useTradeHistory()
      await fetchHistory()

      expect(data.value).not.toBeNull()
      const pagination = data.value!.pagination
      expect(pagination.page).toBe(1)
      expect(pagination.limit).toBe(20)
      expect(pagination.total).toBe(45)
      expect(pagination.hasMore).toBe(true)
    })
  })

  // ============================================================
  // AC #5: fetchHistory behavior
  // ============================================================
  describe('AC #5: fetchHistory behavior', () => {
    it('TC-H15: should set data on successful fetch', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory, data } = useTradeHistory()
      const result = await fetchHistory()

      expect(result).toEqual(mockHistoryData)
      expect(data.value).toEqual(mockHistoryData)
    })

    it('TC-H16: should set loading=true during fetch', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve
        }) as any,
      )

      const { fetchHistory, loading } = useTradeHistory()
      const promise = fetchHistory()

      expect(loading.value).toBe(true)

      resolvePromise!({ data: { success: true, data: mockHistoryData } })
      await promise

      expect(loading.value).toBe(false)
    })

    it('TC-H17: should set error on API failure', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { error: 'Server error' } },
        message: 'Request failed',
      })

      const { fetchHistory, error, data } = useTradeHistory()
      const result = await fetchHistory()

      expect(result).toBeNull()
      expect(error.value).toBe('Server error')
      expect(data.value).toBeNull()
    })

    it('TC-H18: should handle success=false response', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'No data found' },
      })

      const { fetchHistory, error } = useTradeHistory()
      const result = await fetchHistory()

      expect(result).toBeNull()
      expect(error.value).toBe('No data found')
    })

    it('TC-H19: should handle network error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchHistory, error } = useTradeHistory()
      const result = await fetchHistory()

      expect(result).toBeNull()
      expect(error.value).toBe('Network Error')
    })

    it('TC-H20: should clear error on new fetch', async () => {
      // First: fail
      mockedAxios.get.mockRejectedValueOnce(new Error('First error'))
      const { fetchHistory, error } = useTradeHistory()
      await fetchHistory()
      expect(error.value).toBe('First error')

      // Second: success — error should be cleared
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })
      await fetchHistory()
      expect(error.value).toBeNull()
    })

    it('TC-H21: should apply filter overrides when passed', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory, filters } = useTradeHistory()
      await fetchHistory({ symbol: 'EUR-USD', result: 'loss' })

      // Filters should be updated
      expect(filters.value.symbol).toBe('EUR-USD')
      expect(filters.value.result).toBe('loss')
    })
  })

  // ============================================================
  // AC #5: loadMore behavior
  // ============================================================
  describe('AC #5: loadMore behavior', () => {
    it('TC-H22: should increment page and append trades', async () => {
      // Initial fetch
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory, loadMore, data, filters } = useTradeHistory()
      await fetchHistory()

      expect(data.value!.trades).toHaveLength(2)

      // Load more — page 2 data
      const page2Trade = {
        ...mockTrade,
        id: 3,
        symbol: 'EUR-USD',
      }
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            summary: mockSummary,
            trades: [page2Trade],
            pagination: { page: 2, limit: 20, total: 45, hasMore: true },
          },
        },
      })

      await loadMore()

      // Page should increment
      expect(filters.value.page).toBe(2)

      // Trades should be appended (2 original + 1 new = 3)
      expect(data.value!.trades).toHaveLength(3)
      expect(data.value!.trades[2].symbol).toBe('EUR-USD')
    })

    it('TC-H23: should NOT loadMore when hasMore is false', async () => {
      const noMoreData = {
        ...mockHistoryData,
        pagination: { ...mockPagination, hasMore: false },
      }
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: noMoreData },
      })

      const { fetchHistory, loadMore } = useTradeHistory()
      await fetchHistory()

      // Clear mock calls
      mockedAxios.get.mockClear()

      await loadMore()

      // Should NOT have called API
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })

    it('TC-H24: should revert page on loadMore error', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory, loadMore, filters, error } = useTradeHistory()
      await fetchHistory()

      // Load more fails
      mockedAxios.get.mockRejectedValueOnce(new Error('Load more failed'))

      await loadMore()

      // Page should revert to 1
      expect(filters.value.page).toBe(1)
      expect(error.value).toBe('Load more failed')
    })
  })

  // ============================================================
  // AC #5: reset behavior
  // ============================================================
  describe('AC #5: reset behavior', () => {
    it('TC-H25: should reset all filters to defaults and refetch', async () => {
      // Initial fetch with filters
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      const { fetchHistory, reset, filters } = useTradeHistory()
      await fetchHistory({ symbol: 'USD-JPY', result: 'win', sort: 'oldest', page: 3 })

      // Verify filters were set
      expect(filters.value.symbol).toBe('USD-JPY')
      expect(filters.value.page).toBe(3)

      // Reset
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: mockHistoryData },
      })

      await reset()

      // All filters should be reset to defaults
      expect(filters.value.symbol).toBe('')
      expect(filters.value.interval).toBe('')
      expect(filters.value.month).toBe('')
      expect(filters.value.year).toBe('')
      expect(filters.value.result).toBe('')
      expect(filters.value.exitReason).toBe('')
      expect(filters.value.sort).toBe('newest')
      expect(filters.value.page).toBe(1)
      expect(filters.value.limit).toBe(20)

      // Should have called API again (refetch)
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    })
  })
})
