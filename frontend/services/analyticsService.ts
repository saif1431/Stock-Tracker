import apiClient from '@/lib/apiClient'

export interface PortfolioMetrics {
  invested_capital: number
  current_value: number
  total_return_pct: number
  annualized_return_pct: number
  max_drawdown_pct: number
  sharpe_ratio: number
  benchmark_return_pct: number | null
}

export interface PortfolioHistoryPoint {
  date: string
  portfolio_value: number
}

export interface MonthlyReturnPoint {
  month: string
  return_pct: number
}

export interface PortfolioPerformanceResponse {
  metrics: PortfolioMetrics
  history: PortfolioHistoryPoint[]
  monthly_returns: MonthlyReturnPoint[]
}

export interface AllocationItem {
  name?: string
  symbol?: string
  value: number
  percentage: number
}

export interface AssetAllocationResponse {
  total_value: number
  sector_allocation: AllocationItem[]
  holding_allocation: AllocationItem[]
  diversification_score: number
}

export const analyticsService = {
  async getPortfolioPerformance(): Promise<PortfolioPerformanceResponse> {
    const response = await apiClient.get('/api/analytics/portfolio-performance')
    return response.data
  },

  async getAssetAllocation(): Promise<AssetAllocationResponse> {
    const response = await apiClient.get('/api/analytics/asset-allocation')
    return response.data
  },
}
