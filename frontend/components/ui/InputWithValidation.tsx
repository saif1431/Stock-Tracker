"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle } from "lucide-react"

interface InputWithValidationProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  helperText?: string
  validator?: (value: string) => { field: string; message: string } | null
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  showValidation?: boolean
}

export function InputWithValidation({
  label,
  error: externalError,
  success,
  helperText,
  validator,
  onChange,
  showValidation = true,
  className,
  ...props
}: InputWithValidationProps) {
  const [value, setValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(externalError || null)
  const [touched, setTouched] = React.useState(false)

  React.useEffect(() => {
    setError(externalError || null)
  }, [externalError])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    if (validator && touched) {
      const validationError = validator(newValue)
      setError(validationError?.message || null)
    }

    onChange?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true)

    if (validator) {
      const validationError = validator(e.target.value)
      setError(validationError?.message || null)
    }

    props.onBlur?.(e)
  }

  const hasError = touched && error
  const showSuccess = touched && !error && success

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <Input
          {...props}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`
            ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
            ${showSuccess ? "border-green-500 focus:border-green-500 focus:ring-green-500" : ""}
            ${className || ""}
          `}
        />

        {/* Success Icon */}
        {showValidation && showSuccess && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
        )}

        {/* Error Icon */}
        {showValidation && hasError && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
        )}
      </div>

      {/* Error Message */}
      {showValidation && hasError && (
        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <span>{error}</span>
        </p>
      )}

      {/* Helper Text */}
      {helperText && !hasError && (
        <p className="text-gray-500 text-sm mt-1">{helperText}</p>
      )}
    </div>
  )
}
