"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { paperTradingService, PaperAccount, PaperPerformance } from "@/services/paperTradingService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PaperTradingPage() {
  const { loading } = useAuth()
  const [accounts, setAccounts] = useState<PaperAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [performance, setPerformance] = useState<PaperPerformance | null>(null)
  const [isFetching, setIsFetching] = useState(true)

  const [accountName, setAccountName] = useState("Main Paper Account")
  const [initialBalance, setInitialBalance] = useState(100000)

  const [symbol, setSymbol] = useState("AAPL")
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const loadAccounts = useCallback(async () => {
    const items = await paperTradingService.listAccounts()
    setAccounts(items)
    if (!selectedAccountId && items.length > 0) {
      setSelectedAccountId(items[0].id)
    }
  }, [selectedAccountId])

  const loadPerformance = useCallback(async (accountId: number) => {
    const data = await paperTradingService.getPerformance(accountId)
    setPerformance(data)
  }, [])

  useEffect(() => {
    const run = async () => {
      try {
        await loadAccounts()
      } finally {
        setIsFetching(false)
      }
    }

    run()
  }, [loadAccounts])

  useEffect(() => {
    if (selectedAccountId) {
      loadPerformance(selectedAccountId)
    }
  }, [selectedAccountId, loadPerformance])

  const handleCreate = async () => {
    setError(null)
    try {
      await paperTradingService.createAccount(accountName, initialBalance)
      await loadAccounts()
    } catch {
      setError('Failed to create paper account')
    }
  }

  const handleTrade = async () => {
    if (!selectedAccountId) return
    setError(null)
    try {
      await paperTradingService.placeTrade(selectedAccountId, symbol, side, quantity)
      await loadPerformance(selectedAccountId)
      await loadAccounts()
    } catch {
      setError('Trade failed. Check quantity, cash balance, and symbol.')
    }
  }

  if (loading || isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Paper Trading</h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Simulate trades in a risk-free account with real market prices and live portfolio P&L.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-xl">Create Account</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <input className="w-full rounded-md border bg-background px-3 py-2" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Account name" />
              <input className="w-full rounded-md border bg-background px-3 py-2" type="number" value={initialBalance} onChange={(e) => setInitialBalance(Number(e.target.value))} placeholder="Initial balance" />
              <Button onClick={handleCreate} className="w-full">Create Paper Account</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Place Trade</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select className="w-full rounded-md border bg-background px-3 py-2" value={selectedAccountId || ''} onChange={(e) => setSelectedAccountId(Number(e.target.value))}>
                <option value="">Select account</option>
                {accounts.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
              </select>
              <input className="w-full rounded-md border bg-background px-3 py-2" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="Symbol" />
              <div className="grid grid-cols-2 gap-3">
                <select className="rounded-md border bg-background px-3 py-2" value={side} onChange={(e) => setSide(e.target.value as 'buy' | 'sell')}>
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
                <input className="rounded-md border bg-background px-3 py-2" type="number" min={0.0001} step={0.01} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} placeholder="Quantity" />
              </div>
              <Button onClick={handleTrade} className="w-full">Execute Trade</Button>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Account Metrics</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between"><span>Cash</span><span className="text-foreground font-semibold">${performance?.cash_balance?.toLocaleString() || '0'}</span></div>
              <div className="flex justify-between"><span>Positions Value</span><span className="text-foreground font-semibold">${performance?.positions_value?.toLocaleString() || '0'}</span></div>
              <div className="flex justify-between"><span>Total Equity</span><span className="text-foreground font-semibold">${performance?.total_equity?.toLocaleString() || '0'}</span></div>
              <div className="flex justify-between"><span>Total P&L</span><span className={`font-semibold ${(performance?.total_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{performance?.total_pnl?.toFixed(2) || '0'}</span></div>
              <div className="flex justify-between"><span>P&L %</span><span className={`font-semibold ${(performance?.total_pnl_pct || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{performance?.total_pnl_pct?.toFixed(2) || '0'}%</span></div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-xl">Open Positions</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr><th className="text-left py-2">Symbol</th><th className="text-right py-2">Qty</th><th className="text-right py-2">Avg</th><th className="text-right py-2">Price</th><th className="text-right py-2">P&L</th></tr>
                </thead>
                <tbody>
                  {(performance?.positions || []).map((p) => (
                    <tr key={p.symbol} className="border-t">
                      <td className="py-2 font-medium">{p.symbol}</td>
                      <td className="py-2 text-right">{p.quantity.toFixed(2)}</td>
                      <td className="py-2 text-right">{p.average_cost.toFixed(2)}</td>
                      <td className="py-2 text-right">{p.market_price.toFixed(2)}</td>
                      <td className={`py-2 text-right ${p.unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{p.unrealized_pnl.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Recent Transactions</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr><th className="text-left py-2">Date</th><th className="text-left py-2">Symbol</th><th className="text-left py-2">Side</th><th className="text-right py-2">Qty</th><th className="text-right py-2">Price</th></tr>
                </thead>
                <tbody>
                  {(performance?.recent_transactions || []).map((tx) => (
                    <tr key={tx.id} className="border-t">
                      <td className="py-2">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="py-2 font-medium">{tx.symbol}</td>
                      <td className={`py-2 ${tx.transaction_type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>{tx.transaction_type.toUpperCase()}</td>
                      <td className="py-2 text-right">{tx.quantity.toFixed(2)}</td>
                      <td className="py-2 text-right">{tx.price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
