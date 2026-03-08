# KOB-Trade Frontend — Feature Registry

> สรุป Features ทั้งหมดของ Frontend อัปเดตทุกครั้งที่มี commit feature/fix
>
> สถานะ: Done | WIP | Planned | Removed

---

## 1. Trading Dashboard

| Feature | Component / Composable | Status |
|---------|----------------------|--------|
| Symbol list with real-time price | `SymbolList.vue` + `useSymbols` | Done |
| Symbol detail page (indicators, signals, chart) | `symbol/[id]/index.vue` | Done |
| Candlestick chart (OHLCV + overlays) | `CandlestickChart.vue` + `useChart` | Done |
| Chart infinite scroll (auto-fetch older candles) | `useChart` growing timeline cache | Done |
| Multi-timeframe indicator section | Detail page grouped layout | Done |
| Ichimoku Cloud chart overlay (Kumo cloud rendering) | `CandlestickChart.vue` Ichimoku toggle + `KumoCloudPaneView` | Done |
| Signal Readiness Engine dashboard | `ReadinessScore.vue` + `useReadiness` | Done |
| Market Holiday calendar with CRUD | `useMarketHolidays` composable | Done |

## 2. Real-time WebSocket

| Feature | Component / Composable | Status |
|---------|----------------------|--------|
| Socket.IO connection management | `useSocket.ts` | Done |
| `candle:update` listener — auto-reload chart | `CandlestickChart.vue` | Done |
| `indicators:update` listener | `symbol/[id]/index.vue` | Done |
| `trends:update` listener | `symbol/[id]/index.vue` | Done |
| `readiness:update` listener (replaced HTTP polling) | `useReadiness.ts` | Done |
| Real-time price display (throttle 500ms) | `symbol/[id]/index.vue` | Done |

## 3. Data Composables

| Feature | Composable | Status |
|---------|-----------|--------|
| Price data | `usePrice` | Done |
| Quote data (Yahoo) | `useQuote` | Done |
| Technical indicators | `useIndicators` | Done |
| Signals (AI-generated) | `useSignals` | Done |
| Trend analysis | `useTrends` | Done |
| Validation | `useValidation` | Done |
| Analysis | `useAnalysis` | Done |
| Watchlist management | `useWatchlist` | Done |

## 4. Date/Time & Localization

| Feature | Component / Utility | Status |
|---------|-------------------|--------|
| dayjs timezone support (UTC -> browser local TZ) | `app/utils/datetime.ts` | Done |
| Thai locale date formatting (`formatThaiDate`) | `datetime.ts` | Done |
| Relative time display (`formatTimeAgo`) | `datetime.ts` | Done |
| Chart tooltip local time (`formatChartTime`) | `datetime.ts` + `CandlestickChart.vue` | Done |
| Chart tick mark formatting (`formatChartTickMark`) | `datetime.ts` + `CandlestickChart.vue` | Done |
| Short time display (`formatShortTime`) | `datetime.ts` + `SymbolList.vue` | Done |

## 5. Testing Infrastructure

| Feature | Details | Status |
|---------|---------|--------|
| Vitest test framework | vitest, @vue/test-utils, happy-dom | Done |
| 263 unit tests (13 test files) | All composables covered | Done |
| Coverage: 94% statements, 95% lines, 93% functions | @vitest/coverage-v8 | Done |
