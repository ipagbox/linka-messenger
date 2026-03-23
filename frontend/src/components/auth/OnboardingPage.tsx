import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import styles from './AuthPages.module.css'

export function OnboardingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, circleName } = (location.state as { token: string; circleName?: string }) || {}
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const { onboard, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Please enter your display name')
      return
    }
    if (!token) {
      setError('Missing invite token. Please use the invite link again.')
      return
    }

    setError('')
    try {
      await onboard(token, displayName.trim())
      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
    }
  }

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.logo}>Linka</h1>
          <p className={styles.error}>No invite token found. Please use a valid invite link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>Linka</h1>
        <h2 className={styles.title}>Set up your account</h2>
        {circleName && (
          <p className={styles.subtitle}>
            You're joining <strong>{circleName}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Display Name"
            placeholder="How should others see you?"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoFocus
            maxLength={50}
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" loading={isLoading} size="lg" style={{ width: '100%' }}>
            Join Linka
          </Button>
        </form>
      </div>
    </div>
  )
}
