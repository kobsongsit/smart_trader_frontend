# Test Registry — Smart Trader Frontend

## 1. Test Overview
- **Total tests**: 184 (115 component + 69 composable)
- **Test types**: Unit tests (composable logic + component rendering)
- **Framework**: Vitest 4.x + @vue/test-utils + happy-dom + Vuetify
- **Last updated**: 2026-03-16

## 2. Feature Test Map (requirement -> test mapping)

### Feature: usePortfolio Composable
| Requirement / AC | Test File | Test Cases | Status | Last Verified |
|------------------|-----------|------------|--------|---------------|
| AC #1: Fetch from GET /api/strategy/portfolio | `tests/unit/composables/usePortfolio.test.ts` | TC-C5 | Pass | 2026-03-15 |
| AC #2: Return reactive state (data, loading, error) | `tests/unit/composables/usePortfolio.test.ts` | TC-C4, initial state | Pass | 2026-03-15 |
| AC #3: Handle error case | `tests/unit/composables/usePortfolio.test.ts` | TC-C3, network error, success=false | Pass | 2026-03-15 |
| AC #4: Handle success case | `tests/unit/composables/usePortfolio.test.ts` | TC-C1, TC-C2 | Pass | 2026-03-15 |
| Refresh alias | `tests/unit/composables/usePortfolio.test.ts` | TC-C6 | Pass | 2026-03-15 |
| Error cleared on retry | `tests/unit/composables/usePortfolio.test.ts` | clear error test | Pass | 2026-03-15 |

### Feature: PortfolioOverview Component
| Requirement / AC | Test File | Test Cases | Status | Last Verified |
|------------------|-----------|------------|--------|---------------|
| AC #1: Total P&L +/- color | `tests/unit/components/PortfolioOverview.test.ts` | TC-V1, TC-V2, TC-V3 | Pass | 2026-03-15 |
| AC #2: Today/Week delta + color | `tests/unit/components/PortfolioOverview.test.ts` | TC-V4, TC-V4b | Pass | 2026-03-15 |
| AC #3: Win Rate % + progress bar | `tests/unit/components/PortfolioOverview.test.ts` | TC-V5 | Pass | 2026-03-15 |
| AC #4: Win/Loss/Total 3 columns | `tests/unit/components/PortfolioOverview.test.ts` | TC-V6 | Pass | 2026-03-15 |
| AC #5: PF threshold colors | `tests/unit/components/PortfolioOverview.test.ts` | TC-V7, TC-V8, TC-V9, TC-V10 | Pass | 2026-03-15 |
| AC #6: Max DD always red | `tests/unit/components/PortfolioOverview.test.ts` | TC-V11 | Pass | 2026-03-15 |
| AC #7: Streak icons | `tests/unit/components/PortfolioOverview.test.ts` | TC-V12, TC-V13, TC-V14 | Pass | 2026-03-15 |
| AC #8: Open Positions count | `tests/unit/components/PortfolioOverview.test.ts` | TC-V15 | Pass | 2026-03-15 |
| AC #9: Since date | `tests/unit/components/PortfolioOverview.test.ts` | TC-V16 | Pass | 2026-03-15 |
| AC #10: Loading skeleton | `tests/unit/components/PortfolioOverview.test.ts` | TC-V17 | Pass | 2026-03-15 |
| AC #11: Error + Retry | `tests/unit/components/PortfolioOverview.test.ts` | TC-V18, TC-V18b | Pass | 2026-03-15 |
| AC #12: Empty state | `tests/unit/components/PortfolioOverview.test.ts` | TC-V19 | Pass | 2026-03-15 |
| AC #13: font-mono on numbers | `tests/unit/components/PortfolioOverview.test.ts` | TC-V20 | Pass | 2026-03-15 |

