import { create } from 'zustand'
import type { Circle, User } from '../types'
import { getCircles, createCircle as createCircleApi, getCircleMembers } from '../api/circles'

interface CircleState {
  circles: Circle[]
  activeCircleId: number | null
  members: Record<number, User[]>
  isLoading: boolean
  error: string | null

  loadCircles: () => Promise<void>
  setActiveCircle: (id: number | null) => void
  createCircle: (name: string, maxMembers: number) => Promise<{ circle: Circle; invite_link: string }>
  loadMembers: (circleId: number) => Promise<void>
  getActiveCircle: () => Circle | null
}

export const useCircleStore = create<CircleState>((set, get) => ({
  circles: [],
  activeCircleId: null,
  members: {},
  isLoading: false,
  error: null,

  loadCircles: async () => {
    set({ isLoading: true, error: null })
    try {
      const circles = await getCircles()
      set({ circles, isLoading: false })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load circles'
      set({ isLoading: false, error: message })
    }
  },

  setActiveCircle: (id) => set({ activeCircleId: id }),

  createCircle: async (name, maxMembers) => {
    const result = await createCircleApi(name, maxMembers)
    set((state) => ({ circles: [...state.circles, result.circle] }))
    return result
  },

  loadMembers: async (circleId) => {
    try {
      const members = await getCircleMembers(circleId)
      set((state) => ({ members: { ...state.members, [circleId]: members } }))
    } catch (error: unknown) {
      console.error('Failed to load members:', error)
    }
  },

  getActiveCircle: () => {
    const { circles, activeCircleId } = get()
    return circles.find((c) => c.id === activeCircleId) ?? null
  },
}))
