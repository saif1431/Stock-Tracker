import apiClient from "@/lib/apiClient"

export interface AdminDashboard {
  total_users: number
  active_users: number
  banned_users: number
  total_transactions: number
  portfolio_positions: number
  api_usage?: {
    total_requests: number
    error_requests: number
    error_rate_percent: number
    average_response_ms: number
    api_calls_24h: number
    top_endpoints: Array<{
      endpoint: string
      count: number
      errors: number
      avg_ms: number
    }>
  }
  system_health?: {
    database_connected: boolean
    database_size_mb: number | null
    cache_connected: boolean
  }
  requested_by: string
}

export interface AdminUser {
  id: number
  username: string
  email: string
  is_active: boolean
  is_admin: boolean
  is_banned: boolean
  ban_reason?: string | null
  subscription?: string | null
  two_fa_enabled?: boolean
}

export interface AdminUsersQuery {
  skip?: number
  limit?: number
  search?: string
  sortBy?: "id" | "username" | "email" | "is_active" | "is_admin" | "is_banned" | "subscription"
  sortDir?: "asc" | "desc"
}

export interface AdminActionResponse {
  message: string
  user_id: number
}

export interface AdminLogQuery {
  limit?: number
  action?: string
  adminId?: number
  targetUserId?: number
}

export interface AdminLog {
  id: number
  admin_id: number
  action: string
  target_user_id?: number | null
  details?: string | null
  created_at: string
}

export const adminService = {
  async getDashboard(): Promise<AdminDashboard> {
    const response = await apiClient.get<AdminDashboard>("/admin/dashboard")
    return response.data
  },

  async getUsers(params: AdminUsersQuery = {}): Promise<AdminUser[]> {
    const query = new URLSearchParams()
    query.set("skip", String(params.skip ?? 0))
    query.set("limit", String(params.limit ?? 20))
    if (params.search && params.search.trim()) {
      query.set("search", params.search.trim())
    }
    if (params.sortBy) {
      query.set("sort_by", params.sortBy)
    }
    if (params.sortDir) {
      query.set("sort_dir", params.sortDir)
    }

    const response = await apiClient.get<AdminUser[]>(`/admin/users?${query.toString()}`)
    return response.data
  },

  async getLogs(params: AdminLogQuery = {}): Promise<AdminLog[]> {
    const query = new URLSearchParams()
    query.set("limit", String(params.limit ?? 20))
    if (params.action) {
      query.set("action", params.action)
    }
    if (params.adminId !== undefined) {
      query.set("admin_id", String(params.adminId))
    }
    if (params.targetUserId !== undefined) {
      query.set("target_user_id", String(params.targetUserId))
    }

    const response = await apiClient.get<AdminLog[]>(`/admin/logs?${query.toString()}`)
    return response.data
  },

  getLogsExportUrl(params: AdminLogQuery = {}): string {
    const query = new URLSearchParams()
    query.set("limit", String(params.limit ?? 500))
    if (params.action) {
      query.set("action", params.action)
    }
    if (params.adminId !== undefined) {
      query.set("admin_id", String(params.adminId))
    }
    if (params.targetUserId !== undefined) {
      query.set("target_user_id", String(params.targetUserId))
    }
    return `/admin/logs/export?${query.toString()}`
  },

  async banUser(userId: number, reason: string): Promise<AdminActionResponse> {
    const response = await apiClient.post<AdminActionResponse>(`/admin/users/${userId}/ban`, { reason })
    return response.data
  },

  async unbanUser(userId: number): Promise<AdminActionResponse> {
    const response = await apiClient.post<AdminActionResponse>(`/admin/users/${userId}/unban`)
    return response.data
  },

  async resetUserPassword(userId: number, newPassword: string): Promise<AdminActionResponse> {
    const response = await apiClient.post<AdminActionResponse>(`/admin/users/${userId}/reset-password`, {
      new_password: newPassword,
    })
    return response.data
  },

  async deactivateUser(userId: number): Promise<AdminActionResponse> {
    const response = await apiClient.post<AdminActionResponse>(`/admin/users/${userId}/deactivate`)
    return response.data
  },

  async reactivateUser(userId: number): Promise<AdminActionResponse> {
    const response = await apiClient.post<AdminActionResponse>(`/admin/users/${userId}/reactivate`)
    return response.data
  },
}
