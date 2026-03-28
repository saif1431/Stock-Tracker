import { AxiosError } from "axios"

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public data?: Record<string, unknown>
  ) {
    super(message)
    this.name = "APIError"
  }
}

export const handleAPIError = (error: AxiosError | unknown): APIError => {
  if (error instanceof AxiosError) {
    if (error.response) {
      // Server responded with error status
      const status: number = error.response.status
      const statusText: string = error.response.statusText
      const responseData = error.response.data
      let message: string = (responseData as Record<string, unknown>)?.detail as string ||
                             (responseData as Record<string, unknown>)?.message as string ||
                             statusText || "Unknown error"

      switch (status) {
        case 400:
          message = `Bad Request: ${message}`
          break
        case 401:
          message = "Unauthorized. Please log in again."
          break
        case 403:
          message = "Access denied. You don't have permission to perform this action."
          break
        case 404:
          message = "The requested resource was not found."
          break
        case 422:
          message = `Validation error: ${message}`
          break
        case 429:
          message = "Too many requests. Please wait a moment and try again."
          break
        case 500:
          message = "Server error. Our team has been notified. Please try again later."
          break
        case 503:
          message = "Service temporarily unavailable. Please try again later."
          break
        default:
          if (status >= 400 && status < 500) {
            message = `Client error (${status}): ${message}`
          } else if (status >= 500) {
            message = `Server error (${status}): ${message}`
          }
      }

      return new APIError(status, statusText, message)
    }

    if (error.request && !error.response) {
      // Request made but no response received
      return new APIError(
        0,
        "Network Error",
        "No response from server. Please check your internet connection and try again."
      )
    }
  }

  // Error in request setup or unknown error
  if (error instanceof Error) {
    return new APIError(
      0,
      "Error",
      error.message || "An unexpected error occurred"
    )
  }

  return new APIError(
    0,
    "Error",
    "An unexpected error occurred"
  )
}

export const formatAPIError = (error: APIError): string => {
  if (error.status === 422 && error.data?.detail) {
    // Handle validation errors
    if (Array.isArray(error.data.detail)) {
      const details = (error.data.detail as unknown[])
        .map((e: unknown) => {
          const entry = e as Record<string, unknown>
          const loc = Array.isArray(entry.loc) ? (entry.loc as unknown[]).join(".") : String(entry.loc)
          return `${loc}: ${entry.msg}`
        })
        .join("\n")
      return `${error.message}\n${details}`
    }
    return `${error.message}\n${error.data.detail}`
  }
  return error.message
}

export const getErrorStatus = (error: AxiosError | APIError | unknown): number => {
  if (error instanceof APIError) {
    return error.status
  }
  if (error instanceof AxiosError && error.response?.status) {
    return error.response.status
  }
  return 0
}

export const isNetworkError = (error: AxiosError | APIError | unknown): boolean => {
  if (error instanceof APIError) {
    return error.status === 0 && error.statusText === "Network Error"
  }
  if (error instanceof AxiosError) {
    return !error.response && !!error.request
  }
  return false
}

export const is401Error = (error: AxiosError | APIError | unknown): boolean => {
  return getErrorStatus(error) === 401
}
