import { ref, readonly } from 'vue'
import { io, type Socket } from 'socket.io-client'
import type { AnalysisData, SignalData, PriceUpdatePayload } from '../../types/trading'

/**
 * Composable สำหรับ WebSocket connection ผ่าน socket.io-client
 *
 * Features:
 * - Auto-connect เมื่อเรียก connect()
 * - subscribe / unsubscribe symbol channels
 * - Listen events: signal:loading, analysis:full, signal:new,
 *   price:update, indicators:update, trends:update, readiness:update, candle:update
 * - Reconnection handling
 * - Expose connection status
 *
 * ⚠️ Shared singleton — ทุก component ที่เรียก useSocket() จะใช้ socket เดียวกัน
 */

// ============================================================
// Types for WebSocket event payloads
// ============================================================

export interface SignalLoadingPayload {
  symbolId: number
  status: 'loading'
  message: string
  timestamp: string
}

export interface AnalysisFullPayload {
  success: boolean
  data: AnalysisData
}

export interface SignalNewPayload {
  symbolId: number
  signal: SignalData
  timestamp: string
}

/** Notification-style payload — backend tells us "something changed", frontend re-fetches */
export interface CandleUpdatePayload {
  symbolId: number
  intervals: string[]
  timestamp: string
}

export interface IndicatorsUpdatePayload {
  symbolId: number
  intervals: string[]
  timestamp: string
}

export interface TrendsUpdatePayload {
  symbolId: number
  intervals: string[]
  timestamp: string
}

/** Inline-style payload — backend sends actual data, frontend updates cache directly */
export interface ReadinessUpdatePayload {
  symbolId: number
  readiness: {
    directionScore: number | null
    entryTimingScore: number | null
    direction: string | null
    finalAction: string
    marketCondition: string
  }
  timestamp: string
}

// ============================================================
// Event callback types
// ============================================================

type SignalLoadingCallback = (data: SignalLoadingPayload) => void
type AnalysisFullCallback = (data: AnalysisFullPayload) => void
type SignalNewCallback = (data: SignalNewPayload) => void
type PriceUpdateCallback = (data: PriceUpdatePayload) => void
type CandleUpdateCallback = (data: CandleUpdatePayload) => void
type IndicatorsUpdateCallback = (data: IndicatorsUpdatePayload) => void
type TrendsUpdateCallback = (data: TrendsUpdatePayload) => void
type ReadinessUpdateCallback = (data: ReadinessUpdatePayload) => void

// ============================================================
// Shared state (module-level singleton)
// ============================================================

let socket: Socket | null = null
const isConnected = ref(false)
const connectionError = ref<string | null>(null)
const subscribedSymbols = ref<Set<number>>(new Set())

// Event listener registries
const signalLoadingListeners: Set<SignalLoadingCallback> = new Set()
const analysisFullListeners: Set<AnalysisFullCallback> = new Set()
const signalNewListeners: Set<SignalNewCallback> = new Set()
const priceUpdateListeners: Set<PriceUpdateCallback> = new Set()
const candleUpdateListeners: Set<CandleUpdateCallback> = new Set()
const indicatorsUpdateListeners: Set<IndicatorsUpdateCallback> = new Set()
const trendsUpdateListeners: Set<TrendsUpdateCallback> = new Set()
const readinessUpdateListeners: Set<ReadinessUpdateCallback> = new Set()

