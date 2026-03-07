import { ref, readonly } from 'vue'
import axios from 'axios'
import type { ChartData, ChartTimeframe, ChartApiResponse, ChartCandle, ChartOverlays, ChartSignalMarker, ChartVolume } from '../../types/trading'

/**
 * Composable สำหรับ Chart Data API
 * เรียก GET /api/data/:symbolId/chart
 *
 * รองรับ Infinite Scroll — สะสม candle เก่าใน growing timeline cache
 * เมื่อ user scroll ซ้ายเกือบสุด → auto-fetch candle เก่ามา prepend
 *
 * ⚠️ Shared singleton — ทุก component ที่เรียก useChart() จะใช้ cache เดียวกัน
 */

// ============================================================
// Constants
// ============================================================

/** จำนวน candle สูงสุดต่อ TF ที่เก็บใน memory (V1 — ไม่ทำ bidirectional eviction) */
const MAX_CANDLES_PER_TF = 5000

// ============================================================
// Shared state (module-level singleton)
// ============================================================

const chartCache = ref<Map<string, ChartData>>(new Map())
const loadingCharts = ref<Set<string>>(new Set())
const chartErrors = ref<Map<string, string>>(new Map())

/** Growing timeline cache — สะสม candle ที่ fetch มาทั้งหมด (initial + older) */
const timelineCache = new Map<string, ChartCandle[]>()
const volumeCache = new Map<string, ChartVolume[]>()
const overlayCache = new Map<string, ChartOverlays>()
const signalCache = new Map<string, ChartSignalMarker[]>()

/** Track ว่าแต่ละ TF ยังมี data เก่ากว่าให้ fetch อีกไหม */
const hasMoreMap = new Map<string, boolean>()

/** Track ว่ากำลัง fetch older data อยู่หรือเปล่า (ป้องกัน concurrent fetch) */
const fetchingOlderSet = new Set<string>()

// ============================================================
// Helpers
// ============================================================

/**
 * Build cache key from symbolId + timeframe
 */
function cacheKey(symbolId: number, timeframe: ChartTimeframe): string {
  return `${symbolId}-${timeframe}`
}

/**
 * Deduplicate + merge ข้อมูลเก่า (older) เข้ากับข้อมูลที่มีอยู่ (existing) — by `time` field
 * ผลลัพธ์: [...uniqueOlder, ...existing] (เรียงตาม time)
 */
function mergeByTime<T extends { time: number }>(older: T[], existing: T[]): T[] {
  const existingTimes = new Set(existing.map(d => d.time))
  const uniqueOlder = older.filter(d => !existingTimes.has(d.time))
  return [...uniqueOlder, ...existing]
}

/**
 * Merge overlay arrays ทุก 6 lines (sma50, sma200, ema20, bbUpper, bbMiddle, bbLower)
 */
function mergeOverlays(older: ChartOverlays, existing: ChartOverlays): ChartOverlays {
  return {
    sma50: mergeByTime(older.sma50, existing.sma50),
    sma200: mergeByTime(older.sma200, existing.sma200),
    ema20: mergeByTime(older.ema20, existing.ema20),
    bbUpper: mergeByTime(older.bbUpper, existing.bbUpper),
    bbMiddle: mergeByTime(older.bbMiddle, existing.bbMiddle),
    bbLower: mergeByTime(older.bbLower, existing.bbLower),
    ichimokuConversion: mergeByTime(older.ichimokuConversion || [], existing.ichimokuConversion || []),
    ichimokuBase: mergeByTime(older.ichimokuBase || [], existing.ichimokuBase || []),
    ichimokuSpanA: mergeByTime(older.ichimokuSpanA || [], existing.ichimokuSpanA || []),
    ichimokuSpanB: mergeByTime(older.ichimokuSpanB || [], existing.ichimokuSpanB || []),
  }
}

/**
 * Build a complete ChartData from the accumulated caches
 */
function buildChartDataFromCache(key: string, symbol: string, timeframe: ChartTimeframe): ChartData {
  return {
    symbol,
    timeframe,
    candles: timelineCache.get(key) || [],
    volume: volumeCache.get(key) || [],
    overlays: overlayCache.get(key) || { sma50: [], sma200: [], ema20: [], bbUpper: [], bbMiddle: [], bbLower: [], ichimokuConversion: [], ichimokuBase: [], ichimokuSpanA: [], ichimokuSpanB: [] },
    signals: signalCache.get(key) || [],
  }
}

// ============================================================
// Composable
// ============================================================

