import apiClient from './client'
import type { OnboardingResult } from '../types'

export async function onboard(token: string, displayName: string): Promise<OnboardingResult> {
  const response = await apiClient.post('/onboarding', {
    token,
    display_name: displayName,
  })
  return response.data
}

export async function login(matrixUserId: string, password: string): Promise<{ token: string; matrix_access_token: string; matrix_device_id: string; user: { id: number; matrix_user_id: string; display_name: string; is_admin: boolean } }> {
  const response = await apiClient.post('/sessions', { matrix_user_id: matrixUserId, password })
  return response.data
}

export async function logout(): Promise<void> {
  await apiClient.delete('/sessions/current')
}

export async function getProfile(): Promise<{ id: number; matrix_user_id: string; display_name: string; is_admin: boolean }> {
  const response = await apiClient.get('/profile')
  return response.data
}
