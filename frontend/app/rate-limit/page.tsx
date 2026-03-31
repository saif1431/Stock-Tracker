"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { metricsService, RateLimitMetrics } from "@/services/metricsService"

export default function RateLimitPage() {
  const [data, setData] = useState<RateLimitMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await metricsService.getRateLimit()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rate limit metrics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetrics()
  }, [])

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Rate Limit</h1>
          <p className="text-sm text-muted-foreground">View your current tier and request caps.</p>
        </div>
        <Button onClick={loadMetrics} variant="outline">Refresh</Button>
      </div>

      {loading ? <div className="rounded-lg border border-border bg-card p-6">Loading metrics...</div> : null}
      {error ? <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">{error}</div> : null}

      {!loading && !error && data ? (
        <section className="rounded-lg border border-border bg-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Tier</p>
            <p className="text-xl font-semibold uppercase">{data.tier}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Per Minute</p>
            <p className="text-xl font-semibold">{data.limits.per_minute === 0 ? "Unlimited" : data.limits.per_minute}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Per Hour</p>
            <p className="text-xl font-semibold">{data.limits.per_hour === 0 ? "Unlimited" : data.limits.per_hour}</p>
          </div>
          <div className="sm:col-span-3 rounded-md bg-muted/50 p-3 text-sm">
            Admin override: <span className="font-semibold">{data.admin_override ? "Enabled" : "Disabled"}</span>
          </div>
        </section>
      ) : null}
    </main>
  )
}
