"use client"

import React from "react"
import { SectorComparison } from "@/components/SectorComparison"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SectorPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Sector Performance</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Compare sector strength and monitor index breadth to understand market leadership.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        <SectorComparison showBreadth={true} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">How To Use This View</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="space-y-2">
                <li>• Monitor sector trends and identify opportunities</li>
                <li>• Compare your portfolio allocation to sectors</li>
                <li>• Track major market indices (S&P 500, Nasdaq, etc.)</li>
                <li>• Use market breadth to gauge overall market health</li>
                <li>• Make informed diversification decisions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Market Breadth Explained</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p className="text-sm mb-3">
                Market breadth measures the number of stocks advancing vs declining:
              </p>
              <ul className="space-y-1 text-sm">
                <li>• <span className="text-green-600">Advancing</span> - Stocks going up</li>
                <li>• <span className="text-red-600">Declining</span> - Stocks going down</li>
                <li>• <span className="text-muted-foreground">Unchanged</span> - No movement</li>
                <li>• High advance ratio = Strong market health</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
