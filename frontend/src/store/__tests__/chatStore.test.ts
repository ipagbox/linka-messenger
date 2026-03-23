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
      messages: new Map(),
      pendingMessages: [],
      typingUsers: new Map(),
      activeRoomId: null,
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
})
