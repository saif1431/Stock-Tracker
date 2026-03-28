"use client"

import React, { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo)
    this.setState({ errorInfo })

    // Send to error tracking service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
          <Card className="w-full max-w-md border-red-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-red-600 mb-2">Something Went Wrong</h1>
                <p className="text-gray-600 mb-4">
                  An unexpected error occurred. Don&apos;t worry, we&apos;re here to help.
                </p>

                {/* Error Details (Collapsible) */}
                <details className="mb-4 text-left bg-red-100 p-3 rounded-lg text-sm cursor-pointer hover:bg-red-150 transition">
                  <summary className="font-semibold text-red-700 cursor-pointer flex items-center gap-2">
                    <span>Error Details</span>
                  </summary>
                  <div className="mt-3 space-y-2">
                    {this.state.error && (
                      <div>
                        <p className="text-xs font-mono text-red-600 whitespace-pre-wrap break-words">
                          {this.state.error.message}
                        </p>
                      </div>
                    )}
                    {this.state.errorInfo && (
                      <div>
                        <p className="text-xs font-mono text-red-600 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                          {this.state.errorInfo.componentStack}
                        </p>
                      </div>
                    )}
                  </div>
                </details>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={this.handleReset}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button
                    onClick={() => window.location.href = "/dashboard"}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Go to Dashboard
                  </Button>
                  <Button
                    onClick={() => window.location.href = "/"}
                    variant="ghost"
                    className="w-full"
                  >
                    Go to Home
                  </Button>
                </div>

                {/* Debug Info */}
                <div className="mt-4 text-xs text-gray-500 border-t pt-3">
                  <p>If this persists, please contact support or check the console for details.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