export function useSocket() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  /**
   * Connect to WebSocket server
   */
  function connect() {
    // Already connected or connecting
    if (socket?.connected) return

    // Clean up existing socket if any
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
    }

    socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    })

    // ── Connection lifecycle ──
    socket.on('connect', () => {
      isConnected.value = true
      connectionError.value = null

      // Re-subscribe to previously subscribed symbols
      for (const symbolId of subscribedSymbols.value) {
        socket?.emit('subscribe:symbol', { symbolId })
      }
    })

    socket.on('disconnect', (reason) => {
      isConnected.value = false
    })

    socket.on('connect_error', (err) => {
      isConnected.value = false
      connectionError.value = err.message
    })

    // ── Business events ──

    socket.on('signal:loading', (data: SignalLoadingPayload) => {
      signalLoadingListeners.forEach(cb => cb(data))
    })

    socket.on('analysis:full', (data: AnalysisFullPayload) => {
      analysisFullListeners.forEach(cb => cb(data))
    })

    socket.on('signal:new', (data: SignalNewPayload) => {
      signalNewListeners.forEach(cb => cb(data))
    })

    socket.on('price:update', (data: PriceUpdatePayload) => {
      priceUpdateListeners.forEach(cb => cb(data))
    })

    socket.on('candle:update', (data: CandleUpdatePayload) => {
      candleUpdateListeners.forEach(cb => cb(data))
    })

    socket.on('indicators:update', (data: IndicatorsUpdatePayload) => {
      indicatorsUpdateListeners.forEach(cb => cb(data))
    })

    socket.on('trends:update', (data: TrendsUpdatePayload) => {
      trendsUpdateListeners.forEach(cb => cb(data))
    })

    socket.on('readiness:update', (data: ReadinessUpdatePayload) => {
      readinessUpdateListeners.forEach(cb => cb(data))
    })
  }

  /**
   * Disconnect from WebSocket server
   */
  function disconnect() {
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
      socket = null
      isConnected.value = false
      subscribedSymbols.value.clear()
    }
  }

  /**
   * Subscribe to a symbol's channel
   */
  function subscribeSymbol(symbolId: number) {
    subscribedSymbols.value.add(symbolId)
    if (socket?.connected) {
      socket.emit('subscribe:symbol', { symbolId })
    }
  }

  /**
   * Unsubscribe from a symbol's channel
   */
  function unsubscribeSymbol(symbolId: number) {
    subscribedSymbols.value.delete(symbolId)
    if (socket?.connected) {
      socket.emit('unsubscribe:symbol', { symbolId })
    }
  }

  /**
   * Register event listeners (returns cleanup function)
   */
  function onSignalLoading(callback: SignalLoadingCallback): () => void {
    signalLoadingListeners.add(callback)
    return () => signalLoadingListeners.delete(callback)
  }

  function onAnalysisFull(callback: AnalysisFullCallback): () => void {
    analysisFullListeners.add(callback)
    return () => analysisFullListeners.delete(callback)
  }

  function onSignalNew(callback: SignalNewCallback): () => void {
    signalNewListeners.add(callback)
    return () => signalNewListeners.delete(callback)
  }

  function onPriceUpdate(callback: PriceUpdateCallback): () => void {
    priceUpdateListeners.add(callback)
    return () => priceUpdateListeners.delete(callback)
  }

  function onCandleUpdate(callback: CandleUpdateCallback): () => void {
    candleUpdateListeners.add(callback)
    return () => candleUpdateListeners.delete(callback)
  }

  function onIndicatorsUpdate(callback: IndicatorsUpdateCallback): () => void {
    indicatorsUpdateListeners.add(callback)
    return () => indicatorsUpdateListeners.delete(callback)
  }

  function onTrendsUpdate(callback: TrendsUpdateCallback): () => void {
    trendsUpdateListeners.add(callback)
    return () => trendsUpdateListeners.delete(callback)
  }

  function onReadinessUpdate(callback: ReadinessUpdateCallback): () => void {
    readinessUpdateListeners.add(callback)
    return () => readinessUpdateListeners.delete(callback)
  }

  return {
    // State
    isConnected: readonly(isConnected),
    connectionError: readonly(connectionError),
    subscribedSymbols: readonly(subscribedSymbols),

    // Actions
    connect,
    disconnect,
    subscribeSymbol,
    unsubscribeSymbol,

    // Event listeners
    onSignalLoading,
    onAnalysisFull,
    onSignalNew,
    onPriceUpdate,
    onCandleUpdate,
    onIndicatorsUpdate,
    onTrendsUpdate,
    onReadinessUpdate,
  }
}
