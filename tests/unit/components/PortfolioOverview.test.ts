/**
 * Unit tests for PortfolioOverview component
 *
 * Requirement-First: tests verify acceptance criteria,
 * NOT implementation details.
 *
 * Acceptance Criteria:
 *  1.  Total P&L (pips) with +/- color (+ = green, - = red, 0 = grey)
 *  2.  Today/Week pips delta with correct colors
 *  3.  Win Rate % + progress bar
 *  4.  Win/Loss/Total in 3 columns (wins = green, losses = red)
 *  5.  Profit Factor with threshold colors (>=2.0 green, >=1.5 primary, >=1.2 warning, <1.2 red)
 *  6.  Max Drawdown always red
 *  7.  Streak icon (fire=W, snowflake=L, minus=0)
 *  8.  Open Positions count
 *  9.  Since date
 *  10. Loading state (skeleton)
 *  11. Error state + Retry button
 *  12. Empty state
 *  13. Numbers use font-mono class
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { ref, readonly, nextTick } from 'vue'
import PortfolioOverview from '../../../app/components/trading/PortfolioOverview.vue'

// ── Create Vuetify instance for testing ──
const vuetify = createVuetify({ components, directives })

// ── Mock usePortfolio composable ──
// We control the state from tests, not from code
const mockData = ref<any>(null)
const mockLoading = ref(false)
const mockError = ref<string | null>(null)
const mockFetchPortfolio = vi.fn()
const mockRefresh = vi.fn()

vi.stubGlobal('usePortfolio', () => ({
  data: readonly(mockData),
  loading: readonly(mockLoading),
  error: readonly(mockError),
  fetchPortfolio: mockFetchPortfolio,
  refresh: mockRefresh,
}))

// Mock onMounted (Nuxt auto-import)
vi.stubGlobal('onMounted', (fn: Function) => fn())

// ── Mock data from requirements ──
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

function mountComponent() {
  return mount(PortfolioOverview, {
    global: {
      plugins: [vuetify],
    },
  })
}

beforeEach(() => {
  mockData.value = null
  mockLoading.value = false
  mockError.value = null
  mockFetchPortfolio.mockClear()
  mockRefresh.mockClear()
})

// ============================================================
// AC #10: Loading state (skeleton)
// ============================================================
describe('AC #10: Loading state', () => {
  it('TC-V17: should show skeleton loader when loading', () => {
    mockLoading.value = true
    const wrapper = mountComponent()

    // Should have skeleton loaders visible
    expect(wrapper.findComponent({ name: 'v-skeleton-loader' }).exists()).toBe(true)
    // Should NOT show data state or error state
    expect(wrapper.text()).not.toContain('PORTFOLIO OVERVIEW')
    expect(wrapper.text()).not.toContain('Failed to load')
  })
})

// ============================================================
// AC #11: Error state + Retry button
// ============================================================
describe('AC #11: Error state', () => {
  it('TC-V18: should show error alert with retry button', async () => {
    mockError.value = 'Server error'
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Failed to load portfolio data')

    // Should have a Retry button
    const retryBtn = wrapper.find('.v-btn')
    expect(retryBtn.exists()).toBe(true)
    expect(retryBtn.text()).toContain('Retry')
  })

  it('TC-V18b: clicking Retry should call fetchPortfolio', async () => {
    mockError.value = 'Server error'
    const wrapper = mountComponent()

    const retryBtn = wrapper.find('.v-btn')
    await retryBtn.trigger('click')

    expect(mockFetchPortfolio).toHaveBeenCalled()
  })
})

// ============================================================
// AC #12: Empty state
// ============================================================
describe('AC #12: Empty state', () => {
  it('TC-V19: should show empty message when no data', () => {
    mockData.value = null
    mockLoading.value = false
    mockError.value = null
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('No trading data yet')
    expect(wrapper.text()).toContain('Start trading to see your portfolio stats')
  })
})

// ============================================================
// AC #1: Total P&L with +/- color
// ============================================================
describe('AC #1: Total P&L (pips) with color', () => {
  it('TC-V1: positive pips should use green (text-primary) class', () => {
    mockData.value = { ...mockPortfolioData, totalPips: 6492 }
    const wrapper = mountComponent()

    const heroNumber = wrapper.find('.text-h4.font-mono')
    expect(heroNumber.exists()).toBe(true)
    expect(heroNumber.classes()).toContain('text-primary')
    expect(heroNumber.text()).toContain('+6,492')
  })

  it('TC-V2: negative pips should use red (text-error) class', () => {
    mockData.value = { ...mockPortfolioData, totalPips: -1230 }
    const wrapper = mountComponent()

    const heroNumber = wrapper.find('.text-h4.font-mono')
    expect(heroNumber.classes()).toContain('text-error')
    expect(heroNumber.text()).toContain('-1,230')
  })

  it('TC-V3: zero pips should use grey (text-medium-emphasis) class', () => {
    mockData.value = { ...mockPortfolioData, totalPips: 0 }
    const wrapper = mountComponent()

    const heroNumber = wrapper.find('.text-h4.font-mono')
    expect(heroNumber.classes()).toContain('text-medium-emphasis')
    expect(heroNumber.text()).toContain('0')
  })
})

// ============================================================
// AC #2: Today/Week pips delta with colors
// ============================================================
describe('AC #2: Today/Week pips delta', () => {
  it('TC-V4: should display today and week delta with correct colors', () => {
    mockData.value = { ...mockPortfolioData, todayPips: 127, weekPips: 483 }
    const wrapper = mountComponent()

    const html = wrapper.html()
    // Positive deltas should have success color
    expect(html).toContain('text-success')
    expect(wrapper.text()).toContain('+127 today')
    expect(wrapper.text()).toContain('+483 week')
  })

  it('TC-V4b: negative deltas should use red color', () => {
    mockData.value = { ...mockPortfolioData, todayPips: -50, weekPips: -200 }
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('-50 today')
    expect(wrapper.text()).toContain('-200 week')
    // Both should have error class for negative
    const deltaContainer = wrapper.find('.text-caption.font-mono')
    const errorSpans = deltaContainer.findAll('.text-error')
    expect(errorSpans.length).toBeGreaterThanOrEqual(2)
  })
})

// ============================================================
// AC #3: Win Rate % + progress bar
// ============================================================
describe('AC #3: Win Rate', () => {
  it('TC-V5: should display win rate percentage and progress bar', () => {
    mockData.value = { ...mockPortfolioData }
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('73%')
    expect(wrapper.text()).toContain('WIN RATE')
    // Progress bar should exist
    expect(wrapper.findComponent({ name: 'v-progress-linear' }).exists()).toBe(true)
  })
})

// ============================================================
// AC #4: Win/Loss/Total 3 columns
// ============================================================
describe('AC #4: Win/Loss/Total counts', () => {
  it('TC-V6: should display wins (green), losses (red), total in 3 columns', () => {
    mockData.value = { ...mockPortfolioData }
    const wrapper = mountComponent()

    // Wins = green (text-success)
    const winsEl = wrapper.find('.text-success.font-mono')
    expect(winsEl.exists()).toBe(true)
    expect(winsEl.text()).toBe('85')

    // Losses = red (text-error) — find within the Win/Loss/Total row
    const html = wrapper.html()
    expect(html).toContain('text-error')
    expect(wrapper.text()).toContain('32')

    // Total
    expect(wrapper.text()).toContain('117')

    // Labels
    expect(wrapper.text()).toContain('Wins')
    expect(wrapper.text()).toContain('Losses')
    expect(wrapper.text()).toContain('Total')
  })
})

// ============================================================
// AC #5: Profit Factor threshold colors
// ============================================================
describe('AC #5: Profit Factor colors', () => {
  it('TC-V7: PF >= 2.0 should be green (text-success)', () => {
    mockData.value = { ...mockPortfolioData, profitFactor: 2.45 }
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('2.45')
    expect(wrapper.text()).toContain('Profit Factor')
    // Find the PF value element
    const pfEl = wrapper.findAll('.text-h6.font-mono').find(
      (el) => el.text().includes('2.45'),
    )
    expect(pfEl).toBeDefined()
    expect(pfEl!.classes()).toContain('text-success')
  })

  it('TC-V8: PF >= 1.5 (but < 2.0) should be primary (text-primary)', () => {
    mockData.value = { ...mockPortfolioData, profitFactor: 1.75 }
    const wrapper = mountComponent()

    const pfEl = wrapper.findAll('.text-h6.font-mono').find(
      (el) => el.text().includes('1.75'),
    )
    expect(pfEl).toBeDefined()
    expect(pfEl!.classes()).toContain('text-primary')
  })

  it('TC-V9: PF >= 1.2 (but < 1.5) should be warning (text-warning)', () => {
    mockData.value = { ...mockPortfolioData, profitFactor: 1.35 }
    const wrapper = mountComponent()

    const pfEl = wrapper.findAll('.text-h6.font-mono').find(
      (el) => el.text().includes('1.35'),
    )
    expect(pfEl).toBeDefined()
    expect(pfEl!.classes()).toContain('text-warning')
  })

  it('TC-V10: PF < 1.2 should be red (text-error)', () => {
    mockData.value = { ...mockPortfolioData, profitFactor: 0.85 }
    const wrapper = mountComponent()

    const pfEl = wrapper.findAll('.text-h6.font-mono').find(
      (el) => el.text().includes('0.85'),
    )
    expect(pfEl).toBeDefined()
    expect(pfEl!.classes()).toContain('text-error')
  })
})

// ============================================================
// AC #6: Max Drawdown always red
// ============================================================
describe('AC #6: Max Drawdown', () => {
  it('TC-V11: Max DD should always be red (text-error)', () => {
    mockData.value = { ...mockPortfolioData, maxDrawdown: -842 }
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Max DD')
    // Find the DD value — it should have text-error
    const ddEl = wrapper.findAll('.text-h6.font-mono.text-error').find(
      (el) => el.text().includes('842'),
    )
    expect(ddEl).toBeDefined()
  })
})

// ============================================================
// AC #7: Streak icon
// ============================================================
describe('AC #7: Streak icons', () => {
  it('TC-V12: winning streak should show fire icon', () => {
    mockData.value = { ...mockPortfolioData, streak: 3, streakType: 'W' }
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('3W')
    const html = wrapper.html()
    expect(html).toContain('mdi-fire')
  })

  it('TC-V13: losing streak should show snowflake icon', () => {
    mockData.value = { ...mockPortfolioData, streak: 5, streakType: 'L' }
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('5L')
    const html = wrapper.html()
    expect(html).toContain('mdi-snowflake')
  })

  it('TC-V14: zero streak should show minus icon', () => {
    mockData.value = { ...mockPortfolioData, streak: 0 }
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('0')
    const html = wrapper.html()
    expect(html).toContain('mdi-minus')
  })
})

// ============================================================
// AC #8: Open Positions count
// ============================================================
describe('AC #8: Open Positions', () => {
  it('TC-V15: should display open positions count', () => {
    mockData.value = { ...mockPortfolioData, openPositions: 4 }
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('4 Open Positions')
  })
})

// ============================================================
// AC #9: Since date
// ============================================================
describe('AC #9: Since date', () => {
  it('TC-V16: should display since date', () => {
    mockData.value = { ...mockPortfolioData, since: 'Oct 1, 2025' }
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Since Oct 1, 2025')
  })
})

// ============================================================
// AC #13: font-mono on numbers
// ============================================================
describe('AC #13: font-mono class on numbers', () => {
  it('TC-V20: numeric values should have font-mono class', () => {
    mockData.value = { ...mockPortfolioData }
    const wrapper = mountComponent()

    // Total pips — font-mono
    const heroPips = wrapper.find('.text-h4.font-mono')
    expect(heroPips.exists()).toBe(true)

    // Today/Week delta — font-mono
    const deltaRow = wrapper.find('.text-caption.font-mono')
    expect(deltaRow.exists()).toBe(true)

    // Win rate % — font-mono
    const winRateVal = wrapper.findAll('.font-mono').find(
      (el) => el.text().includes('73%'),
    )
    expect(winRateVal).toBeDefined()

    // Win/Loss/Total counts — font-mono
    const statNumbers = wrapper.findAll('.text-h6.font-mono')
    expect(statNumbers.length).toBeGreaterThanOrEqual(6) // wins, losses, total, PF, DD, streak

    // Open positions chip — font-mono
    const chip = wrapper.findComponent({ name: 'v-chip' })
    expect(chip.classes()).toContain('font-mono')
  })
})
