import type { MatrixClient } from 'matrix-js-sdk'

const MAX_UPLOAD_SIZE_MB = parseInt(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || '50')
const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

export function validateFileSize(file: File): void {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`File size exceeds limit of ${MAX_UPLOAD_SIZE_MB}MB`)
  }
}

export function getMediaUrl(client: MatrixClient, mxcUrl: string): string {
  if (!mxcUrl.startsWith('mxc://')) return mxcUrl
  const baseUrl = (client as { baseUrl?: string }).baseUrl || ''
  const [server, mediaId] = mxcUrl.slice(6).split('/')
  return `${baseUrl}/_matrix/media/v3/download/${server}/${mediaId}`
}

export function getThumbnailUrl(
  client: MatrixClient,
  mxcUrl: string,
  width = 320,
  height = 240
): string {
  if (!mxcUrl.startsWith('mxc://')) return mxcUrl
  const baseUrl = (client as { baseUrl?: string }).baseUrl || ''
  const [server, mediaId] = mxcUrl.slice(6).split('/')
  return `${baseUrl}/_matrix/media/v3/thumbnail/${server}/${mediaId}?width=${width}&height=${height}&method=scale`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getRetentionDays(): number {
  return parseInt(import.meta.env.VITE_MEDIA_RETENTION_DAYS || '30')
}
