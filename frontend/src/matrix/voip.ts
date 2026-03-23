import type { MatrixClient } from 'matrix-js-sdk'

export function setupVoipListeners(
  client: MatrixClient,
  onIncomingCall: (call: unknown) => void
): void {
  client.on('Call.incoming' as never, onIncomingCall as never)
}

export function removeVoipListeners(
  client: MatrixClient,
  onIncomingCall: (call: unknown) => void
): void {
  client.off('Call.incoming' as never, onIncomingCall as never)
}

export async function startCall(
  _client: MatrixClient,
  _roomId: string,
  _type: 'voice' | 'video'
): Promise<unknown> {
  // Matrix VoIP via matrix-js-sdk createCall
  throw new Error('VoIP not yet implemented - requires browser media permissions')
}
