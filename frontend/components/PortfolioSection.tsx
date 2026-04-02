import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, DollarSign } from "lucide-react"

export interface PortfolioItem {
  id: number;
  symbol: string;
  quantity: number;
  average_price: number;
  current_price?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
}

interface PortfolioSectionProps {
  items: PortfolioItem[]
  onRemove: (symbol: string) => void
  onSelect: (symbol: string) => void
}

export function PortfolioSection({ items, onRemove, onSelect }: PortfolioSectionProps) {
  const totalInvested = items.reduce((acc, item) => acc + (item.quantity * item.average_price), 0)
  const totalValue = items.reduce((acc, item) => acc + (item.quantity * (item.current_price || item.average_price)), 0)
  const totalProfitLoss = totalValue - totalInvested

  return (
    <Card className="w-full border-slate-700 bg-slate-800/70 shadow-none">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="w-full">
          <CardTitle className="text-lg font-bold text-slate-100 sm:text-xl">Your Portfolio</CardTitle>
          <CardDescription className="text-xs text-slate-400 sm:text-sm">Position overview and realized/unrealized performance</CardDescription>
        </div>
        <div className="shrink-0 rounded-lg border border-slate-700 bg-slate-900 p-2">
          <DollarSign className="h-5 w-5 text-blue-400" />
        </div>
      </CardHeader>
      <CardContent className="w-full">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground italic text-sm">No holdings yet. Start by buying some stocks!</p>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 sm:p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Invested</p>
                <p className="data-num mt-1 text-lg font-bold text-slate-100 sm:text-xl">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="rounded-xl border border-blue-500/60 bg-blue-500/10 p-3 sm:p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-blue-300">Current Value</p>
                <p className="data-num mt-1 text-lg font-bold text-blue-300 sm:text-xl">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className={`rounded-xl border p-3 sm:p-4 ${totalProfitLoss >= 0 ? "border-green-500/60 bg-green-500/10" : "border-red-500/60 bg-red-500/10"}`}>
                <p className={`text-xs font-medium uppercase tracking-wider ${totalProfitLoss >= 0 ? "text-green-400" : "text-red-400"}`}>Profit/Loss</p>
                <p className={`data-num mt-1 text-lg font-bold sm:text-xl ${totalProfitLoss >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {totalProfitLoss >= 0 ? "+" : ""}{totalProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="w-full overflow-x-auto rounded-md border border-slate-700">
              <table className="w-full text-xs sm:text-sm">
                <thead className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium text-slate-300 sm:px-4">Symbol</th>
                    <th className="hidden px-2 py-2 text-right font-medium text-slate-300 sm:table-cell sm:px-4">Qty</th>
                    <th className="hidden px-2 py-2 text-right font-medium text-slate-300 md:table-cell sm:px-4">Avg Price</th>
                    <th className="px-2 py-2 text-right font-medium text-slate-300 sm:px-4">Current</th>
                    <th className="px-2 py-2 text-right font-medium text-slate-300 sm:px-4">P&L</th>
                    <th className="w-8 px-2 py-2 sm:w-12 sm:px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {items.map((item) => (
                    <TableRow 
                        key={item.symbol} 
                        item={item} 
                        onSelect={onSelect} 
                        onRemove={onRemove} 
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function TableRow({ item, onSelect, onRemove }: { item: PortfolioItem, onSelect: (s: string) => void, onRemove: (s: string) => void }) {
    const profitLoss = item.profit_loss || 0
    const isProfitable = profitLoss >= 0
    
    return (
        <tr className="group cursor-pointer transition-colors odd:bg-slate-800 even:bg-slate-900 hover:bg-slate-700/60" onClick={() => onSelect(item.symbol)}>
            <td className="data-num px-2 py-3 text-sm font-bold text-slate-100 sm:px-4 sm:text-base">{item.symbol}</td>
            <td className="data-num hidden px-2 py-3 text-right text-xs text-slate-200 sm:table-cell sm:px-4 sm:text-sm">{item.quantity.toFixed(2)}</td>
            <td className="data-num hidden px-2 py-3 text-right text-xs text-slate-200 md:table-cell sm:px-4 sm:text-sm">${item.average_price.toFixed(2)}</td>
            <td className="data-num px-2 py-3 text-right text-xs font-medium text-slate-200 sm:px-4 sm:text-sm">${(item.current_price || item.average_price).toFixed(2)}</td>
            <td className={`data-num px-2 py-3 text-right text-xs font-medium sm:px-4 sm:text-sm ${isProfitable ? "text-green-500" : "text-red-500"}`}>
              <div className="whitespace-nowrap">
                ${profitLoss.toFixed(2)}
              </div>
              <div className="text-xs opacity-75">
                ({(item.profit_loss_percent || 0).toFixed(1)}%)
              </div>
            </td>
            <td className="px-2 sm:px-4 py-3" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemove(item.symbol)}
                    title="Remove from portfolio"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </td>
        </tr>
    )
}
