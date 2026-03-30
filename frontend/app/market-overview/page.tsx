"use client"

import React from "react"
import { MarketOverview } from "@/components/MarketOverview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function MarketOverviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Market Overview</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Track macro indicators, commodities, and major FX pairs in one consolidated macro dashboard.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        <MarketOverview />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Economic Indicators</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Track key macroeconomic data including unemployment rates, inflation,
              GDP growth, and interest rates to make informed investment decisions.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Commodities</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Monitor precious metals (gold, silver), energy (oil, gas), and
              agricultural products. Essential for inflation hedging strategies.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Forex Rates</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Track major currency pairs (USD, EUR, GBP, JPY) and their daily
              changes. Important for global portfolio analysis.
            </CardContent>
          </Card>
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-xl">Why Monitor Global Markets?</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Understand macroeconomic context for investments</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Identify inflation risks through commodity trends</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Diversify into different asset classes</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span>
                <span>Make informed international investment decisions</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
