import { useEffect, useRef } from "react"
import { stockService, ChartData } from "@/services/stockService"

/**
 * A custom hook that polls for stock data at a regular interval.
 * 
 * @param symbol The stock symbol to poll.
 * @param onUpdate Callback function to handle the new data.
 * @param interval The polling interval in milliseconds (default: 30 seconds).
 */
export function useStockPolling(
  symbol: string | null,
  onUpdate: (data: ChartData[]) => void,
  interval: number = 30000
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!symbol) return

    const fetchData = async () => {
      try {
        console.log(`Polling fresh data for ${symbol}...`)
        const rawData = await stockService.getStockData(symbol)
        const transformedData = stockService.transformStockData(rawData)
        onUpdate(transformedData)
      } catch (error) {
        console.error("Polling error:", error)
      }
    }

    // Set up the interval
    timerRef.current = setInterval(fetchData, interval)

    // Clean up on unmount or when symbol/interval changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [symbol, interval, onUpdate])
}
