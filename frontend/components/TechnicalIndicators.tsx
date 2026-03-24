"use client"

import React, { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { stockService, ChartData } from "@/services/stockService"

interface IndicatorData {
  symbol: string
  indicator_type: string
  indicators: {
    sma_20?: number[]
    sma_50?: number[]
    sma_200?: number[]
    ema_12?: number[]
    ema_26?: number[]
    rsi?: number[]
    macd?: {
      macd: number[]
      signal: number[]
      histogram: number[]
    }
    bollinger?: {
      upper: number[]
      middle: number[]
      lower: number[]
    }
    stochastic?: {
      "%k": number[]
      "%d": number[]
    }
  }
  data_points: number
}

interface MergedChartData extends ChartData {
  sma_20?: number
  sma_50?: number
  sma_200?: number
  rsi?: number
  macd?: number
  macd_signal?: number
  macd_histogram?: number
  bb_upper?: number
  bb_middle?: number
  bb_lower?: number
}

interface TechnicalIndicatorsProps {
  symbol: string
  chartData: ChartData[]
}

export function TechnicalIndicators({ symbol, chartData }: TechnicalIndicatorsProps) {
  const [indicators, setIndicators] = useState<IndicatorData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedIndicators, setSelectedIndicators] = useState({
    sma: false,
    rsi: false,
    macd: false,
    bollinger: false,
  })

  useEffect(() => {
    fetchIndicators()
  }, [symbol])

  const fetchIndicators = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await stockService.getStockIndicators(symbol, "all")
      setIndicators(data)
    } catch (err) {
      setError(`Failed to load indicators: ${err}`)
      setIndicators(null)
    } finally {
      setLoading(false)
    }
  }

  const toggleIndicator = (indicator: keyof typeof selectedIndicators) => {
    setSelectedIndicators((prev) => ({
      ...prev,
      [indicator]: !prev[indicator],
    }))
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Technical Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Loading indicators...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Technical Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 p-4">{error}</div>
          <Button onClick={fetchIndicators} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!indicators) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Technical Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No indicator data available</p>
        </CardContent>
      </Card>
    )
  }

  // Merge indicators with price data for chart display
  const mergedData: MergedChartData[] = chartData.map((item, index) => {
    const merged: MergedChartData = { ...item }

    if (selectedIndicators.sma && indicators.indicators.sma_20) {
      merged.sma_20 = indicators.indicators.sma_20[index]
      merged.sma_50 = indicators.indicators.sma_50?.[index]
      merged.sma_200 = indicators.indicators.sma_200?.[index]
    }

    if (selectedIndicators.rsi && indicators.indicators.rsi) {
      merged.rsi = indicators.indicators.rsi[index]
    }

    if (selectedIndicators.macd && indicators.indicators.macd) {
      merged.macd = indicators.indicators.macd.macd[index]
      merged.macd_signal = indicators.indicators.macd.signal[index]
      merged.macd_histogram = indicators.indicators.macd.histogram[index]
    }

    if (selectedIndicators.bollinger && indicators.indicators.bollinger) {
      merged.bb_upper = indicators.indicators.bollinger.upper[index]
      merged.bb_middle = indicators.indicators.bollinger.middle[index]
      merged.bb_lower = indicators.indicators.bollinger.lower[index]
    }

    return merged
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Technical Indicators for {symbol}</CardTitle>
          <CardDescription>Toggle indicators to customize your chart view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedIndicators.sma ? "default" : "outline"}
              onClick={() => toggleIndicator("sma")}
            >
              📊 Moving Averages
            </Button>
            <Button
              size="sm"
              variant={selectedIndicators.rsi ? "default" : "outline"}
              onClick={() => toggleIndicator("rsi")}
            >
              📈 RSI
            </Button>
            <Button
              size="sm"
              variant={selectedIndicators.macd ? "default" : "outline"}
              onClick={() => toggleIndicator("macd")}
            >
              📉 MACD
            </Button>
            <Button
              size="sm"
              variant={selectedIndicators.bollinger ? "default" : "outline"}
              onClick={() => toggleIndicator("bollinger")}
            >
              🎯 Bollinger Bands
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Price Chart with Indicators */}
      {(selectedIndicators.sma || selectedIndicators.bollinger) && (
        <Card>
          <CardHeader>
            <CardTitle>Price Chart with Overlays</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={mergedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date: string) => {
                    const index = mergedData.findIndex((d) => d.date === date)
                    return index % 5 === 0 ? date.substring(5) : ""
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{ value: "Price ($)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
                  formatter={(value) => (typeof value === "number" ? `$${value.toFixed(2)}` : value)}
                />
                <Legend />

                {/* Price Line */}
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  dot={false}
                  strokeWidth={2}
                  name="Close Price"
                />

                {/* SMA Lines */}
                {selectedIndicators.sma && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="sma_20"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                      dot={false}
                      name="SMA 20"
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="sma_50"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      dot={false}
                      name="SMA 50"
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="sma_200"
                      stroke="#8b5cf6"
                      strokeWidth={1.5}
                      dot={false}
                      name="SMA 200"
                      strokeDasharray="5 5"
                    />
                  </>
                )}

                {/* Bollinger Bands */}
                {selectedIndicators.bollinger && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="bb_upper"
                      stroke="#ef4444"
                      strokeWidth={1}
                      dot={false}
                      name="BB Upper"
                      opacity={0.5}
                      strokeDasharray="3 3"
                    />
                    <Line
                      type="monotone"
                      dataKey="bb_middle"
                      stroke="#6b7280"
                      strokeWidth={1}
                      dot={false}
                      name="BB Middle"
                      opacity={0.5}
                      strokeDasharray="3 3"
                    />
                    <Line
                      type="monotone"
                      dataKey="bb_lower"
                      stroke="#10b981"
                      strokeWidth={1}
                      dot={false}
                      name="BB Lower"
                      opacity={0.5}
                      strokeDasharray="3 3"
                    />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* RSI Chart */}
      {selectedIndicators.rsi && (
        <Card>
          <CardHeader>
            <CardTitle>Relative Strength Index (RSI)</CardTitle>
            <CardDescription>
              RSI above 70 indicates overbought, below 30 indicates oversold
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={mergedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date: string) => {
                    const index = mergedData.findIndex((d) => d.date === date)
                    return index % 5 === 0 ? date.substring(5) : ""
                  }}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => (typeof value === "number" ? value.toFixed(2) : value)} />
                <Legend />

                {/* Reference lines */}
                <Line type="monotone" dataKey={() => 70} stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" name="Overbought (70)" />
                <Line type="monotone" dataKey={() => 30} stroke="#10b981" strokeWidth={1} strokeDasharray="5 5" name="Oversold (30)" />

                {/* RSI Line */}
                <Line
                  type="monotone"
                  dataKey="rsi"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="RSI (14)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* MACD Chart */}
      {selectedIndicators.macd && (
        <Card>
          <CardHeader>
            <CardTitle>MACD (Moving Average Convergence Divergence)</CardTitle>
            <CardDescription>Trend-following momentum indicator</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={mergedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(date: string) => {
                    const index = mergedData.findIndex((d) => d.date === date)
                    return index % 5 === 0 ? date.substring(5) : ""
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => (typeof value === "number" ? value.toFixed(4) : value)} />
                <Legend />

                {/* Zero line */}
                <Line type="monotone" dataKey={() => 0} stroke="#6b7280" strokeWidth={1} strokeDasharray="5 5" />

                {/* Histogram as bars */}
                <Bar dataKey="macd_histogram" fill="#d1d5db" name="Histogram" />

                {/* MACD and Signal lines */}
                <Line
                  type="monotone"
                  dataKey="macd"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={false}
                  name="MACD Line"
                />
                <Line
                  type="monotone"
                  dataKey="macd_signal"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  dot={false}
                  name="Signal Line"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Indicator Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">📊 Moving Averages</h4>
            <p className="text-muted-foreground">20, 50, and 200-day SMAs help identify trend direction and support/resistance levels.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">📈 RSI</h4>
            <p className="text-muted-foreground">Values above 70 suggest overbought conditions, below 30 suggest oversold. Range: 0-100.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">📉 MACD</h4>
            <p className="text-muted-foreground">When MACD crosses above signal line, it suggests bullish momentum. Histogram shows the difference.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">🎯 Bollinger Bands</h4>
            <p className="text-muted-foreground">Price at upper band suggests overbought, at lower band suggests oversold. Bands show volatility.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
