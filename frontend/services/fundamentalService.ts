import apiClient from "@/lib/apiClient"

export interface Fundamental {
  id: number
  symbol: string
  company_name: string
  sector: string
  industry: string
  market_cap: number | null
  pe_ratio: number | null
  eps: number | null
  dividend_yield: number | null
  dividend_per_share: number | null
  revenue: number | null
  profit_margin: number | null
  debt_to_equity: number | null
  roa: number | null
  roe: number | null
  fifty_two_week_high: number | null
  fifty_two_week_low: number | null
  book_value: number | null
  description: string | null
  website: string | null
  ceo: string | null
  employees: number | null
  updated_at: string
}

export const fundamentalService = {
  async getFundamental(symbol: string): Promise<Fundamental> {
    const response = await apiClient.get(`/api/fundamentals/${symbol}`)
    return response.data
  },

  async getAllFundamentals(limit: number = 10): Promise<Fundamental[]> {
    const response = await apiClient.get("/api/fundamentals/", { params: { limit } })
    return response.data
  },

  async getFundamentalsBySector(sector: string, limit: number = 10): Promise<Fundamental[]> {
    const response = await apiClient.get(`/api/fundamentals/sector/${sector}`, {
      params: { limit },
    })
    return response.data
  },

  async compareFundamentals(symbols: string[]): Promise<Fundamental[]> {
    const symbolsStr = symbols.join(",")
    const response = await apiClient.get(`/api/fundamentals/compare/${symbolsStr}`)
    return response.data
  },
}
