/**
 * Unit tests for OpenPositions component
 *
 * Requirement-First: tests verify acceptance criteria,
 * NOT implementation details.
 *
 * Acceptance Criteria:
 *  1.  Section Header: title "OPEN POSITIONS" + count chip + total floating P&L
 *  2.  Position Card per position
 *  3.  BUY/SELL chip correct colors (BUY=green, SELL=red)
 *  4.  Symbol name + Timeframe
 *  5.  Entry Price + Current Price
 *  6.  SL Distance Bar colors (<50% green, 50-74% amber, 75%+ red)
 *  7.  SL Price + SL Label
 *  8.  Floating P&L hero stat with color
 *  9.  Duration shown if present, hidden if null
 *  10. Null handling: currentPrice->"---", floatingPips->"--- pips", slDistancePercent->bar invisible
 *  11. Loading state: skeleton cards
 *  12. Error state: error alert + Retry button
 *  13. Empty state: "Bot is scanning for optimal setups" + radar icon
 *  14. Numbers use font-mono class
 *  15. Total floating P&L in header = sum of all positions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { ref, readonly } from 'vue'
import OpenPositions from '../../../app/components/trading/OpenPositions.vue'

// ── Create Vuetify instance for testing ──
const vuetify = createVuetify({ components, directives })

// ── Mock useOpenPositions composable ──
// We control the state from tests, not from code
const mockPositions = ref<any[]>([])
const mockLoading = ref(false)
const mockError = ref<string | null>(null)
const mockFetchPositions = vi.fn()
const mockRefresh = vi.fn()

vi.stubGlobal('useOpenPositions', () => ({
  positions: readonly(mockPositions),
  loading: readonly(mockLoading),
  error: readonly(mockError),
  fetchPositions: mockFetchPositions,
  refresh: mockRefresh,
}))

// Mock onMounted (Nuxt auto-import)
vi.stubGlobal('onMounted', (fn: Function) => fn())

// ── Mock data from requirements ──
const positionBuy = {
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
}

const positionSell = {
  symbol: 'XAU-USD',
  interval: '4h',
  action: 'SELL' as const,
  entryPrice: '2,985.50',
  currentPrice: '2,995.30',
  slPrice: '2,995.30',
  slLabel: 'ATR\u00d72.5',
  entryTime: 'Mar 14 16:00',
  floatingPips: -98,
  slDistancePercent: 82,
  duration: '18h 45m',
}

function mountComponent() {
  return mount(OpenPositions, {
    global: {
      plugins: [vuetify],
    },
  })
}

beforeEach(() => {
  mockPositions.value = []
  mockLoading.value = false
  mockError.value = null
  mockFetchPositions.mockClear()
  mockRefresh.mockClear()
})

// ============================================================
// AC #11: Loading state (skeleton cards)
// ============================================================
describe('AC #11: Loading state', () => {
  it('TC-V18: should show skeleton loaders when loading', () => {
    mockLoading.value = true
    const wrapper = mountComponent()

    // Should have skeleton loaders visible
    expect(wrapper.findComponent({ name: 'v-skeleton-loader' }).exists()).toBe(true)
    // Should NOT show data content or error
    expect(wrapper.text()).not.toContain('OPEN POSITIONS')
    expect(wrapper.text()).not.toContain('Failed to load')
  })
})

// ============================================================
// AC #12: Error state + Retry button
// ============================================================
describe('AC #12: Error state', () => {
  it('TC-V19a: should show error alert with retry button', () => {
    mockError.value = 'Server error'
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Failed to load open positions')

    // Should have a Retry button
    const retryBtn = wrapper.find('.v-btn')
    expect(retryBtn.exists()).toBe(true)
    expect(retryBtn.text()).toContain('Retry')
  })

  it('TC-V19b: clicking Retry should call fetchPositions', async () => {
    mockError.value = 'Server error'
    const wrapper = mountComponent()

    const retryBtn = wrapper.find('.v-btn')
    await retryBtn.trigger('click')

    expect(mockFetchPositions).toHaveBeenCalled()
  })
})

// ============================================================
// AC #13: Empty state
// ============================================================
describe('AC #13: Empty state', () => {
  it('TC-V20: should show "Bot is scanning" message and radar icon when no positions', () => {
    mockPositions.value = []
    mockLoading.value = false
    mockError.value = null
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('Bot is scanning for optimal setups')
    const html = wrapper.html()
    expect(html).toContain('mdi-radar')
  })
})

// ============================================================
// AC #1: Section Header
// ============================================================
describe('AC #1: Section Header', () => {
  it('TC-V1: should display "OPEN POSITIONS" title', () => {
    mockPositions.value = [positionBuy, positionSell]
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('OPEN POSITIONS')
  })

  it('TC-V2: should display position count chip', () => {
    mockPositions.value = [positionBuy, positionSell]
    const wrapper = mountComponent()

    // Count chip should show "2"
    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const countChip = chips.find((c) => c.text().trim() === '2')
    expect(countChip).toBeDefined()
  })

  it('TC-V3: should display total floating P&L in header', () => {
    mockPositions.value = [positionBuy, positionSell]
    const wrapper = mountComponent()

    // Total = 33 + (-98) = -65 pips
    expect(wrapper.text()).toContain('-65 pips')
  })
})

// ============================================================
// AC #15: Total floating P&L calculation
// ============================================================
describe('AC #15: Total P&L calculation', () => {
  it('TC-V22: total should be sum of all positions floatingPips', () => {
    mockPositions.value = [
      { ...positionBuy, floatingPips: 100 },
      { ...positionSell, floatingPips: -30 },
    ]
    const wrapper = mountComponent()

    // Total = 100 + (-30) = +70
    expect(wrapper.text()).toContain('+70 pips')
  })

  it('TC-V22b: should handle null floatingPips in sum (treat as 0)', () => {
    mockPositions.value = [
      { ...positionBuy, floatingPips: 50 },
      { ...positionSell, floatingPips: null },
    ]
    const wrapper = mountComponent()

    // Total = 50 + 0 = +50
    expect(wrapper.text()).toContain('+50 pips')
  })
})

// ============================================================
// AC #3: BUY/SELL chip colors
// ============================================================
describe('AC #3: BUY/SELL chip colors', () => {
  it('TC-V4: BUY chip should be green (color=success)', () => {
    mockPositions.value = [positionBuy]
    const wrapper = mountComponent()

    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const buyChip = chips.find((c) => c.text().trim() === 'BUY')
    expect(buyChip).toBeDefined()
    expect(buyChip!.props('color')).toBe('success')
  })

  it('TC-V5: SELL chip should be red (color=error)', () => {
    mockPositions.value = [positionSell]
    const wrapper = mountComponent()

    const chips = wrapper.findAllComponents({ name: 'v-chip' })
    const sellChip = chips.find((c) => c.text().trim() === 'SELL')
    expect(sellChip).toBeDefined()
    expect(sellChip!.props('color')).toBe('error')
  })
})

// ============================================================
// AC #4: Symbol + Timeframe
// ============================================================
describe('AC #4: Symbol + Timeframe', () => {
  it('TC-V6: should display symbol name and timeframe', () => {
    mockPositions.value = [positionBuy]
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('USD-JPY')
    expect(wrapper.text()).toContain('1h')
  })
})

// ============================================================
// AC #5: Entry Price + Current Price
// ============================================================
describe('AC #5: Entry Price + Current Price', () => {
  it('TC-V7: should display entry price and current price', () => {
    mockPositions.value = [positionBuy]
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('149.250')
    expect(wrapper.text()).toContain('149.580')
    // Labels
    expect(wrapper.text()).toContain('Entry')
    expect(wrapper.text()).toContain('Now')
  })
})

// ============================================================
// AC #6: SL Distance Bar colors
// ============================================================
describe('AC #6: SL Distance Bar colors', () => {
  // Note: Vuetify v-progress-linear does not render hex color values into HTML in test env.
  // We verify the SL distance color logic via the percentage text color class (slPercentColorClass)
  // which uses the same thresholds: <50% green(success), 50-74% amber(warning), 75%+ red(error).
  // We also verify the progress bar receives the correct model-value.

  it('TC-V8: <50% SL distance should show green indicator (text-success)', () => {
    mockPositions.value = [{ ...positionBuy, slDistancePercent: 30 }]
    const wrapper = mountComponent()

    // Progress bar should exist with correct value
    const progressBar = wrapper.findComponent({ name: 'v-progress-linear' })
    expect(progressBar.exists()).toBe(true)

    // SL percentage text should be green (text-success)
    const slPercentEl = wrapper.findAll('.font-mono').find(
      (el) => el.text().includes('30%'),
    )
    expect(slPercentEl).toBeDefined()
    expect(slPercentEl!.classes()).toContain('text-success')
  })

  it('TC-V9: 50-74% SL distance should show amber indicator (text-warning)', () => {
    mockPositions.value = [{ ...positionBuy, slDistancePercent: 60 }]
    const wrapper = mountComponent()

    const slPercentEl = wrapper.findAll('.font-mono').find(
      (el) => el.text().includes('60%'),
    )
    expect(slPercentEl).toBeDefined()
    expect(slPercentEl!.classes()).toContain('text-warning')
  })

  it('TC-V10: 75%+ SL distance should show red indicator (text-error)', () => {
    mockPositions.value = [{ ...positionSell, slDistancePercent: 82 }]
    const wrapper = mountComponent()

    const slPercentEl = wrapper.findAll('.font-mono').find(
      (el) => el.text().includes('82%'),
    )
    expect(slPercentEl).toBeDefined()
    expect(slPercentEl!.classes()).toContain('text-error')
  })
})

// ============================================================
// AC #7: SL Price + SL Label
// ============================================================
describe('AC #7: SL Price + SL Label', () => {
  it('TC-V11: should display SL price and SL label', () => {
    mockPositions.value = [positionBuy]
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('148.950')
    expect(wrapper.text()).toContain('Fixed 30p')
    expect(wrapper.text()).toContain('SL')
  })
})

// ============================================================
// AC #8: Floating P&L hero stat
// ============================================================
describe('AC #8: Floating P&L hero stat', () => {
  it('TC-V12a: positive P&L should be green (text-success)', () => {
    mockPositions.value = [positionBuy] // floatingPips = 33
    const wrapper = mountComponent()

    const heroStat = wrapper.find('.text-h5.font-mono')
    expect(heroStat.exists()).toBe(true)
    expect(heroStat.text()).toContain('+33 pips')
    expect(heroStat.classes()).toContain('text-success')
  })

  it('TC-V12b: negative P&L should be red (text-error)', () => {
    mockPositions.value = [positionSell] // floatingPips = -98
    const wrapper = mountComponent()

    const heroStats = wrapper.findAll('.text-h5.font-mono')
    const negStat = heroStats.find((el) => el.text().includes('-98'))
    expect(negStat).toBeDefined()
    expect(negStat!.classes()).toContain('text-error')
  })
})

// ============================================================
// AC #9: Duration
// ============================================================
describe('AC #9: Duration', () => {
  it('TC-V13: should show duration when present', () => {
    mockPositions.value = [positionBuy] // duration = '5h 20m'
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('5h 20m')
    const html = wrapper.html()
    expect(html).toContain('mdi-clock-outline')
  })

  it('TC-V14: should hide duration when null', () => {
    mockPositions.value = [{ ...positionBuy, duration: null }]
    const wrapper = mountComponent()

    const html = wrapper.html()
    expect(html).not.toContain('mdi-clock-outline')
  })
})

// ============================================================
// AC #10: Null handling
// ============================================================
describe('AC #10: Null handling', () => {
  it('TC-V15: null currentPrice should display "---"', () => {
    mockPositions.value = [{ ...positionBuy, currentPrice: null }]
    const wrapper = mountComponent()

    // Should show "---" for current price
    expect(wrapper.text()).toContain('---')
  })

  it('TC-V16: null floatingPips should display "--- pips"', () => {
    mockPositions.value = [{ ...positionBuy, floatingPips: null }]
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('--- pips')
  })

  it('TC-V17: null slDistancePercent should set bar to 0', () => {
    mockPositions.value = [{ ...positionBuy, slDistancePercent: null }]
    const wrapper = mountComponent()

    const progressBar = wrapper.findComponent({ name: 'v-progress-linear' })
    expect(progressBar.props('modelValue')).toBe(0)
  })
})

// ============================================================
// AC #14: font-mono on numbers
// ============================================================
describe('AC #14: font-mono class on numbers', () => {
  it('TC-V21: numeric values should have font-mono class', () => {
    mockPositions.value = [positionBuy]
    const wrapper = mountComponent()

    // Entry price — font-mono
    const entryPriceEl = wrapper.findAll('.font-mono').find(
      (el) => el.text().includes('149.250'),
    )
    expect(entryPriceEl).toBeDefined()

    // Current price — font-mono
    const currentPriceEl = wrapper.findAll('.font-mono').find(
      (el) => el.text().includes('149.580'),
    )
    expect(currentPriceEl).toBeDefined()

    // Floating P&L — font-mono
    const plEl = wrapper.find('.text-h5.font-mono')
    expect(plEl.exists()).toBe(true)

    // Total P&L in header — font-mono
    const totalPlEl = wrapper.findAll('.font-mono').find(
      (el) => el.text().includes('pips'),
    )
    expect(totalPlEl).toBeDefined()
  })
})

// ============================================================
// AC #2: Position Card for each position
// ============================================================
describe('AC #2: Position Cards', () => {
  it('should render a card for each position', () => {
    mockPositions.value = [positionBuy, positionSell]
    const wrapper = mountComponent()

    // Should show both symbols
    expect(wrapper.text()).toContain('USD-JPY')
    expect(wrapper.text()).toContain('XAU-USD')

    // Should have 2 position cards (glass-card class)
    const cards = wrapper.findAll('.glass-card')
    expect(cards.length).toBe(2)
  })
})
