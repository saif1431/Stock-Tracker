import apiClient from "@/lib/apiClient"

export interface SectorPerformance {
  id: number
  sector: string
  day_change_percent: number
  week_change_percent: number
  month_change_percent: number
  three_month_change_percent: number
  year_change_percent: number
  stocks_count: number
  updated_at: string
}

export interface MarketIndex {
  id: number
  symbol: string
  name: string
  current_value: number
  day_change: number
  day_change_percent: number
  year_high: number | null
  year_low: number | null
  updated_at: string
}

export const marketService = {
  async getSectorPerformance(): Promise<SectorPerformance[]> {
    const response = await apiClient.get("/api/market/sectors")
    return response.data
  },

  async getSectorByName(sector: string): Promise<SectorPerformance> {
    const response = await apiClient.get(`/api/market/sectors/${sector}`)
    return response.data
  },

  async getMarketIndices(): Promise<MarketIndex[]> {
    const response = await apiClient.get("/api/market/indices")
    return response.data
  },

  async getMarketIndex(symbol: string): Promise<MarketIndex> {
    const response = await apiClient.get(`/api/market/indices/${symbol}`)
    return response.data
  },

  async getMarketBreadth(): Promise<{
    up: number
    down: number
    unchanged: number
    up_ratio: number
  }> {
    const response = await apiClient.get("/api/market/breadth")
    return response.data
  },
}
