"use client"

import React, { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

import { useAuth } from "@/hooks/useAuth"
import { analyticsService, AssetAllocationResponse } from "@/services/analyticsService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = ["#14b8a6", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"]

export default function AssetAllocationPage() {
  const { loading } = useAuth()
  const [data, setData] = useState<AssetAllocationResponse | null>(null)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const response = await analyticsService.getAssetAllocation()
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

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Asset Allocation</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            View your portfolio concentration by sector and holdings with diversification scoring.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Total Portfolio Value</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">${data?.total_value?.toLocaleString() || "0"}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Diversification Score</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{data?.diversification_score?.toFixed(2) || "0"}/100</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Tracked Sectors</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold">{data?.sector_allocation?.length || 0}</CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Sector Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.sector_allocation || []} dataKey="value" nameKey="name" outerRadius={120} label>
                      {(data?.sector_allocation || []).map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Top Holdings Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.holding_allocation?.slice(0, 10) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="symbol" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
