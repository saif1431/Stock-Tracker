"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

interface SearchStockFormProps {
  onSearch: (symbol: string) => void
  isLoading?: boolean
}

const POPULAR_SYMBOLS = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "META", "NVDA", "NFLX"];

export function SearchStockForm({ onSearch, isLoading = false }: SearchStockFormProps) {
  const [symbol, setSymbol] = useState("")
  const [showAutocomplete, setShowAutocomplete] = useState(false)

  const filteredSymbols = POPULAR_SYMBOLS.filter(s => 
    s.toLowerCase().includes(symbol.toLowerCase()) && s !== symbol.toUpperCase()
  ).slice(0, 5)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (symbol.trim()) {
      onSearch(symbol.toUpperCase())
      setShowAutocomplete(false)
    }
  }

  const handleSelectSymbol = (s: string) => {
    setSymbol(s)
    onSearch(s)
    setShowAutocomplete(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Stock</CardTitle>
        <CardDescription>Enter a stock symbol to view its data</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <div className="flex-1 relative">
            <Input
              placeholder="e.g., AAPL, GOOGL, MSFT"
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value)
                setShowAutocomplete(true)
              }}
              onFocus={() => setShowAutocomplete(true)}
              onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
              disabled={isLoading}
              className="w-full"
            />
            {showAutocomplete && symbol.length > 0 && filteredSymbols.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 overflow-hidden">
                {filteredSymbols.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelectSymbol(s)}
                    className="w-full px-4 py-2 text-left hover:bg-primary/10 transition-colors text-sm font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            {isLoading ? "Loading..." : "Search"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
