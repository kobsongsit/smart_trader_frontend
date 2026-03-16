/**
 * Unit tests for Trade History page (history.vue)
 *
 * Requirement-First: tests verify acceptance criteria,
 * NOT implementation details.
 *
 * Acceptance Criteria:
 *  AC #6:  Filter bar: Symbol chip group + Period month navigator
 *  AC #7:  Expandable filter section: Result (Win/Loss) + Timeframe + Exit Reason chip groups
 *  AC #8:  Sort toggle: Latest First / Oldest First
 *  AC #9:  Summary stats bar 2 rows: Row1 (trades/WR/pips), Row2 (avgW/avgL/PF)
 *  AC #10: Trade cards: Action chip (BUY=green/SELL=red), Symbol, Interval, Duration,
 *          Entry->Exit price, Exit Reason badge (TP=green, SL=red, Signal=blue, Manual=amber),
 *          P&L pips hero (positive=green, negative=red)
 *  AC #11: Load More button for pagination
 *  AC #12: 4 states: loading skeleton, error alert+retry, empty state, data state
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { ref, readonly, computed, nextTick } from 'vue'
import TradeHistory from '../../../app/pages/history.vue'

// ── Create Vuetify instance for testing ──
const vuetify = createVuetify({ components, directives })

// ── Mock useTradeHistory composable ──
const mockData = ref<any>(null)
const mockLoading = ref(false)
const mockError = ref<string | null>(null)
const mockFilters = ref({
  symbol: '',
  interval: '',
  month: '',
  year: '',
  result: '',
  exitReason: '',
  sort: 'newest',
  page: 1,
  limit: 20,
})
const mockFetchHistory = vi.fn()
const mockLoadMore = vi.fn()
const mockReset = vi.fn()

vi.stubGlobal('useTradeHistory', () => ({
  data: readonly(mockData),
  loading: readonly(mockLoading),
  error: readonly(mockError),
  filters: mockFilters,
  fetchHistory: mockFetchHistory,
  loadMore: mockLoadMore,
  reset: mockReset,
}))

// Mock onMounted (Nuxt auto-import)
vi.stubGlobal('onMounted', (fn: Function) => fn())

// ── Mock data from requirements ──
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

const mockTradeBuy = {
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

const mockTradeSell = {
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
  trades: [mockTradeBuy, mockTradeSell],
  pagination: mockPagination,
}

function mountComponent() {
  return mount(TradeHistory, {
    global: {
      plugins: [vuetify],
    },
  })
}

beforeEach(() => {
  mockData.value = null
  mockLoading.value = false
  mockError.value = null
  mockFilters.value = {
    symbol: '',
    interval: '',
    month: '',
    year: '',
    result: '',
    exitReason: '',
    sort: 'newest',
    page: 1,
    limit: 20,
  }
  mockFetchHistory.mockClear()
  mockLoadMore.mockClear()
  mockReset.mockClear()
})

// ============================================================
// AC #12: Loading state (skeleton)
// ============================================================
describe('AC #12: Loading state', () => {
  it('TC-TH1: should show skeleton loaders when loading and no data', () => {
    mockLoading.value = true
    const wrapper = mountComponent()

    expect(wrapper.findComponent({ name: 'v-skeleton-loader' }).exists()).toBe(true)
    // Should not show error or empty
    expect(wrapper.text()).not.toContain('Failed to load trade history')
  })
})

// ============================================================
// AC #12: Error state + Retry
// ============================================================
describe('AC #12: Error state', () => {
  it('TC-TH2: should show error alert when error occurs', () => {
    mockError.value = 'Server error'
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Failed to load trade history')
  })

  it('TC-TH3: should show Retry button in error state', () => {
    mockError.value = 'Server error'
    const wrapper = mountComponent()

    const retryBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('Retry'),
    )
    expect(retryBtn).toBeDefined()
  })

  it('TC-TH4: clicking Retry should re-fetch data', async () => {
    mockError.value = 'Server error'
    const wrapper = mountComponent()

    const retryBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('Retry'),
    )
    await retryBtn!.trigger('click')

    expect(mockFetchHistory).toHaveBeenCalled()
  })
})

// ============================================================
// AC #12: Empty state
// ============================================================
describe('AC #12: Empty state', () => {
  it('TC-TH5: should show empty message when data has no trades', () => {
    mockData.value = {
      ...mockHistoryData,
      trades: [],
    }
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('No trades found')
    expect(wrapper.text()).toContain('Try adjusting your filters')
  })
})

// ============================================================
// AC #12: Data state (page header)
// ============================================================
describe('AC #12: Data state', () => {
  it('TC-TH6: should show TRADE HISTORY page header', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('TRADE HISTORY')
    expect(wrapper.text()).toContain('Closed trades log')
  })
})

// ============================================================
// AC #6: Filter bar — Symbol chip group
// ============================================================
describe('AC #6: Symbol chip group filter', () => {
  it('TC-TH7: should render Symbol chip group with options', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Symbol')
    // Should have symbol chips: All, USD-JPY, EUR-USD, GBP-JPY, XAU-USD
    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const symbolChips = chips.filter((c) =>
      ['All', 'USD-JPY', 'EUR-USD', 'GBP-JPY', 'XAU-USD'].includes(c.text().trim()),
    )
    expect(symbolChips.length).toBeGreaterThanOrEqual(5)
  })

  it('TC-TH8: clicking a Symbol chip should call fetchHistory with that symbol', async () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const usdJpyChip = chips.find((c) => c.text().trim() === 'USD-JPY')
    expect(usdJpyChip).toBeDefined()

    await usdJpyChip!.trigger('click')

    expect(mockFetchHistory).toHaveBeenCalled()
  })
})

// ============================================================
// AC #6: Filter bar — Period month navigator
// ============================================================
describe('AC #6: Period month navigator', () => {
  it('TC-TH9: should render Period section with month label and navigation arrows', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Period')
    // Should have navigation buttons (chevron-left, chevron-right)
    const html = wrapper.html()
    expect(html).toContain('mdi-chevron-left')
    expect(html).toContain('mdi-chevron-right')
  })
})

// ============================================================
// AC #7: Expandable filter section
// ============================================================
describe('AC #7: Expandable filter section', () => {
  it('TC-TH10: should have More Filters toggle button', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('More Filters')
  })

  it('TC-TH11: expanded section should show Result, Timeframe, Exit filter groups', async () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    // Click More Filters button
    const moreFiltersBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('More Filters'),
    )
    if (moreFiltersBtn) {
      await moreFiltersBtn.trigger('click')
      await nextTick()
    }

    const text = wrapper.text()
    expect(text).toContain('Result')
    expect(text).toContain('Timeframe')
    expect(text).toContain('Exit')
  })

  it('TC-TH12: Result filter should have All/Win/Loss options', async () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    // Expand filters
    const moreFiltersBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('More Filters'),
    )
    if (moreFiltersBtn) {
      await moreFiltersBtn.trigger('click')
      await nextTick()
    }

    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const resultChips = chips.filter((c) =>
      ['Win', 'Loss'].includes(c.text().trim()),
    )
    expect(resultChips.length).toBeGreaterThanOrEqual(2)
  })

  it('TC-TH13: Timeframe filter should have All/15m/1h/4h options', async () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    const moreFiltersBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('More Filters'),
    )
    if (moreFiltersBtn) {
      await moreFiltersBtn.trigger('click')
      await nextTick()
    }

    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const tfChips = chips.filter((c) =>
      ['15m', '1h', '4h'].includes(c.text().trim()),
    )
    expect(tfChips.length).toBeGreaterThanOrEqual(3)
  })

  it('TC-TH14: Exit filter should have All/TP/SL/Signal/Manual options', async () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    const moreFiltersBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('More Filters'),
    )
    if (moreFiltersBtn) {
      await moreFiltersBtn.trigger('click')
      await nextTick()
    }

    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const exitChips = chips.filter((c) =>
      ['TP', 'SL', 'Signal', 'Manual'].includes(c.text().trim()),
    )
    expect(exitChips.length).toBeGreaterThanOrEqual(4)
  })

  it('TC-TH15: should show badge with active extra filter count when collapsed', async () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    // Expand and select a result filter
    const moreFiltersBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('More Filters'),
    )
    if (moreFiltersBtn) {
      await moreFiltersBtn.trigger('click')
      await nextTick()
    }

    // Click 'Win' chip
    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const winChip = chips.find((c) => c.text().trim() === 'Win')
    if (winChip) {
      await winChip.trigger('click')
      await nextTick()
    }

    // Collapse
    const lessFiltersBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('Less Filters'),
    )
    if (lessFiltersBtn) {
      await lessFiltersBtn.trigger('click')
      await nextTick()
    }

    // Badge should be present (v-badge component)
    const badge = wrapper.findComponent({ name: 'v-badge' })
    expect(badge.exists()).toBe(true)
  })
})

// ============================================================
// AC #8: Sort toggle
// ============================================================
describe('AC #8: Sort toggle', () => {
  it('TC-TH16: should render sort selector with Latest First / Oldest First options', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    // Should have a v-select for sort
    const select = wrapper.findComponent({ name: 'v-select' })
    expect(select.exists()).toBe(true)
  })
})

// ============================================================
// AC #9: Summary stats bar — 2 rows
// ============================================================
describe('AC #9: Summary stats bar', () => {
  it('TC-TH17: Row1 should show Trades, Win Rate, Pips', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('45') // totalTrades
    expect(wrapper.text()).toContain('66.7%') // winRate
    expect(wrapper.text()).toContain('Trades')
    expect(wrapper.text()).toContain('Win Rate')
    expect(wrapper.text()).toContain('Pips')
  })

  it('TC-TH18: Row2 should show Avg Win, Avg Loss, PF', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Avg Win')
    expect(wrapper.text()).toContain('Avg Loss')
    expect(wrapper.text()).toContain('PF')
    expect(wrapper.text()).toContain('2.10') // profitFactor
  })

  it('TC-TH19: Total pips should have correct color (positive=green)', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    // Find the pips value in the summary stats
    const pipsElements = wrapper.findAll('.text-h6.font-mono')
    const pipsEl = pipsElements.find((el) => el.text().includes('1,250'))
    expect(pipsEl).toBeDefined()
    expect(pipsEl!.classes()).toContain('text-success')
  })

  it('TC-TH20: negative pips should have red color', () => {
    mockData.value = {
      ...mockHistoryData,
      summary: { ...mockSummary, totalPips: -500 },
    }
    const wrapper = mountComponent()

    const pipsElements = wrapper.findAll('.text-h6.font-mono')
    const pipsEl = pipsElements.find((el) => el.text().includes('500'))
    expect(pipsEl).toBeDefined()
    expect(pipsEl!.classes()).toContain('text-error')
  })

  it('TC-TH21: PF should use threshold colors (>=2.0 success)', () => {
    mockData.value = mockHistoryData // PF = 2.1
    const wrapper = mountComponent()

    const pfElements = wrapper.findAll('.text-h6.font-mono')
    const pfEl = pfElements.find((el) => el.text().includes('2.10'))
    expect(pfEl).toBeDefined()
    expect(pfEl!.classes()).toContain('text-success')
  })

  it('TC-TH22: PF >=1.5 <2.0 should use primary color', () => {
    mockData.value = {
      ...mockHistoryData,
      summary: { ...mockSummary, profitFactor: 1.75 },
    }
    const wrapper = mountComponent()

    const pfElements = wrapper.findAll('.text-h6.font-mono')
    const pfEl = pfElements.find((el) => el.text().includes('1.75'))
    expect(pfEl).toBeDefined()
    expect(pfEl!.classes()).toContain('text-primary')
  })

  it('TC-TH23: PF >=1.2 <1.5 should use warning color', () => {
    mockData.value = {
      ...mockHistoryData,
      summary: { ...mockSummary, profitFactor: 1.35 },
    }
    const wrapper = mountComponent()

    const pfElements = wrapper.findAll('.text-h6.font-mono')
    const pfEl = pfElements.find((el) => el.text().includes('1.35'))
    expect(pfEl).toBeDefined()
    expect(pfEl!.classes()).toContain('text-warning')
  })

  it('TC-TH24: PF <1.2 should use error color', () => {
    mockData.value = {
      ...mockHistoryData,
      summary: { ...mockSummary, profitFactor: 0.85 },
    }
    const wrapper = mountComponent()

    const pfElements = wrapper.findAll('.text-h6.font-mono')
    const pfEl = pfElements.find((el) => el.text().includes('0.85'))
    expect(pfEl).toBeDefined()
    expect(pfEl!.classes()).toContain('text-error')
  })
})

// ============================================================
// AC #10: Trade cards
// ============================================================
describe('AC #10: Trade cards', () => {
  it('TC-TH25: BUY action chip should be green (color=success)', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const buyChip = chips.find((c) => c.text().trim() === 'BUY')
    expect(buyChip).toBeDefined()
    expect(buyChip!.props('color')).toBe('success')
  })

  it('TC-TH26: SELL action chip should be red (color=error)', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const sellChip = chips.find((c) => c.text().trim() === 'SELL')
    expect(sellChip).toBeDefined()
    expect(sellChip!.props('color')).toBe('error')
  })

  it('TC-TH27: should display symbol and interval on each trade card', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('USD-JPY')
    expect(wrapper.text()).toContain('XAU-USD')
    expect(wrapper.text()).toContain('1h')
    expect(wrapper.text()).toContain('4h')
  })

  it('TC-TH28: should display duration on each trade card', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('5h 30m')
    expect(wrapper.text()).toContain('12h 0m')
    const html = wrapper.html()
    expect(html).toContain('mdi-clock-outline')
  })

  it('TC-TH29: should display Entry and Exit prices', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('149.250')
    expect(wrapper.text()).toContain('149.580')
    expect(wrapper.text()).toContain('Entry')
    expect(wrapper.text()).toContain('Exit')
  })

  it('TC-TH30: TP exit reason should be green (color=success)', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    // Filter for tonal variant chips (trade card chips) to avoid filter bar chips with same text
    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const tpChips = chips.filter((c) => c.text().trim() === 'TP' && c.props('variant') === 'tonal')
    expect(tpChips.length).toBeGreaterThanOrEqual(1)
    expect(tpChips[0].props('color')).toBe('success')
  })

  it('TC-TH31: SL exit reason should be red (color=error)', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const slChips = chips.filter((c) => c.text().trim() === 'SL' && c.props('variant') === 'tonal')
    expect(slChips.length).toBeGreaterThanOrEqual(1)
    expect(slChips[0].props('color')).toBe('error')
  })

  it('TC-TH32: OPPOSITE_SIGNAL exit reason should be blue (color=info)', () => {
    mockData.value = {
      ...mockHistoryData,
      trades: [{ ...mockTradeBuy, exitReason: 'OPPOSITE_SIGNAL' as const }],
    }
    const wrapper = mountComponent()

    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const signalChip = chips.find((c) => c.text().trim() === 'SIGNAL EXIT')
    expect(signalChip).toBeDefined()
    expect(signalChip!.props('color')).toBe('info')
  })

  it('TC-TH33: MANUAL exit reason should be amber (color=warning)', () => {
    mockData.value = {
      ...mockHistoryData,
      trades: [{ ...mockTradeBuy, exitReason: 'MANUAL' as const }],
    }
    const wrapper = mountComponent()

    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const manualChip = chips.find((c) => c.text().trim() === 'MANUAL')
    expect(manualChip).toBeDefined()
    expect(manualChip!.props('color')).toBe('warning')
  })

  it('TC-TH34: positive profitPips should be green (text-success)', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    const heroStats = wrapper.findAll('.text-h5.font-mono')
    const positivePl = heroStats.find((el) => el.text().includes('+33'))
    expect(positivePl).toBeDefined()
    expect(positivePl!.classes()).toContain('text-success')
  })

  it('TC-TH35: negative profitPips should be red (text-error)', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    const heroStats = wrapper.findAll('.text-h5.font-mono')
    const negativePl = heroStats.find((el) => el.text().includes('-98'))
    expect(negativePl).toBeDefined()
    expect(negativePl!.classes()).toContain('text-error')
  })
})

// ============================================================
// AC #11: Load More button
// ============================================================
describe('AC #11: Load More button', () => {
  it('TC-TH36: should show Load More button when hasMore is true', () => {
    mockData.value = mockHistoryData // hasMore = true
    const wrapper = mountComponent()

    const loadMoreBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('Load More'),
    )
    expect(loadMoreBtn).toBeDefined()
  })

  it('TC-TH37: should show "X of Y shown" pagination info', () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('2 of 45 shown')
  })

  it('TC-TH38: clicking Load More should call loadMore', async () => {
    mockData.value = mockHistoryData
    const wrapper = mountComponent()

    const loadMoreBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('Load More'),
    )
    await loadMoreBtn!.trigger('click')

    expect(mockLoadMore).toHaveBeenCalled()
  })

  it('TC-TH39: should NOT show Load More when hasMore is false', () => {
    mockData.value = {
      ...mockHistoryData,
      pagination: { ...mockPagination, hasMore: false },
    }
    const wrapper = mountComponent()

    const loadMoreBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('Load More'),
    )
    expect(loadMoreBtn).toBeUndefined()
  })
})
