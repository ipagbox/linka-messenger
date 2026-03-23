import { useRef, useState } from 'react'
import { validateFileSize } from '../../matrix/media'
import styles from './MediaUpload.module.css'

interface MediaUploadProps {
  onFileSelected: (file: File) => void
  onError?: (error: string) => void
}

export function MediaUpload({ onFileSelected, onError }: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    try {
      validateFileSize(file)
      onFileSelected(file)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'File too large'
      onError?.(message)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div
      className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <span className={styles.icon}>📎</span>
      <span className={styles.text}>Drop file or click to upload</span>
      <input ref={fileInputRef} type="file" hidden onChange={handleChange} />
    </div>
  )
}
