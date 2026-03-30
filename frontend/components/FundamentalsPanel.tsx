import React, { useEffect, useState } from "react"
import { fundamentalService, Fundamental } from "@/services/fundamentalService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/Toast"

interface FundamentalsPanelProps {
  symbol: string
}

export const FundamentalsPanel: React.FC<FundamentalsPanelProps> = ({ symbol }) => {
  const [fundamental, setFundamental] = useState<Fundamental | null>(null)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    const fetchFundamentals = async () => {
      setLoading(true)
      try {
        const data = await fundamentalService.getFundamental(symbol)
        setFundamental(data)
      } catch (error) {
        try {
          const fallback = await fundamentalService.getAllFundamentals(1)
          if (fallback.length > 0) {
            setFundamental(fallback[0])
          } else {
            setFundamental(null)
            showToast("No fundamentals data available", "info")
          }
        } catch {
          setFundamental(null)
          showToast("Failed to load fundamentals", "error")
        }
      } finally {
        setLoading(false)
      }
    }

    if (symbol) {
      fetchFundamentals()
    }
  }, [symbol, showToast])

  if (loading) return <div className="text-center p-6 text-sm text-muted-foreground">Loading fundamentals...</div>
  if (!fundamental)
    return <div className="text-center p-6 text-sm text-muted-foreground">No fundamentals data available</div>

  const metrics = [
    { label: "P/E Ratio", value: fundamental.pe_ratio, format: "0.00" },
    { label: "EPS", value: fundamental.eps, format: "$0.00" },
    { label: "Dividend Yield", value: fundamental.dividend_yield, format: "0.00%" },
    { label: "ROE", value: fundamental.roe, format: "0.00%" },
    { label: "Debt to Equity", value: fundamental.debt_to_equity, format: "0.00" },
    { label: "Profit Margin", value: fundamental.profit_margin, format: "0.00%" },
  ]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">{fundamental.symbol} Fundamentals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">{fundamental.company_name}</h3>
            <p className="text-sm text-muted-foreground">
              {fundamental.sector} • {fundamental.industry}
            </p>
            {fundamental.description && (
              <p className="text-sm text-muted-foreground mt-2">{fundamental.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metrics.map(
              (metric) =>
                metric.value !== null && (
                  <div key={metric.label} className="rounded-md border border-border p-3 bg-background">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="text-lg font-semibold">
                      {metric.value.toFixed(2)} {metric.format.includes("%") ? "%" : ""}
                    </p>
                  </div>
                )
            )}
          </div>

          {fundamental.market_cap && (
            <div className="bg-primary/5 p-3 rounded-md border border-primary/20">
              <p className="text-xs text-muted-foreground">Market Cap</p>
              <p className="text-sm font-semibold">
                ${(fundamental.market_cap / 1e9).toFixed(2)}B
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
