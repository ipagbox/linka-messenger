import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCircleStore } from '../../store/circleStore'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import styles from './CircleList.module.css'

export function CircleList() {
  const { circles, loadCircles, createCircle, isLoading } = useCircleStore()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [maxMembers, setMaxMembers] = useState('15')
  const [createError, setCreateError] = useState('')
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  useEffect(() => {
    loadCircles()
  }, [loadCircles])

  const handleCreate = async () => {
    if (!name.trim()) {
      setCreateError('Please enter a circle name')
      return
    }
    setCreateError('')
    try {
      const result = await createCircle(name.trim(), parseInt(maxMembers) || 15)
      setInviteLink(result.invite_link)
      setName('')
      setShowCreate(false)
    } catch {
      setCreateError('Failed to create circle')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Circles</h2>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          + Create
        </Button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Loading...</div>
      ) : circles.length === 0 ? (
        <div className={styles.empty}>
          <p>No circles yet. Create one to get started!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {circles.map((circle) => (
            <button
              key={circle.id}
              className={styles.item}
              onClick={() => navigate(`/circles/${circle.id}`)}
            >
              <Avatar name={circle.name} size="md" />
              <div className={styles.info}>
                <span className={styles.name}>{circle.name}</span>
                <span className={styles.members}>{circle.member_count} / {circle.max_members} members</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Circle">
        <div className={styles.form}>
          <Input
            label="Circle Name"
            placeholder="My Circle"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            label="Max Members"
            type="number"
            min="2"
            max="100"
            value={maxMembers}
            onChange={(e) => setMaxMembers(e.target.value)}
          />
          {createError && <p className={styles.error}>{createError}</p>}
          <Button variant="primary" onClick={handleCreate}>Create Circle</Button>
        </div>
      </Modal>

      <Modal isOpen={!!inviteLink} onClose={() => setInviteLink(null)} title="Circle Created!">
        <div className={styles.inviteResult}>
          <p>Share this invite link:</p>
          <div className={styles.inviteLink}>{inviteLink}</div>
          <Button
            variant="secondary"
            onClick={() => { navigator.clipboard.writeText(inviteLink || ''); setInviteLink(null) }}
          >
            Copy & Close
          </Button>
        </div>
      </Modal>
    </div>
  )
}