### Feature: useOpenPositions Composable
| Requirement / AC | Test File | Test Cases | Status | Last Verified |
|------------------|-----------|------------|--------|---------------|
| AC #1: Fetch from GET /api/strategy/positions | `tests/unit/composables/useOpenPositions.test.ts` | TC-C1 | Pass | 2026-03-15 |
| AC #2: Return reactive state (positions, loading, error) | `tests/unit/composables/useOpenPositions.test.ts` | TC-C2, TC-C8 | Pass | 2026-03-15 |
| AC #3: Handle error case | `tests/unit/composables/useOpenPositions.test.ts` | TC-C5, TC-C6, network error | Pass | 2026-03-15 |
| AC #4: Handle success case | `tests/unit/composables/useOpenPositions.test.ts` | TC-C3, TC-C4 | Pass | 2026-03-15 |
| AC #5: Handle empty array | `tests/unit/composables/useOpenPositions.test.ts` | TC-C7 | Pass | 2026-03-15 |
| Refresh alias | `tests/unit/composables/useOpenPositions.test.ts` | TC-C9 | Pass | 2026-03-15 |
| Error cleared on retry | `tests/unit/composables/useOpenPositions.test.ts` | TC-C10 | Pass | 2026-03-15 |

### Feature: OpenPositions Component
| Requirement / AC | Test File | Test Cases | Status | Last Verified |
|------------------|-----------|------------|--------|---------------|
| AC #1: Section Header (title + count + total P&L) | `tests/unit/components/OpenPositions.test.ts` | TC-V1, TC-V2, TC-V3 | Pass | 2026-03-15 |
| AC #2: Position Card per position | `tests/unit/components/OpenPositions.test.ts` | card count test | Pass | 2026-03-15 |
| AC #3: BUY/SELL chip colors | `tests/unit/components/OpenPositions.test.ts` | TC-V4, TC-V5 | Pass | 2026-03-15 |
| AC #4: Symbol + Timeframe | `tests/unit/components/OpenPositions.test.ts` | TC-V6 | Pass | 2026-03-15 |
| AC #5: Entry Price + Current Price | `tests/unit/components/OpenPositions.test.ts` | TC-V7 | Pass | 2026-03-15 |
| AC #6: SL Distance Bar colors | `tests/unit/components/OpenPositions.test.ts` | TC-V8, TC-V9, TC-V10 | Pass | 2026-03-15 |
| AC #7: SL Price + SL Label | `tests/unit/components/OpenPositions.test.ts` | TC-V11 | Pass | 2026-03-15 |
| AC #8: Floating P&L hero stat + color | `tests/unit/components/OpenPositions.test.ts` | TC-V12a, TC-V12b | Pass | 2026-03-15 |
| AC #9: Duration show/hide | `tests/unit/components/OpenPositions.test.ts` | TC-V13, TC-V14 | Pass | 2026-03-15 |
| AC #10: Null handling | `tests/unit/components/OpenPositions.test.ts` | TC-V15, TC-V16, TC-V17 | Pass | 2026-03-15 |
| AC #11: Loading skeleton | `tests/unit/components/OpenPositions.test.ts` | TC-V18 | Pass | 2026-03-15 |
| AC #12: Error + Retry | `tests/unit/components/OpenPositions.test.ts` | TC-V19a, TC-V19b | Pass | 2026-03-15 |
| AC #13: Empty state + radar | `tests/unit/components/OpenPositions.test.ts` | TC-V20 | Pass | 2026-03-15 |
| AC #14: font-mono on numbers | `tests/unit/components/OpenPositions.test.ts` | TC-V21 | Pass | 2026-03-15 |
| AC #15: Total P&L calculation | `tests/unit/components/OpenPositions.test.ts` | TC-V22, TC-V22b | Pass | 2026-03-15 |

### Feature: useTradeHistory Composable
| Requirement / AC | Test File | Test Cases | Status | Last Verified |
|------------------|-----------|------------|--------|---------------|
| AC #1: API supports filters (symbol, interval, month/year, result, exitReason, sort, pagination) | `tests/unit/composables/useTradeHistory.test.ts` | TC-H4~H11 | Pass | 2026-03-16 |
| AC #2: Summary stats (totalTrades, wins, losses, winRate, totalPips, PF, avgWinPips, avgLossPips) | `tests/unit/composables/useTradeHistory.test.ts` | TC-H12 | Pass | 2026-03-16 |
| AC #3: Trades array (id, symbol, interval, strategyName, action, prices, times, exitReason, profitPips, duration) | `tests/unit/composables/useTradeHistory.test.ts` | TC-H13 | Pass | 2026-03-16 |
| AC #4: Pagination (page, limit, total, hasMore) | `tests/unit/composables/useTradeHistory.test.ts` | TC-H14 | Pass | 2026-03-16 |
| AC #5: fetchHistory, loadMore, reset, filter state | `tests/unit/composables/useTradeHistory.test.ts` | TC-H1~H3, TC-H15~H25 | Pass | 2026-03-16 |
| Error handling (API fail, success=false, network) | `tests/unit/composables/useTradeHistory.test.ts` | TC-H17~H20 | Pass | 2026-03-16 |
| loadMore append + revert on error | `tests/unit/composables/useTradeHistory.test.ts` | TC-H22~H24 | Pass | 2026-03-16 |
| Reset filters + refetch | `tests/unit/composables/useTradeHistory.test.ts` | TC-H25 | Pass | 2026-03-16 |

