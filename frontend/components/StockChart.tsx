"use client"

import React from "react"
import {
  LineChart,
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
      <Card>
        <CardHeader>
          <CardTitle>{symbol} Price History</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading chart...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{symbol} Price History</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Search for a stock to view its chart</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{symbol} Price History</CardTitle>
          <CardDescription>
            {data.length} data points • Last updated: {data[data.length - 1].date}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {onAddWatchlist && (
            <Button variant="outline" size="sm" onClick={onAddWatchlist} className="gap-1">
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
                    className="w-20 h-8"
                    placeholder="Qty"
                  />
                  <Input 
                    type="number" 
                    value={buyPrice} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuyPrice(e.target.value)} 
                    className="w-24 h-8"
                    placeholder="Price"
                  />
                  <Button size="sm" onClick={() => {
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
                  <Button variant="ghost" size="sm" onClick={() => setIsBuying(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={() => setIsBuying(true)} className="gap-1">
                  <DollarSign className="w-4 h-4" />
                  Buy
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Current Price</p>
              <p className="font-bold text-lg">${data[data.length - 1]?.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">High</p>
              <p className="font-bold text-green-600">${Math.max(...data.map(d => d.price)).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Low</p>
              <p className="font-bold text-red-600">${Math.min(...data.map(d => d.price)).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Change</p>
              <p className={`font-bold ${(data[data.length - 1]?.price - data[0]?.price) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {(data[data.length - 1]?.price - data[0]?.price) >= 0 ? "+" : ""}{((data[data.length - 1]?.price - data[0]?.price) / data[0]?.price * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(date: string) => {
                // Show every 5th date to avoid crowding
                const index = data.findIndex(d => d.date === date);
                return index % 5 === 0 ? date.substring(5) : '';
              }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={['dataMin - 5', 'dataMax + 5']}
              label={{ value: 'Price ($)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
              formatter={(value) => [`$${typeof value === "number" ? value.toFixed(2) : value}`, '']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
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
              stroke="#3b82f6"
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
                      stroke="#fff"
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
