"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { stockService, Transaction, TransactionSummary } from "@/services/stockService"

interface TransactionFilter {
  symbol?: string
  transaction_type?: string
  days?: number
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TransactionFilter>({})
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [filterSymbol, setFilterSymbol] = useState("")
  const [filterType, setFilterType] = useState("")

  useEffect(() => {
    fetchTransactions()
    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params: TransactionFilter = {}
      if (filter.symbol) params.symbol = filter.symbol
      if (filter.transaction_type) params.transaction_type = filter.transaction_type
      if (filter.days) params.days = filter.days

      const response = await stockService.getTransactions(params)
      setTransactions(response || [])
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await stockService.getTransactionSummary()
      setSummary(response || null)
    } catch (error) {
      console.error("Failed to fetch summary:", error)
    }
  }

  const handleExport = async () => {
    try {
      await stockService.exportTransactionsCSV()
    } catch (error) {
      console.error("Failed to export:", error)
    }
  }

  const handleFilterChange = () => {
    const newFilter: TransactionFilter = {}
    if (filterSymbol) newFilter.symbol = filterSymbol.toUpperCase()
    if (filterType) newFilter.transaction_type = filterType
    setFilter(newFilter)
  }

  const handleClearFilters = () => {
    setFilterSymbol("")
    setFilterType("")
    setFilter({})
  }

  const handleDeleteTransaction = async (id: number) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await stockService.deleteTransaction(id)
        fetchTransactions()
        fetchSummary()
      } catch (error) {
        console.error("Failed to delete transaction:", error)
      }
    }
  }

  if (loading && transactions.length === 0) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500">
                Total Transactions
              </div>
              <div className="text-2xl font-bold">
                {summary.total_transactions}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500">Buys</div>
              <div className="text-2xl font-bold text-green-600">
                {summary.buy_count}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500">Sells</div>
              <div className="text-2xl font-bold text-red-600">
                {summary.sell_count}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500">
                Net Invested
              </div>
              <div className="text-2xl font-bold">
                ${summary.net_invested?.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <Button onClick={handleExport} variant="outline" size="sm">
            📥 Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Filter by symbol"
              className="px-3 py-2 border rounded"
              value={filterSymbol}
              onChange={(e) => setFilterSymbol(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleFilterChange()
              }}
            />
            <select
              className="px-3 py-2 border rounded"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
            <Button
              onClick={handleFilterChange}
              variant="default"
              size="sm"
            >
              Apply Filter
            </Button>
            <Button
              onClick={handleClearFilters}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No transactions found
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Symbol</th>
                    <th className="text-left py-3 px-2">Type</th>
                    <th className="text-right py-3 px-2">Quantity</th>
                    <th className="text-right py-3 px-2">Price</th>
                    <th className="text-right py-3 px-2">Total</th>
                    <th className="text-center py-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-2">
                        {new Date(tx.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 font-semibold">{tx.symbol}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            tx.transaction_type === "buy"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.transaction_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-right py-3 px-2">{tx.quantity}</td>
                      <td className="text-right py-3 px-2">
                        ${tx.price_per_share.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-2 font-semibold">
                        ${tx.total_value.toFixed(2)}
                      </td>
                      <td className="text-center py-3 px-2">
                        <Button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
