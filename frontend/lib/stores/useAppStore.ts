import { create } from 'zustand'
import type { PortfolioItem } from '@/components/PortfolioSection'

export interface AppWatchlistItem {
  symbol: string
  price: number
  change: number
  changePercent: number
}

interface AppState {
  watchlist: AppWatchlistItem[]
  portfolio: PortfolioItem[]
  setWatchlist: (watchlist: AppWatchlistItem[]) => void
  setPortfolio: (portfolio: PortfolioItem[]) => void
  upsertWatchlistItem: (item: AppWatchlistItem) => void
  removeWatchlistItem: (symbol: string) => void
  removePortfolioItem: (symbol: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  watchlist: [],
  portfolio: [],
  setWatchlist: (watchlist) => set({ watchlist }),
  setPortfolio: (portfolio) => set({ portfolio }),
  upsertWatchlistItem: (item) =>
    set((state) => {
      const existing = state.watchlist.find((x) => x.symbol === item.symbol)
      if (!existing) {
        return { watchlist: [item, ...state.watchlist] }
      }
      return {
        watchlist: state.watchlist.map((x) => (x.symbol === item.symbol ? item : x)),
      }
    }),
  removeWatchlistItem: (symbol) =>
    set((state) => ({ watchlist: state.watchlist.filter((x) => x.symbol !== symbol) })),
  removePortfolioItem: (symbol) =>
    set((state) => ({ portfolio: state.portfolio.filter((x) => x.symbol !== symbol) })),
}))
