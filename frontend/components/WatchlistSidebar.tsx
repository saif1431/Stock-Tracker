"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Trash2 } from "lucide-react"

interface WatchlistItem {
  symbol: string
  price: number
  change: number
  changePercent: number
}

interface WatchlistSidebarProps {
  items: WatchlistItem[]
  onSelectStock: (symbol: string) => void
  onRemoveStock: (symbol: string) => void
  currentStock?: string
}

export function WatchlistSidebar({
  items,
  onSelectStock,
  onRemoveStock,
  currentStock,
}: WatchlistSidebarProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Watchlist
        </CardTitle>
        <CardDescription>{items.length} stocks</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No stocks in your watchlist yet. Add one to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.symbol}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  currentStock === item.symbol
                    ? "bg-primary/10 border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectStock(item.symbol)}
                    className="flex-1 text-left"
                  >
                    <p className="font-semibold text-sm">{item.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      ${item.price.toFixed(2)}
                    </p>
                  </button>
                  <button
                    onClick={() => onRemoveStock(item.symbol)}
                    className="p-1 hover:bg-destructive/10 rounded transition-colors"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
                <div className={`text-xs font-medium mt-1 ${
                  item.change >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
