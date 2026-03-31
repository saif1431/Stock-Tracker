"use client"

import { useCallback, useEffect, useState } from "react"
import { taxService, TaxSummaryResponse, CapitalGainsResponse, HarvestingResponse } from "@/services/taxService"
import { Button } from "@/components/ui/button"

function toCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
}

export default function TaxPage() {
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [summary, setSummary] = useState<TaxSummaryResponse | null>(null)
  const [capitalGains, setCapitalGains] = useState<CapitalGainsResponse | null>(null)
  const [harvesting, setHarvesting] = useState<HarvestingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTaxData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryData, capitalData, harvestingData] = await Promise.all([
        taxService.getSummary(year),
        taxService.getCapitalGains(year),
        taxService.getHarvesting(),
      ])
      setSummary(summaryData)
      setCapitalGains(capitalData)
      setHarvesting(harvestingData)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load tax data")
      }
    } finally {
      setLoading(false)
    }
  }, [year])

  const handleDownloadCsv = async () => {
    try {
      const csvBlob = await taxService.downloadCsv(year)
      const url = URL.createObjectURL(csvBlob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `tax_report_${year}.csv`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV download failed")
    }
  }

  useEffect(() => {
    loadTaxData()
  }, [loadTaxData])

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tax Tools</h1>
          <p className="text-sm text-muted-foreground">Capital gains, summary, and harvesting opportunities.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-10 w-28 rounded-md border border-border bg-background px-3 text-sm"
          />
          <Button variant="outline" onClick={loadTaxData}>Refresh</Button>
          <Button onClick={handleDownloadCsv}>Export CSV</Button>
        </div>
      </div>

      {loading ? <div className="rounded-lg border border-border bg-card p-6">Loading tax data...</div> : null}
      {error ? <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">{error}</div> : null}

      {!loading && !error && summary ? (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Short Term</p><p className="text-xl font-semibold">{toCurrency(summary.short_term_gains)}</p></div>
          <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Long Term</p><p className="text-xl font-semibold">{toCurrency(summary.long_term_gains)}</p></div>
          <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Total Gain</p><p className="text-xl font-semibold">{toCurrency(summary.total_gain)}</p></div>
          <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Total Losses</p><p className="text-xl font-semibold">{toCurrency(summary.total_losses)}</p></div>
          <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Wash Sale Count</p><p className="text-xl font-semibold">{summary.wash_sale_count}</p></div>
        </section>
      ) : null}

      {!loading && !error && capitalGains ? (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Capital Gains Details</h2>
            <p className="text-xs text-muted-foreground">{capitalGains.transactions_count} realized records</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3">Symbol</th>
                  <th className="text-left p-3">Purchase</th>
                  <th className="text-left p-3">Sale</th>
                  <th className="text-left p-3">Quantity</th>
                  <th className="text-left p-3">Gain/Loss</th>
                  <th className="text-left p-3">Holding</th>
                </tr>
              </thead>
              <tbody>
                {capitalGains.gains.map((row, idx) => (
                  <tr key={`${row.symbol}-${idx}`} className="border-t border-border">
                    <td className="p-3">{row.symbol}</td>
                    <td className="p-3">{new Date(row.purchase_date).toLocaleDateString()}</td>
                    <td className="p-3">{new Date(row.sale_date).toLocaleDateString()}</td>
                    <td className="p-3">{row.quantity}</td>
                    <td className={`p-3 font-medium ${row.gain_loss >= 0 ? "text-green-600" : "text-red-600"}`}>{toCurrency(row.gain_loss)}</td>
                    <td className="p-3">{row.holding_period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {!loading && !error && harvesting ? (
        <section className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Harvesting Opportunities</h2>
            <p className="text-xs text-muted-foreground">{harvesting.count} positions in loss</p>
          </div>
          <div className="divide-y divide-border">
            {harvesting.opportunities.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No harvesting opportunities right now.</p>
            ) : (
              harvesting.opportunities.slice(0, 10).map((item) => (
                <div key={item.symbol} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.symbol}</p>
                    <p className="text-xs text-muted-foreground">Qty {item.quantity} | Avg {toCurrency(item.average_cost)} | Current {toCurrency(item.current_price)}</p>
                  </div>
                  <p className="text-red-600 font-semibold">Potential loss {toCurrency(item.potential_loss)}</p>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}
    </main>
  )
}