export function useChart() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Check if chart is loading for specific symbol + timeframe
   */
  function isLoadingChart(symbolId: number, timeframe: ChartTimeframe): boolean {
    return loadingCharts.value.has(cacheKey(symbolId, timeframe))
  }

  /**
   * Check if currently fetching older data for a specific symbol + timeframe
   */
  function isFetchingOlder(symbolId: number, timeframe: ChartTimeframe): boolean {
    return fetchingOlderSet.has(cacheKey(symbolId, timeframe))
  }

  /**
   * Get cached chart data
   */
  function getCachedChart(symbolId: number, timeframe: ChartTimeframe): ChartData | undefined {
    return chartCache.value.get(cacheKey(symbolId, timeframe))
  }

  /**
   * Get error for specific chart
   */
  function getChartError(symbolId: number, timeframe: ChartTimeframe): string | undefined {
    return chartErrors.value.get(cacheKey(symbolId, timeframe))
  }

  /**
   * Check ว่ายังมี data เก่ากว่าให้ fetch อีกไหม
   */
  function getHasMore(symbolId: number, timeframe: ChartTimeframe): boolean {
    return hasMoreMap.get(cacheKey(symbolId, timeframe)) ?? true
  }

  /**
   * Fetch chart data from API (initial load)
   * GET /api/data/:symbolId/chart?timeframe=1H&limit=200&includeOverlays=true&includeSignals=true&includeVolume=true
   *
   * เมื่อ fetch สำเร็จ จะ seed ลง timeline cache ด้วย
   */
  async function fetchChartData(
    symbolId: number,
    options?: {
      timeframe?: ChartTimeframe
      limit?: number
      includeOverlays?: boolean
      includeSignals?: boolean
      includeVolume?: boolean
      forceRefresh?: boolean
    }
  ): Promise<ChartData | null> {
    const {
      timeframe = '1H',
      limit = 200,
      includeOverlays = true,
      includeSignals = true,
      includeVolume = true,
      forceRefresh = false,
    } = options || {}

    const key = cacheKey(symbolId, timeframe)

    // Return cached if available and not forcing refresh
    if (!forceRefresh && chartCache.value.has(key)) {
      return chartCache.value.get(key) || null
    }

    // Skip if already loading
    if (loadingCharts.value.has(key)) {
      return null
    }

    // Mark as loading
    loadingCharts.value.add(key)
    chartErrors.value.delete(key)

    try {
      const params = new URLSearchParams({
        timeframe,
        limit: String(limit),
        includeOverlays: String(includeOverlays),
        includeSignals: String(includeSignals),
        includeVolume: String(includeVolume),
      })

      const url = `${baseUrl}/api/data/${symbolId}/chart?${params.toString()}`
      const { data: response } = await axios.get<ChartApiResponse>(url)

      if (response.success) {
        const chartData = response.data

        // Seed timeline cache (initial load — replace ไม่ใช่ merge)
        timelineCache.set(key, [...chartData.candles])
        volumeCache.set(key, [...chartData.volume])
        overlayCache.set(key, {
          sma50: [...(chartData.overlays?.sma50 || [])],
          sma200: [...(chartData.overlays?.sma200 || [])],
          ema20: [...(chartData.overlays?.ema20 || [])],
          bbUpper: [...(chartData.overlays?.bbUpper || [])],
          bbMiddle: [...(chartData.overlays?.bbMiddle || [])],
          bbLower: [...(chartData.overlays?.bbLower || [])],
          ichimokuConversion: [...(chartData.overlays?.ichimokuConversion || [])],
          ichimokuBase: [...(chartData.overlays?.ichimokuBase || [])],
          ichimokuSpanA: [...(chartData.overlays?.ichimokuSpanA || [])],
          ichimokuSpanB: [...(chartData.overlays?.ichimokuSpanB || [])],
        })
        signalCache.set(key, [...(chartData.signals || [])])

        // Track hasMore from meta (default true ถ้า backend ยังไม่ส่งมา)
        hasMoreMap.set(key, response.meta?.hasMore ?? true)

        chartCache.value.set(key, chartData)
        return chartData
      } else {
        throw new Error('Failed to fetch chart data')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch chart data'
      chartErrors.value.set(key, errorMsg)
      // error silently
      return null
    } finally {
      loadingCharts.value.delete(key)
    }
  }

  /**
   * Fetch older chart data for infinite scroll
   *
   * - หา oldest candle จาก timeline cache
   * - เรียก API ด้วย `before=oldestTime`
   * - Deduplicate + Prepend ทั้ง candles, volume, overlays, signals
   * - Update hasMore flag
   * - Return merged ChartData
   *
   * @returns { data: ChartData | null, addedCount: number } — addedCount คือจำนวน candle ใหม่ที่เพิ่มมา (ใช้ restore scroll position)
   */
  async function fetchOlderChartData(
    symbolId: number,
    timeframe: ChartTimeframe,
    options?: {
      limit?: number
    }
  ): Promise<{ data: ChartData | null; addedCount: number }> {
    const key = cacheKey(symbolId, timeframe)
    const { limit = 200 } = options || {}

    // Guard: ถ้ากำลัง fetch อยู่แล้ว หรือไม่มี data เก่ากว่าแล้ว → skip
    if (fetchingOlderSet.has(key) || !getHasMore(symbolId, timeframe)) {
      return { data: null, addedCount: 0 }
    }

    // Guard: ถ้าสะสมเกิน memory cap → หยุด fetch
    const existingCandles = timelineCache.get(key)
    if (!existingCandles || existingCandles.length === 0) {
      return { data: null, addedCount: 0 }
    }
    if (existingCandles.length >= MAX_CANDLES_PER_TF) {
      hasMoreMap.set(key, false)
      return { data: null, addedCount: 0 }
    }

    // หา oldest timestamp
    const oldestTime = existingCandles[0]!.time

    fetchingOlderSet.add(key)

    try {
      const params = new URLSearchParams({
        timeframe,
        limit: String(limit),
        before: String(oldestTime),
        includeOverlays: 'true',
        includeSignals: 'true',
        includeVolume: 'true',
      })

      const url = `${baseUrl}/api/data/${symbolId}/chart?${params.toString()}`
      const { data: response } = await axios.get<ChartApiResponse>(url)

      if (!response.success) {
        return { data: null, addedCount: 0 }
      }

      const olderData = response.data

      // Graceful degradation: ถ้า backend ส่ง data ชุดเดิมกลับมา (ยังไม่รองรับ before)
      // → deduplicate จะ filter ออกหมด → addedCount = 0 → หยุด fetch อัตโนมัติ

      // Merge candles
      const mergedCandles = mergeByTime(olderData.candles, existingCandles)
      const addedCount = mergedCandles.length - existingCandles.length

      // ถ้าไม่มี candle ใหม่เลย → set hasMore = false (ป้องกัน infinite loop)
      if (addedCount === 0) {
        hasMoreMap.set(key, false)
        return { data: null, addedCount: 0 }
      }

      // Merge volume
      const existingVolume = volumeCache.get(key) || []
      const mergedVolume = mergeByTime(olderData.volume, existingVolume)

      // Merge overlays (ทุก 6 lines)
      const existingOverlays = overlayCache.get(key) || { sma50: [], sma200: [], ema20: [], bbUpper: [], bbMiddle: [], bbLower: [], ichimokuConversion: [], ichimokuBase: [], ichimokuSpanA: [], ichimokuSpanB: [] }
      const mergedOverlays = olderData.overlays
        ? mergeOverlays(olderData.overlays, existingOverlays)
        : existingOverlays

      // Merge signals
      const existingSignals = signalCache.get(key) || []
      const mergedSignals = mergeByTime(olderData.signals || [], existingSignals)

      // Update caches
      timelineCache.set(key, mergedCandles)
      volumeCache.set(key, mergedVolume)
      overlayCache.set(key, mergedOverlays)
      signalCache.set(key, mergedSignals)

      // Update hasMore flag จาก API response (default true ถ้า backend ยังไม่ส่ง)
      hasMoreMap.set(key, response.meta?.hasMore ?? true)

      // Build merged ChartData
      const symbol = olderData.symbol || chartCache.value.get(key)?.symbol || ''
      const mergedChartData = buildChartDataFromCache(key, symbol, timeframe)

      // Update main cache
      chartCache.value.set(key, mergedChartData)

      return { data: mergedChartData, addedCount }
    } catch (err: any) {
      // Fail silently — ไม่ block user experience
      console.warn(`[useChart] Failed to fetch older data for ${key}:`, err.message)
      return { data: null, addedCount: 0 }
    } finally {
      fetchingOlderSet.delete(key)
    }
  }

  /**
   * Clear chart cache + timeline caches
   */
  function clearChartCache(symbolId?: number) {
    if (symbolId !== undefined) {
      // Clear all timeframes for this symbol
      for (const key of chartCache.value.keys()) {
        if (key.startsWith(`${symbolId}-`)) {
          chartCache.value.delete(key)
          chartErrors.value.delete(key)
          timelineCache.delete(key)
          volumeCache.delete(key)
          overlayCache.delete(key)
          signalCache.delete(key)
          hasMoreMap.delete(key)
        }
      }
    } else {
      chartCache.value.clear()
      chartErrors.value.clear()
      timelineCache.clear()
      volumeCache.clear()
      overlayCache.clear()
      signalCache.clear()
      hasMoreMap.clear()
    }
  }

  /**
   * Clear timeline cache เฉพาะ 1 timeframe (ใช้ตอนเปลี่ยน TF)
   */
  function clearTimelineForTf(symbolId: number, timeframe: ChartTimeframe) {
    const key = cacheKey(symbolId, timeframe)
    timelineCache.delete(key)
    volumeCache.delete(key)
    overlayCache.delete(key)
    signalCache.delete(key)
    hasMoreMap.delete(key)
    chartCache.value.delete(key)
  }

  return {
    // State
    chartCache: readonly(chartCache),

    // Actions
    fetchChartData,
    fetchOlderChartData,
    isLoadingChart,
    isFetchingOlder,
    getCachedChart,
    getChartError,
    getHasMore,
    clearChartCache,
    clearTimelineForTf,
  }
}
