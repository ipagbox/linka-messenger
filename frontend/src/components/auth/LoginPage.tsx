import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import styles from './AuthPages.module.css'

export function LoginPage() {
  const navigate = useNavigate()
  const [matrixUserId, setMatrixUserId] = useState('')
  const [error, setError] = useState('')
  const { login, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matrixUserId.trim()) {
      setError('Please enter your Matrix user ID')
      return
    }

    setError('')
    try {
      await login(matrixUserId.trim())
      navigate('/')
    } catch {
      setError('Login failed. Please check your credentials.')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>Linka</h1>
        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Matrix User ID"
            placeholder="@username:server"
            value={matrixUserId}
            onChange={(e) => setMatrixUserId(e.target.value)}
            autoFocus
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" loading={isLoading} size="lg" style={{ width: '100%' }}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}
