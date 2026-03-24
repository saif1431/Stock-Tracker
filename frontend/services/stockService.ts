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
  async getWatchlist(): Promise<any[]> {
    const response = await apiClient.get(`/watchlist/`);
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
  async getPortfolio(): Promise<any[]> {
    const response = await apiClient.get(`/portfolio/`);
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
  async getStockIndicators(symbol: string, indicatorType: string = 'all'): Promise<any> {
    const response = await apiClient.get(`/stock/${symbol}/indicators`, {
      params: { indicator_type: indicatorType }
    });
    return response.data;
  },

  /**
   * Get all indicators for a stock (convenience method)
   */
  async getAllIndicators(symbol: string): Promise<any> {
    return this.getStockIndicators(symbol, 'all');
  },

  /**
   * Get SMA indicators (20, 50, 200)
   */
  async getSMAIndicators(symbol: string): Promise<any> {
    return this.getStockIndicators(symbol, 'sma');
  },

  /**
   * Get RSI indicator
   */
  async getRSIIndicator(symbol: string): Promise<any> {
    return this.getStockIndicators(symbol, 'rsi');
  },

  /**
   * Get MACD indicator
   */
  async getMACDIndicator(symbol: string): Promise<any> {
    return this.getStockIndicators(symbol, 'macd');
  },

  /**
   * Get Bollinger Bands indicator
   */
  async getBollingerIndicator(symbol: string): Promise<any> {
    return this.getStockIndicators(symbol, 'bollinger');
  },

  /**
   * Fetches OHLC candlestick data for a stock
   * @param symbol The stock symbol
   * @param days Number of days (1-365)
   */
  async getCandleData(symbol: string, days: number = 30): Promise<any> {
    const response = await apiClient.get(`/stock/${symbol}/candlestick`, {
      params: { days }
    });
    return response.data;
  },
};
