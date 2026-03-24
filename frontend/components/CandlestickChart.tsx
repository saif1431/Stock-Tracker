"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  type BarProps,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { stockService } from "@/services/stockService"

interface Candlestick {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface CandleChartData extends Candlestick {
  x: number
  wickY1: number
  wickY2: number
  bodyY: number
  bodyHeight: number
  color: string
}

interface CandlestickChartProps {
  symbol: string
  days?: number
  showVolume?: boolean
}

interface CandleShapeProps {
  x: number
  y: number
  width: number
  height: number
  payload: CandleChartData
  yAxis?: {
    scale: (value: number) => number
  }
}

export function CandlestickChart({
  symbol,
  days = 30,
  showVolume = true,
}: CandlestickChartProps) {
  const [data, setData] = useState<CandleChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showVolumeChart, setShowVolumeChart] = useState(showVolume)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await stockService.getCandleData(symbol, days)

      // Transform for recharts
      const transformedData: CandleChartData[] = response.candlesticks.map(
        (candle: Candlestick, index: number) => {
          const color = candle.close >= candle.open ? "#10b981" : "#ef4444"
          return {
            ...candle,
            x: index,
            wickY1: candle.high,
            wickY2: candle.low,
            bodyY: Math.min(candle.open, candle.close),
            bodyHeight: Math.abs(candle.close - candle.open) || 0.5,
            color,
          }
        }
      )

      setData(transformedData)
    } catch (err) {
      setError(`Failed to load candlestick data: ${err}`)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [symbol, days])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Candlestick Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading candlestick data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Candlestick Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 p-4">{error}</div>
          <Button onClick={fetchData} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Candlestick Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No candlestick data available</p>
        </CardContent>
      </Card>
    )
  }

  const priceMin = Math.min(...data.map((d) => d.low))
  const priceMax = Math.max(...data.map((d) => d.high))
  const pricePadding = (priceMax - priceMin) * 0.05

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>{symbol} - Candlestick Chart</CardTitle>
            <p className="text-sm text-muted-foreground">Last {data.length} trading days</p>
          </div>
          <Button
            variant={showVolumeChart ? "default" : "outline"}
            size="sm"
            onClick={() => setShowVolumeChart(!showVolumeChart)}
          >
            {showVolumeChart ? "Hide" : "Show"} Volume
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Price Chart with Candlesticks */}
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(date: string) => date.substring(5)}
              />
              <YAxis
                domain={[priceMin - pricePadding, priceMax + pricePadding]}
                label={{ value: "Price ($)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "10px",
                }}
                formatter={(value) => {
                  if (typeof value === "number") {
                    return [value.toFixed(2), ""]
                  }
                  return ["", ""]
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />

              {/* Custom Candlestick Bars */}
              <Bar 
                dataKey="bodyHeight" 
                shape={CandleStickShape as unknown as BarProps['shape']} 
                isAnimationActive={false} 
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Volume Chart */}
          {showVolumeChart && (
            <ResponsiveContainer width="100%" height={150}>
              <ComposedChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(date: string) => date.substring(5)}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  label={{ value: "Volume", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  formatter={(value) => {
                    if (typeof value === "number") {
                      return [`${(value / 1000000).toFixed(2)}M`, "Volume"]
                    }
                    return ["", ""]
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />

                <Bar dataKey="volume" fill="#d1d5db" isAnimationActive={false}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} opacity={0.7} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {/* Legend Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-semibold mb-2">📈 Color Coding</p>
              <p className="text-sm text-muted-foreground">
                <span className="text-green-600 font-bold">● Green</span>: Close {">"} Open (Bullish)
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="text-red-600 font-bold">● Red</span>: Close {"<"} Open (Bearish)
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2">📊 Candlestick Parts</p>
              <p className="text-sm text-muted-foreground">Wick: High to Low range</p>
              <p className="text-sm text-muted-foreground">Body: Open to Close range</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Custom Candlestick Shape Component
const CandleStickShape = (props: CandleShapeProps) => {
  const { x, width, payload, yAxis } = props

  if (!payload) return null

  const { open, high, low, close, color } = payload

  // If yAxis is not available, render a simple rectangle
  if (!yAxis) {
    const candleWidth = Math.max(width * 0.6, 4)
    const candleX = x + (width - candleWidth) / 2
    return (
      <rect
        x={candleX}
        y={0}
        width={candleWidth}
        height={10}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    )
  }

  const scale = yAxis.scale

  // Get pixel positions
  const openY = scale(open)
  const highY = scale(high)
  const lowY = scale(low)
  const closeY = scale(close)

  // Body positions
  const bodyTop = Math.min(openY, closeY)
  const bodyBottom = Math.max(openY, closeY)
  const calculatedBodyHeight = Math.max(bodyBottom - bodyTop, 2)

  const candleWidth = Math.max(width * 0.6, 4)
  const candleX = x + (width - candleWidth) / 2

  return (
    <g>
      {/* Wick (High-Low line) */}
      <line
        x1={x + width / 2}
        y1={highY}
        x2={x + width / 2}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
      />

      {/* Body (Open-Close rectangle) */}
      <rect
        x={candleX}
        y={bodyTop}
        width={candleWidth}
        height={calculatedBodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  )
}
