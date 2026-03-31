"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { twoFaService, TwoFASetupResponse } from "@/services/twoFaService"

export default function SecurityPage() {
  const [setupData, setSetupData] = useState<TwoFASetupResponse | null>(null)
  const [token, setToken] = useState("")
  const [disableToken, setDisableToken] = useState("")
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSetup = async () => {
    setLoading(true)
    setError(null)
    setStatusMessage(null)
    try {
      const data = await twoFaService.setup()
      setSetupData(data)
      setStatusMessage("2FA setup generated. Scan QR and enter token to enable.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to setup 2FA")
    } finally {
      setLoading(false)
    }
  }

  const handleEnable = async () => {
    if (!setupData) {
      setError("Generate setup first.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await twoFaService.enable(setupData.secret, token)
      setStatusMessage(`2FA ${result.status}. Save your backup codes safely.`)
      setSetupData({ ...setupData, backup_codes: result.backup_codes })
      setToken("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable 2FA")
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await twoFaService.disable(disableToken)
      setStatusMessage(`2FA ${result.status}.`)
      setDisableToken("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-sm text-muted-foreground">Configure Two-Factor Authentication for your account.</p>
      </div>

      {statusMessage ? <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-green-700">{statusMessage}</div> : null}
      {error ? <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">{error}</div> : null}

      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Enable 2FA</h2>
        <p className="text-sm text-muted-foreground">Generate QR code, scan in authenticator app, then verify with one code.</p>
        <Button onClick={handleSetup} disabled={loading}>Generate Setup</Button>

        {setupData ? (
          <div className="space-y-4 pt-2">
            <Image
              src={setupData.qr_code}
              alt="2FA QR code"
              width={208}
              height={208}
              unoptimized
              className="w-52 h-52 border border-border rounded-md bg-white p-2"
            />
            <p className="text-xs text-muted-foreground break-all">Secret: {setupData.secret}</p>
            <div className="flex items-center gap-2">
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter 6-digit code"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
              <Button onClick={handleEnable} disabled={loading || token.trim().length < 6}>Enable 2FA</Button>
            </div>
            <div>
              <p className="text-sm font-medium">Backup Codes</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {setupData.backup_codes.map((code) => (
                  <span key={code} className="rounded border border-border bg-muted/50 px-2 py-1 text-xs">{code}</span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Disable 2FA</h2>
        <p className="text-sm text-muted-foreground">Enter current authenticator or backup code to disable.</p>
        <div className="flex items-center gap-2">
          <input
            value={disableToken}
            onChange={(e) => setDisableToken(e.target.value)}
            placeholder="Token or backup code"
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          />
          <Button variant="outline" onClick={handleDisable} disabled={loading || disableToken.trim().length < 6}>Disable 2FA</Button>
        </div>
      </section>
    </main>
  )
}
