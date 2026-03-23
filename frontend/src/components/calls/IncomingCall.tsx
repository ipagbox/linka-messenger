import { useCallStore } from '../../store/callStore'
import { Button } from '../ui/Button'
import styles from './IncomingCall.module.css'

export function IncomingCall() {
  const { activeCall, callState, answerCall, rejectCall } = useCallStore()

  if (callState !== 'ringing' || !activeCall) return null

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.avatar}>📞</div>
        <h3 className={styles.title}>Incoming Call</h3>
        <p className={styles.subtitle}>Someone is calling you</p>
        <div className={styles.actions}>
          <Button variant="danger" onClick={rejectCall}>Decline</Button>
          <Button variant="primary" onClick={answerCall}>Accept</Button>
        </div>
      </div>
    </div>
  )
}
