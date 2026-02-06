import axios from 'axios'
import type { Signal, ApiResponse } from '../../types/trading'

/**
 * Request body สำหรับ analyze signal
 */
interface AnalyzeSignalRequest {
  symbolId: number
  includeNews?: boolean
}

/**
 * Composable สำหรับจัดการ AI Signals
 */
export function useSignals() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl

  // State
  const currentSignal = ref<Signal | null>(null)
  const signalHistory = ref<Signal[]>([])
  const isAnalyzing = ref(false)
  const isLoadingHistory = ref(false)
  const error = ref<string | null>(null)

  /**
   * วิเคราะห์ Signal ด้วย AI
   * POST /api/signals/analyze
   */
  async function analyzeSignal(symbolId: number, includeNews = false): Promise<Signal | null> {
    isAnalyzing.value = true
    error.value = null

    try {
      const url = `${baseUrl}/api/signals/analyze`
      const body: AnalyzeSignalRequest = {
        symbolId,
        includeNews
      }

      const { data: response } = await axios.post<ApiResponse<Signal>>(url, body)

      if (response.success) {
        currentSignal.value = response.data
        return response.data
      } else {
        throw new Error(response.error || 'Failed to analyze signal')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to analyze signal'
      error.value = errorMsg
      console.error('Error analyzing signal:', err)
      return null
    } finally {
      isAnalyzing.value = false
    }
  }

  /**
   * ดึงประวัติ Signal ของ symbol
   * GET /api/signals/:symbolId?limit=N
   */
  async function fetchSignalHistory(symbolId: number, limit = 10): Promise<Signal[]> {
    isLoadingHistory.value = true
    error.value = null

    try {
      const url = `${baseUrl}/api/signals/${symbolId}?limit=${limit}`
      const { data: response } = await axios.get<ApiResponse<Signal[]>>(url)

      if (response.success) {
        signalHistory.value = response.data
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch signal history')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch signal history'
      error.value = errorMsg
      console.error('Error fetching signal history:', err)
      return []
    } finally {
      isLoadingHistory.value = false
    }
  }

  /**
   * ดึง Signal ล่าสุดของ symbol
   * GET /api/signals/latest/:symbolId
   */
  async function fetchLatestSignal(symbolId: number): Promise<Signal | null> {
    error.value = null

    try {
      const url = `${baseUrl}/api/signals/latest/${symbolId}`
      const { data: response } = await axios.get<ApiResponse<Signal>>(url)

      if (response.success) {
        currentSignal.value = response.data
        return response.data
      } else {
        throw new Error(response.error || 'Failed to fetch latest signal')
      }
    } catch (err: any) {
      // ไม่ set error ถ้าไม่มี signal (404)
      if (err.response?.status !== 404) {
        const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch latest signal'
        error.value = errorMsg
        console.error('Error fetching latest signal:', err)
      }
      return null
    }
  }

  /**
   * Clear state
   */
  function clearSignal() {
    currentSignal.value = null
    signalHistory.value = []
    error.value = null
  }

  return {
    // State
    currentSignal: readonly(currentSignal),
    signalHistory: readonly(signalHistory),
    isAnalyzing: readonly(isAnalyzing),
    isLoadingHistory: readonly(isLoadingHistory),
    error: readonly(error),

    // Actions
    analyzeSignal,
    fetchSignalHistory,
    fetchLatestSignal,
    clearSignal
  }
}
