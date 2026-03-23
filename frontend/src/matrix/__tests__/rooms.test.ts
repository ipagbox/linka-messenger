import { describe, it, expect, vi } from 'vitest'
import { getSpaces, getNonSpaceRooms, getUnreadCount } from '../rooms'
import type { MatrixClient, Room } from 'matrix-js-sdk'

function makeRoom(id: string, isSpace: boolean, name: string): Room {
  return {
    roomId: id,
    name,
    isSpaceRoom: vi.fn().mockReturnValue(isSpace),
    currentState: { getStateEvents: vi.fn().mockReturnValue([]) },
    getLiveTimeline: vi.fn().mockReturnValue({ getEvents: vi.fn().mockReturnValue([]) }),
    getUnreadNotificationCount: vi.fn().mockReturnValue(0),
  } as unknown as Room
}

describe('Matrix rooms', () => {
  const mockClient = {
    getRooms: vi.fn(),
    getRoom: vi.fn(),
    createRoom: vi.fn(),
    sendStateEvent: vi.fn(),
  } as unknown as MatrixClient

  it('gets spaces', () => {
    const space = makeRoom('!space1:localhost', true, 'Space')
    const room = makeRoom('!room1:localhost', false, 'Room')
    vi.mocked(mockClient.getRooms).mockReturnValue([space, room])

    const spaces = getSpaces(mockClient)
    expect(spaces).toHaveLength(1)
    expect(spaces[0].roomId).toBe('!space1:localhost')
  })

  it('gets non-space rooms', () => {
    const space = makeRoom('!space1:localhost', true, 'Space')
    const room = makeRoom('!room1:localhost', false, 'Room')
    vi.mocked(mockClient.getRooms).mockReturnValue([space, room])

    const rooms = getNonSpaceRooms(mockClient)
    expect(rooms).toHaveLength(1)
    expect(rooms[0].roomId).toBe('!room1:localhost')
  })

  it('returns 0 unread count when no notifications', () => {
    const room = makeRoom('!room1:localhost', false, 'Room')
    expect(getUnreadCount(room)).toBe(0)
  })
})
