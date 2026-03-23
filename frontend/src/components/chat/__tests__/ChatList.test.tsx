import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ChatList } from '../ChatList'
import type { ChatRoom } from '../../../types'

const makeRoom = (overrides: Partial<ChatRoom> = {}): ChatRoom => ({
  id: 'room1',
  name: 'Test Room',
  unreadCount: 0,
  isDM: false,
  isGeneral: false,
  isAnnouncements: false,
  ...overrides,
})

describe('ChatList', () => {
  it('renders list of chats', () => {
    const rooms = [makeRoom({ name: 'Room A' }), makeRoom({ id: 'room2', name: 'Room B' })]
    render(<MemoryRouter><ChatList rooms={rooms} /></MemoryRouter>)
    expect(screen.getByText('Room A')).toBeInTheDocument()
    expect(screen.getByText('Room B')).toBeInTheDocument()
  })

  it('shows unread count badge', () => {
    const rooms = [makeRoom({ name: 'Room A', unreadCount: 5 })]
    render(<MemoryRouter><ChatList rooms={rooms} /></MemoryRouter>)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows last message preview', () => {
    const rooms = [makeRoom({ name: 'Room A', lastMessage: 'Hello world' })]
    render(<MemoryRouter><ChatList rooms={rooms} /></MemoryRouter>)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('pins general and announcements rooms at top', () => {
    const rooms = [
      makeRoom({ id: 'room3', name: 'Regular', lastMessageTime: 1000 }),
      makeRoom({ id: 'room1', name: 'General', isGeneral: true }),
      makeRoom({ id: 'room2', name: 'Announcements', isAnnouncements: true }),
    ]
    render(<MemoryRouter><ChatList rooms={rooms} /></MemoryRouter>)
    const items = screen.getAllByRole('button')
    const names = items.map((el) => el.textContent)
    expect(names[0]).toContain('General')
    expect(names[1]).toContain('Announcements')
  })

  it('shows empty state when no rooms', () => {
    render(<MemoryRouter><ChatList rooms={[]} /></MemoryRouter>)
    expect(screen.getByText(/no chats yet/i)).toBeInTheDocument()
  })
})
