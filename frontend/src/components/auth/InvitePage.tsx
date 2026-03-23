import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { validateInvite } from '../../api/invites'
import { Spinner } from '../ui/Spinner'
import styles from './AuthPages.module.css'

export function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [circleName, setCircleName] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      setError('Missing invite token')
      return
    }

    validateInvite(token)
      .then((result) => {
        if (result.valid) {
          setCircleName(result.circle_name || '')
          setStatus('valid')
          setTimeout(() => {
            navigate('/onboarding', { state: { token, circleName: result.circle_name } })
          }, 1500)
        } else {
          setStatus('invalid')
          setError(result.reason || 'This invite is not valid')
        }
      })
      .catch(() => {
        setStatus('invalid')
        setError('Failed to validate invite. Please try again.')
      })
  }, [token, navigate])

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>Linka</h1>

        {status === 'loading' && (
          <div className={styles.centered}>
            <Spinner size="lg" />
            <p className={styles.subtitle}>Validating invite...</p>
          </div>
        )}

        {status === 'valid' && (
          <div className={styles.centered}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.title}>You're invited!</h2>
            <p className={styles.subtitle}>
              Join <strong>{circleName}</strong>
            </p>
            <p className={styles.muted}>Redirecting to setup...</p>
          </div>
        )}

        {status === 'invalid' && (
          <div className={styles.centered}>
            <div className={styles.errorIcon}>✕</div>
            <h2 className={styles.title}>Invalid Invite</h2>
            <p className={styles.error}>{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
