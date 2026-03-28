import apiClient from '../lib/apiClient';

export interface StockData {
  "Meta Data": Record<string, string>;
  "Time Series (Daily)": Record<string, Record<string, string>>;
}

export interface ApiError {
  detail: string;
}

export interface ChartData {
  date: string;
  price: number;
  change?: number;
  high?: number;
  low?: number;
}

// Watchlist Item Interface
export interface WatchlistItem {
  id: number;
  symbol: string;
  current_price: number;
  daily_change: number;
  daily_change_percent: number;
  daily_high: number;
  daily_low: number;
}

// Portfolio Item Interface
export interface PortfolioItem {
  id: number;
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  profit_loss: number;
  profit_loss_percent: number;
}

// Indicator Data Interface
export interface IndicatorData {
  symbol: string;
  indicator_type: string;
  indicators: {
    sma_20?: number[];
    sma_50?: number[];
    sma_200?: number[];
    ema_12?: number[];
    ema_26?: number[];
    rsi?: number[];
    macd?: {
      macd: number[];
      signal: number[];
      histogram: number[];
    };
    bollinger?: {
      upper: number[];
      middle: number[];
      lower: number[];
    };
    stochastic?: {
      '%k': number[];
      '%d': number[];
    };
  };
  data_points: number;
}

