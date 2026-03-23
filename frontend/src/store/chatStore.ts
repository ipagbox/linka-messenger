import { create } from 'zustand'
import type { Message } from '../types'

interface ChatState {
  messages: Map<string, Message[]>
  pendingMessages: Message[]
  typingUsers: Map<string, string[]>
  activeRoomId: string | null

  setActiveRoom: (roomId: string | null) => void
  addMessage: (roomId: string, message: Message) => void
  updateMessageStatus: (roomId: string, messageId: string, status: Message['status']) => void
  setMessages: (roomId: string, messages: Message[]) => void
  setTypingUsers: (roomId: string, userIds: string[]) => void
  getMessages: (roomId: string) => Message[]
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: new Map(),
  pendingMessages: [],
  typingUsers: new Map(),
  activeRoomId: null,

  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

  addMessage: (roomId, message) => {
    set((state) => {
      const messages = new Map(state.messages)
      const existing = messages.get(roomId) || []
      // Avoid duplicates
      if (!existing.find((m) => m.id === message.id)) {
        messages.set(roomId, [...existing, message])
      }
      return { messages }
    })
  },

  updateMessageStatus: (roomId, messageId, status) => {
    set((state) => {
      const messages = new Map(state.messages)
      const existing = messages.get(roomId) || []
      messages.set(
        roomId,
        existing.map((m) => (m.id === messageId ? { ...m, status } : m))
      )
      return { messages }
    })
  },

  setMessages: (roomId, newMessages) => {
    set((state) => {
      const messages = new Map(state.messages)
      messages.set(roomId, newMessages)
      return { messages }
    })
  },

  setTypingUsers: (roomId, userIds) => {
    set((state) => {
      const typing = new Map(state.typingUsers)
      typing.set(roomId, userIds)
      return { typingUsers: typing }
    })
  },

  getMessages: (roomId) => {
    return get().messages.get(roomId) || []
  },
}))
