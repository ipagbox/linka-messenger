import { useCallStore } from '../../store/callStore'
import { CallControls } from './CallControls'
import styles from './CallView.module.css'

export function CallView() {
  const { callState, callRoomId } = useCallStore()

  if (callState === 'idle') return null

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <h2 className={styles.status}>
          {callState === 'ringing' ? 'Calling...' : callState === 'connecting' ? 'Connecting...' : 'In Call'}
        </h2>
        <p className={styles.room}>{callRoomId}</p>
        <div className={styles.video}>
          {/* Video streams */}
          <div className={styles.remoteVideo}>Remote</div>
          <div className={styles.localVideo}>You</div>
        </div>
        <CallControls />
      </div>
    </div>
  )
}
