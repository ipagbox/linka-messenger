import { useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCircleStore } from '../../store/circleStore'
import { useChatStore } from '../../store/chatStore'
import { useAuthStore } from '../../store/authStore'
import { getMatrixClient } from '../../matrix/client'
import { createDM } from '../../matrix/rooms'
import { Avatar } from '../ui/Avatar'
import { ContactCard } from '../contacts/ContactCard'
import type { User } from '../../types'
import styles from './CircleView.module.css'

export function CircleView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { circles, members, loadMembers } = useCircleStore()
  const { findDMRoom } = useChatStore()
  const { matrixUserId } = useAuthStore()
  const circle = circles.find((c) => String(c.id) === id)
  const circleMembers = id ? members[parseInt(id)] || [] : []

  useEffect(() => {
    if (id) loadMembers(parseInt(id))
  }, [id, loadMembers])

  const handleOpenGeneralChat = useCallback(() => {
    if (circle?.matrix_general_room_id) {
      navigate(`/chat/${encodeURIComponent(circle.matrix_general_room_id)}`)
    }
  }, [circle, navigate])

  const handleOpenAnnouncements = useCallback(() => {
    if (circle?.matrix_announcements_room_id) {
      navigate(`/chat/${encodeURIComponent(circle.matrix_announcements_room_id)}`)
    }
  }, [circle, navigate])

  const handleMessage = useCallback(async (user: User) => {
    const existingRoom = findDMRoom(user.matrix_user_id)
    if (existingRoom) {
      navigate(`/chat/${encodeURIComponent(existingRoom.id)}`)
      return
    }

    const client = getMatrixClient()
    if (!client) return

    try {
      const room = await createDM(client, user.matrix_user_id, circle?.matrix_space_id || undefined)
      navigate(`/chat/${encodeURIComponent(room.roomId)}`)
    } catch (err) {
      console.error('Failed to create DM:', err)
    }
  }, [findDMRoom, navigate, circle])

  if (!circle) return <div className={styles.notFound}>Circle not found</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Avatar name={circle.name} size="lg" />
        <div>
          <h2 className={styles.name}>{circle.name}</h2>
          <p className={styles.meta}>{circle.member_count} / {circle.max_members} members</p>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Rooms</h3>
        <div className={styles.roomList}>
          {circle.matrix_general_room_id && (
            <button className={styles.roomBtn} onClick={handleOpenGeneralChat}>
              <span className={styles.roomIcon}>#</span>
              <span>General</span>
            </button>
          )}
          {circle.matrix_announcements_room_id && (
            <button className={styles.roomBtn} onClick={handleOpenAnnouncements}>
              <span className={styles.roomIcon}>#</span>
              <span>Announcements</span>
            </button>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Members</h3>
        <div className={styles.memberList}>
          {circleMembers.map((member) => (
            <ContactCard
              key={member.id}
              user={member}
              onMessage={member.matrix_user_id !== matrixUserId ? handleMessage : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
