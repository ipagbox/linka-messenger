import { MsgType } from 'matrix-js-sdk'
import type { MatrixClient, MatrixEvent, Room } from 'matrix-js-sdk'
import type { Message } from '../types'

export function matrixEventToMessage(event: MatrixEvent, client: MatrixClient): Message | null {
  if (event.getType() !== 'm.room.message') return null

  const content = event.getContent()
  const sender = event.getSender() || ''
  const senderProfile = client.getUser(sender)

  return {
    id: event.getId() || event.getTxnId() || String(Date.now()),
    roomId: event.getRoomId() || '',
    senderId: sender,
    senderName: senderProfile?.displayName || sender,
    body: content.body || '',
    msgtype: content.msgtype || 'm.text',
    timestamp: event.getTs(),
    status: 'sent',
    content: content as import('../types').MessageContent,
  }
}

export async function sendTextMessage(client: MatrixClient, roomId: string, body: string): Promise<string> {
  const result = await client.sendTextMessage(roomId, body)
  return result.event_id
}

export async function sendTyping(client: MatrixClient, roomId: string, isTyping: boolean): Promise<void> {
  await client.sendTyping(roomId, isTyping, isTyping ? 5000 : 0)
}

export async function sendReadReceipt(client: MatrixClient, _room: Room, event: MatrixEvent): Promise<void> {
  await client.sendReadReceipt(event)
}

export function getRoomMessages(room: Room, client: MatrixClient): Message[] {
  const timeline = room.getLiveTimeline().getEvents()
  return timeline
    .map((event) => matrixEventToMessage(event, client))
    .filter((m): m is Message => m !== null)
}

export async function uploadFile(
  client: MatrixClient,
  file: File
): Promise<{ url: string; info: { mimetype: string; size: number } }> {
  const result = await client.uploadContent(file, {
    type: file.type,
    name: file.name,
  })
  return {
    url: result.content_uri,
    info: {
      mimetype: file.type,
      size: file.size,
    },
  }
}

export async function sendFileMessage(
  client: MatrixClient,
  roomId: string,
  file: File
): Promise<string> {
  const { url, info } = await uploadFile(client, file)
  const isImage = file.type.startsWith('image/')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await client.sendMessage(roomId, {
    msgtype: isImage ? MsgType.Image : MsgType.File,
    body: file.name,
    url,
    info: {
      ...info,
      ...(isImage && { w: 0, h: 0 }),
    },
  } as any)
  return result.event_id
}
