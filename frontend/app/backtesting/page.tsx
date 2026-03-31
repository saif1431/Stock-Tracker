"use client"

import React, { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

import { useAuth } from "@/hooks/useAuth"
import { backtestingService, BacktestResult } from "@/services/backtestingService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const EQUITY_CURVE_COLOR = "#0ea5e9"

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #d1d5db",
  color: "#111111",
}

const TOOLTIP_TEXT_STYLE = {
  color: "#111111",
}

function todayMinus(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export default function BacktestingPage() {
  const { loading } = useAuth()
  const [symbol, setSymbol] = useState("AAPL")
  const [startDate, setStartDate] = useState(todayMinus(365))
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10))
  const [shortWindow, setShortWindow] = useState(20)
  const [longWindow, setLongWindow] = useState(50)
  const [initialCapital, setInitialCapital] = useState(10000)

  const [result, setResult] = useState<BacktestResult | null>(null)
  const [savedRuns, setSavedRuns] = useState<Array<{ id: number; symbol: string; total_return_pct: number; created_at: string }>>([])
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRuns = async () => {
    const rows = await backtestingService.listRuns()
    setSavedRuns(rows)
  }

  useEffect(() => {
    const run = async () => {
      try {
        await loadRuns()
      } finally {
        setIsFetching(false)
      }
    }
    run()
  }, [])

  const runBacktest = async (saveRun = false) => {
    setError(null)
    try {
      const response = await backtestingService.runBacktest({
        symbol,
        start_date: startDate,
        end_date: endDate,
        short_window: shortWindow,
        long_window: longWindow,
        initial_capital: initialCapital,
        save_run: saveRun,
        run_name: `${symbol} ${shortWindow}/${longWindow}`,
      })
      setResult(response.result)
      if (saveRun) {
        await loadRuns()
      }
    } catch {
      setError('Backtest failed. Verify dates and SMA windows (short < long).')
    }
  }

  if (loading || isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Backtesting</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Test an SMA crossover strategy on historical data with return, drawdown, and win-rate analytics.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-xl">Backtest Parameters</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="rounded-md border bg-background px-3 py-2" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="Symbol" />
            <input className="rounded-md border bg-background px-3 py-2" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input className="rounded-md border bg-background px-3 py-2" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <input className="rounded-md border bg-background px-3 py-2" type="number" value={shortWindow} onChange={(e) => setShortWindow(Number(e.target.value))} placeholder="Short window" />
            <input className="rounded-md border bg-background px-3 py-2" type="number" value={longWindow} onChange={(e) => setLongWindow(Number(e.target.value))} placeholder="Long window" />
            <input className="rounded-md border bg-background px-3 py-2" type="number" value={initialCapital} onChange={(e) => setInitialCapital(Number(e.target.value))} placeholder="Initial capital" />
            <div className="md:col-span-3 flex gap-3">
              <Button onClick={() => runBacktest(false)}>Run Backtest</Button>
              <Button variant="outline" onClick={() => runBacktest(true)}>Run and Save</Button>
            </div>
            {error && <p className="md:col-span-3 text-sm text-red-500">{error}</p>}
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-base">Total Return</CardTitle></CardHeader><CardContent className={`text-2xl font-bold ${result.total_return_pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{result.total_return_pct.toFixed(2)}%</CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-base">Sharpe Ratio</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{result.sharpe_ratio.toFixed(2)}</CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-base">Max Drawdown</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-amber-500">{result.max_drawdown_pct.toFixed(2)}%</CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-base">Win Rate</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{result.win_rate_pct.toFixed(2)}%</CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-xl">Equity Curve</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.equity_curve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={TOOLTIP_CONTENT_STYLE}
                        labelStyle={TOOLTIP_TEXT_STYLE}
                        itemStyle={TOOLTIP_TEXT_STYLE}
                        cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }}
                      />
                      <Line dataKey="equity" stroke={EQUITY_CURVE_COLOR} strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader><CardTitle className="text-xl">Saved Runs</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr><th className="text-left py-2">Date</th><th className="text-left py-2">Symbol</th><th className="text-right py-2">Return</th></tr>
              </thead>
              <tbody>
                {savedRuns.map((run) => (
                  <tr key={run.id} className="border-t">
                    <td className="py-2">{new Date(run.created_at).toLocaleDateString()}</td>
                    <td className="py-2 font-medium">{run.symbol}</td>
                    <td className={`py-2 text-right ${run.total_return_pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{run.total_return_pct.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
