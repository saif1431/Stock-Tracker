"use client"

import React, { useState, useCallback, useEffect } from "react"
import { SearchStockForm } from "@/components/SearchStockForm"
import { StockChart } from "@/components/StockChart"
import { stockService, ChartData } from "@/services/stockService"
import { useStockWebSocket } from "@/hooks/useStockWebSocket"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { WatchlistSidebar } from "@/components/WatchlistSidebar"
import { PortfolioSection, PortfolioItem } from "@/components/PortfolioSection"
import { TrendingUp, Radio, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toast, useToast } from "@/components/ui/Toast"

interface WatchlistItem {
  symbol: string
  price: number
  change: number
  changePercent: number
}

// Mock data for demonstration
const MOCK_CHART_DATA: ChartData[] = [
  { date: "Jan 1", price: 150.5 },
  { date: "Jan 2", price: 152.3 },
  { date: "Jan 3", price: 151.8 },
  { date: "Jan 4", price: 154.2 },
  { date: "Jan 5", price: 156.7 },
  { date: "Jan 6", price: 155.9 },
  { date: "Jan 7", price: 158.3 },
  { date: "Jan 8", price: 160.1 },
  { date: "Jan 9", price: 159.4 },
  { date: "Jan 10", price: 162.8 },
]

const MOCK_WATCHLIST: WatchlistItem[] = [
  { symbol: "AAPL", price: 150.25, change: 2.5, changePercent: 1.69 },
  { symbol: "GOOGL", price: 140.5, change: -1.2, changePercent: -0.85 },
  { symbol: "MSFT", price: 380.2, change: 5.3, changePercent: 1.42 },
]

export default function Dashboard() {
  const { loading, logout } = useAuth()
  const { toast, showToast, hideToast } = useToast()
  const router = useRouter()
  const [currentStock, setCurrentStock] = useState<string>("AAPL")
  const [chartData, setChartData] = useState<ChartData[]>(MOCK_CHART_DATA)
  const [isLoading, setIsLoading] = useState(false)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [watchlistData, portfolioData] = await Promise.all([
          stockService.getWatchlist(),
          stockService.getPortfolio()
        ])
        
        setWatchlist(watchlistData.map(item => ({
          symbol: item.symbol,
          price: item.price || 0,
          change: item.change || 0,
          changePercent: item.changePercent || 0
        })))
        
        setPortfolio(portfolioData)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        showToast("Failed to load dashboard data", "error")
      }
    }
    
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      fetchData()
    }
  }, [])

  // Set up WebSocket for real-time updates
  const { isConnected } = useStockWebSocket(currentStock, useCallback((data: any) => {
    if (data && !data.error) {
      const transformedData = stockService.transformStockData(data)
      setChartData(transformedData)
    }
  }, []))

  const handleSearch = useCallback(async (symbol: string) => {
    setIsLoading(true)
    try {
      const rawData = await stockService.getStockData(symbol)
      const transformedData = stockService.transformStockData(rawData)
      setCurrentStock(symbol)
      setChartData(transformedData)
      showToast(`Loaded ${symbol} successfully`, "success")
    } catch (error: any) {
      console.error("Error fetching stock data:", error)
      showToast(error.response?.data?.detail || "Failed to fetch stock data", "error")
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  const handleAddToWatchlist = useCallback(async () => {
    try {
      await stockService.addToWatchlist(currentStock)
      const data = await stockService.getWatchlist()
      setWatchlist(data.map(item => ({
        symbol: item.symbol,
        price: item.price || 0,
        change: item.change || 0,
        changePercent: item.changePercent || 0
      })))
      showToast(`${currentStock} added to watchlist`, "success")
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Failed to add to watchlist", "error")
    }
  }, [currentStock, showToast])

  const handleSelectFromWatchlist = useCallback((symbol: string) => {
    handleSearch(symbol)
  }, [handleSearch])

  const handleRemoveFromWatchlist = useCallback(async (symbol: string) => {
    try {
      await stockService.removeFromWatchlist(symbol)
      setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol))
      showToast(`${symbol} removed from watchlist`, "success")
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Failed to remove from watchlist", "error")
    }
  }, [])

  const handleRemoveFromPortfolio = useCallback(async (symbol: string) => {
    try {
      await stockService.removeFromPortfolio(symbol)
      setPortfolio((prev) => prev.filter((item) => item.symbol !== symbol))
      showToast(`${symbol} sold/removed from portfolio`, "success")
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Failed to remove from portfolio", "error")
    }
  }, [])

  const handleAddToPortfolio = useCallback(async (quantity: number, price: number) => {
    try {
      await stockService.addToPortfolio(currentStock, quantity, price)
      const data = await stockService.getPortfolio()
      setPortfolio(data)
      showToast(`Bought ${quantity} shares of ${currentStock}`, "success")
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Failed to buy stock", "error")
    }
  }, [currentStock])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight">Stock Tracker</h1>
                  {isConnected && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium animate-pulse">
                      <Radio className="w-3 h-3" />
                      Live
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground">Track stocks and manage your watchlist</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-destructive gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search Form */}
            <SearchStockForm onSearch={handleSearch} isLoading={isLoading} />

            {/* Chart */}
            <StockChart
              data={chartData}
              symbol={currentStock}
              isLoading={isLoading}
              onAddWatchlist={handleAddToWatchlist}
              onBuy={handleAddToPortfolio}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WatchlistSidebar
              items={watchlist}
              onSelectStock={handleSelectFromWatchlist}
              onRemoveStock={handleRemoveFromWatchlist}
              currentStock={currentStock}
            />
            <PortfolioSection
              items={portfolio}
              onRemove={handleRemoveFromPortfolio}
              onSelect={handleSearch}
            />
          </div>
        </div>
      </main>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
    </div>
  )
}
