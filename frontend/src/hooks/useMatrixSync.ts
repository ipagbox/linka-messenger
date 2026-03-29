import { useEffect, useRef, useCallback } from 'react'
import type { MatrixClient, MatrixEvent, Room, RoomMember } from 'matrix-js-sdk'
import { ClientEvent, RoomEvent, RoomMemberEvent } from 'matrix-js-sdk'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import {
  initMatrixClient,
  startMatrixSync,
  destroyMatrixClient,
  getMatrixClient,
} from '../matrix/client'
import {
  getNonSpaceRooms,
  getRoomDisplayName,
  isGeneralRoom,
  isAnnouncementsRoom,
  getUnreadCount,
} from '../matrix/rooms'
import { matrixEventToMessage } from '../matrix/messages'
import type { ChatRoom } from '../types'

const MATRIX_BASE_URL = window.location.origin

function roomToChatRoom(room: Room, client: MatrixClient): ChatRoom {
  const members = room.getJoinedMembers()
  const myUserId = client.getUserId() || ''
  const otherMembers = members.filter((m) => m.userId !== myUserId)
  const isDM = members.length <= 2 && !isGeneralRoom(room) && !isAnnouncementsRoom(room)

  const timeline = room.getLiveTimeline().getEvents()
  const lastMsgEvent = [...timeline].reverse().find((e) => e.getType() === 'm.room.message')

  let name = getRoomDisplayName(room)
  if (isDM && otherMembers.length > 0) {
    name = otherMembers[0].name || otherMembers[0].userId
  }

  return {
    id: room.roomId,
    name,
    topic: room.currentState.getStateEvents('m.room.topic', '')?.getContent()?.topic,
    lastMessage: lastMsgEvent?.getContent()?.body,
    lastMessageTime: lastMsgEvent?.getTs(),
    unreadCount: getUnreadCount(room),
    isDM,
    isGeneral: isGeneralRoom(room),
    isAnnouncements: isAnnouncementsRoom(room),
    members: members.map((m) => m.userId),
  }
}

export function useMatrixSync(): { client: MatrixClient | null; isReady: boolean } {
  const clientRef = useRef<MatrixClient | null>(null)
  const isReadyRef = useRef(false)
  const { matrixAccessToken, matrixUserId, matrixDeviceId, isAuthenticated, logout } = useAuthStore()
  const { setRooms, addMessage, setMessages, setTypingUsers, setSyncing, reset } = useChatStore()

  const handleUnknownTokenError = useCallback((error: unknown) => {
    if (!error || typeof error !== 'object') return

    const matrixErr = error as { errcode?: string; data?: { errcode?: string } }
    const errcode = matrixErr.errcode ?? matrixErr.data?.errcode
    if (errcode === 'M_UNKNOWN_TOKEN') {
      console.warn('Matrix access token is invalid or expired, logging out')
      logout()
      setSyncing(false)
    }
  }, [logout, setSyncing])

  const refreshRooms = useCallback(() => {
    const client = clientRef.current
    if (!client) return

    const matrixRooms = getNonSpaceRooms(client)
    const chatRooms = matrixRooms
      .map((r) => roomToChatRoom(r, client))
      .sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))
    setRooms(chatRooms)
  }, [setRooms])

  useEffect(() => {
    if (!isAuthenticated || !matrixAccessToken || !matrixUserId || !matrixDeviceId) {
      return
    }

    let cancelled = false

    async function connect() {
      setSyncing(true)

      try {
        const client = await initMatrixClient({
          baseUrl: MATRIX_BASE_URL,
          accessToken: matrixAccessToken!,
          userId: matrixUserId!,
          deviceId: matrixDeviceId!,
        })

        if (cancelled) {
          destroyMatrixClient()
          return
        }

        clientRef.current = client

        // Listen for sync to populate rooms
        client.on(ClientEvent.Sync, (state: string, _prevState: string | null, data?: { error?: unknown }) => {
          if (state === 'ERROR' && data?.error) {
            handleUnknownTokenError(data.error)
          }

          if (state === 'PREPARED' || state === 'SYNCING') {
            isReadyRef.current = true
            setSyncing(false)
            refreshRooms()
          }
        })

        // Listen for new messages (skip local echoes — ChatView handles optimistic display)
        client.on(RoomEvent.Timeline, (event: MatrixEvent, room: Room | undefined) => {
          if (!room || event.getType() !== 'm.room.message') return
          // Local echoes have a non-null status (SENDING, ENCRYPTING, etc.)
          // Only process server-confirmed events (status === null)
          if (event.status !== null) return

          const message = matrixEventToMessage(event, client)
          if (message) {
            addMessage(room.roomId, message)
          }
          refreshRooms()
        })

        // Listen for typing events
        client.on(RoomMemberEvent.Typing, (_event: MatrixEvent, member: RoomMember) => {
          const room = client.getRoom(member.roomId)
          if (!room) return
          const typingMembers = room
            .getMembers()
            .filter((m) => m.typing && m.userId !== client.getUserId())
            .map((m) => m.name || m.userId)
          setTypingUsers(member.roomId, typingMembers)
        })

        // Listen for room membership changes
        client.on(RoomMemberEvent.Membership, () => {
          refreshRooms()
        })

        startMatrixSync(client)

        // Load existing messages for rooms after initial sync
        client.once(ClientEvent.Sync, (_state: string) => {
          const rooms = getNonSpaceRooms(client)
          for (const room of rooms) {
            const timeline = room.getLiveTimeline().getEvents()
            const messages = timeline
              .map((ev) => matrixEventToMessage(ev, client))
              .filter((m): m is NonNullable<typeof m> => m !== null)
            if (messages.length > 0) {
              setMessages(room.roomId, messages)
            }
          }
        })
      } catch (err) {
        console.error('Matrix client init failed:', err)
        handleUnknownTokenError(err)
        setSyncing(false)
      }
    }

    connect()

    return () => {
      cancelled = true
      clientRef.current = null
      isReadyRef.current = false
      destroyMatrixClient()
      reset()
    }
  }, [isAuthenticated, matrixAccessToken, matrixUserId, matrixDeviceId, addMessage, setMessages, setTypingUsers, setSyncing, refreshRooms, reset, handleUnknownTokenError])

  return { client: getMatrixClient(), isReady: isReadyRef.current }
}
