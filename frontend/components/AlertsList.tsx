"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { stockService } from "@/services/stockService"

interface Alert {
  id: number
  symbol: string
  alert_type: "above" | "below" | "change_percent"
  threshold_price?: number
  change_percent?: number
  is_active: boolean
  triggered: boolean
  created_at: string
  updated_at: string
}

interface AlertsListProps {
  refreshTrigger?: number
}

export function AlertsList({ refreshTrigger }: AlertsListProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [refreshTrigger])

  useEffect(() => {
    // Initial fetch when component mounts
    fetchAlerts()
    // Polling disabled to prevent server overload
    // Alerts will refresh only on user actions or manual refresh
    return undefined
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Fetching alerts...")
      const data = await stockService.getAlerts()
      console.log("Alerts fetched:", data)
      // Ensure data is always an array
      setAlerts(Array.isArray(data) ? data : [])
    } catch (err: unknown) {
      console.error("Error fetching alerts:", err)
      let errorMessage = "Failed to fetch alerts"
      
      if (err && typeof err === 'object') {
        if ('response' in err && typeof (err as Record<string, unknown>).response === 'object') {
          const response = (err as Record<string, unknown>).response as Record<string, unknown>
          if ('data' in response && typeof response.data === 'object') {
            const data = response.data as Record<string, unknown>
            if ('detail' in data && typeof data.detail === 'string') {
              errorMessage = data.detail
            }
          } else if ('status' in response) {
            errorMessage = `HTTP ${(response as Record<string, unknown>).status}: ${errorMessage}`
          }
        } else if ('message' in err) {
          errorMessage = (err as Record<string, unknown>).message as string
        }
      }
      
      setError(errorMessage)
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (alertId: number) => {
    try {
      await stockService.deleteAlert(alertId)
      setAlerts((prev) => Array.isArray(prev) ? prev.filter((a) => a.id !== alertId) : [])
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || "Failed to delete alert")
    }
  }

  const handleToggle = async (alertId: number) => {
    try {
      const updatedAlert = await stockService.toggleAlert(alertId)
      setAlerts((prev) => {
        if (!Array.isArray(prev)) return []
        return prev.map((a) =>
          a.id === alertId ? { ...a, is_active: updatedAlert.alert?.is_active ?? a.is_active } : a
        )
      })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || "Failed to toggle alert")
    }
  }

  const handleReset = async (alertId: number) => {
    try {
      await stockService.resetAlert(alertId)
      setAlerts((prev) => {
        if (!Array.isArray(prev)) return []
        return prev.map((a) =>
          a.id === alertId ? { ...a, triggered: false } : a
        )
      })
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || "Failed to reset alert")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Price Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading alerts...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Price Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Price Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">No alerts created yet</div>
        </CardContent>
      </Card>
    )
  }

  const getAlertDescription = (alert: Alert) => {
    if (alert.alert_type === "above") {
      return `Alert when ${alert.symbol} goes above $${alert.threshold_price?.toFixed(2)}`
    }
    if (alert.alert_type === "below") {
      return `Alert when ${alert.symbol} goes below $${alert.threshold_price?.toFixed(2)}`
    }
    if (alert.alert_type === "change_percent") {
      return `Alert when ${alert.symbol} changes by ${alert.change_percent}%`
    }
    return ""
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>My Price Alerts ({alerts.length})</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchAlerts} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border rounded-lg ${
                alert.is_active ? "border-blue-300 bg-blue-50" : "border-gray-300 bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-lg">{alert.symbol}</h4>
                    {alert.triggered && (
                      <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-semibold">
                        ✅ Triggered
                      </span>
                    )}
                    {!alert.is_active && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded-full font-semibold">
                        ⏸ Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{getAlertDescription(alert)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created: {new Date(alert.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2 flex-col ml-4">
                  {alert.triggered && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReset(alert.id)}
                      className="text-xs"
                    >
                      Reset
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={alert.is_active ? "outline" : "secondary"}
                    onClick={() => handleToggle(alert.id)}
                    className="text-xs"
                  >
                    {alert.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(alert.id)}
                    className="text-xs"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
