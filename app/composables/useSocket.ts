import { ref, readonly } from 'vue'
import { io, type Socket } from 'socket.io-client'
import type { AnalysisData, SignalData } from '../../types/trading'

/**
 * Composable สำหรับ WebSocket connection ผ่าน socket.io-client
 *
 * Features:
 * - Auto-connect เมื่อเรียก connect()
 * - subscribe / unsubscribe symbol channels
 * - Listen events: signal:loading, analysis:full, signal:new
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

// ============================================================
// Event callback types
// ============================================================

type SignalLoadingCallback = (data: SignalLoadingPayload) => void
type AnalysisFullCallback = (data: AnalysisFullPayload) => void
type SignalNewCallback = (data: SignalNewPayload) => void

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
      console.log('[WS] Connected:', socket?.id)

      // Re-subscribe to previously subscribed symbols
      for (const symbolId of subscribedSymbols.value) {
        socket?.emit('subscribe:symbol', { symbolId })
      }
    })

    socket.on('disconnect', (reason) => {
      isConnected.value = false
      console.log('[WS] Disconnected:', reason)
    })

    socket.on('connect_error', (err) => {
      isConnected.value = false
      connectionError.value = err.message
      console.error('[WS] Connection error:', err.message)
    })

    // ── Business events ──

    socket.on('signal:loading', (data: SignalLoadingPayload) => {
      console.log('[WS] signal:loading', data.symbolId)
      signalLoadingListeners.forEach(cb => cb(data))
    })

    socket.on('analysis:full', (data: AnalysisFullPayload) => {
      console.log('[WS] analysis:full', data.success)
      analysisFullListeners.forEach(cb => cb(data))
    })

    socket.on('signal:new', (data: SignalNewPayload) => {
      console.log('[WS] signal:new', data.symbolId)
      signalNewListeners.forEach(cb => cb(data))
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
      console.log('[WS] Manually disconnected')
    }
  }

  /**
   * Subscribe to a symbol's channel
   */
  function subscribeSymbol(symbolId: number) {
    subscribedSymbols.value.add(symbolId)
    if (socket?.connected) {
      socket.emit('subscribe:symbol', { symbolId })
      console.log('[WS] Subscribed to symbol:', symbolId)
    }
  }

  /**
   * Unsubscribe from a symbol's channel
   */
  function unsubscribeSymbol(symbolId: number) {
    subscribedSymbols.value.delete(symbolId)
    if (socket?.connected) {
      socket.emit('unsubscribe:symbol', { symbolId })
      console.log('[WS] Unsubscribed from symbol:', symbolId)
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
  }
}
