import { describe, it, expect, beforeEach } from 'vitest'
import { useChatStore } from '../chatStore'
import type { Message } from '../../types'

const makeMessage = (id: string, roomId: string): Message => ({
  id,
  roomId,
  senderId: '@user:localhost',
  senderName: 'User',
  body: 'Hello',
  msgtype: 'm.text',
  timestamp: Date.now(),
  status: 'sent',
})

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.setState({
      rooms: [],
      messages: new Map(),
      pendingMessages: [],
      typingUsers: new Map(),
      activeRoomId: null,
      isSyncing: false,
    })
  })

  it('adds message to correct room', () => {
    const msg = makeMessage('1', 'room-a')
    useChatStore.getState().addMessage('room-a', msg)
    expect(useChatStore.getState().getMessages('room-a')).toHaveLength(1)
    expect(useChatStore.getState().getMessages('room-b')).toHaveLength(0)
  })

  it('handles pending state', () => {
    const msg = makeMessage('1', 'room-a')
    useChatStore.getState().addMessage('room-a', { ...msg, status: 'sending' })
    expect(useChatStore.getState().getMessages('room-a')[0].status).toBe('sending')
  })

  it('handles error state', () => {
    const msg = makeMessage('1', 'room-a')
    useChatStore.getState().addMessage('room-a', msg)
    useChatStore.getState().updateMessageStatus('room-a', '1', 'error')
    expect(useChatStore.getState().getMessages('room-a')[0].status).toBe('error')
  })

  it('avoids duplicate messages', () => {
    const msg = makeMessage('1', 'room-a')
    useChatStore.getState().addMessage('room-a', msg)
    useChatStore.getState().addMessage('room-a', msg)
    expect(useChatStore.getState().getMessages('room-a')).toHaveLength(1)
  })

  it('updates typing users', () => {
    useChatStore.getState().setTypingUsers('room-a', ['@user1:localhost', '@user2:localhost'])
    const state = useChatStore.getState()
    expect(state.typingUsers.get('room-a')).toHaveLength(2)
  })

  it('sets active room', () => {
    useChatStore.getState().setActiveRoom('room-xyz')
    expect(useChatStore.getState().activeRoomId).toBe('room-xyz')
  })

  it('sets rooms', () => {
    const rooms = [
      { id: 'room-a', name: 'General', unreadCount: 0, isDM: false, isGeneral: true, isAnnouncements: false },
      { id: 'room-b', name: 'Alice', unreadCount: 1, isDM: true, isGeneral: false, isAnnouncements: false, members: ['@alice:localhost', '@me:localhost'] },
    ]
    useChatStore.getState().setRooms(rooms)
    expect(useChatStore.getState().rooms).toHaveLength(2)
  })

  it('finds DM room by user id', () => {
    const rooms = [
      { id: 'room-a', name: 'General', unreadCount: 0, isDM: false, isGeneral: true, isAnnouncements: false },
      { id: 'room-b', name: 'Alice', unreadCount: 0, isDM: true, isGeneral: false, isAnnouncements: false, members: ['@alice:localhost', '@me:localhost'] },
    ]
    useChatStore.getState().setRooms(rooms)
    expect(useChatStore.getState().findDMRoom('@alice:localhost')?.id).toBe('room-b')
    expect(useChatStore.getState().findDMRoom('@bob:localhost')).toBeUndefined()
  })

  it('replaces pending message with server event id', () => {
    const msg = makeMessage('pending-123', 'room-a')
    useChatStore.getState().addMessage('room-a', { ...msg, status: 'sending' })
    useChatStore.getState().replacePendingMessage('room-a', 'pending-123', '$server-event-id')

    const messages = useChatStore.getState().getMessages('room-a')
    expect(messages).toHaveLength(1)
    expect(messages[0].id).toBe('$server-event-id')
    expect(messages[0].status).toBe('sent')
  })

  it('prevents duplicate when sync delivers event after pending replace', () => {
    const msg = makeMessage('pending-123', 'room-a')
    useChatStore.getState().addMessage('room-a', { ...msg, status: 'sending' })
    useChatStore.getState().replacePendingMessage('room-a', 'pending-123', '$evt1')

    // Sync delivers same event
    useChatStore.getState().addMessage('room-a', { ...msg, id: '$evt1' })
    expect(useChatStore.getState().getMessages('room-a')).toHaveLength(1)
  })

  it('drops pending when sync event arrived before replace', () => {
    const msg = makeMessage('pending-123', 'room-a')
    useChatStore.getState().addMessage('room-a', { ...msg, status: 'sending' })

    // Sync delivers the real event before sendTextMessage resolves
    useChatStore.getState().addMessage('room-a', { ...msg, id: '$evt1' })
    expect(useChatStore.getState().getMessages('room-a')).toHaveLength(2)

    // Now replace resolves — should drop pending, keep sync copy
    useChatStore.getState().replacePendingMessage('room-a', 'pending-123', '$evt1')
    const messages = useChatStore.getState().getMessages('room-a')
    expect(messages).toHaveLength(1)
    expect(messages[0].id).toBe('$evt1')
  })

  it('resets all state', () => {
    useChatStore.getState().addMessage('room-a', makeMessage('1', 'room-a'))
    useChatStore.getState().setRooms([{ id: 'r', name: 'R', unreadCount: 0, isDM: false, isGeneral: false, isAnnouncements: false }])
    useChatStore.getState().setSyncing(true)
    useChatStore.getState().setActiveRoom('room-a')

    useChatStore.getState().reset()

    const state = useChatStore.getState()
    expect(state.rooms).toHaveLength(0)
    expect(state.messages.size).toBe(0)
    expect(state.activeRoomId).toBeNull()
    expect(state.isSyncing).toBe(false)
  })

  it('tracks syncing state', () => {
    useChatStore.getState().setSyncing(true)
    expect(useChatStore.getState().isSyncing).toBe(true)
    useChatStore.getState().setSyncing(false)
    expect(useChatStore.getState().isSyncing).toBe(false)
  })
})