// Candlestick Data Interface
export interface CandleStickData {
  meta: {
    symbol: string;
    last_refreshed: string;
    data_points: number;
  };
  candlesticks: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

// Alert Interface
export interface Alert {
  id: number;
  symbol: string;
  alert_type: 'above' | 'below' | 'change_percent';
  threshold_price?: number;
  change_percent?: number;
  is_active: boolean;
  triggered: boolean;
  triggered_at?: string;
  created_at: string;
  updated_at: string;
}

// Transaction Interface
export interface Transaction {
  id: number;
  symbol: string;
  transaction_type: 'buy' | 'sell';
  quantity: number;
  price_per_share: number;
  total_value: number;
  transaction_date: string;
  notes?: string;
}

// Transaction Summary Interface
export interface TransactionSummary {
  total_transactions: number;
  buy_count: number;
  sell_count: number;
  total_invested: number;
  total_sold: number;
  net_invested: number;
}

export const stockService = {
  /**
   * Fetches daily stock data for a given symbol.
   * @param symbol The stock symbol (e.g., 'AAPL', 'GOOGL')
   * @returns The stock data from the backend
   */
  async getStockData(symbol: string): Promise<StockData> {
    const response = await apiClient.get<StockData>(`/stock/${symbol}`);
    return response.data;
  },

  /**
   * Transforms Alpha Vantage "Time Series (Daily)" data into a flat array of ChartData.
   * @param data The raw StockData from the backend
   * @returns A transformed array of ChartData
   */
  transformStockData(data: StockData): ChartData[] {
    const timeSeries = data["Time Series (Daily)"];
    if (!timeSeries) return [];

    // Sort dates ascending and map to ChartData format
    return Object.entries(timeSeries)
      .map(([date, values]) => ({
        date,
        price: parseFloat(values["4. close"]),
        high: parseFloat(values["2. high"] || values["4. close"]),
        low: parseFloat(values["3. low"] || values["4. close"]),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days for better visualization
  },
  
  /**
   * Fetches the user's watchlist from the backend.
   */
  async getWatchlist(): Promise<WatchlistItem[]> {
    const response = await apiClient.get<WatchlistItem[]>(`/watchlist/`);
    return response.data;
  },

  /**
   * Adds a stock to the user's watchlist.
   */
  async addToWatchlist(symbol: string): Promise<void> {
    await apiClient.post("/watchlist/", { symbol });
  },

  /**
   * Removes a stock from the user's watchlist.
   */
  async removeFromWatchlist(symbol: string): Promise<void> {
    await apiClient.delete(`/watchlist/${symbol}`);
  },

  /**
   * Fetches the user's portfolio from the backend.
   */
  async getPortfolio(): Promise<PortfolioItem[]> {
    const response = await apiClient.get<PortfolioItem[]>(`/portfolio/`);
    return response.data;
  },

  /**
   * Adds a stock to the user's portfolio.
   */
  async addToPortfolio(symbol: string, quantity: number, averagePrice: number): Promise<void> {
    await apiClient.post("/portfolio/", { symbol, quantity, average_price: averagePrice });
  },

  /**
   * Removes a stock from the user's portfolio.
   */
  async removeFromPortfolio(symbol: string): Promise<void> {
    await apiClient.delete(`/portfolio/${symbol}`);
  },

  /**
   * Fetches technical indicators for a stock.
   * @param symbol The stock symbol
   * @param indicatorType Type of indicators: 'all', 'sma', 'ema', 'rsi', 'macd', 'bollinger', or 'stochastic'
   */
  async getStockIndicators(symbol: string, indicatorType: string = 'all'): Promise<IndicatorData> {
    const response = await apiClient.get<IndicatorData>(`/stock/${symbol}/indicators`, {
      params: { indicator_type: indicatorType }
    });
    return response.data;
  },

  /**
   * Get all indicators for a stock (convenience method)
   */
  async getAllIndicators(symbol: string): Promise<IndicatorData> {
    return this.getStockIndicators(symbol, 'all');
  },

  /**
   * Get SMA indicators (20, 50, 200)
   */
  async getSMAIndicators(symbol: string): Promise<IndicatorData> {
    return this.getStockIndicators(symbol, 'sma');
  },

  /**
   * Get RSI indicator
   */
  async getRSIIndicator(symbol: string): Promise<IndicatorData> {
    return this.getStockIndicators(symbol, 'rsi');
  },

  /**
   * Get MACD indicator
   */
  async getMACDIndicator(symbol: string): Promise<IndicatorData> {
    return this.getStockIndicators(symbol, 'macd');
  },

  /**
   * Get Bollinger Bands indicator
   */
  async getBollingerIndicator(symbol: string): Promise<IndicatorData> {
    return this.getStockIndicators(symbol, 'bollinger');
  },

  /**
   * Fetches OHLC candlestick data for a stock
   * @param symbol The stock symbol
   * @param days Number of days (1-365)
   */
  async getCandleData(symbol: string, days: number = 30): Promise<CandleStickData> {
    const response = await apiClient.get<CandleStickData>(`/stock/${symbol}/candlestick`, {
      params: { days }
    });
    return response.data;
  },

  /**
   * Create a price alert for a stock
   */
  async createAlert(data: {
    symbol: string;
    alert_type: 'above' | 'below' | 'change_percent';
    threshold_price?: number;
    change_percent?: number;
  }): Promise<Alert> {
    const response = await apiClient.post<Alert>(`/stock/alerts`, {
      symbol: data.symbol,
      alert_type: data.alert_type,
      threshold_price: data.threshold_price,
      change_percent: data.change_percent,
    });
    return response.data;
  },

  /**
   * Get all alerts for the current user
   */
  async getAlerts(): Promise<Alert[]> {
    const response = await apiClient.get<Alert[]>(`/stock/alerts`);
    return response.data;
  },

  /**
   * Get a specific alert by ID
   */
  async getAlert(alertId: number): Promise<Alert> {
    const response = await apiClient.get<Alert>(`/stock/alerts/${alertId}`);
    return response.data;
  },

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/stock/alerts/${alertId}`);
    return response.data;
  },

  /**
   * Toggle alert active/inactive status
   */
  async toggleAlert(alertId: number): Promise<Alert> {
    const response = await apiClient.patch<Alert>(`/stock/alerts/${alertId}/toggle`);
    return response.data;
  },

  /**
   * Reset alert triggered status
   */
  async resetAlert(alertId: number): Promise<Alert> {
    const response = await apiClient.patch<Alert>(`/stock/alerts/${alertId}/reset`);
    return response.data;
  },

  /**
   * Get transaction history with optional filters
   */
  async getTransactions(params?: {
    symbol?: string;
    transaction_type?: string;
    days?: number;
  }): Promise<Transaction[]> {
    const response = await apiClient.get<Transaction[]>('/transactions/', { params });
    return response.data;
  },

  /**
   * Get transaction summary statistics
   */
  async getTransactionSummary(): Promise<TransactionSummary> {
    const response = await apiClient.get<TransactionSummary>('/transactions/summary');
    return response.data;
  },

  /**
   * Get a specific transaction
   */
  async getTransaction(id: number): Promise<Transaction> {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: number): Promise<void> {
    await apiClient.delete(`/transactions/${id}`);
  },

  /**
   * Export transactions as CSV
   */
  async exportTransactionsCSV(): Promise<void> {
    const response = await apiClient.get('/transactions/export/csv', {
      responseType: 'blob',
    });
    
    // Create a blob URL and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  },
};