### Feature: Trade History Page (history.vue)
| Requirement / AC | Test File | Test Cases | Status | Last Verified |
|------------------|-----------|------------|--------|---------------|
| AC #6: Symbol chip group + Period month navigator | `tests/unit/components/TradeHistory.test.ts` | TC-TH7~TH9 | Pass | 2026-03-16 |
| AC #7: Expandable filter (Result/Timeframe/Exit) + badge | `tests/unit/components/TradeHistory.test.ts` | TC-TH10~TH15 | Pass | 2026-03-16 |
| AC #8: Sort toggle (Latest/Oldest) | `tests/unit/components/TradeHistory.test.ts` | TC-TH16 | Pass | 2026-03-16 |
| AC #9: Summary stats 2 rows + colors + PF thresholds | `tests/unit/components/TradeHistory.test.ts` | TC-TH17~TH24 | Pass | 2026-03-16 |
| AC #10: Trade cards (action/symbol/interval/duration/prices/exitReason/P&L colors) | `tests/unit/components/TradeHistory.test.ts` | TC-TH25~TH35 | Pass | 2026-03-16 |
| AC #11: Load More + pagination info | `tests/unit/components/TradeHistory.test.ts` | TC-TH36~TH39 | Pass | 2026-03-16 |
| AC #12: 4 states (loading/error+retry/empty/data) | `tests/unit/components/TradeHistory.test.ts` | TC-TH1~TH6 | Pass | 2026-03-16 |

### Feature: useMonthlyPerformance Composable
| Requirement / AC | Test File | Test Cases | Status | Last Verified |
|------------------|-----------|------------|--------|---------------|
| AC #13: API call to /api/strategy/performance/monthly | `tests/unit/composables/useMonthlyPerformance.test.ts` | TC-M3, TC-M4 | Pass | 2026-03-16 |
| AC #14: Month data fields (totalPips, wins, losses, WR, PF, cumulative, best/worst, symbols, intervals) | `tests/unit/composables/useMonthlyPerformance.test.ts` | TC-M5~M9 | Pass | 2026-03-16 |
| AC #15: fetchMonthly, refresh, reactive state | `tests/unit/composables/useMonthlyPerformance.test.ts` | TC-M1~M2, TC-M10~M16 | Pass | 2026-03-16 |
| Error handling (API fail, success=false, network) | `tests/unit/composables/useMonthlyPerformance.test.ts` | TC-M12~M15 | Pass | 2026-03-16 |
| Edge case: empty months | `tests/unit/composables/useMonthlyPerformance.test.ts` | TC-M17 | Pass | 2026-03-16 |

### Feature: Monthly Performance Page (performance.vue)
| Requirement / AC | Test File | Test Cases | Status | Last Verified |
|------------------|-----------|------------|--------|---------------|
| AC #16: Cumulative P&L hero (text-h4, +success/-error color) | `tests/unit/components/MonthlyPerformance.test.ts` | TC-MP7~MP10 | Pass | 2026-03-16 |
| AC #17: CSS horizontal bar chart (green=profit, red=loss, proportional width) | `tests/unit/components/MonthlyPerformance.test.ts` | TC-MP11~MP16 | Pass | 2026-03-16 |
| AC #18: Compact month cards (trades, WR%, PF thresholds, pips, cumulative) | `tests/unit/components/MonthlyPerformance.test.ts` | TC-MP30~MP34 | Pass | 2026-03-16 |
| AC #19: Month detail (stats grid, best/worst trade, symbol breakdown, TF breakdown) | `tests/unit/components/MonthlyPerformance.test.ts` | TC-MP17~MP29 | Pass | 2026-03-16 |
| AC #20: 4 states (loading/error+retry/empty/data) | `tests/unit/components/MonthlyPerformance.test.ts` | TC-MP1~MP6 | Pass | 2026-03-16 |

