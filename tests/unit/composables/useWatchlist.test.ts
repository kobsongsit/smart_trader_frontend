/**
 * Unit tests for useWatchlist composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

let useWatchlist: typeof import('../../../app/composables/useWatchlist').useWatchlist

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/useWatchlist')
  useWatchlist = mod.useWatchlist
})

const mockWatchlistItem = {
  id: 1,
  symbolId: 42,
  symbol: { id: 42, symbol: 'BTC-USD', name: 'Bitcoin', type: 'CRYPTO' as const, exchange: 'BINANCE', isActive: true },
  priority: 1,
  notes: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('useWatchlist', () => {
  describe('initial state', () => {
    it('should start with empty state', () => {
      const { watchlist, isLoading, error } = useWatchlist()
      expect(watchlist.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
    })
  })

  describe('fetchWatchlist', () => {
    it('should fetch and store watchlist', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [mockWatchlistItem] },
      })

      const { fetchWatchlist, watchlist } = useWatchlist()
      await fetchWatchlist()

      expect(watchlist.value).toEqual([mockWatchlistItem])
    })

    it('should handle error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchWatchlist, error } = useWatchlist()
      await fetchWatchlist()

      expect(error.value).toBe('Network Error')
    })

    it('should handle success=false', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'Unauthorized' },
      })

      const { fetchWatchlist, error } = useWatchlist()
      await fetchWatchlist()

      expect(error.value).toBe('Unauthorized')
    })

    it('should handle error with response data', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { error: { message: 'Token expired' } } },
        message: 'Failed',
      })

      const { fetchWatchlist, error } = useWatchlist()
      await fetchWatchlist()

      expect(error.value).toBe('Token expired')
    })

    it('should manage loading state', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchWatchlist, isLoading } = useWatchlist()
      const promise = fetchWatchlist()
      expect(isLoading.value).toBe(true)

      resolvePromise!({ data: { success: true, data: [] } })
      await promise
      expect(isLoading.value).toBe(false)
    })
  })

  describe('addToWatchlist', () => {
    it('should add item and update local state', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: mockWatchlistItem },
      })

      const { addToWatchlist, watchlist } = useWatchlist()
      const result = await addToWatchlist(42)

      expect(result).toBe(true)
      expect(watchlist.value).toContainEqual(mockWatchlistItem)
    })

    it('should pass priority and notes options', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: mockWatchlistItem },
      })

      const { addToWatchlist } = useWatchlist()
      await addToWatchlist(42, { priority: 5, notes: 'test' })

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:9001/api/watchlist',
        { symbolId: 42, priority: 5, notes: 'test' },
      )
    })

    it('should return false on API failure', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: false },
      })

      const { addToWatchlist } = useWatchlist()
      const result = await addToWatchlist(42)

      expect(result).toBe(false)
    })

    it('should handle network error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'))

      const { addToWatchlist, error } = useWatchlist()
      const result = await addToWatchlist(42)

      expect(result).toBe(false)
      expect(error.value).toBe('Network Error')
    })
  })

  describe('removeFromWatchlist', () => {
    it('should remove item and update local state', async () => {
      // Setup: add item first
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [mockWatchlistItem] },
      })
      const { fetchWatchlist, removeFromWatchlist, watchlist } = useWatchlist()
      await fetchWatchlist()

      mockedAxios.delete.mockResolvedValueOnce({
        data: { success: true, data: null },
      })

      const result = await removeFromWatchlist(42)

      expect(result).toBe(true)
      expect(watchlist.value).toEqual([])
    })

    it('should return false on failure', async () => {
      mockedAxios.delete.mockResolvedValueOnce({
        data: { success: false },
      })

      const { removeFromWatchlist } = useWatchlist()
      const result = await removeFromWatchlist(42)

      expect(result).toBe(false)
    })

    it('should handle network error', async () => {
      mockedAxios.delete.mockRejectedValueOnce(new Error('Network Error'))

      const { removeFromWatchlist, error } = useWatchlist()
      const result = await removeFromWatchlist(42)

      expect(result).toBe(false)
      expect(error.value).toBe('Network Error')
    })
  })

  describe('toggleWatchlist', () => {
    it('should add if not in watchlist', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: mockWatchlistItem },
      })

      const { toggleWatchlist } = useWatchlist()
      const result = await toggleWatchlist(42)

      expect(result).toBe(true) // now in watchlist
    })

    it('should remove if already in watchlist', async () => {
      // Setup: add first
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [mockWatchlistItem] },
      })
      const { fetchWatchlist, toggleWatchlist } = useWatchlist()
      await fetchWatchlist()

      mockedAxios.delete.mockResolvedValueOnce({
        data: { success: true, data: null },
      })

      const result = await toggleWatchlist(42)
      expect(result).toBe(false) // now removed
    })
  })

  describe('isInWatchlist', () => {
    it('should return true for symbols in watchlist', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [mockWatchlistItem] },
      })

      const { fetchWatchlist, isInWatchlist } = useWatchlist()
      await fetchWatchlist()

      expect(isInWatchlist(42)).toBe(true)
      expect(isInWatchlist(99)).toBe(false)
    })
  })

  describe('watchlistSymbolIds', () => {
    it('should compute Set of symbolIds', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [mockWatchlistItem] },
      })

      const { fetchWatchlist, watchlistSymbolIds } = useWatchlist()
      await fetchWatchlist()

      expect(watchlistSymbolIds.value.has(42)).toBe(true)
      expect(watchlistSymbolIds.value.size).toBe(1)
    })
  })
})
