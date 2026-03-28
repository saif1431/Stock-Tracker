"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { stockService } from "@/services/stockService"

interface CreateAlertDialogProps {
  symbol: string
  onAlertCreated: () => void
  onClose: () => void
}

type AlertType = "above" | "below" | "change_percent"

export function CreateAlertDialog({
  symbol,
  onAlertCreated,
  onClose,
}: CreateAlertDialogProps) {
  const [alertType, setAlertType] = useState<AlertType>("above")
  const [threshold, setThreshold] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!threshold) {
        setError("Please enter a threshold value")
        setLoading(false)
        return
      }

      const thresholdValue = parseFloat(threshold)
      if (isNaN(thresholdValue) || thresholdValue <= 0) {
        setError("Please enter a valid number")
        setLoading(false)
        return
      }

      const alertData = {
        symbol: symbol.toUpperCase(),
        alert_type: alertType,
        threshold_price: alertType !== "change_percent" ? thresholdValue : undefined,
        change_percent: alertType === "change_percent" ? thresholdValue : undefined,
      }

      await stockService.createAlert(alertData)
      console.log("Alert created successfully")
      setThreshold("")
      setAlertType("above")
      onAlertCreated()
      onClose()
    } catch (err: unknown) {
      console.error("Full error object:", err)
      let errorMessage = "Failed to create alert"
      
      if (err && typeof err === 'object') {
        if ('response' in err && typeof (err as Record<string, unknown>).response === 'object') {
          const response = (err as Record<string, unknown>).response as Record<string, unknown>
          if ('data' in response && typeof response.data === 'object') {
            const data = response.data as Record<string, unknown>
            if ('detail' in data && typeof data.detail === 'string') {
              errorMessage = data.detail
            }
          }
        } else if ('message' in err && typeof (err as Record<string, unknown>).message === 'string') {
          errorMessage = (err as Record<string, unknown>).message as string
        }
      }
      console.error("Error creating alert:", errorMessage)

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Create Alert for {symbol.toUpperCase()}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Alert Type</label>
            <select
              value={alertType}
              onChange={(e) => {
                setAlertType(e.target.value as AlertType)
                setThreshold("")
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option className="text-black"  value="above">📈 Price goes above</option>
              <option className="text-black" value="below">📉 Price goes below</option>
              <option className="text-black" value="change_percent">📊 Price changes by %</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {alertType === "change_percent" ? "Change Percentage (%)" : "Price Threshold ($)"}
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder={alertType === "change_percent" ? "e.g., 5" : "e.g., 150.00"}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Alert"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
