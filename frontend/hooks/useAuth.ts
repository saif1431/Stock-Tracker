"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import apiClient from "@/lib/apiClient"

export interface User {
  id: number
  username: string
  email: string
  is_active: boolean
}

interface LoginResponse {
  access_token: string
  token_type: string
}

interface RegisterResponse {
  id: number
  username: string
  email: string
  is_active: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    setUser(null)
    setError(null)
    router.push("/login")
  }, [router])

  const fetchCurrentUser = useCallback(async (token: string) => {
    try {
      const response = await apiClient.get<User>("/auth/me")
      setUser(response.data)
      setError(null)
      return response.data
    } catch (error) {
      console.error("Failed to fetch user:", error)
      localStorage.removeItem("token")
      setUser(null)
      throw error
    }
  }, [])

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setLoading(false)
      setUser(null)
      return
    }

    try {
      await fetchCurrentUser(token)
    } catch (error) {
      console.error("Auth check failed:", error)
      logout()
    } finally {
      setLoading(false)
    }
  }, [fetchCurrentUser, logout])

  const login = useCallback(async (username: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append("username", username)
      formData.append("password", password)

      const response = await apiClient.post<LoginResponse>("/auth/login", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      localStorage.setItem("token", response.data.access_token)
      await fetchCurrentUser(response.data.access_token)
      router.push("/dashboard")

      return response.data
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Login failed"
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [fetchCurrentUser, router])

  const register = useCallback(async (username: string, email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.post<RegisterResponse>("/auth/register", {
        username,
        email,
        password,
      })

      // Auto-login after registration
      const loginResponse = await login(username, password)
      return response.data
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Registration failed"
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [login])

  useEffect(() => {
    checkAuth()
  }, [])

  return {
    user,
    loading,
    error,
    logout,
    login,
    register,
    checkAuth,
  }
}
