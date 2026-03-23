import type { MatrixClient, Room } from 'matrix-js-sdk'

export function getSpaces(client: MatrixClient): Room[] {
  return client.getRooms().filter((r) => r.isSpaceRoom())
}

export function getSpaceChildren(client: MatrixClient, spaceId: string): Room[] {
  const space = client.getRoom(spaceId)
  if (!space) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const childEvents = space.currentState.getStateEvents('m.space.child' as any)
  const childRoomIds = childEvents.map((ev) => ev.getStateKey()).filter(Boolean) as string[]

  return childRoomIds
    .map((id) => client.getRoom(id))
    .filter((r): r is Room => r !== null)
}

export function getNonSpaceRooms(client: MatrixClient): Room[] {
  return client.getRooms().filter((r) => !r.isSpaceRoom())
}

export async function createDM(client: MatrixClient, userId: string, spaceId?: string): Promise<Room> {
  const result = await client.createRoom({
    preset: 'private_chat' as never,
    invite: [userId],
    is_direct: true,
  })

  const room = client.getRoom(result.room_id)
  if (!room) throw new Error('Room not found after creation')

  if (spaceId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await client.sendStateEvent(spaceId, 'm.space.child' as any, { via: ['localhost'], suggested: false }, result.room_id)
    } catch (err) {
      console.warn('Failed to add DM to space:', err)
    }
  }

  return room
}

export function getRoomDisplayName(room: Room): string {
  return room.name || room.roomId
}

export function isGeneralRoom(room: Room): boolean {
  const name = room.name?.toLowerCase() || ''
  return name.includes('general')
}

export function isAnnouncementsRoom(room: Room): boolean {
  const name = room.name?.toLowerCase() || ''
  return name.includes('announcement')
}

export function getUnreadCount(room: Room): number {
  return room.getUnreadNotificationCount() || 0
}
