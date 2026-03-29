import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureRoomMembership, isNotInRoomError } from '../membership'
import type { MatrixClient, Room, RoomMember } from 'matrix-js-sdk'
import type { Circle } from '../../types'

vi.mock('../../api/circles', () => ({
  joinCircleRooms: vi.fn(),
}))

import { joinCircleRooms } from '../../api/circles'

const GENERAL_ROOM_ID = '!general1:localhost'
const ANNOUNCEMENTS_ROOM_ID = '!announcements1:localhost'

const circle: Circle = {
  id: 1,
  name: 'Test Circle',
  matrix_space_id: '!space1:localhost',
  matrix_general_room_id: GENERAL_ROOM_ID,
  matrix_announcements_room_id: ANNOUNCEMENTS_ROOM_ID,
  max_members: 15,
  member_count: 2,
  creator: null,
  created_at: '2024-01-01',
}

function makeMockClient(opts: { roomExists: boolean; isMember: boolean }): MatrixClient {
  const member = opts.isMember
    ? ({ membership: 'join' } as RoomMember)
    : null

  const room = opts.roomExists
    ? ({ getMember: vi.fn().mockReturnValue(member) } as unknown as Room)
    : null

  return {
    getRoom: vi.fn().mockReturnValue(room),
    getUserId: vi.fn().mockReturnValue('@user:localhost'),
  } as unknown as MatrixClient
}

describe('ensureRoomMembership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns true if user is already a joined member', async () => {
    const client = makeMockClient({ roomExists: true, isMember: true })

    const result = await ensureRoomMembership(client, GENERAL_ROOM_ID, [circle])

    expect(result).toBe(true)
    expect(joinCircleRooms).not.toHaveBeenCalled()
  })

  it('calls joinCircleRooms when user is not in room', async () => {
    const client = makeMockClient({ roomExists: false, isMember: false })
    vi.mocked(joinCircleRooms).mockResolvedValue({ joined_rooms: [GENERAL_ROOM_ID], errors: [] })

    const result = await ensureRoomMembership(client, GENERAL_ROOM_ID, [circle])

    expect(result).toBe(true)
    expect(joinCircleRooms).toHaveBeenCalledWith(1)
  })

  it('returns false when room does not belong to any circle', async () => {
    const client = makeMockClient({ roomExists: false, isMember: false })

    const result = await ensureRoomMembership(client, '!unknown:localhost', [circle])

    expect(result).toBe(false)
    expect(joinCircleRooms).not.toHaveBeenCalled()
  })

  it('returns false when joinCircleRooms fails', async () => {
    const client = makeMockClient({ roomExists: false, isMember: false })
    vi.mocked(joinCircleRooms).mockRejectedValue(new Error('Network error'))

    const result = await ensureRoomMembership(client, GENERAL_ROOM_ID, [circle])

    expect(result).toBe(false)
  })

  it('works for announcements room too', async () => {
    const client = makeMockClient({ roomExists: false, isMember: false })
    vi.mocked(joinCircleRooms).mockResolvedValue({ joined_rooms: [ANNOUNCEMENTS_ROOM_ID], errors: [] })

    const result = await ensureRoomMembership(client, ANNOUNCEMENTS_ROOM_ID, [circle])

    expect(result).toBe(true)
    expect(joinCircleRooms).toHaveBeenCalledWith(1)
  })
})

describe('isNotInRoomError', () => {
  it('returns true for M_FORBIDDEN with "not in room" message', () => {
    const error = {
      errcode: 'M_FORBIDDEN',
      message: 'User @user:localhost not in room !room:localhost',
    }
    expect(isNotInRoomError(error)).toBe(true)
  })

  it('returns true for nested errcode in data', () => {
    const error = {
      data: { errcode: 'M_FORBIDDEN' },
      message: 'M_FORBIDDEN: User not in room',
    }
    expect(isNotInRoomError(error)).toBe(true)
  })

  it('returns false for non-forbidden errors', () => {
    const error = { errcode: 'M_UNKNOWN', message: 'Something else' }
    expect(isNotInRoomError(error)).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isNotInRoomError(null)).toBe(false)
    expect(isNotInRoomError(undefined)).toBe(false)
  })
})
