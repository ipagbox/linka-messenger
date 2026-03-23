import axios, { AxiosError } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

export function shouldRedirectOnUnauthorized(error: AxiosError): boolean {
  if (error.response?.status !== 401) {
    return false
  }

  const method = error.config?.method?.toLowerCase()
  const requestUrl = error.config?.url ?? ''

  return !(method === 'post' && /\/sessions\/?$/.test(requestUrl))
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('rails_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (shouldRedirectOnUnauthorized(error)) {
      localStorage.removeItem('rails_token')
      localStorage.removeItem('auth_state')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
