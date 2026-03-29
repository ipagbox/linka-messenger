import apiClient from './client'
import type { Circle } from '../types'

export async function getCircles(): Promise<Circle[]> {
  const response = await apiClient.get('/circles')
  return response.data
}

export async function getCircle(id: number): Promise<Circle> {
  const response = await apiClient.get(`/circles/${id}`)
  return response.data
}

export async function createCircle(name: string, maxMembers: number): Promise<{ circle: Circle; invite_link: string }> {
  const response = await apiClient.post('/circles', { name, max_members: maxMembers })
  return response.data
}

export async function getCircleMembers(circleId: number) {
  const response = await apiClient.get(`/circles/${circleId}/members`)
  return response.data
}
