import apiClient from '@/lib/apiClient'

export interface ScreenerCriteria {
  min_market_cap?: number
  max_market_cap?: number
  min_pe_ratio?: number
  max_pe_ratio?: number
  min_dividend_yield?: number
  min_revenue_growth?: number
  min_profit_margin?: number
  sector?: string
  limit?: number
}

export interface ScreenerResult {
  symbol: string
  market_cap?: number
  pe_ratio?: number
  dividend_yield?: number
  revenue_growth?: number
  profit_margin?: number
  sector?: string
  score: number
}

export interface SavedScreen {
  id: number
  name: string
  description?: string
  criteria: Record<string, unknown>
  created_at: string
}

export const screenerService = {
  async run(criteria: ScreenerCriteria): Promise<{ count: number; results: ScreenerResult[] }> {
    const response = await apiClient.post('/api/screener/run', criteria)
    return response.data
  },

  async save(name: string, description: string, criteria: ScreenerCriteria): Promise<{ screen_id: number; name: string; result_count: number }> {
    const response = await apiClient.post('/api/screener/save', { name, description, criteria })
    return response.data
  },

  async listSaved(): Promise<SavedScreen[]> {
    const response = await apiClient.get('/api/screener/saved')
    return response.data
  },

  async runSaved(screenId: number): Promise<{ screen_id: number; name: string; count: number; results: ScreenerResult[] }> {
    const response = await apiClient.post(`/api/screener/saved/${screenId}/run`)
    return response.data
  },
}
