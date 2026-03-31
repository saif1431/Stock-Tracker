import apiClient from "@/lib/apiClient"

export interface RateLimitMetrics {
  tier: string
  limits: {
    per_minute: number
    per_hour: number
  }
  admin_override: boolean
}

export const metricsService = {
  async getRateLimit(): Promise<RateLimitMetrics> {
    const response = await apiClient.get<RateLimitMetrics>("/metrics/rate-limit")
    return response.data
  },
}
