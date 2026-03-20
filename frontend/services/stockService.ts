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
};
