import axios, { AxiosError } from 'axios';
import { handleAPIError, APIError, is401Error } from './errorHandler';

let isRedirectingToLogin = false;

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds (increased from 10 for heavy calculations)
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Convert to APIError for consistent error handling
    const apiError = handleAPIError(error);
    
    // Log error for monitoring
    console.error('API Error:', apiError);
    
    // Handle 401 Unauthorized - redirect to login
    if (is401Error(apiError)) {
      console.warn('401 Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      if (typeof window !== 'undefined' && !isRedirectingToLogin && window.location.pathname !== '/login') {
        isRedirectingToLogin = true;
        window.location.href = '/login';
      }
    }

    return Promise.reject(apiError);
  }
);

export default apiClient;
