import apiClient from "@/lib/apiClient"

export interface CapitalGainItem {
  symbol: string
  purchase_date: string
  sale_date: string
  quantity: number
  cost_basis: number
  proceeds: number
  gain_loss: number
  holding_period: "short-term" | "long-term"
  wash_sale: boolean
}

export interface CapitalGainsResponse {
  year: number
  short_term_gains: number
  long_term_gains: number
  total_gain: number
  transactions_count: number
  gains: CapitalGainItem[]
}

export interface TaxSummaryResponse {
  year: number
  short_term_gains: number
  long_term_gains: number
  total_gain: number
  total_losses: number
  wash_sale_count: number
}

export interface Form8949Row {
  description: string
  date_acquired: string
  date_sold: string
  proceeds: number
  cost_basis: number
  adjustment_code: string | null
  gain_or_loss: number
  category: "short" | "long"
}

export interface Form8949Response {
  year: number
  rows: Form8949Row[]
}

export interface HarvestOpportunity {
  symbol: string
  quantity: number
  average_cost: number
  current_price: number
  cost_basis: number
  current_value: number
  potential_loss: number
}

export interface HarvestingResponse {
  count: number
  opportunities: HarvestOpportunity[]
}

export const taxService = {
  async getCapitalGains(year: number): Promise<CapitalGainsResponse> {
    const response = await apiClient.get<CapitalGainsResponse>(`/tax/capital-gains/${year}`)
    return response.data
  },

  async getSummary(year: number): Promise<TaxSummaryResponse> {
    const response = await apiClient.get<TaxSummaryResponse>(`/tax/summary/${year}`)
    return response.data
  },

  async getForm8949(year: number): Promise<Form8949Response> {
    const response = await apiClient.get<Form8949Response>(`/tax/form-8949/${year}`)
    return response.data
  },

  async getHarvesting(): Promise<HarvestingResponse> {
    const response = await apiClient.get<HarvestingResponse>("/tax/harvesting-opportunities")
    return response.data
  },

  async downloadCsv(year: number): Promise<Blob> {
    const response = await apiClient.get(`/tax/export/${year}`, { responseType: "blob" })
    return response.data as Blob
  },

  async downloadPdf(year: number): Promise<Blob> {
    const response = await apiClient.get(`/tax/export/${year}/pdf`, { responseType: "blob" })
    return response.data as Blob
  },
}
