/**
 * Kumo Cloud Custom Series Plugin for Lightweight Charts v5
 *
 * Renders the filled area between Ichimoku Span A and Span B (the "Kumo" / cloud).
 * - Bullish cloud (Span A > Span B): green fill
 * - Bearish cloud (Span B > Span A): red fill
 * - Crossover points: linear interpolation for smooth color transition
 *
 * Uses ICustomSeriesPaneView + ICustomSeriesPaneRenderer from LWC v5 API.
 * Ref: https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series
 */
import type {
  CustomSeriesPricePlotValues,
  ICustomSeriesPaneView,
  ICustomSeriesPaneRenderer,
  PaneRendererCustomData,
  CustomData,
  CustomSeriesOptions,
  Time,
  PriceToCoordinateConverter,
} from 'lightweight-charts'
import type { CanvasRenderingTarget2D } from 'fancy-canvas'

// ============================================================
// Data Shape
// ============================================================

/**
 * Each data point contains both Span A and Span B values at a given time.
 * The renderer draws filled trapezoids between consecutive points.
 */
export interface KumoCloudData extends CustomData {
  spanA: number
  spanB: number
}

// ============================================================
// Colors (Espresso-approved design specs)
// ============================================================

/** Bullish cloud: Span A > Span B — uses candle-up green tone */
const BULLISH_COLOR = 'rgba(76, 175, 80, 0.12)'
/** Bearish cloud: Span B > Span A — uses red tone */
const BEARISH_COLOR = 'rgba(239, 83, 80, 0.12)'

// ============================================================
// Renderer
// ============================================================

class KumoCloudRenderer implements ICustomSeriesPaneRenderer {
  private _data: PaneRendererCustomData<Time, KumoCloudData> | null = null
  private _priceConverter: PriceToCoordinateConverter | null = null

  update(data: PaneRendererCustomData<Time, KumoCloudData>): void {
    this._data = data
  }

  setPriceConverter(converter: PriceToCoordinateConverter): void {
    this._priceConverter = converter
  }

  draw(target: CanvasRenderingTarget2D, priceConverter: PriceToCoordinateConverter): void {
    // Use the priceConverter passed by LWC (most up-to-date)
    const converter = priceConverter || this._priceConverter
    if (!converter) return

    target.useBitmapCoordinateSpace((scope) => {
      if (!this._data || !this._data.visibleRange) return

      const { context: ctx, horizontalPixelRatio, verticalPixelRatio } = scope
      const bars = this._data.bars
      const { from, to } = this._data.visibleRange!

      // Need at least 2 visible bars to draw trapezoids
      if (to - from < 2) return

      for (let i = from; i < to - 1; i++) {
        const cur = bars[i]!
        const next = bars[i + 1]!

        const curData = cur.originalData
        const nextData = next.originalData

        // Skip whitespace data points
        if (curData.spanA === undefined || curData.spanB === undefined) continue
        if (nextData.spanA === undefined || nextData.spanB === undefined) continue

        // Convert price values to Y pixel coordinates via LWC's price converter
        const curSpanAY = converter(curData.spanA)
        const curSpanBY = converter(curData.spanB)
        const nextSpanAY = converter(nextData.spanA)
        const nextSpanBY = converter(nextData.spanB)

        // Skip if any coordinate is off-screen (null)
        if (curSpanAY === null || curSpanBY === null || nextSpanAY === null || nextSpanBY === null) continue

        const x1 = cur.x * horizontalPixelRatio
        const x2 = next.x * horizontalPixelRatio
        const y1A = curSpanAY * verticalPixelRatio
        const y1B = curSpanBY * verticalPixelRatio
        const y2A = nextSpanAY * verticalPixelRatio
        const y2B = nextSpanBY * verticalPixelRatio

        const curBullish = curData.spanA >= curData.spanB
        const nextBullish = nextData.spanA >= nextData.spanB

        if (curBullish === nextBullish) {
          // Same direction: single filled trapezoid
          ctx.fillStyle = curBullish ? BULLISH_COLOR : BEARISH_COLOR
          ctx.beginPath()
          ctx.moveTo(x1, y1A)
          ctx.lineTo(x2, y2A)
          ctx.lineTo(x2, y2B)
          ctx.lineTo(x1, y1B)
          ctx.closePath()
          ctx.fill()
        } else {
          // Crossover: split into 2 triangles at the intersection point
          // Linear interpolation to find where spanA and spanB cross
          const diffCur = curData.spanA - curData.spanB
          const diffNext = nextData.spanA - nextData.spanB
          const t = diffCur / (diffCur - diffNext)

          const crossX = x1 + t * (x2 - x1)
          const crossPrice = curData.spanA + t * (nextData.spanA - curData.spanA)
          const crossYRaw = converter(crossPrice)
          if (crossYRaw === null) continue
          const crossY = crossYRaw * verticalPixelRatio

          // First half (cur side)
          ctx.fillStyle = curBullish ? BULLISH_COLOR : BEARISH_COLOR
          ctx.beginPath()
          ctx.moveTo(x1, y1A)
          ctx.lineTo(crossX, crossY)
          ctx.lineTo(x1, y1B)
          ctx.closePath()
          ctx.fill()

          // Second half (next side)
          ctx.fillStyle = nextBullish ? BULLISH_COLOR : BEARISH_COLOR
          ctx.beginPath()
          ctx.moveTo(crossX, crossY)
          ctx.lineTo(x2, y2A)
          ctx.lineTo(x2, y2B)
          ctx.closePath()
          ctx.fill()
        }
      }
    })
  }
}

// ============================================================
// Pane View (entry point for LWC custom series)
// ============================================================

export class KumoCloudPaneView implements ICustomSeriesPaneView<Time, KumoCloudData, CustomSeriesOptions> {
  private _renderer = new KumoCloudRenderer()

  /**
   * Returns price values for auto-scaling.
   * LWC uses these to determine the visible price range.
   */
  priceValueBuilder(plotRow: KumoCloudData): CustomSeriesPricePlotValues {
    return [
      Math.min(plotRow.spanA, plotRow.spanB),
      Math.max(plotRow.spanA, plotRow.spanB),
    ]
  }

  /**
   * Check if data point is whitespace (no actual data)
   */
  isWhitespace(data: KumoCloudData): boolean {
    return data.spanA === undefined || data.spanB === undefined
  }

  /**
   * Returns the renderer instance
   */
  renderer(): ICustomSeriesPaneRenderer {
    return this._renderer
  }

  /**
   * Called by LWC with latest data before each paint
   */
  update(data: PaneRendererCustomData<Time, KumoCloudData>, _seriesOptions: CustomSeriesOptions): void {
    this._renderer.update(data)
  }

  /**
   * Default options for this custom series
   */
  defaultOptions(): CustomSeriesOptions {
    return {} as CustomSeriesOptions
  }
}
