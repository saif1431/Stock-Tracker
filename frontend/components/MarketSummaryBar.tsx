"use client"

import { useMemo } from "react"

interface IndexItem {
  name: string
  value: number
  changePercent: number
}

interface MarketSummaryBarProps {
  loading?: boolean
}

const MOCK_INDICES: IndexItem[] = [
  { name: "S&P 500", value: 5278.62, changePercent: 0.41 },
  { name: "NASDAQ", value: 16418.35, changePercent: -0.28 },
  { name: "DOW", value: 39221.88, changePercent: 0.17 },
]

export function MarketSummaryBar({ loading = false }: MarketSummaryBarProps) {
  const indices = useMemo(() => MOCK_INDICES, [])

  return (
    <section className="sticky top-16 z-30 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="h-10 w-full animate-pulse rounded-md bg-slate-700/60" />
            <div className="h-10 w-full animate-pulse rounded-md bg-slate-700/60" />
            <div className="h-10 w-full animate-pulse rounded-md bg-slate-700/60" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {indices.map((index) => {
              const positive = index.changePercent >= 0
              return (
                <div
                  key={index.name}
                  className="rounded-md border border-slate-700 bg-slate-800/70 px-3 py-2"
                >
                  <div className="text-xs text-slate-400">{index.name}</div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-2">
                    <span className="data-num text-sm font-semibold text-slate-100">
                      {index.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className={`data-num text-xs font-semibold ${positive ? "text-green-500" : "text-red-500"}`}>
                      {positive ? "+" : ""}
                      {index.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
