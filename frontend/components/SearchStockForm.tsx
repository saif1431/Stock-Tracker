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
    <Card className="border-slate-700 bg-slate-800/70 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-slate-100">Search Stock</CardTitle>
        <CardDescription className="text-slate-400">Enter ticker symbols to load real-time pricing and indicators.</CardDescription>
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
              className="data-num w-full border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500"
            />
            {showAutocomplete && symbol.length > 0 && filteredSymbols.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-lg">
                {filteredSymbols.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelectSymbol(s)}
                    className="data-num w-full px-4 py-2 text-left text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
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
            className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
          >
            <Search className="w-4 h-4" />
            {isLoading ? "Loading..." : "Search"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
