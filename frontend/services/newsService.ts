import apiClient from "@/lib/apiClient"

export interface News {
  id: number
  symbol: string | null
  title: string
  summary: string
  source: string
  source_url: string
  image_url: string | null
  published_date: string
  sentiment: string | null
  relevance_score: number | null
  cached_at: string
}

export const newsService = {
  async getStockNews(
    symbol: string,
    limit: number = 20,
    days: number = 7
  ): Promise<News[]> {
    const response = await apiClient.get(`/api/news/stock/${symbol}`, {
      params: { limit, days },
    })
    return response.data
  },

  async getMarketNews(limit: number = 20, days: number = 7): Promise<News[]> {
    const response = await apiClient.get("/api/news/market", {
      params: { limit, days },
    })
    return response.data
  },

  async getTrendingNews(limit: number = 10): Promise<News[]> {
    const response = await apiClient.get("/api/news/trending", { params: { limit } })
    return response.data
  },

  async getNewsBySentiment(sentiment: string, limit: number = 20): Promise<News[]> {
    const response = await apiClient.get(`/api/news/sentiment/${sentiment}`, {
      params: { limit },
    })
    return response.data
  },
}
