"use client"

import React, { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { screenerService, ScreenerCriteria, ScreenerResult, SavedScreen } from "@/services/screenerService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ScreenerPage() {
  const { loading } = useAuth()
  const [criteria, setCriteria] = useState<ScreenerCriteria>({ limit: 50 })
  const [results, setResults] = useState<ScreenerResult[]>([])
  const [saved, setSaved] = useState<SavedScreen[]>([])
  const [isFetching, setIsFetching] = useState(true)

  const [screenName, setScreenName] = useState("High Quality Growth")
  const [screenDescription, setScreenDescription] = useState("Revenue and margin focused")

  const loadSaved = async () => {
    const rows = await screenerService.listSaved()
    setSaved(rows)
  }

  useEffect(() => {
    const run = async () => {
      try {
        await loadSaved()
      } finally {
        setIsFetching(false)
      }
    }

    run()
  }, [])

  const setField = (key: keyof ScreenerCriteria, value: string) => {
    const parsed = value === "" ? undefined : Number(value)
    setCriteria((prev) => ({ ...prev, [key]: Number.isNaN(parsed) ? undefined : parsed }))
  }

  const runScreener = async () => {
    const data = await screenerService.run(criteria)
    setResults(data.results)
  }

  const saveScreen = async () => {
    await screenerService.save(screenName, screenDescription, criteria)
    await loadSaved()
  }

  const runSaved = async (id: number) => {
    const data = await screenerService.runSaved(id)
    setResults(data.results)
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
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Stock Screener</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Filter stocks by valuation, growth, and profitability. Save reusable screens for fast reruns.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-xl">Screener Criteria</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="rounded-md border bg-background px-3 py-2" placeholder="Min Market Cap" type="number" onChange={(e) => setField('min_market_cap', e.target.value)} />
            <input className="rounded-md border bg-background px-3 py-2" placeholder="Max PE Ratio" type="number" onChange={(e) => setField('max_pe_ratio', e.target.value)} />
            <input className="rounded-md border bg-background px-3 py-2" placeholder="Min Revenue Growth %" type="number" onChange={(e) => setField('min_revenue_growth', e.target.value)} />
            <input className="rounded-md border bg-background px-3 py-2" placeholder="Min Profit Margin %" type="number" onChange={(e) => setField('min_profit_margin', e.target.value)} />
            <input className="rounded-md border bg-background px-3 py-2" placeholder="Min Dividend Yield %" type="number" onChange={(e) => setField('min_dividend_yield', e.target.value)} />
            <input className="rounded-md border bg-background px-3 py-2" placeholder="Limit" type="number" defaultValue={50} onChange={(e) => setField('limit', e.target.value)} />
            <div className="md:col-span-3 flex flex-wrap gap-3">
              <Button onClick={runScreener}>Run Screener</Button>
              <input className="rounded-md border bg-background px-3 py-2 min-w-[220px]" value={screenName} onChange={(e) => setScreenName(e.target.value)} placeholder="Screen name" />
              <input className="rounded-md border bg-background px-3 py-2 min-w-[280px]" value={screenDescription} onChange={(e) => setScreenDescription(e.target.value)} placeholder="Description" />
              <Button variant="outline" onClick={saveScreen}>Save Screen</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader><CardTitle className="text-xl">Results ({results.length})</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="text-left py-2">Symbol</th>
                    <th className="text-right py-2">Market Cap</th>
                    <th className="text-right py-2">PE</th>
                    <th className="text-right py-2">Rev Growth</th>
                    <th className="text-right py-2">Margin</th>
                    <th className="text-right py-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.symbol} className="border-t">
                      <td className="py-2 font-medium">{r.symbol}</td>
                      <td className="py-2 text-right">{r.market_cap?.toLocaleString() ?? '-'}</td>
                      <td className="py-2 text-right">{r.pe_ratio?.toFixed(2) ?? '-'}</td>
                      <td className="py-2 text-right">{r.revenue_growth?.toFixed(2) ?? '-'}%</td>
                      <td className="py-2 text-right">{r.profit_margin?.toFixed(2) ?? '-'}%</td>
                      <td className="py-2 text-right font-semibold">{r.score.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Saved Screens</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {saved.length === 0 && <p className="text-sm text-muted-foreground">No saved screens yet.</p>}
              {saved.map((s) => (
                <button key={s.id} onClick={() => runSaved(s.id)} className="w-full text-left rounded-md border px-3 py-2 hover:bg-accent transition-colors">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.description || 'No description'}</div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
