"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, LogOut, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavItem {
  label: string
  path: string
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Fundamentals", path: "/fundamentals" },
  { label: "News", path: "/news" },
  { label: "Market", path: "/market-overview" },
]

const MORE_NAV_ITEMS: NavItem[] = [
  { label: "Sectors", path: "/sector" },
  { label: "Transactions", path: "/transactions" },
  { label: "Portfolio", path: "/portfolio-performance" },
  { label: "Paper Trading", path: "/paper-trading" },
  { label: "Screener", path: "/screener" },
  { label: "Allocation", path: "/asset-allocation" },
  { label: "Backtesting", path: "/backtesting" },
]

const HIDE_NAV_PATHS = new Set(["/", "/login", "/register"])

export function AppNavbar() {
  const pathname = usePathname()
  const router = useRouter()

  if (HIDE_NAV_PATHS.has(pathname)) {
    return null
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 text-left"
          >
            <TrendingUp className="w-8 h-8 text-primary" />
            <span className="font-semibold text-xl tracking-tight">Stock Tracker</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-2">
              {PRIMARY_NAV_ITEMS.map((item) => (
                <Button
                  key={item.path}
                  variant={pathname === item.path ? "default" : "outline"}
                  size="sm"
                  onClick={() => router.push(item.path)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <details className="relative group">
              <summary className="list-none cursor-pointer inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
                Menu
                <ChevronDown className="w-4 h-4" />
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg p-2 z-20">
                {[...PRIMARY_NAV_ITEMS, ...MORE_NAV_ITEMS].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent ${pathname === item.path ? "bg-accent font-medium" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="my-1 border-t border-border" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 inline-flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>
    </header>
  )
}