import apiClient from './client'

export async function getServerSettings() {
  const response = await apiClient.get('/admin/server_settings')
  return response.data
}

export async function updateServerSettings(settings: Record<string, string>) {
  const response = await apiClient.patch('/admin/server_settings', { settings })
  return response.data
}

export async function getAdminUsers() {
  const response = await apiClient.get('/admin/users')
  return response.data
}

export async function deleteUser(userId: number) {
  const response = await apiClient.delete(`/admin/users/${userId}`)
  return response.data
}
