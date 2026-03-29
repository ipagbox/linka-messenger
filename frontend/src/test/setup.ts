/// <reference types="vitest/globals" />
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock matrix-js-sdk globally
vi.mock('matrix-js-sdk', () => ({
  createClient: vi.fn(() => ({
    startClient: vi.fn(),
    stopClient: vi.fn(),
    login: vi.fn(),
    getRooms: vi.fn(() => []),
    getRoom: vi.fn(),
    sendMessage: vi.fn(),
    sendTextMessage: vi.fn(),
    sendTyping: vi.fn(),
    sendReadReceipt: vi.fn(),
    uploadContent: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    initRustCrypto: vi.fn().mockResolvedValue(undefined),
    setGlobalErrorOnUnknownDevices: vi.fn(),
    getUser: vi.fn(),
    getUserId: vi.fn(() => '@testuser:localhost'),
    getDeviceId: vi.fn(() => 'DEVICE123'),
    isLoggedIn: vi.fn(() => true),
    joinRoom: vi.fn(),
    createRoom: vi.fn(),
    invite: vi.fn(),
    leave: vi.fn(),
  })),
  IndexedDBCryptoStore: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MemoryStore: function MockMemoryStore(this: any) { return this } as unknown as typeof import('matrix-js-sdk').MemoryStore,
  ClientEvent: { Sync: 'Sync' },
  RoomEvent: { Timeline: 'Room.timeline' },
  RoomMemberEvent: { Typing: 'RoomMember.typing', Membership: 'RoomMember.membership' },
  MsgType: { Image: 'm.image', File: 'm.file' },
}))

// Mock indexedDB for matrix crypto store
const indexedDBMock = {
  open: vi.fn(),
}
Object.defineProperty(window, 'indexedDB', { value: indexedDBMock, writable: true })

// Suppress console errors in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})
