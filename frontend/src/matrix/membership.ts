import type { MatrixClient } from 'matrix-js-sdk'
import { joinCircleRooms } from '../api/circles'
import type { Circle } from '../types'

/**
 * Checks if the user is a joined member of the given room.
 * If not, attempts to join via the backend admin API.
 * Returns true if the user is (or became) a member, false otherwise.
 */
export async function ensureRoomMembership(
  client: MatrixClient,
  roomId: string,
  circles: Circle[]
): Promise<boolean> {
  const room = client.getRoom(roomId)
  const userId = client.getUserId()

  // Check if already joined
  if (room && userId) {
    const member = room.getMember(userId)
    if (member && member.membership === 'join') {
      return true
    }
  }

  // Find which circle this room belongs to
  const circle = circles.find(
    (c) => c.matrix_general_room_id === roomId || c.matrix_announcements_room_id === roomId
  )

  if (!circle) {
    return false
  }

  try {
    await joinCircleRooms(circle.id)
    // Wait briefly for sync to pick up the new membership
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return true
  } catch (err) {
    console.error('Failed to join circle rooms via backend:', err)
    return false
  }
}

/**
 * Checks if an error is a Matrix M_FORBIDDEN "not in room" error.
 */
export function isNotInRoomError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { errcode?: string; message?: string; data?: { errcode?: string } }
  const errcode = err.errcode ?? err.data?.errcode
  if (errcode === 'M_FORBIDDEN') {
    const message = err.message || ''
    return message.includes('not in room') || message.includes('M_FORBIDDEN')
  }
  return false
}