## 3. Test Plan Archive

### 2026-03-15 — Portfolio Overview (usePortfolio + PortfolioOverview component)
- **Source Requirement**: 13 acceptance criteria for component + 4 for composable
- **Test Plan**: 26 test cases covering all AC (TC-C1~C6, TC-V1~V20)
- **Result**: PASS — 32/32 tests passed
- **Files Tested**: `app/composables/usePortfolio.ts`, `app/components/trading/PortfolioOverview.vue`
- **Config Changed**: `vitest.config.ts` (added @vitejs/plugin-vue, vuetify inline deps)

### 2026-03-15 — Open Positions (useOpenPositions + OpenPositions component)
- **Source Requirement**: 15 acceptance criteria for component + 5 for composable
- **Test Plan**: 37 test cases covering all AC (TC-C1~C10, TC-V1~V22b)
- **Result**: PASS — 37/37 tests passed (69/69 total with Portfolio tests)
- **Files Tested**: `app/composables/useOpenPositions.ts`, `app/components/trading/OpenPositions.vue`
- **Notes**: Vuetify v-progress-linear does not expose color prop in test env; SL bar color verified via percentage text color class instead (same threshold logic)

### 2026-03-16 — Trade History (useTradeHistory + history.vue page)
- **Source Requirement**: 12 acceptance criteria (AC #1~#12)
- **Test Plan**: 64 test cases (25 composable + 39 component)
- **Result**: PASS — 64/64 tests passed (184/184 total)
- **Files Tested**: `app/composables/useTradeHistory.ts`, `app/pages/history.vue`
- **Notes**: Exit reason chips (TP/SL) in trade cards overlap with filter chips of same name; resolved by filtering for `variant="tonal"` to target trade card chips specifically

### 2026-03-16 — Monthly Performance (useMonthlyPerformance + performance.vue page)
- **Source Requirement**: 8 acceptance criteria (AC #13~#20)
- **Test Plan**: 51 test cases (17 composable + 34 component)
- **Result**: PASS — 51/51 tests passed (184/184 total)
- **Files Tested**: `app/composables/useMonthlyPerformance.ts`, `app/pages/performance.vue`
- **Notes**: dayjs used for date formatting in page component, no mocking needed as node_modules dayjs works in test env

## 4. Known Issues & Waivers
| Issue | Severity | Reason Not Fixed | Waived By | Date |
|-------|----------|------------------|-----------|------|
| — | — | — | — | — |

## 5. Regression History
| Date | What Regressed | Root Cause | Fixed In | Test Added |
|------|---------------|------------|----------|------------|
| — | — | — | — | — |

## 6. Coverage Gaps (requirements without tests)
| Feature | Requirement | Why No Test | Priority |
|---------|-------------|-------------|----------|
| PortfolioOverview | Navigation on open positions click | Route TBD (not in AC) | Low |
| Other composables | usePrice, useSignals, etc. | Backup tests exist but not active | Medium |

## 7. Test Infrastructure Notes
- **Framework**: Vitest 4.x
- **Component testing**: @vue/test-utils 2.x + Vuetify 3 (full component mount)
- **DOM environment**: happy-dom
- **Setup file**: `tests/setup.ts` — mocks Nuxt auto-imports (ref, computed, useRuntimeConfig, etc.)
- **Vue SFC support**: @vitejs/plugin-vue in vitest.config.ts
- **Vuetify in tests**: `server.deps.inline: ['vuetify']` for CSS handling
- **Run tests**: `npx vitest run`
- **Run with coverage**: `npx vitest run --coverage`
- **Mock patterns**: axios mock for composables, `vi.stubGlobal('useXxx', ...)` for component tests (usePortfolio, useOpenPositions, useTradeHistory, useMonthlyPerformance)
- **Page component testing**: Pages (history.vue, performance.vue) tested by mocking their composables via `vi.stubGlobal` + `vi.stubGlobal('onMounted', (fn) => fn())`
- **Vuetify limitation**: `v-progress-linear` does not expose `color` prop via `.props()` in test env; verify color logic via rendered CSS classes instead
- **Chip disambiguation**: When filter chips and data chips share same text (e.g., 'TP', 'SL'), filter by `variant="tonal"` to target data chips
