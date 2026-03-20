"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface StockSearchProps {
  onSearch: (symbol: string) => void
  placeholder?: string
}

export function StockSearch({ onSearch, placeholder = "Search stock symbol..." }: StockSearchProps) {
  const [symbol, setSymbol] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (symbol.trim()) {
      onSearch(symbol.trim().toUpperCase())
    }
  }

  return (
    <form 
      onSubmit={handleSearch} 
      className="flex w-full max-w-sm items-center space-x-2"
    >
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="pl-9"
        />
      </div>
      <Button type="submit">Search</Button>
    </form>
  )
}
