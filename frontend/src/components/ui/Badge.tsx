import styles from './Badge.module.css'

interface BadgeProps {
  count?: number
  variant?: 'default' | 'success' | 'warning' | 'error'
  label?: string
}

export function Badge({ count, variant = 'default', label }: BadgeProps) {
  if (count !== undefined && count <= 0) return null

  return (
    <span className={`${styles.badge} ${styles[variant]}`} aria-label={label}>
      {count !== undefined ? (count > 99 ? '99+' : String(count)) : label}
    </span>
  )
}
