import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCircleStore } from '../circleStore'

vi.mock('../../api/circles', () => ({
  getCircles: vi.fn(),
  createCircle: vi.fn(),
  getCircleMembers: vi.fn(),
  getCircle: vi.fn(),
}))

describe('circleStore', () => {
  beforeEach(() => {
    useCircleStore.setState({
      circles: [],
      activeCircleId: null,
      members: {},
      isLoading: false,
      error: null,
    })
  })

  it('starts with empty circles', () => {
    expect(useCircleStore.getState().circles).toHaveLength(0)
  })

  it('sets active circle', () => {
    useCircleStore.getState().setActiveCircle(42)
    expect(useCircleStore.getState().activeCircleId).toBe(42)
  })

  it('gets active circle', () => {
    const circle = { id: 1, name: 'Test', matrix_space_id: null, matrix_general_room_id: null, matrix_announcements_room_id: null, max_members: 15, member_count: 1, creator: null, created_at: '' }
    useCircleStore.setState({ circles: [circle], activeCircleId: 1 })
    expect(useCircleStore.getState().getActiveCircle()).toEqual(circle)
  })

  it('loads circles from API', async () => {
    const { getCircles } = await import('../../api/circles')
    const mockCircles = [
      { id: 1, name: 'Circle 1', matrix_space_id: null, matrix_general_room_id: null, matrix_announcements_room_id: null, max_members: 15, member_count: 1, creator: null, created_at: '' },
    ]
    vi.mocked(getCircles).mockResolvedValue(mockCircles)
    await useCircleStore.getState().loadCircles()
    expect(useCircleStore.getState().circles).toEqual(mockCircles)
  })

  it('sets error on load failure', async () => {
    const { getCircles } = await import('../../api/circles')
    vi.mocked(getCircles).mockRejectedValue(new Error('Network error'))
    await useCircleStore.getState().loadCircles()
    expect(useCircleStore.getState().error).toBe('Network error')
  })
})
