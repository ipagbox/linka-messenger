import { formatFileSize, getRetentionDays } from '../../matrix/media'
import { Badge } from '../ui/Badge'
import styles from './FileAttachment.module.css'

interface FileAttachmentProps {
  url: string
  filename: string
  size?: number
  mimetype?: string
}

export function FileAttachment({ url, filename, size, mimetype }: FileAttachmentProps) {
  const retentionDays = getRetentionDays()
  const isDownloadable = url.startsWith('http') || url.startsWith('mxc://')

  return (
    <div className={styles.attachment}>
      <div className={styles.icon}>📄</div>
      <div className={styles.info}>
        <span className={styles.name}>{filename}</span>
        <div className={styles.meta}>
          {size && <span className={styles.size}>{formatFileSize(size)}</span>}
          {mimetype && <span className={styles.type}>{mimetype}</span>}
          <Badge variant="warning" label={`${retentionDays}d TTL`} />
        </div>
      </div>
      {isDownloadable && (
        <a href={url} download={filename} className={styles.downloadBtn} target="_blank" rel="noreferrer">
          ↓
        </a>
      )}
    </div>
  )
}
