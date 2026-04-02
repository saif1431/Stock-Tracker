"use client"

import React from "react"
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
    <Card className="h-full border-slate-700 bg-slate-800/70 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <Star className="w-5 h-5 text-blue-400" />
          Watchlist
        </CardTitle>
        <CardDescription className="text-slate-400">{items.length} stocks</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No stocks in your watchlist yet. Add one to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.symbol}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  currentStock === item.symbol
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 bg-slate-900/40 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectStock(item.symbol)}
                    className="flex-1 text-left"
                  >
                    <p className="data-num text-sm font-semibold text-slate-100">{item.symbol}</p>
                    <p className="data-num text-xs text-slate-400">
                      ${item.price.toFixed(2)}
                    </p>
                  </button>
                  <button
                    onClick={() => onRemoveStock(item.symbol)}
                    className="rounded p-1 transition-colors hover:bg-red-500/10"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
                <div className={`data-num mt-1 text-xs font-semibold ${
                  item.change >= 0 ? "text-green-500" : "text-red-500"
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
