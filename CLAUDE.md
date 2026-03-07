# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KOB-Trade Frontend — Nuxt 3 + Vuetify 3 dashboard for AI-powered trading signal system. Displays real-time market data, technical indicators across multiple timeframes, AI analysis results, and trading signals.

**Team agents** (see backend `agents-persona.md` for full personas):
- **Latte** (Marcille-style) — Backend / Tech Lead: API, architecture, database
- **Cappu** (Nobara-style) — Frontend Developer: Vue/Nuxt/Vuetify, UI/UX
- **Mocha** (Yor Forger-style) — QA / Tester: unit, integration, E2E testing

**Backend repo**: `../smart_trader/` (Express.js + TypeScript)

## Common Commands

```bash
# Development
npm run dev          # Start Nuxt dev server (default: http://localhost:3000)
npm run build        # Build for production
npm run generate     # Static site generation
npm run preview      # Preview production build
npm run postinstall  # Run nuxt prepare (auto after npm install)
```

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Nuxt 4 (nuxt ^4.3.0) |
| UI Framework | Vuetify 3 (vuetify ^3.11.8) via `vuetify-nuxt-module` |
| Charts | `lightweight-charts` ^5.1.0 (TradingView) |
| HTTP Client | `axios` ^1.13.4 |
| WebSocket | `socket.io-client` ^4.8.3 |
| Icons | `@mdi/font` (Material Design Icons) |
| CSS | `sass-embedded`, global CSS (`assets/css/global.css`) |
| Fonts | JetBrains Mono (code), Noto Sans Thai (text) |

## Architecture

### File Structure

```
app/
├── pages/                    # Route pages (file-based routing)
│   ├── index.vue             # Dashboard — symbol list with summary cards
│   ├── symbols.vue           # Symbol management list
│   ├── symbol/
│   │   ├── create.vue        # Add new symbol (autocomplete search)
│   │   └── [id]/
│   │       ├── index.vue     # Symbol detail — indicators, signals, chart
│   │       └── edit.vue      # Edit symbol settings
│   ├── analysis-tools.vue    # Analysis tools overview page
│   └── market-holidays.vue   # Market holiday calendar CRUD
├── composables/              # Vue 3 composables (singleton pattern)
│   ├── usePrice.ts           # Real-time price data
│   ├── useQuote.ts           # Yahoo Finance quote data
│   ├── useIndicators.ts      # Technical indicators (enhanced mode)
│   ├── useTrends.ts          # Multi-TF trend directions
│   ├── useSignals.ts         # AI trading signals
│   ├── useAnalysis.ts        # AI analysis summary
│   ├── useValidation.ts      # ProIndicator validation status
│   ├── useChart.ts           # Candlestick chart data + infinite scroll
│   ├── useSymbols.ts         # Symbol CRUD operations
│   ├── useWatchlist.ts       # Watchlist management
│   ├── useMarketHolidays.ts  # Market holiday CRUD
│   └── useSocket.ts          # Socket.IO connection (app-level)
├── components/trading/       # Reusable trading components
│   ├── SymbolList.vue        # Symbol list with search/filter
│   ├── SymbolCard.vue        # Dashboard symbol card
│   ├── CandlestickChart.vue  # TradingView lightweight-charts wrapper
│   ├── IndicatorValue.vue    # Single indicator display
│   ├── TrendBadge.vue        # Trend direction badge
│   ├── PreFilterStatus.vue   # Pre-filter validation status
│   ├── PricePosition.vue     # BB price position display
│   ├── ValidationStatus.vue  # Validation overall status
│   ├── SignalResult.vue      # AI signal result card
│   ├── SignalResultSkeleton.vue # Loading skeleton
│   ├── SignalHistory.vue     # Historical signals list
│   └── SignalAnalyzeButton.vue  # Manual AI analysis trigger
└── assets/css/
    └── global.css            # Global styles, glassmorphism theme
types/
└── trading.ts                # TypeScript type definitions
```

### Composable Pattern (Singleton)

All composables follow a singleton pattern — data is fetched once and cached:

```typescript
// Pattern: each composable exports a function that returns reactive state
const { data, loading, error, fetch } = useIndicators(symbolId);
```

Key composables and their backend APIs:

| Composable | API Endpoint | Description |
|-----------|-------------|-------------|
| `usePrice` | `GET /api/data/:id/price` | Latest price + change% |
| `useQuote` | `GET /api/data/:id/quote` | Yahoo Finance quote |
| `useIndicators` | `GET /api/indicators/:id?enhanced=true` | Raw indicators + derived signals + BB position + summary (multi-TF) |
| `useTrends` | `GET /api/trends/:id` | Trend directions per timeframe |
| `useSignals` | `GET /api/signals/latest/:id` | Latest AI signal (BUY/SELL/WAIT) |
| `useAnalysis` | `GET /api/analysis/:id` | Full AI analysis |
| `useValidation` | `GET /api/validation/:id` | ProIndicator validation status |
| `useChart` | `GET /api/data/:id/chart` | OHLCV + overlays (SMA/BB) + signals |
| `useSymbols` | `GET /api/symbols` | Symbol CRUD |
| `useWatchlist` | `GET /api/watchlist` | Watchlist management |

### Key Data Types (types/trading.ts)

- `RawIndicators` — raw indicator values per timeframe (SMA, EMA, RSI, MACD, BB, Stochastic, OBV, ATR, ADX)
- `DerivedSignals` — computed signals (BB Squeeze, RSI/MACD Divergence, SMA Crossover, Candlestick Patterns)
- `IndicatorSummaryCount` — bullish/bearish/neutral counts with overall bias
- `ValidationData` — ProIndicator validation results
- `OverallBias` — `'bullish' | 'bearish' | 'neutral'`
- `IndicatorInterval` — `'15m' | '1h' | '4h' | '1d'`

### Design System

- **Theme**: Dark mode default (`#121212` background, `#1E1E1E` surface)
- **Primary color**: `#4ADE80` (green)
- **Glass effect**: `.glass-card` class for frosted glass cards
- **Fonts**: JetBrains Mono for numbers/code, Noto Sans Thai for text
- **Indicator colors**: Bullish=green, Bearish=red, Neutral=grey
- **Multi-TF display**: All 4 timeframes (15m, 1h, 4h, 1d) shown simultaneously

## Configuration

### Runtime Config

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:9001   # Backend API base URL
```

### Nuxt Config Highlights

- `compatibilityDate: '2025-07-15'`
- Vuetify module with dark/light theme presets
- MDI icons as default icon set
- Google Fonts: JetBrains Mono + Noto Sans Thai

## Document Responsibility

| Agent | Doc | When |
|-------|-----|------|
| **Cappu** | This `CLAUDE.md`, Component docs | New pages, new components |
| **Cappu** | `docs/FEATURES.md` (frontend sections) | Every feature/fix commit |
| **Cappu** | `docs/CHANGELOG.md` (frontend entries) | Every commit |

### Checklist before Commit

- [ ] Code done
- [ ] No TypeScript errors (`npx nuxi typecheck` or check browser console)
- [ ] Update `docs/FEATURES.md` in backend repo (if new feature/fix)
- [ ] Commit + Push
