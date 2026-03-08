# Changelog

> บันทึกการเปลี่ยนแปลงสำคัญ — อัปเดตทุกครั้งที่ commit
>
> Format: `[commit hash] type(scope): description`

## [Unreleased]

### Added
- `90176d3` feat(frontend): add dayjs timezone support — display local time instead of UTC
  - New dependency: `dayjs` with `utc` and `relativeTime` plugins
  - New centralized utility: `app/utils/datetime.ts` — all date/time formatting in one place
  - `formatThaiDate()`: ISO date string -> Thai locale short date (auto UTC -> local TZ)
  - `formatTimeAgo()`: ISO date string -> relative time ("5m ago", "2h ago")
  - `formatChartTime()`: Unix timestamp -> local time for chart tooltip
  - `formatChartTickMark()`: Unix timestamp -> formatted tick mark (Year/Month/Day/Time)
  - `formatShortTime()`: ISO date string -> short time (HH:mm)
  - `CandlestickChart.vue`: uses `tickMarkFormatter` + `timeFormatter` for local timezone display
  - `SymbolList.vue`: "Last Refresh" now uses `formatShortTime()` instead of raw `Date.toLocaleTimeString()`
  - `types/trading.ts`: removed old `formatTimeAgo`/`formatThaiDate` — re-exports from `datetime.ts`

### Fixed
- `198f09e` fix(frontend): handle null scores in ReadinessScore component

### Changed
- `d1a3fca` chore: add coverage/ to .gitignore

### Added (Earlier)
- `a13d100` test(frontend): add Vitest test infrastructure + 263 unit tests for all composables
  - Setup: vitest, @vue/test-utils, happy-dom, @vitest/coverage-v8
  - 13 test files covering ALL composables
  - Coverage: Statements 94% / Lines 95% / Functions 93% / Branches 75%
- `ded868d` feat(ws): add real-time WebSocket listeners for live data updates
  - `useSocket.ts`: 4 new event listeners — `candle:update`, `indicators:update`, `trends:update`, `readiness:update`
  - `useReadiness.ts`: replaced HTTP polling (60s) with WS inline data
  - `CandlestickChart.vue`: auto-reload chart on `candle:update`
  - `symbol/[id]/index.vue`: real-time price display (throttle 500ms)
- `5499941` feat(frontend): add Signal Readiness Engine dashboard components
- `aee85a4` feat(chart): add Ichimoku Cloud overlay with Kumo cloud rendering
- `a58d2bb` feat(frontend): add Ichimoku Cloud card + info tooltips for all indicator cards
- `4bb8766` refactor(ui): redesign detail page indicators with grouped layout and status-first approach
- `e079d14` feat(frontend): restore missing indicators + cleanup unused imports on detail page
- `ab2aef1` feat: Chart infinite scroll — auto-fetch older candles on left scroll
- `6ad2504` refactor: Show all 4 timeframes simultaneously instead of tab-based single TF view
- `163ac38` feat: Multi-TF indicator section with timeframe tabs on detail page
- `5e8a2df` feat: Add Market Holiday calendar page with CRUD composable
- `bfbc6d7` refactor: Optimize symbols feature — singleton pattern, DRY helpers, chart 8-timeframe support
