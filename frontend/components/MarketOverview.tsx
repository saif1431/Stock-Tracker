import React, { useEffect, useState } from "react"
import {
  marketOverviewService,
  EconomicIndicator,
  Commodity,
  CurrencyRate,
} from "@/services/marketOverviewService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/Toast"

export const MarketOverview: React.FC = () => {
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([])
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [indData, commData, currData] = await Promise.all([
          marketOverviewService.getEconomicIndicators(),
          marketOverviewService.getCommodities(),
          marketOverviewService.getCurrencyRates(),
        ])
        setIndicators(indData)
        setCommodities(commData)
        setCurrencies(currData)
      } catch (error) {
        showToast("Failed to load market overview", "error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [showToast])

  if (loading) return <div className="text-center p-6 text-sm text-muted-foreground">Loading market overview...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Economic Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {indicators.length === 0 ? (
              <p className="text-muted-foreground text-sm">No economic data available</p>
            ) : (
              indicators.slice(0, 5).map((ind) => (
                <div key={ind.indicator} className="border-b pb-2 last:border-b-0">
                  <p className="text-sm font-medium">{ind.indicator}</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {ind.current_value.toFixed(2)} {ind.unit || ""}
                  </p>
                  {ind.previous_value && (
                    <p className="text-xs text-muted-foreground">
                      Prev: {ind.previous_value.toFixed(2)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Commodities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commodities.length === 0 ? (
              <p className="text-muted-foreground text-sm">No commodity data available</p>
            ) : (
              commodities.slice(0, 5).map((comm) => (
                <div key={comm.symbol} className="border-b pb-2 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{comm.name}</p>
                      <p className="text-xs text-muted-foreground">${comm.current_price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`text-sm font-semibold ${
                          comm.day_change_percent >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {comm.day_change_percent >= 0 ? "+" : ""}
                        {comm.day_change_percent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Forex Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currencies.length === 0 ? (
              <p className="text-muted-foreground text-sm">No currency data available</p>
            ) : (
              currencies.slice(0, 5).map((curr) => (
                <div key={curr.pair} className="border-b pb-2 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{curr.pair}</p>
                      <p className="text-lg font-semibold">{curr.rate.toFixed(4)}</p>
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        curr.day_change_percent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {curr.day_change_percent >= 0 ? "+" : ""}
                      {curr.day_change_percent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
