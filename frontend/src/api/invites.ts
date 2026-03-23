import apiClient from './client'

export interface ValidateInviteResponse {
  valid: boolean
  circle_name?: string
  expires_at?: string | null
  reason?: string
}

export async function validateInvite(token: string): Promise<ValidateInviteResponse> {
  const response = await apiClient.post('/invites/validate', { token })
  return response.data
}

export async function createCircleInvite(
  circleId: number,
  options: { max_uses?: number; expires_in_hours?: number } = {}
) {
  const response = await apiClient.post(`/circles/${circleId}/invites`, options)
  return response.data
}

export async function getCircleInvites(circleId: number) {
  const response = await apiClient.get(`/circles/${circleId}/invites`)
  return response.data
}
