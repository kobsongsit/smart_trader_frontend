/**
 * Centralized Date/Time Utilities
 *
 * ใช้ dayjs แทน native Date เพื่อ:
 * - Consistent timezone handling (UTC → Browser local TZ)
 * - Smaller bundle size (2KB vs moment.js 300KB)
 * - Immutable API (ไม่เปลี่ยน original object)
 *
 * Convention:
 * - Backend ส่ง datetime เป็น ISO 8601 UTC (e.g. "2026-03-07T22:00:00Z")
 * - หรือ Unix timestamp (seconds) สำหรับ chart data
 * - Frontend ใช้ dayjs แปลงเป็น browser timezone อัตโนมัติ
 */

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import relativeTime from 'dayjs/plugin/relativeTime'

// Register plugins
dayjs.extend(utc)
dayjs.extend(relativeTime)

/**
 * Format ISO date string → Thai-style short date
 * e.g. "2026-03-07T22:00:00Z" → "08 มี.ค. 05:00" (in Asia/Bangkok)
 *
 * Uses browser's Intl API for Thai locale formatting
 * dayjs automatically converts UTC → browser local timezone
 */
export function formatThaiDate(dateStr: string): string {
  const d = dayjs(dateStr)
  if (!d.isValid()) return 'N/A'

  // Use Intl for Thai locale (dayjs locale is English by default)
  return d.toDate().toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format ISO date string → relative time
 * e.g. "2026-03-08T10:00:00Z" → "5m ago" / "2h ago" / "08/03/2026"
 *
 * - < 1 min → "Just now"
 * - < 60 min → "Xm ago"
 * - < 24 hours → "Xh ago"
 * - >= 24 hours → Thai locale date string
 */
export function formatTimeAgo(timestamp: string): string {
  const d = dayjs(timestamp)
  if (!d.isValid()) return 'N/A'

  const now = dayjs()
  const diffMins = now.diff(d, 'minute')

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return d.toDate().toLocaleDateString('th-TH')
}

/**
 * Format Unix timestamp (seconds) → local time string for chart tooltip
 * e.g. 1741388400 → "08/03/2026 05:00" (in Asia/Bangkok)
 */
export function formatChartTime(unixSeconds: number): string {
  return dayjs.unix(unixSeconds).format('DD/MM/YYYY HH:mm')
}

/**
 * Format Unix timestamp (seconds) → short time for chart time axis
 * e.g. 1741388400 → "05:00" or "08 Mar" depending on context
 */
export function formatChartTickMark(unixSeconds: number, tickMarkType: number): string {
  const d = dayjs.unix(unixSeconds)

  // tickMarkType from TradingView Lightweight Charts:
  // 0 = Year, 1 = Month, 2 = DayOfMonth, 3 = Time, 4 = TimeWithSeconds
  switch (tickMarkType) {
    case 0: // Year
      return d.format('YYYY')
    case 1: // Month
      return d.format('MMM YYYY')
    case 2: // Day of month
      return d.format('DD MMM')
    case 3: // Time
      return d.format('HH:mm')
    case 4: // Time with seconds
      return d.format('HH:mm:ss')
    default:
      return d.format('DD/MM HH:mm')
  }
}

/**
 * Format ISO date string → short local time (HH:mm)
 * e.g. "2026-03-08T22:00:00Z" → "05:00" (in Asia/Bangkok +7)
 */
export function formatShortTime(dateStr: string): string {
  const d = dayjs(dateStr)
  if (!d.isValid()) return '--:--'
  return d.format('HH:mm')
}

// Re-export dayjs for advanced usage
export { dayjs }
