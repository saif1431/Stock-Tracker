import apiClient from "@/lib/apiClient"

export interface EconomicIndicator {
  id: number
  indicator: string
  country: string
  current_value: number
  previous_value: number | null
  forecast_value: number | null
  unit: string | null
  release_date: string
  updated_at: string
}

export interface Commodity {
  id: number
  symbol: string
  name: string
  current_price: number
  day_change_percent: number
  week_change_percent: number
  month_change_percent: number
  year_change_percent: number
  unit: string
  updated_at: string
}

export interface CurrencyRate {
  id: number
  pair: string
  rate: number
  day_change_percent: number
  updated_at: string
}

export const marketOverviewService = {
  async getEconomicIndicators(country: string = "USA"): Promise<EconomicIndicator[]> {
    const response = await apiClient.get("/api/market-overview/economic-indicators", {
      params: { country },
    })
    return response.data
  },

  async getEconomicIndicator(indicator: string): Promise<EconomicIndicator> {
    const response = await apiClient.get(
      `/api/market-overview/economic-indicators/${indicator}`
    )
    return response.data
  },

  async getCommodities(): Promise<Commodity[]> {
    const response = await apiClient.get("/api/market-overview/commodities")
    return response.data
  },

  async getCommodity(symbol: string): Promise<Commodity> {
    const response = await apiClient.get(`/api/market-overview/commodities/${symbol}`)
    return response.data
  },

  async getCurrencyRates(): Promise<CurrencyRate[]> {
    const response = await apiClient.get("/api/market-overview/currencies")
    return response.data
  },

  async getCurrencyPair(pair: string): Promise<CurrencyRate> {
    const response = await apiClient.get(`/api/market-overview/currencies/${pair}`)
    return response.data
  },
}
