import { describe, it, expect, vi } from 'vitest'
import { sendTextMessage, sendTyping, matrixEventToMessage } from '../messages'
import type { MatrixClient, MatrixEvent } from 'matrix-js-sdk'

describe('Matrix messages', () => {
  const mockClient = {
    sendTextMessage: vi.fn().mockResolvedValue({ event_id: 'evt123' }),
    sendTyping: vi.fn().mockResolvedValue({}),
    sendReadReceipt: vi.fn().mockResolvedValue({}),
    uploadContent: vi.fn().mockResolvedValue({ content_uri: 'mxc://localhost/abc123' }),
    sendMessage: vi.fn().mockResolvedValue({ event_id: 'evt456' }),
    getUser: vi.fn().mockReturnValue({ displayName: 'Alice' }),
  } as unknown as MatrixClient

  it('sends text message', async () => {
    const eventId = await sendTextMessage(mockClient, '!room1:localhost', 'Hello')
    expect(eventId).toBe('evt123')
    expect(mockClient.sendTextMessage).toHaveBeenCalledWith('!room1:localhost', 'Hello')
  })

  it('sends typing notification', async () => {
    await sendTyping(mockClient, '!room1:localhost', true)
    expect(mockClient.sendTyping).toHaveBeenCalledWith('!room1:localhost', true, 5000)
  })

  it('sends stop typing notification', async () => {
    await sendTyping(mockClient, '!room1:localhost', false)
    expect(mockClient.sendTyping).toHaveBeenCalledWith('!room1:localhost', false, 0)
  })

  it('converts matrix event to message', () => {
    const mockEvent = {
      getType: vi.fn().mockReturnValue('m.room.message'),
      getContent: vi.fn().mockReturnValue({ body: 'Hello', msgtype: 'm.text' }),
      getSender: vi.fn().mockReturnValue('@alice:localhost'),
      getId: vi.fn().mockReturnValue('evt123'),
      getTxnId: vi.fn().mockReturnValue(null),
      getRoomId: vi.fn().mockReturnValue('!room1:localhost'),
      getTs: vi.fn().mockReturnValue(1000),
    } as unknown as MatrixEvent

    const message = matrixEventToMessage(mockEvent, mockClient)
    expect(message).not.toBeNull()
    expect(message?.body).toBe('Hello')
    expect(message?.senderName).toBe('Alice')
    expect(message?.status).toBe('sent')
  })

  it('returns null for non-message events', () => {
    const mockEvent = {
      getType: vi.fn().mockReturnValue('m.room.member'),
    } as unknown as MatrixEvent

    const message = matrixEventToMessage(mockEvent, mockClient)
    expect(message).toBeNull()
  })
})
