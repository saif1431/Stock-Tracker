export interface ValidationError {
  field: string
  message: string
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationError | null => {
  if (!email || email.trim() === "") {
    return { field: "email", message: "Email is required" }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { field: "email", message: "Please enter a valid email address" }
  }
  return null
}

/**
 * Validate password strength
 * Requirements: min 6 chars, 1 uppercase, 1 number
 */
export const validatePassword = (password: string): ValidationError | null => {
  if (!password) {
    return { field: "password", message: "Password is required" }
  }
  if (password.length < 6) {
    return { field: "password", message: "Password must be at least 6 characters long" }
  }
  if (!/[A-Z]/.test(password)) {
    return { field: "password", message: "Password must contain at least one uppercase letter" }
  }
  if (!/[0-9]/.test(password)) {
    return { field: "password", message: "Password must contain at least one number" }
  }
  return null
}

/**
 * Validate username
 * Requirements: 3+ chars, alphanumeric + _ -
 */
export const validateUsername = (username: string): ValidationError | null => {
  if (!username || username.trim() === "") {
    return { field: "username", message: "Username is required" }
  }
  if (username.length < 3) {
    return { field: "username", message: "Username must be at least 3 characters long" }
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      field: "username",
      message: "Username can only contain letters, numbers, underscores, and hyphens",
    }
  }
  return null
}

/**
 * Validate stock symbol
 * Requirements: 1-5 uppercase letters
 */
export const validateStockSymbol = (symbol: string): ValidationError | null => {
  if (!symbol || symbol.trim() === "") {
    return { field: "symbol", message: "Stock symbol is required" }
  }
  const upperSymbol = symbol.toUpperCase()
  if (!/^[A-Z]{1,5}$/.test(upperSymbol)) {
    return {
      field: "symbol",
      message: "Stock symbol must be 1-5 letters (e.g., AAPL, GOOGL)",
    }
  }
  return null
}

/**
 * Validate quantity input
 * Requirements: positive number
 */
export const validateQuantity = (quantity: string | number): ValidationError | null => {
  if (quantity === "" || quantity === null || quantity === undefined) {
    return { field: "quantity", message: "Quantity is required" }
  }
  
  const num = typeof quantity === "string" ? parseFloat(quantity) : quantity
  
  if (isNaN(num)) {
    return { field: "quantity", message: "Quantity must be a valid number" }
  }
  if (num <= 0) {
    return { field: "quantity", message: "Quantity must be greater than 0" }
  }
  if (!Number.isFinite(num)) {
    return { field: "quantity", message: "Quantity must be a finite number" }
  }
  return null
}

/**
 * Validate price input
 * Requirements: positive number
 */
export const validatePrice = (price: string | number): ValidationError | null => {
  if (price === "" || price === null || price === undefined) {
    return { field: "price", message: "Price is required" }
  }
  
  const num = typeof price === "string" ? parseFloat(price) : price
  
  if (isNaN(num)) {
    return { field: "price", message: "Price must be a valid number" }
  }
  if (num <= 0) {
    return { field: "price", message: "Price must be greater than 0" }
  }
  if (!Number.isFinite(num)) {
    return { field: "price", message: "Price must be a finite number" }
  }
  return null
}

/**
 * Validate threshold price for alerts
 */
export const validateThresholdPrice = (price: string | number): ValidationError | null => {
  if (price === "" || price === null || price === undefined) {
    return { field: "threshold_price", message: "Threshold price is required" }
  }
  
  return validatePrice(price) ? 
    { field: "threshold_price", message: "Threshold price must be a positive number" } 
    : null
}

/**
 * Validate change percent for alerts
 */
export const validateChangePercent = (percent: string | number): ValidationError | null => {
  if (percent === "" || percent === null || percent === undefined) {
    return { field: "change_percent", message: "Change percent is required" }
  }
  
  const num = typeof percent === "string" ? parseFloat(percent) : percent
  
  if (isNaN(num)) {
    return { field: "change_percent", message: "Change percent must be a valid number" }
  }
  if (num === 0) {
    return { field: "change_percent", message: "Change percent cannot be 0" }
  }
  if (!Number.isFinite(num)) {
    return { field: "change_percent", message: "Change percent must be a finite number" }
  }
  return null
}

/**
 * Validate form data object
 */
export const validateFormData = (
  data: Record<string, unknown>,
  validators: Record<string, (value: unknown) => ValidationError | null>
): ValidationError[] => {
  const errors: ValidationError[] = []
  
  Object.entries(validators).forEach(([field, validator]) => {
    const error = validator(data[field])
    if (error) {
      errors.push(error)
    }
  })
  
  return errors
}

/**
 * Check if there are any validation errors
 */
export const hasValidationErrors = (errors: ValidationError[]): boolean => {
  return errors.length > 0
}

/**
 * Get error message for a specific field
 */
export const getFieldError = (errors: ValidationError[], field: string): string | null => {
  const error = errors.find((e) => e.field === field)
  return error?.message || null
}
