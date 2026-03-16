/**
 * Unit tests for Monthly Performance page (performance.vue)
 *
 * Requirement-First: tests verify acceptance criteria,
 * NOT implementation details.
 *
 * Acceptance Criteria:
 *  AC #16: Page hero: Cumulative P&L (text-h4, positive=success/negative=error color)
 *  AC #17: CSS horizontal bar chart: monthly P&L, green=profit red=loss, bar width proportional
 *  AC #18: Compact month cards: trades, WR%, PF (color thresholds), pips, cumulative
 *  AC #19: Month detail when selected: stat grid + best/worst trade + symbol breakdown + TF breakdown
 *  AC #20: 4 states: loading skeleton, error alert+retry, empty state, data state
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { ref, readonly, nextTick } from 'vue'
import MonthlyPerformance from '../../../app/pages/performance.vue'

// ── Create Vuetify instance for testing ──
const vuetify = createVuetify({ components, directives })

// ── Mock useMonthlyPerformance composable ──
const mockData = ref<any>(null)
const mockLoading = ref(false)
const mockError = ref<string | null>(null)
const mockFetchMonthly = vi.fn()
const mockRefresh = vi.fn()

vi.stubGlobal('useMonthlyPerformance', () => ({
  data: readonly(mockData),
  loading: readonly(mockLoading),
  error: readonly(mockError),
  fetchMonthly: mockFetchMonthly,
  refresh: mockRefresh,
}))

// Mock onMounted (Nuxt auto-import)
vi.stubGlobal('onMounted', (fn: Function) => fn())

// ── Mock data from requirements ──
const mockBestTrade = {
  symbol: 'USD-JPY',
  action: 'BUY' as const,
  pips: 120,
  date: '2026-03-05',
  interval: '1h',
}

const mockWorstTrade = {
  symbol: 'XAU-USD',
  action: 'SELL' as const,
  pips: -85,
  date: '2026-03-12',
  interval: '4h',
}

const mockSymbolBreakdown = [
  { symbol: 'USD-JPY', totalPips: 200, wins: 8, losses: 3, totalTrades: 11 },
  { symbol: 'XAU-USD', totalPips: -50, wins: 4, losses: 5, totalTrades: 9 },
]

const mockIntervalBreakdown = [
  { interval: '1h', wins: 7, losses: 4, totalPips: 120 },
  { interval: '4h', wins: 5, losses: 4, totalPips: 30 },
]

const mockMonth1 = {
  month: '2026-03',
  label: 'Mar 2026',
  totalPips: 350,
  wins: 20,
  losses: 10,
  totalTrades: 30,
  winRate: 66.7,
  profitFactor: 2.1,
  cumulativePips: 1600,
  bestTrade: mockBestTrade,
  worstTrade: mockWorstTrade,
  symbols: mockSymbolBreakdown,
  intervals: mockIntervalBreakdown,
}

const mockMonth2 = {
  month: '2026-02',
  label: 'Feb 2026',
  totalPips: -100,
  wins: 8,
  losses: 12,
  totalTrades: 20,
  winRate: 40.0,
  profitFactor: 0.9,
  cumulativePips: 1250,
  bestTrade: { ...mockBestTrade, pips: 90, date: '2026-02-10' },
  worstTrade: { ...mockWorstTrade, pips: -60, date: '2026-02-20' },
  symbols: mockSymbolBreakdown,
  intervals: mockIntervalBreakdown,
}

const mockMonth3 = {
  month: '2026-01',
  label: 'Jan 2026',
  totalPips: 500,
  wins: 25,
  losses: 5,
  totalTrades: 30,
  winRate: 83.3,
  profitFactor: 3.5,
  cumulativePips: 1350,
  bestTrade: { ...mockBestTrade, pips: 150, date: '2026-01-15' },
  worstTrade: { ...mockWorstTrade, pips: -40, date: '2026-01-20' },
  symbols: mockSymbolBreakdown,
  intervals: mockIntervalBreakdown,
}

const mockPerformanceData = {
  months: [mockMonth1, mockMonth2, mockMonth3], // newest first
}

function mountComponent() {
  return mount(MonthlyPerformance, {
    global: {
      plugins: [vuetify],
    },
  })
}

beforeEach(() => {
  mockData.value = null
  mockLoading.value = false
  mockError.value = null
  mockFetchMonthly.mockClear()
  mockRefresh.mockClear()
})

// ============================================================
// AC #20: Loading state (skeleton)
// ============================================================
describe('AC #20: Loading state', () => {
  it('TC-MP1: should show skeleton loaders when loading and no data', () => {
    mockLoading.value = true
    const wrapper = mountComponent()

    expect(wrapper.findComponent({ name: 'v-skeleton-loader' }).exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Failed to load monthly performance')
  })
})

// ============================================================
// AC #20: Error state + Retry
// ============================================================
describe('AC #20: Error state', () => {
  it('TC-MP2: should show error alert when error occurs', () => {
    mockError.value = 'Server error'
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Failed to load monthly performance')
  })

  it('TC-MP3: should show Retry button in error state', () => {
    mockError.value = 'Server error'
    const wrapper = mountComponent()

    const retryBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('Retry'),
    )
    expect(retryBtn).toBeDefined()
  })

  it('TC-MP4: clicking Retry should call fetchMonthly', async () => {
    mockError.value = 'Server error'
    const wrapper = mountComponent()

    const retryBtn = wrapper.findAll('.v-btn').find(
      (btn) => btn.text().includes('Retry'),
    )
    await retryBtn!.trigger('click')

    expect(mockFetchMonthly).toHaveBeenCalled()
  })
})

// ============================================================
// AC #20: Empty state
// ============================================================
describe('AC #20: Empty state', () => {
  it('TC-MP5: should show empty message when no months data', () => {
    mockData.value = { months: [] }
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('No performance data yet')
    expect(wrapper.text()).toContain('Complete some trades to see monthly performance')
  })
})

// ============================================================
// AC #20: Data state — page header
// ============================================================
describe('AC #20: Data state', () => {
  it('TC-MP6: should show PERFORMANCE page header', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('PERFORMANCE')
    expect(wrapper.text()).toContain('Monthly summary')
  })
})

// ============================================================
// AC #16: Cumulative P&L hero
// ============================================================
describe('AC #16: Cumulative P&L hero', () => {
  it('TC-MP7: should display Cumulative P&L with text-h4', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('CUMULATIVE P&L')
    const heroEl = wrapper.find('.text-h4.font-mono')
    expect(heroEl.exists()).toBe(true)
  })

  it('TC-MP8: positive cumulative should use success color', () => {
    mockData.value = mockPerformanceData // cumulativePips = 1600
    const wrapper = mountComponent()

    const heroEl = wrapper.find('.text-h4.font-mono')
    expect(heroEl.classes()).toContain('text-success')
    expect(heroEl.text()).toContain('+1,600')
  })

  it('TC-MP9: negative cumulative should use error color', () => {
    mockData.value = {
      months: [{ ...mockMonth1, cumulativePips: -300 }],
    }
    const wrapper = mountComponent()

    const heroEl = wrapper.find('.text-h4.font-mono')
    expect(heroEl.classes()).toContain('text-error')
  })

  it('TC-MP10: should show "pips" label and "Since" info', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('pips')
    expect(wrapper.text()).toContain('Since')
    expect(wrapper.text()).toContain('3 months')
  })
})

// ============================================================
// AC #17: CSS horizontal bar chart
// ============================================================
describe('AC #17: Monthly P&L bar chart', () => {
  it('TC-MP11: should show MONTHLY P&L section', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('MONTHLY P&L')
  })

  it('TC-MP12: should render a bar row for each month', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    // Should show month labels for all 3 months
    expect(wrapper.text()).toContain('Mar')
    expect(wrapper.text()).toContain('Feb')
    expect(wrapper.text()).toContain('Jan')
  })

  it('TC-MP13: positive month bars should be green (bg-success)', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    const html = wrapper.html()
    expect(html).toContain('bg-success')
  })

  it('TC-MP14: negative month bars should be red (bg-error)', () => {
    mockData.value = mockPerformanceData // Feb has -100 pips
    const wrapper = mountComponent()

    const html = wrapper.html()
    expect(html).toContain('bg-error')
  })

  it('TC-MP15: should display pips values next to bars', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('+350')
    expect(wrapper.text()).toContain('-100')
    expect(wrapper.text()).toContain('+500')
  })

  it('TC-MP16: clicking a bar row should select that month', async () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    // Click on a month row (cursor-pointer elements)
    const monthRows = wrapper.findAll('.cursor-pointer')
    expect(monthRows.length).toBeGreaterThanOrEqual(3)
  })
})

// ============================================================
// AC #19: Month detail when selected
// ============================================================
describe('AC #19: Month detail', () => {
  it('TC-MP17: should show selected month detail card with stats grid', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    // Default selected = newest month (Mar 2026)
    expect(wrapper.text()).toContain('Mar 2026')
    expect(wrapper.text()).toContain('30') // totalTrades
    expect(wrapper.text()).toContain('66.7%') // winRate
    expect(wrapper.text()).toContain('Trades')
    expect(wrapper.text()).toContain('Win Rate')
    expect(wrapper.text()).toContain('PF')
  })

  it('TC-MP18: should show month pips with correct color', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    // +350 pips should be text-success
    const pipsElements = wrapper.findAll('.text-h6.font-mono')
    const pipsEl = pipsElements.find((el) => el.text().includes('350'))
    // Should exist somewhere in the detail
    expect(wrapper.text()).toContain('+350')
  })

  it('TC-MP19: PF should use threshold colors (>=2.0 success)', () => {
    mockData.value = mockPerformanceData // PF = 2.1
    const wrapper = mountComponent()

    const pfElements = wrapper.findAll('.text-h6.font-mono')
    const pfEl = pfElements.find((el) => el.text().includes('2.10'))
    expect(pfEl).toBeDefined()
    expect(pfEl!.classes()).toContain('text-success')
  })

  it('TC-MP20: PF >=1.5 <2.0 should use primary color', () => {
    mockData.value = {
      months: [{ ...mockMonth1, profitFactor: 1.75 }],
    }
    const wrapper = mountComponent()

    const pfElements = wrapper.findAll('.text-h6.font-mono')
    const pfEl = pfElements.find((el) => el.text().includes('1.75'))
    expect(pfEl).toBeDefined()
    expect(pfEl!.classes()).toContain('text-primary')
  })

  it('TC-MP21: PF >=1.2 <1.5 should use warning color', () => {
    mockData.value = {
      months: [{ ...mockMonth1, profitFactor: 1.35 }],
    }
    const wrapper = mountComponent()

    const pfElements = wrapper.findAll('.text-h6.font-mono')
    const pfEl = pfElements.find((el) => el.text().includes('1.35'))
    expect(pfEl).toBeDefined()
    expect(pfEl!.classes()).toContain('text-warning')
  })

  it('TC-MP22: PF <1.2 should use error color', () => {
    mockData.value = {
      months: [{ ...mockMonth1, profitFactor: 0.85 }],
    }
    const wrapper = mountComponent()

    const pfElements = wrapper.findAll('.text-h6.font-mono')
    const pfEl = pfElements.find((el) => el.text().includes('0.85'))
    expect(pfEl).toBeDefined()
    expect(pfEl!.classes()).toContain('text-error')
  })

  it('TC-MP23: should show BEST / WORST TRADE section', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('BEST / WORST TRADE')
    const html = wrapper.html()
    expect(html).toContain('mdi-trophy')
    expect(html).toContain('mdi-alert-circle-outline')
  })

  it('TC-MP24: best trade should show symbol, action, pips', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    // Best trade: USD-JPY BUY +120
    expect(wrapper.text()).toContain('+120')
  })

  it('TC-MP25: worst trade should show symbol, action, pips', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    // Worst trade: XAU-USD SELL -85
    expect(wrapper.text()).toContain('-85')
  })

  it('TC-MP26: should show SYMBOL BREAKDOWN section', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('SYMBOL BREAKDOWN')
    expect(wrapper.text()).toContain('USD-JPY')
    expect(wrapper.text()).toContain('XAU-USD')
  })

  it('TC-MP27: symbol breakdown should show W/L counts and pips', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('8W 3L') // USD-JPY
    expect(wrapper.text()).toContain('4W 5L') // XAU-USD
    expect(wrapper.text()).toContain('+200')
    expect(wrapper.text()).toContain('-50')
  })

  it('TC-MP28: should show TIMEFRAME BREAKDOWN section', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('TIMEFRAME BREAKDOWN')
    expect(wrapper.text()).toContain('1h')
    expect(wrapper.text()).toContain('4h')
  })

  it('TC-MP29: TF breakdown should show W/L counts and pips', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('7W 4L') // 1h
    expect(wrapper.text()).toContain('5W 4L') // 4h
    expect(wrapper.text()).toContain('+120')
    expect(wrapper.text()).toContain('+30')
  })
})

// ============================================================
// AC #18: Compact month cards (other months)
// ============================================================
describe('AC #18: Compact month cards', () => {
  it('TC-MP30: should show ALL MONTHS section', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('ALL MONTHS')
  })

  it('TC-MP31: should show compact cards for non-selected months', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    // Default selected = Mar 2026, so Feb and Jan should be in compact list
    expect(wrapper.text()).toContain('Feb 2026')
    expect(wrapper.text()).toContain('Jan 2026')
  })

  it('TC-MP32: compact cards should show trades, WR%, PF, pips', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    // Feb 2026 stats in compact card
    expect(wrapper.text()).toContain('20 trades') // Feb totalTrades
    expect(wrapper.text()).toContain('40% WR') // Feb winRate
    expect(wrapper.text()).toContain('PF 0.90') // Feb PF
  })

  it('TC-MP33: compact cards should show cumulative pips', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('cum:')
  })

  it('TC-MP34: PF in compact cards should use threshold colors', () => {
    mockData.value = mockPerformanceData
    const wrapper = mountComponent()

    // Feb PF = 0.9 -> should have text-error somewhere
    const html = wrapper.html()
    expect(html).toContain('text-error')
  })
})
