import React, { useEffect, useState } from "react"
import { marketService, SectorPerformance, MarketIndex } from "@/services/marketService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useToast } from "@/components/ui/Toast"

interface MarketBreadth {
  up: number
  down: number
  unchanged: number
  up_ratio: number
}

interface SectorComparisonProps {
  showBreadth?: boolean
}

export const SectorComparison: React.FC<SectorComparisonProps> = ({
  showBreadth = true,
}) => {
  const [sectors, setSectors] = useState<SectorPerformance[]>([])
  const [indices, setIndices] = useState<MarketIndex[]>([])
  const [breadth, setBreadth] = useState<MarketBreadth | null>(null)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [sectorsData, indicesData, breadthData] = await Promise.all([
          marketService.getSectorPerformance(),
          marketService.getMarketIndices(),
          showBreadth ? marketService.getMarketBreadth() : Promise.resolve(null),
        ])
        setSectors(sectorsData)
        setIndices(indicesData)
        if (breadthData) setBreadth(breadthData)
      } catch (error) {
        showToast("Failed to load market data", "error")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [showBreadth, showToast])

  if (loading) return <div className="text-center p-6 text-sm text-muted-foreground">Loading market data...</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sector Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sectors.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sector data available</p>
            ) : (
              sectors.map((sector) => (
                <div
                  key={sector.sector}
                  className="flex justify-between items-center p-2 hover:bg-accent rounded-md"
                >
                  <span className="text-sm font-medium">{sector.sector}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        sector.day_change_percent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {sector.day_change_percent >= 0 ? "+" : ""}
                      {sector.day_change_percent.toFixed(2)}%
                    </span>
                    {sector.day_change_percent >= 0 ? (
                      <TrendingUp size={16} className="text-green-600" />
                    ) : (
                      <TrendingDown size={16} className="text-red-600" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Market Indices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {indices.length === 0 ? (
              <p className="text-muted-foreground text-sm">No index data available</p>
            ) : (
              indices.map((index) => (
                <div
                  key={index.symbol}
                  className="flex justify-between items-center p-2 hover:bg-accent rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium">{index.name}</p>
                    <p className="text-xs text-muted-foreground">{index.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {index.current_value.toFixed(2)}
                    </p>
                    <p
                      className={`text-xs ${
                        index.day_change_percent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {index.day_change_percent >= 0 ? "+" : ""}
                      {index.day_change_percent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {showBreadth && breadth && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Market Breadth</p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-sm font-semibold text-green-600">{breadth.up}</p>
                  <p className="text-xs text-muted-foreground">Advancing</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-red-600">{breadth.down}</p>
                  <p className="text-xs text-muted-foreground">Declining</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">{breadth.unchanged}</p>
                  <p className="text-xs text-muted-foreground">Unchanged</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
