import apiClient from "@/lib/apiClient"

export interface TwoFASetupResponse {
  secret: string
  qr_code: string
  backup_codes: string[]
}

export interface TwoFAEnableResponse {
  status: "enabled"
  backup_codes: string[]
}

export interface TwoFADisableResponse {
  status: "disabled"
}

export const twoFaService = {
  async setup(): Promise<TwoFASetupResponse> {
    const response = await apiClient.post<TwoFASetupResponse>("/auth/2fa/setup")
    return response.data
  },

  async enable(secret: string, token: string): Promise<TwoFAEnableResponse> {
    const response = await apiClient.post<TwoFAEnableResponse>("/auth/2fa/enable", { secret, token })
    return response.data
  },

  async disable(token: string): Promise<TwoFADisableResponse> {
    const response = await apiClient.post<TwoFADisableResponse>("/auth/2fa/disable", { token })
    return response.data
  },
}
