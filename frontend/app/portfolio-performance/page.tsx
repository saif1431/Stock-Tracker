"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts"

import { useAuth } from "@/hooks/useAuth"
import { analyticsService, PortfolioPerformanceResponse } from "@/services/analyticsService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PortfolioPerformancePage() {
  const { loading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<PortfolioPerformanceResponse | null>(null)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const response = await analyticsService.getPortfolioPerformance()
        setData(response)
      } finally {
        setIsFetching(false)
      }
    }

    run()
  }, [])

  if (loading || isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const metrics = data?.metrics

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Portfolio Performance</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Analyze returns, risk metrics, benchmark comparison, and monthly performance snapshots.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Current Value</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">${metrics?.current_value?.toLocaleString() || "0"}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Total Return</CardTitle></CardHeader>
            <CardContent className={`text-2xl font-bold ${(metrics?.total_return_pct || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
              {(metrics?.total_return_pct || 0).toFixed(2)}%
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Sharpe Ratio</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{(metrics?.sharpe_ratio || 0).toFixed(2)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Max Drawdown</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold text-amber-500">{(metrics?.max_drawdown_pct || 0).toFixed(2)}%</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Portfolio Value Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.history || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="portfolio_value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Monthly Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.monthly_returns || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="return_pct" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Benchmark Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                Compare your portfolio against SPY over the same horizon.
              </p>
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex justify-between"><span>Portfolio Annualized Return</span><span className="font-semibold text-foreground">{(metrics?.annualized_return_pct || 0).toFixed(2)}%</span></div>
                <div className="flex justify-between"><span>SPY Return</span><span className="font-semibold text-foreground">{metrics?.benchmark_return_pct?.toFixed(2) ?? "N/A"}%</span></div>
                <div className="flex justify-between"><span>Invested Capital</span><span className="font-semibold text-foreground">${metrics?.invested_capital?.toLocaleString() || "0"}</span></div>
              </div>
              <button onClick={() => router.push('/dashboard')} className="text-primary hover:underline">Back to Dashboard</button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
