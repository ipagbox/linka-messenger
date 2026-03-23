import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../authStore'

vi.mock('../../api/auth', () => ({
  onboard: vi.fn(),
  login: vi.fn(),
  getProfile: vi.fn(),
}))

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      matrixAccessToken: null,
      matrixUserId: null,
      matrixDeviceId: null,
      railsToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
    localStorage.clear()
  })

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })

  it('clears on logout', () => {
    useAuthStore.setState({
      user: { id: 1, display_name: 'Test', matrix_user_id: '@test:localhost', is_admin: false },
      isAuthenticated: true,
      railsToken: 'token123',
    })
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.railsToken).toBeNull()
  })

  it('sets credentials', () => {
    useAuthStore.getState().setCredentials({
      matrixAccessToken: 'mat-token',
      matrixUserId: '@user:localhost',
      matrixDeviceId: 'DEVICE123',
      railsToken: 'rails-token',
    })
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.matrixAccessToken).toBe('mat-token')
  })

  it('handles onboard success', async () => {
    const { onboard: mockOnboard } = await import('../../api/auth')
    vi.mocked(mockOnboard).mockResolvedValue({
      matrix_user_id: '@newuser:localhost',
      access_token: 'access-token',
      device_id: 'DEVICE123',
      rails_token: 'rails-token',
    })

    await useAuthStore.getState().onboard('token', 'New User')
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.matrixUserId).toBe('@newuser:localhost')
  })

  it('sets error on onboard failure', async () => {
    const { onboard: mockOnboard } = await import('../../api/auth')
    vi.mocked(mockOnboard).mockRejectedValue(new Error('Registration failed'))

    try {
      await useAuthStore.getState().onboard('token', 'Name')
    } catch {}
    expect(useAuthStore.getState().error).toBe('Registration failed')
  })
})
