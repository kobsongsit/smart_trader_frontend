/**
 * Unit tests for useSocket composable
 *
 * Tests: connect/disconnect, subscribe/unsubscribe, event listeners, cleanup, singleton state
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock socket.io-client
const mockSocket = {
  connected: false,
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  removeAllListeners: vi.fn(),
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

// We need to reset module state between tests
let useSocket: typeof import('../../../app/composables/useSocket').useSocket

beforeEach(async () => {
  vi.resetModules()
  mockSocket.connected = false
  mockSocket.on.mockReset()
  mockSocket.emit.mockReset()
  mockSocket.disconnect.mockReset()
  mockSocket.removeAllListeners.mockReset()

  const mod = await import('../../../app/composables/useSocket')
  useSocket = mod.useSocket
})

describe('useSocket', () => {
  describe('initial state', () => {
    it('should start disconnected with no errors', () => {
      const { isConnected, connectionError, subscribedSymbols } = useSocket()
      expect(isConnected.value).toBe(false)
      expect(connectionError.value).toBeNull()
      expect(subscribedSymbols.value.size).toBe(0)
    })
  })

  describe('connect', () => {
    it('should create socket connection via io()', async () => {
      const { io } = await import('socket.io-client')
      const { connect } = useSocket()
      connect()
      expect(io).toHaveBeenCalledWith('http://localhost:9001', expect.objectContaining({
        transports: ['websocket', 'polling'],
        reconnection: true,
      }))
    })

    it('should register lifecycle event listeners on connect', () => {
      const { connect } = useSocket()
      connect()
      const eventNames = mockSocket.on.mock.calls.map((c: any[]) => c[0])
      expect(eventNames).toContain('connect')
      expect(eventNames).toContain('disconnect')
      expect(eventNames).toContain('connect_error')
    })

    it('should register business event listeners on connect', () => {
      const { connect } = useSocket()
      connect()
      const eventNames = mockSocket.on.mock.calls.map((c: any[]) => c[0])
      expect(eventNames).toContain('signal:loading')
      expect(eventNames).toContain('analysis:full')
      expect(eventNames).toContain('signal:new')
      expect(eventNames).toContain('price:update')
      expect(eventNames).toContain('candle:update')
      expect(eventNames).toContain('indicators:update')
      expect(eventNames).toContain('trends:update')
      expect(eventNames).toContain('readiness:update')
    })

    it('should set isConnected to true when socket emits connect', () => {
      const { connect, isConnected } = useSocket()
      connect()
      const connectHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'connect')[1]
      connectHandler()
      expect(isConnected.value).toBe(true)
    })

    it('should set isConnected to false on disconnect event', () => {
      const { connect, isConnected } = useSocket()
      connect()
      // Simulate connect first
      const connectHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'connect')[1]
      connectHandler()
      expect(isConnected.value).toBe(true)

      // Then disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'disconnect')[1]
      disconnectHandler('io server disconnect')
      expect(isConnected.value).toBe(false)
    })

    it('should set connectionError on connect_error event', () => {
      const { connect, connectionError } = useSocket()
      connect()
      const errorHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'connect_error')[1]
      errorHandler(new Error('Connection refused'))
      expect(connectionError.value).toBe('Connection refused')
    })

    it('should skip connect if already connected', () => {
      const { connect } = useSocket()
      mockSocket.connected = true
      // Manually set socket reference by connecting first with disconnected state
      mockSocket.connected = false
      connect()
      const firstCallCount = mockSocket.on.mock.calls.length

      // Now pretend it's connected
      mockSocket.connected = true
      connect()
      // Should NOT have registered more listeners
      expect(mockSocket.on.mock.calls.length).toBe(firstCallCount)
    })

    it('should re-subscribe existing symbols on reconnect', () => {
      const { connect, subscribeSymbol } = useSocket()
      connect()

      // Subscribe a symbol while "connected"
      mockSocket.connected = true
      subscribeSymbol(1)
      subscribeSymbol(2)

      // Simulate reconnect
      const connectHandler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'connect')[1]
      connectHandler()

      // Should emit subscribe for both symbols on reconnect
      const subscribeCalls = mockSocket.emit.mock.calls.filter((c: any[]) => c[0] === 'subscribe:symbol')
      // 2 from initial subscribe + 2 from reconnect
      expect(subscribeCalls.length).toBe(4)
    })
  })

  describe('disconnect', () => {
    it('should clean up socket on disconnect', () => {
      const { connect, disconnect, isConnected, subscribedSymbols } = useSocket()
      connect()
      // Subscribe a symbol
      mockSocket.connected = true
      const sock = useSocket()
      sock.subscribeSymbol(5)

      disconnect()
      expect(mockSocket.removeAllListeners).toHaveBeenCalled()
      expect(mockSocket.disconnect).toHaveBeenCalled()
      expect(isConnected.value).toBe(false)
      expect(subscribedSymbols.value.size).toBe(0)
    })

    it('should be safe to call disconnect without prior connect', () => {
      const { disconnect } = useSocket()
      expect(() => disconnect()).not.toThrow()
    })
  })

  describe('subscribeSymbol', () => {
    it('should add symbolId to subscribedSymbols set', () => {
      const { subscribeSymbol, subscribedSymbols } = useSocket()
      subscribeSymbol(42)
      expect(subscribedSymbols.value.has(42)).toBe(true)
    })

    it('should emit subscribe:symbol when connected', () => {
      const { connect, subscribeSymbol } = useSocket()
      connect()
      mockSocket.connected = true
      subscribeSymbol(42)
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe:symbol', { symbolId: 42 })
    })

    it('should NOT emit when not connected (but still track)', () => {
      const { subscribeSymbol, subscribedSymbols } = useSocket()
      subscribeSymbol(42)
      expect(subscribedSymbols.value.has(42)).toBe(true)
      expect(mockSocket.emit).not.toHaveBeenCalled()
    })
  })

  describe('unsubscribeSymbol', () => {
    it('should remove symbolId from subscribedSymbols', () => {
      const { subscribeSymbol, unsubscribeSymbol, subscribedSymbols } = useSocket()
      subscribeSymbol(42)
      unsubscribeSymbol(42)
      expect(subscribedSymbols.value.has(42)).toBe(false)
    })

    it('should emit unsubscribe:symbol when connected', () => {
      const { connect, subscribeSymbol, unsubscribeSymbol } = useSocket()
      connect()
      mockSocket.connected = true
      subscribeSymbol(42)
      unsubscribeSymbol(42)
      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribe:symbol', { symbolId: 42 })
    })
  })

  describe('event listeners', () => {
    it('should register and fire signalLoading callback', () => {
      const { connect, onSignalLoading } = useSocket()
      const callback = vi.fn()
      onSignalLoading(callback)
      connect()

      // Find the socket handler for signal:loading and fire it
      const handler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'signal:loading')[1]
      const payload = { symbolId: 1, status: 'loading' as const, message: 'test', timestamp: '2024-01-01' }
      handler(payload)
      expect(callback).toHaveBeenCalledWith(payload)
    })

    it('should return cleanup function that removes listener', () => {
      const { connect, onSignalLoading } = useSocket()
      const callback = vi.fn()
      const cleanup = onSignalLoading(callback)
      connect()

      cleanup()

      const handler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'signal:loading')[1]
      handler({ symbolId: 1, status: 'loading', message: 'test', timestamp: '2024-01-01' })
      expect(callback).not.toHaveBeenCalled()
    })

    it('should support multiple listeners for same event', () => {
      const { connect, onPriceUpdate } = useSocket()
      const cb1 = vi.fn()
      const cb2 = vi.fn()
      onPriceUpdate(cb1)
      onPriceUpdate(cb2)
      connect()

      const handler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'price:update')[1]
      const payload = { symbol: 'BTC', price: 50000, volume: 100, timestamp: '2024-01-01', source: 'finnhub-ws' as const }
      handler(payload)
      expect(cb1).toHaveBeenCalledWith(payload)
      expect(cb2).toHaveBeenCalledWith(payload)
    })

    it('onAnalysisFull should register and fire callback', () => {
      const { connect, onAnalysisFull } = useSocket()
      const callback = vi.fn()
      onAnalysisFull(callback)
      connect()

      const handler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'analysis:full')[1]
      const payload = { success: true, data: {} }
      handler(payload)
      expect(callback).toHaveBeenCalledWith(payload)
    })

    it('onSignalNew should register and fire callback', () => {
      const { connect, onSignalNew } = useSocket()
      const callback = vi.fn()
      onSignalNew(callback)
      connect()

      const handler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'signal:new')[1]
      const payload = { symbolId: 1, signal: {}, timestamp: '2024-01-01' }
      handler(payload)
      expect(callback).toHaveBeenCalledWith(payload)
    })

    it('onCandleUpdate should register and fire callback', () => {
      const { connect, onCandleUpdate } = useSocket()
      const callback = vi.fn()
      onCandleUpdate(callback)
      connect()

      const handler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'candle:update')[1]
      const payload = { symbolId: 1, intervals: ['15m'], timestamp: '2024-01-01' }
      handler(payload)
      expect(callback).toHaveBeenCalledWith(payload)
    })

    it('onIndicatorsUpdate should register and fire callback', () => {
      const { connect, onIndicatorsUpdate } = useSocket()
      const callback = vi.fn()
      onIndicatorsUpdate(callback)
      connect()

      const handler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'indicators:update')[1]
      const payload = { symbolId: 1, intervals: ['15m'], timestamp: '2024-01-01' }
      handler(payload)
      expect(callback).toHaveBeenCalledWith(payload)
    })

    it('onTrendsUpdate should register and fire callback', () => {
      const { connect, onTrendsUpdate } = useSocket()
      const callback = vi.fn()
      onTrendsUpdate(callback)
      connect()

      const handler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'trends:update')[1]
      const payload = { symbolId: 1, intervals: ['1h'], timestamp: '2024-01-01' }
      handler(payload)
      expect(callback).toHaveBeenCalledWith(payload)
    })

    it('onReadinessUpdate should register and fire callback', () => {
      const { connect, onReadinessUpdate } = useSocket()
      const callback = vi.fn()
      onReadinessUpdate(callback)
      connect()

      const handler = mockSocket.on.mock.calls.find((c: any[]) => c[0] === 'readiness:update')[1]
      const payload = { symbolId: 1, readiness: {}, timestamp: '2024-01-01' }
      handler(payload)
      expect(callback).toHaveBeenCalledWith(payload)
    })
  })

  describe('singleton pattern', () => {
    it('should share state across multiple useSocket() calls', () => {
      const sock1 = useSocket()
      const sock2 = useSocket()
      sock1.subscribeSymbol(99)
      expect(sock2.subscribedSymbols.value.has(99)).toBe(true)
    })
  })
})
