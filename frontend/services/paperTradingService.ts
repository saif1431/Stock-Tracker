import apiClient from '@/lib/apiClient'

export interface PaperAccount {
  id: number
  name: string
  initial_balance: number
  current_balance: number
  active: boolean
  created_at: string
}

export interface PaperPosition {
  symbol: string
  quantity: number
  average_cost: number
  market_price: number
  market_value: number
  unrealized_pnl: number
}

export interface PaperTransaction {
  id: number
  symbol: string
  transaction_type: string
  quantity: number
  price: number
  total_value: number
  created_at: string
}

export interface PaperPerformance {
  account_id: number
  cash_balance: number
  positions_value: number
  total_equity: number
  total_pnl: number
  total_pnl_pct: number
  positions: PaperPosition[]
  recent_transactions: PaperTransaction[]
}

export const paperTradingService = {
  async createAccount(name: string, initial_balance: number): Promise<PaperAccount> {
    const response = await apiClient.post('/api/paper-trading/accounts', { name, initial_balance })
    return response.data
  },

  async listAccounts(): Promise<PaperAccount[]> {
    const response = await apiClient.get('/api/paper-trading/accounts')
    return response.data
  },

  async placeTrade(account_id: number, symbol: string, side: 'buy' | 'sell', quantity: number): Promise<PaperTransaction> {
    const response = await apiClient.post('/api/paper-trading/trade', { account_id, symbol, side, quantity })
    return response.data
  },

  async getPerformance(accountId: number): Promise<PaperPerformance> {
    const response = await apiClient.get(`/api/paper-trading/accounts/${accountId}/performance`)
    return response.data
  },
}
