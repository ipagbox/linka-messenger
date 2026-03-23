import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import styles from './AuthPages.module.css'

export function LoginPage() {
  const navigate = useNavigate()
  const [matrixUserId, setMatrixUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matrixUserId.trim()) {
      setError('Введите Matrix User ID')
      return
    }
    if (!password) {
      setError('Введите пароль')
      return
    }

    setError('')
    try {
      await login(matrixUserId.trim(), password)
      navigate('/')
    } catch {
      setError('Неверные учётные данные. Проверьте логин и пароль.')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>Linka</h1>
        <h2 className={styles.title}>Вход</h2>
        <p className={styles.subtitle}>Войдите в свой аккаунт</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Matrix User ID"
            placeholder="@username:server"
            value={matrixUserId}
            onChange={(e) => setMatrixUserId(e.target.value)}
            autoFocus
          />

          <Input
            label="Пароль"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" loading={isLoading} size="lg" style={{ width: '100%' }}>
            Войти
          </Button>
        </form>
      </div>
    </div>
  )
}
