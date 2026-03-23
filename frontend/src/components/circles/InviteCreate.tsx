import { useState } from 'react'
import { createCircleInvite } from '../../api/invites'
import { Button } from '../ui/Button'
import styles from './InviteCreate.module.css'

interface InviteCreateProps {
  circleId: number
}

export function InviteCreate({ circleId }: InviteCreateProps) {
  const [link, setLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const result = await createCircleInvite(circleId)
      setLink(result.invite_link)
    } catch {
      // Handle error
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!link) return
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.container}>
      <Button variant="secondary" size="sm" onClick={handleCreate} loading={loading}>
        Generate Invite Link
      </Button>
      {link && (
        <div className={styles.result}>
          <div className={styles.link}>{link}</div>
          <Button variant="primary" size="sm" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </div>
      )}
    </div>
  )
}
