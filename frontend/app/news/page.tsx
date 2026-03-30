"use client"

import React from "react"
import { NewsFeed } from "@/components/NewsFeed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Market News</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Follow breaking headlines and sentiment signals to keep your portfolio decisions timely.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Trending News</h2>
            <NewsFeed />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Macro & Market News</h2>
            <NewsFeed marketNews={true} />
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Source Coverage</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>Reuters - Global financial news</li>
                <li>Bloomberg - Market analysis and breaking news</li>
                <li>Financial Times - In-depth market coverage</li>
                <li>MarketWatch - Stock market updates</li>
                <li>Yahoo Finance - General market news</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
