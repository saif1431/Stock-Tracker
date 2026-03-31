"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { adminService, AdminDashboard, AdminUser, AdminLog } from "@/services/adminService"
import { Button } from "@/components/ui/button"
import apiClient from "@/lib/apiClient"

interface HttpLikeError {
  status?: number
  message?: string
  response?: {
    status?: number
  }
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export default function AdminPage() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"id" | "username" | "email" | "is_active" | "is_admin" | "is_banned" | "subscription">("id")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [actionStatus, setActionStatus] = useState<string | null>(null)
  const [logActionFilter, setLogActionFilter] = useState("")

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setActionStatus(null)

    try {
      const [dashboardData, usersData, logsData] = await Promise.all([
        adminService.getDashboard(),
        adminService.getUsers({
          skip: (page - 1) * limit,
          limit,
          search,
          sortBy,
          sortDir,
        }),
        adminService.getLogs({
          limit: 15,
          action: logActionFilter || undefined,
        }),
      ])

      setDashboard(dashboardData)
      setUsers(usersData)
      setLogs(logsData)
    } catch (err: unknown) {
      const parsedError = err as HttpLikeError
      const status = parsedError.status ?? parsedError.response?.status
      if (status === 401) {
        setError("You are not logged in. Please log in again.")
      } else if (status === 403) {
        setError("Access denied. This page is only for admin users.")
      } else {
        setError(parsedError.message || "Failed to load admin dashboard")
      }
    } finally {
      setLoading(false)
    }
  }, [limit, page, search, sortBy, sortDir, logActionFilter])

  const runAction = async (work: () => Promise<{ message: string }>) => {
    try {
      setActionStatus(null)
      await work()
      setActionStatus("Action completed successfully")
      await loadData()
    } catch (err: unknown) {
      const parsedError = err as HttpLikeError
      setError(parsedError.message || "Action failed")
    }
  }

  const handleBan = async (user: AdminUser) => {
    const reason = window.prompt(`Enter ban reason for ${user.username}`, "Policy violation")
    if (!reason || reason.trim().length < 3) {
      return
    }
    await runAction(() => adminService.banUser(user.id, reason.trim()))
  }

  const handleUnban = async (user: AdminUser) => {
    if (!window.confirm(`Unban ${user.username}?`)) {
      return
    }
    await runAction(() => adminService.unbanUser(user.id))
  }

  const handleResetPassword = async (user: AdminUser) => {
    const newPassword = window.prompt(`Enter a new password for ${user.username} (min 8 chars)`, "")
    if (!newPassword || newPassword.length < 8) {
      return
    }
    await runAction(() => adminService.resetUserPassword(user.id, newPassword))
  }

  const handleDeactivate = async (user: AdminUser) => {
    if (!window.confirm(`Deactivate ${user.username}?`)) {
      return
    }
    await runAction(() => adminService.deactivateUser(user.id))
  }

  const handleReactivate = async (user: AdminUser) => {
    if (!window.confirm(`Reactivate ${user.username}?`)) {
      return
    }
    await runAction(() => adminService.reactivateUser(user.id))
  }

  const handleExportLogs = async () => {
    try {
      const url = adminService.getLogsExportUrl({
        limit: 500,
        action: logActionFilter || undefined,
      })
      const response = await apiClient.get(url, { responseType: "blob" })
      const blob = response.data as Blob
      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = objectUrl
      anchor.download = "admin_logs.csv"
      anchor.click()
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export logs")
    }
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitor users, activity, and admin actions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          <Button onClick={loadData}>Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border p-6 bg-card">Loading admin data...</div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && actionStatus ? (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">
          {actionStatus}
        </div>
      ) : null}

      {!loading && !error && dashboard ? (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="rounded-lg border border-border p-4 bg-card">
              <p className="text-xs text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{dashboard.total_users}</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-card">
              <p className="text-xs text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{dashboard.active_users}</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-card">
              <p className="text-xs text-muted-foreground">Banned Users</p>
              <p className="text-2xl font-bold">{dashboard.banned_users}</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-card">
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{dashboard.total_transactions}</p>
            </div>
            <div className="rounded-lg border border-border p-4 bg-card">
              <p className="text-xs text-muted-foreground">Portfolio Positions</p>
              <p className="text-2xl font-bold">{dashboard.portfolio_positions}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4 bg-card space-y-2">
              <h2 className="font-semibold">System Health</h2>
              <p className="text-sm">Database: <span className="font-medium">{dashboard.system_health?.database_connected ? "Connected" : "Disconnected"}</span></p>
              <p className="text-sm">Cache: <span className="font-medium">{dashboard.system_health?.cache_connected ? "Connected" : "Disconnected"}</span></p>
              <p className="text-sm">Database Size: <span className="font-medium">{dashboard.system_health?.database_size_mb ?? "N/A"} MB</span></p>
            </div>

            <div className="rounded-lg border border-border p-4 bg-card space-y-2">
              <h2 className="font-semibold">API Usage</h2>
              <p className="text-sm">Total Requests: <span className="font-medium">{dashboard.api_usage?.total_requests ?? 0}</span></p>
              <p className="text-sm">24h Calls: <span className="font-medium">{dashboard.api_usage?.api_calls_24h ?? 0}</span></p>
              <p className="text-sm">Avg Response: <span className="font-medium">{dashboard.api_usage?.average_response_ms ?? 0} ms</span></p>
              <p className="text-sm">Error Rate: <span className="font-medium">{dashboard.api_usage?.error_rate_percent ?? 0}%</span></p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">Top Endpoints</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Endpoint</th>
                    <th className="text-left p-3">Count</th>
                    <th className="text-left p-3">Errors</th>
                    <th className="text-left p-3">Avg (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboard.api_usage?.top_endpoints || []).map((item) => (
                    <tr key={item.endpoint} className="border-t border-border">
                      <td className="p-3">{item.endpoint}</td>
                      <td className="p-3">{item.count}</td>
                      <td className="p-3">{item.errors}</td>
                      <td className="p-3">{item.avg_ms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Users</h2>
              <p className="text-xs text-muted-foreground">Showing {users.length} users</p>
            </div>
            <div className="p-4 border-b border-border flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
                placeholder="Search by username or email"
                className="h-10 min-w-72 rounded-md border border-border bg-background px-3 text-sm"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="id">Sort: ID</option>
                <option value="username">Sort: Username</option>
                <option value="email">Sort: Email</option>
                <option value="is_active">Sort: Active</option>
                <option value="is_banned">Sort: Banned</option>
              </select>
              <select
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">Username</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Subscription</th>
                    <th className="text-left p-3">Flags</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-border">
                      <td className="p-3">{user.id}</td>
                      <td className="p-3">{user.username}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.subscription || "free"}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-2">
                          {user.is_admin ? "admin" : "user"}
                          {user.is_banned ? "| banned" : "| not banned"}
                          {user.is_active ? "| active" : "| inactive"}
                          {user.two_fa_enabled ? "| 2FA" : ""}
                        </span>
                      </td>
                      <td className="p-3">
                        {user.is_admin ? (
                          <span className="text-xs text-muted-foreground">Protected admin</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {user.is_banned ? (
                              <Button size="sm" variant="outline" onClick={() => handleUnban(user)}>Unban</Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleBan(user)}>Ban</Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleResetPassword(user)}>Reset Password</Button>
                            {user.is_active ? (
                              <Button size="sm" variant="outline" onClick={() => handleDeactivate(user)}>Deactivate</Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleReactivate(user)}>Reactivate</Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Page {page}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={users.length < limit}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Recent Admin Actions</h2>
              <div className="flex gap-2">
                <input
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  placeholder="Filter by action"
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
                <Button size="sm" variant="outline" onClick={loadData}>Apply</Button>
                <Button size="sm" onClick={handleExportLogs}>Export CSV</Button>
              </div>
            </div>
            <div className="divide-y divide-border">
              {logs.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No admin actions yet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-muted-foreground">Target User: {log.target_user_id ?? "-"} {log.details ? `| ${log.details}` : ""}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(log.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : null}
    </main>
  )
}
