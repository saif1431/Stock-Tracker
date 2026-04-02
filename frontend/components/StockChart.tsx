"use client"

import React from "react"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChartData {
  date: string
  price: number
  change?: number
}

interface StockChartProps {
  data: ChartData[]
  symbol: string
  isLoading?: boolean
  onAddWatchlist?: () => void
  onBuy?: (quantity: number, price: number) => void
}

export function StockChart({ 
  data, 
  symbol, 
  isLoading = false, 
  onAddWatchlist,
  onBuy,
}: StockChartProps) {
  const tooltipTheme = {
    backgroundColor: "#0f172a",
    border: "1px solid #475569",
    borderRadius: "8px",
    color: "#f8fafc",
  }

  const [isBuying, setIsBuying] = React.useState(false)
  const [buyQuantity, setBuyQuantity] = React.useState("1")
  const [buyPrice, setBuyPrice] = React.useState("")

  React.useEffect(() => {
    if (data && data.length > 0) {
      setBuyPrice(data[data.length - 1].price.toString())
    }
  }, [data])

  if (isLoading) {
    return (
      <Card className="border-slate-700 bg-slate-800/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-slate-100">{symbol} Price History</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <div className="h-72 w-full animate-pulse rounded-md bg-slate-900" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-800/70 shadow-none">
        <CardHeader>
          <CardTitle className="text-slate-100">{symbol} Price History</CardTitle>
          <CardDescription className="text-slate-400">No data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-slate-400">Search for a stock to view its chart</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-700 bg-slate-800/70 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-slate-100">{symbol} Price History</CardTitle>
          <CardDescription className="text-slate-400">
            {data.length} data points • Last updated: {data[data.length - 1].date}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {onAddWatchlist && (
            <Button variant="outline" size="sm" onClick={onAddWatchlist} className="gap-1 border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-700">
              <Plus className="w-4 h-4" />
              Watch
            </Button>
          )}
          {onBuy && (
            <div className="flex items-center gap-2">
              {isBuying ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                  <Input 
                    type="number" 
                    value={buyQuantity} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuyQuantity(e.target.value)} 
                    className="data-num h-8 w-20 border-slate-600 bg-slate-900 text-slate-100"
                    placeholder="Qty"
                  />
                  <Input 
                    type="number" 
                    value={buyPrice} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuyPrice(e.target.value)} 
                    className="data-num h-8 w-24 border-slate-600 bg-slate-900 text-slate-100"
                    placeholder="Price"
                  />
                  <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-500" onClick={() => {
                    const qty = parseFloat(buyQuantity);
                    const price = parseFloat(buyPrice);
                    if (isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) {
                      alert('Please enter valid quantity and price');
                      return;
                    }
                    onBuy(qty, price);
                    setIsBuying(false);
                  }}>
                    Confirm
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-slate-700" onClick={() => setIsBuying(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setIsBuying(true)} className="gap-1 bg-blue-600 text-white hover:bg-blue-500">
                  <DollarSign className="w-4 h-4" />
                  Buy
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900 p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <p className="text-xs text-slate-400">Current Price</p>
              <p className="data-num text-lg font-bold text-slate-100">${data[data.length - 1]?.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">High</p>
              <p className="data-num font-bold text-green-500">${Math.max(...data.map(d => d.price)).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Low</p>
              <p className="data-num font-bold text-red-500">${Math.min(...data.map(d => d.price)).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Change</p>
              <p className={`data-num font-bold ${(data[data.length - 1]?.price - data[0]?.price) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {(data[data.length - 1]?.price - data[0]?.price) >= 0 ? "+" : ""}{((data[data.length - 1]?.price - data[0]?.price) / data[0]?.price * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 6" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={{ stroke: "#475569" }}
              tickLine={{ stroke: "#475569" }}
              tickFormatter={(date: string) => {
                // Show every 5th date to avoid crowding
                const index = data.findIndex(d => d.date === date);
                return index % 5 === 0 ? date.substring(5) : '';
              }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              domain={['dataMin - 5', 'dataMax + 5']}
              axisLine={{ stroke: "#475569" }}
              tickLine={{ stroke: "#475569" }}
              label={{ value: 'Price ($)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94a3b8' } }}
            />
            <Tooltip
              contentStyle={tooltipTheme}
              labelStyle={{ color: "#94a3b8" }}
              itemStyle={{ color: "#f8fafc" }}
              cursor={{ stroke: "#3b82f6", strokeOpacity: 0.35, strokeWidth: 1 }}
              formatter={(value) => [`$${typeof value === "number" ? value.toFixed(2) : value}`, '']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', color: '#94a3b8' }} />
            
            {/* High Price Line */}
            <Line
              type="monotone"
              dataKey="high"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              name="Daily High"
              opacity={0.6}
            />
            
            {/* Close Price Line (Main) */}
            <Line
              type="monotone"
              dataKey="price"
              stroke="#10b981"
              dot={(props) => {
                const { cx, cy, payload } = props;
                const index = data.findIndex(d => d.date === payload.date);
                // Show dots on every 5th point for clarity
                if (index % 5 === 0) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="#3b82f6"
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  );
                }
                return null;
              }}
              strokeWidth={3}
              name="Close Price"
              isAnimationActive={true}
            />
            
            {/* Low Price Line */}
            <Line
              type="monotone"
              dataKey="low"
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              name="Daily Low"
              opacity={0.6}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
