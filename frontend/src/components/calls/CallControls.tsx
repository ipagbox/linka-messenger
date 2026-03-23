import { useCallStore } from '../../store/callStore'
import styles from './CallControls.module.css'

export function CallControls() {
  const { isMuted, isVideoMuted, toggleMute, toggleVideo, hangUp } = useCallStore()

  return (
    <div className={styles.controls}>
      <button
        className={`${styles.btn} ${isMuted ? styles.active : ''}`}
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '🔇' : '🎤'}
      </button>
      <button
        className={`${styles.btn} ${isVideoMuted ? styles.active : ''}`}
        onClick={toggleVideo}
        aria-label={isVideoMuted ? 'Start video' : 'Stop video'}
      >
        {isVideoMuted ? '📵' : '📹'}
      </button>
      <button
        className={`${styles.btn} ${styles.hangup}`}
        onClick={hangUp}
        aria-label="Hang up"
      >
        📵
      </button>
    </div>
  )
}
