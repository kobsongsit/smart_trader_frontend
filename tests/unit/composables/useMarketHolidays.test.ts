/**
 * Unit tests for useMarketHolidays composable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

let useMarketHolidays: typeof import('../../../app/composables/useMarketHolidays').useMarketHolidays

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('../../../app/composables/useMarketHolidays')
  useMarketHolidays = mod.useMarketHolidays
})

const mockHoliday = {
  id: 1,
  date: '2024-07-04',
  name: 'Independence Day',
  market: 'STOCK',
  exchange: null,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockCreateResponse = {
  holiday: mockHoliday,
  cleanup: { deletedCandles: 5, affectedSymbols: 2 },
}

describe('useMarketHolidays', () => {
  describe('initial state', () => {
    it('should start with empty state', () => {
      const { holidays, isLoading, error } = useMarketHolidays()
      expect(holidays.value).toEqual([])
      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
    })
  })

  describe('fetchHolidays', () => {
    it('should fetch and store holidays', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [mockHoliday] },
      })

      const { fetchHolidays, holidays } = useMarketHolidays()
      await fetchHolidays()

      expect(holidays.value).toEqual([mockHoliday])
    })

    it('should pass year and market filters', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [] },
      })

      const { fetchHolidays } = useMarketHolidays()
      await fetchHolidays({ year: 2024, market: 'STOCK' })

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:9001/api/market-holidays',
        { params: { year: 2024, market: 'STOCK' } },
      )
    })

    it('should handle error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'))

      const { fetchHolidays, error } = useMarketHolidays()
      await fetchHolidays()

      expect(error.value).toBe('Network Error')
    })

    it('should handle success=false', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: false, error: 'Failed to fetch' },
      })

      const { fetchHolidays, error } = useMarketHolidays()
      await fetchHolidays()

      expect(error.value).toBe('Failed to fetch')
    })

    it('should fetch without any filters', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [] },
      })

      const { fetchHolidays } = useMarketHolidays()
      await fetchHolidays()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:9001/api/market-holidays',
        { params: {} },
      )
    })

    it('should manage loading state', async () => {
      let resolvePromise: Function
      mockedAxios.get.mockReturnValueOnce(
        new Promise((resolve) => { resolvePromise = resolve }) as any,
      )

      const { fetchHolidays, isLoading } = useMarketHolidays()
      const promise = fetchHolidays()
      expect(isLoading.value).toBe(true)

      resolvePromise!({ data: { success: true, data: [] } })
      await promise
      expect(isLoading.value).toBe(false)
    })
  })

  describe('createHoliday', () => {
    it('should create holiday and add to local state', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: mockCreateResponse },
      })

      const { createHoliday, holidays } = useMarketHolidays()
      const result = await createHoliday({ date: '2024-07-04', name: 'Independence Day', market: 'STOCK' })

      expect(result).toEqual(mockCreateResponse)
      expect(holidays.value).toContainEqual(mockHoliday)
    })

    it('should send null market when not provided', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, data: mockCreateResponse },
      })

      const { createHoliday } = useMarketHolidays()
      await createHoliday({ date: '2024-07-04', name: 'Test' })

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:9001/api/market-holidays',
        { date: '2024-07-04', name: 'Test', market: null },
      )
    })

    it('should return null on failure', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: false },
      })

      const { createHoliday } = useMarketHolidays()
      const result = await createHoliday({ date: '2024-07-04', name: 'Test' })

      expect(result).toBeNull()
    })

    it('should handle error', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Server Error'))

      const { createHoliday, error } = useMarketHolidays()
      const result = await createHoliday({ date: '2024-07-04', name: 'Test' })

      expect(result).toBeNull()
      expect(error.value).toBe('Server Error')
    })
  })

  describe('deleteHoliday', () => {
    it('should delete and remove from local state', async () => {
      // Setup
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [mockHoliday] },
      })
      const { fetchHolidays, deleteHoliday, holidays } = useMarketHolidays()
      await fetchHolidays()

      mockedAxios.delete.mockResolvedValueOnce({
        data: { success: true, data: null },
      })

      const result = await deleteHoliday(1)

      expect(result).toBe(true)
      expect(holidays.value).toEqual([])
    })

    it('should return false on failure', async () => {
      mockedAxios.delete.mockResolvedValueOnce({
        data: { success: false },
      })

      const { deleteHoliday } = useMarketHolidays()
      const result = await deleteHoliday(1)

      expect(result).toBe(false)
    })

    it('should handle error', async () => {
      mockedAxios.delete.mockRejectedValueOnce(new Error('Server Error'))

      const { deleteHoliday, error } = useMarketHolidays()
      const result = await deleteHoliday(1)

      expect(result).toBe(false)
      expect(error.value).toBe('Server Error')
    })
  })

  describe('getHolidayByDate', () => {
    it('should find holiday by date string', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [mockHoliday] },
      })

      const { fetchHolidays, getHolidayByDate } = useMarketHolidays()
      await fetchHolidays()

      expect(getHolidayByDate('2024-07-04')).toEqual(mockHoliday)
      expect(getHolidayByDate('2024-07-05')).toBeUndefined()
    })
  })

  describe('isHoliday', () => {
    it('should check if date is a holiday', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [mockHoliday] },
      })

      const { fetchHolidays, isHoliday } = useMarketHolidays()
      await fetchHolidays()

      expect(isHoliday('2024-07-04')).toBe(true)
      expect(isHoliday('2024-07-05')).toBe(false)
    })
  })

  describe('holidayDatesSet', () => {
    it('should compute Set of holiday dates', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { success: true, data: [mockHoliday] },
      })

      const { fetchHolidays, holidayDatesSet } = useMarketHolidays()
      await fetchHolidays()

      expect(holidayDatesSet.value.has('2024-07-04')).toBe(true)
      expect(holidayDatesSet.value.size).toBe(1)
    })
  })
})
