import { useState } from 'react'
import styles from './ImagePreview.module.css'

interface ImagePreviewProps {
  url: string
  alt?: string
}

export function ImagePreview({ url, alt = 'Image' }: ImagePreviewProps) {
  const [lightbox, setLightbox] = useState(false)

  return (
    <>
      <div className={styles.thumbnail} onClick={() => setLightbox(true)}>
        <img src={url} alt={alt} className={styles.img} loading="lazy" />
      </div>
      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(false)}>
          <img src={url} alt={alt} className={styles.lightboxImg} />
        </div>
      )}
    </>
  )
}
