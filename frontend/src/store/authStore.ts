import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { onboard as onboardApi, login as loginApi, getProfile } from '../api/auth'

interface AuthState {
  user: User | null
  matrixAccessToken: string | null
  matrixUserId: string | null
  matrixDeviceId: string | null
  railsToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  onboard: (token: string, displayName: string) => Promise<void>
  login: (matrixUserId: string, password: string) => Promise<void>
  restoreSession: () => Promise<void>
  setCredentials: (credentials: {
    matrixAccessToken: string
    matrixUserId: string
    matrixDeviceId: string
    railsToken: string
  }) => void
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      matrixAccessToken: null,
      matrixUserId: null,
      matrixDeviceId: null,
      railsToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      onboard: async (token, displayName) => {
        set({ isLoading: true, error: null })
        try {
          const result = await onboardApi(token, displayName)
          localStorage.setItem('rails_token', result.rails_token)
          set({
            matrixAccessToken: result.access_token,
            matrixUserId: result.matrix_user_id,
            matrixDeviceId: result.device_id,
            railsToken: result.rails_token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Onboarding failed'
          set({ isLoading: false, error: message })
          throw error
        }
      },

      login: async (matrixUserId, password) => {
        set({ isLoading: true, error: null })
        try {
          const result = await loginApi(matrixUserId, password)
          localStorage.setItem('rails_token', result.token)
          set({
            user: result.user as User,
            matrixUserId,
            matrixAccessToken: result.matrix_access_token,
            matrixDeviceId: result.matrix_device_id,
            railsToken: result.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Login failed'
          set({ isLoading: false, error: message })
          throw error
        }
      },

      restoreSession: async () => {
        const { railsToken } = get()
        if (!railsToken) return

        set({ isLoading: true })
        try {
          const profile = await getProfile()
          set({ user: profile as User, isAuthenticated: true, isLoading: false })
        } catch {
          get().logout()
        }
      },

      setCredentials: (credentials) => {
        localStorage.setItem('rails_token', credentials.railsToken)
        set({
          ...credentials,
          isAuthenticated: true,
        })
      },

      logout: () => {
        localStorage.removeItem('rails_token')
        localStorage.removeItem('auth_state')
        set({
          user: null,
          matrixAccessToken: null,
          matrixUserId: null,
          matrixDeviceId: null,
          railsToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth_state',
      partialize: (state) => ({
        matrixAccessToken: state.matrixAccessToken,
        matrixUserId: state.matrixUserId,
        matrixDeviceId: state.matrixDeviceId,
        railsToken: state.railsToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
