import apiClient from '@/lib/apiClient'

export interface BacktestRequest {
  symbol: string
  start_date: string
  end_date: string
  short_window: number
  long_window: number
  initial_capital: number
  fee_pct?: number
  slippage_bps?: number
  save_run?: boolean
  run_name?: string
}

export interface BacktestResult {
  symbol: string
  strategy: string
  parameters: {
    short_window: number
    long_window: number
    fee_pct?: number
    slippage_bps?: number
  }
  initial_capital: number
  final_capital: number
  total_return_pct: number
  max_drawdown_pct: number
  sharpe_ratio: number
  win_rate_pct: number
  total_trades: number
  wins: number
  losses: number
  equity_curve: Array<{ date: string; equity: number }>
  trades: Array<{ date: string; side: string; price: number; shares: number }>
}

export interface SavedBacktestRun {
  id: number
  name?: string
  symbol: string
  total_return_pct: number
  created_at: string
}

export const backtestingService = {
  async runBacktest(payload: BacktestRequest): Promise<{ result: BacktestResult; saved_run_id?: number }> {
    const response = await apiClient.post('/api/backtesting/run', payload)
    return response.data
  },

  async listRuns(): Promise<SavedBacktestRun[]> {
    const response = await apiClient.get('/api/backtesting/runs')
    return response.data
  },
}
