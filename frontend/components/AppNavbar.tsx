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
  { label: "Tax Tools", path: "/tax" },
  { label: "Security (2FA)", path: "/security" },
  { label: "Rate Limit", path: "/rate-limit" },
]

const HIDE_NAV_PATHS = new Set(["/", "/login", "/register"])

export function AppNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const isAdminPage = pathname.startsWith("/admin")

  if (HIDE_NAV_PATHS.has(pathname)) {
    return null
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 text-left"
          >
            <TrendingUp className="w-7 h-7 text-blue-500" />
            <span className="text-lg font-semibold tracking-tight text-slate-100">Stock Tracker</span>
          </button>

          <div className="flex items-center gap-2">
            {!isAdminPage ? (
              <>
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
                  <summary className="list-none cursor-pointer inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:border-slate-600 hover:bg-slate-700/70">
                    Menu
                    <ChevronDown className="w-4 h-4" />
                  </summary>
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl">
                    {[...PRIMARY_NAV_ITEMS, ...MORE_NAV_ITEMS].map((item) => (
                      <button
                        key={item.path}
                        onClick={() => router.push(item.path)}
                        className={`w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800 ${pathname === item.path ? "bg-slate-800 font-medium" : ""}`}
                      >
                        {item.label}
                      </button>
                    ))}
                    <div className="my-1 border-t border-slate-700" />
                    <button
                      onClick={handleLogout}
                      className="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </details>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="inline-flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}