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
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="w-full">
          <CardTitle className="text-lg sm:text-xl font-bold">Your Portfolio</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Manage your stock holdings</CardDescription>
        </div>
        <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
          <DollarSign className="w-5 h-5 text-primary" />
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
              <div className="p-3 sm:p-4 rounded-xl bg-secondary/30 border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Invested</p>
                <p className="text-lg sm:text-xl font-bold mt-1">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-primary/10 border border-primary">
                <p className="text-xs font-medium text-primary uppercase tracking-wider">Current Value</p>
                <p className="text-lg sm:text-xl font-bold text-primary mt-1">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className={`p-3 sm:p-4 rounded-xl border ${totalProfitLoss >= 0 ? "bg-green-500/10 border-green-500" : "bg-red-500/10 border-red-500"}`}>
                <p className={`text-xs font-medium uppercase tracking-wider ${totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>Profit/Loss</p>
                <p className={`text-lg sm:text-xl font-bold mt-1 ${totalProfitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {totalProfitLoss >= 0 ? "+" : ""}{totalProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="w-full overflow-x-auto rounded-md border">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-left font-medium">Symbol</th>
                    <th className="px-2 sm:px-4 py-2 text-right font-medium hidden sm:table-cell">Qty</th>
                    <th className="px-2 sm:px-4 py-2 text-right font-medium hidden md:table-cell">Avg Price</th>
                    <th className="px-2 sm:px-4 py-2 text-right font-medium">Current</th>
                    <th className="px-2 sm:px-4 py-2 text-right font-medium">P&L</th>
                    <th className="px-2 sm:px-4 py-2 w-8 sm:w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
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
    const currentTotal = item.current_price ? item.quantity * item.current_price : item.quantity * item.average_price
    const profitLoss = item.profit_loss || 0
    const isProfitable = profitLoss >= 0
    
    return (
        <tr className="group cursor-pointer hover:bg-muted/70 transition-colors" onClick={() => onSelect(item.symbol)}>
            <td className="px-2 sm:px-4 py-3 font-bold text-sm sm:text-base">{item.symbol}</td>
            <td className="px-2 sm:px-4 py-3 text-right hidden sm:table-cell text-xs sm:text-sm">{item.quantity.toFixed(2)}</td>
            <td className="px-2 sm:px-4 py-3 text-right hidden md:table-cell text-xs sm:text-sm">${item.average_price.toFixed(2)}</td>
            <td className="px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium">${(item.current_price || item.average_price).toFixed(2)}</td>
            <td className={`px-2 sm:px-4 py-3 text-right text-xs sm:text-sm font-medium ${isProfitable ? "text-green-600" : "text-red-600"}`}>
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
