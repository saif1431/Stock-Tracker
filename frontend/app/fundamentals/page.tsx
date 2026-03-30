"use client"

import React, { useState } from "react"
import { FundamentalsPanel } from "@/components/FundamentalsPanel"
import { NewsFeed } from "@/components/NewsFeed"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"

export default function FundamentalsPage() {
  const [searchSymbol, setSearchSymbol] = useState("")
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchSymbol.trim()) {
      setSelectedSymbol(searchSymbol.toUpperCase())
      setSearchSymbol("")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Company Fundamentals</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Research valuation, profitability, and business quality metrics with curated market context.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search symbol like AAPL, MSFT, NVDA"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              />
              <Button type="submit" className="gap-2 sm:w-auto w-full">
                <Search size={16} />
                Load Fundamentals
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FundamentalsPanel symbol={selectedSymbol} />
          </div>
          <div>
            <NewsFeed symbol={selectedSymbol} />
          </div>
        </div>
      </div>
    </div>
  )
}
