import { createClient, type MatrixClient, MemoryStore } from 'matrix-js-sdk'

let matrixClient: MatrixClient | null = null

interface InitParams {
  baseUrl: string
  accessToken: string
  userId: string
  deviceId: string
}

export function getMatrixClient(): MatrixClient | null {
  return matrixClient
}

export async function initMatrixClient(params: InitParams): Promise<MatrixClient> {
  if (matrixClient) {
    matrixClient.stopClient()
  }

  matrixClient = createClient({
    baseUrl: params.baseUrl,
    accessToken: params.accessToken,
    userId: params.userId,
    deviceId: params.deviceId,
    store: new MemoryStore(),
  })

  try {
    await matrixClient.initRustCrypto()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(matrixClient as any).setGlobalErrorOnUnknownDevices?.(false)
  } catch (err) {
    console.warn('Crypto init failed:', err)
  }

  return matrixClient
}

export function startMatrixSync(client: MatrixClient, initialSyncLimit = 20): void {
  client.startClient({ initialSyncLimit })
}

export function destroyMatrixClient(): void {
  if (matrixClient) {
    matrixClient.stopClient()
    matrixClient = null
  }
}
