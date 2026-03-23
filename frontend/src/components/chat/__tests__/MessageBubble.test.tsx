import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MessageBubble } from '../MessageBubble'
import type { Message } from '../../../types'

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg1',
  roomId: 'room1',
  senderId: '@other:localhost',
  senderName: 'Alice',
  body: 'Hello world',
  msgtype: 'm.text',
  timestamp: Date.now(),
  status: 'sent',
  ...overrides,
})

describe('MessageBubble', () => {
  it('renders text message', () => {
    render(<MessageBubble message={makeMessage()} isOwn={false} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('shows sender name for others', () => {
    render(<MessageBubble message={makeMessage()} isOwn={false} showSender />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('does not show sender name for own messages', () => {
    render(<MessageBubble message={makeMessage()} isOwn showSender />)
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('shows timestamp', () => {
    const msg = makeMessage({ timestamp: new Date('2024-01-01T12:00:00').getTime() })
    render(<MessageBubble message={msg} isOwn={false} />)
    expect(screen.getByText(/12:00/)).toBeInTheDocument()
  })

  it('shows error state with retry', () => {
    const onRetry = vi.fn()
    const msg = makeMessage({ status: 'error' })
    render(<MessageBubble message={msg} isOwn onRetry={onRetry} />)
    const retryBtn = screen.getByText('Retry')
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledWith(msg)
  })

  it('shows pending state', () => {
    const msg = makeMessage({ status: 'sending' })
    render(<MessageBubble message={msg} isOwn />)
    expect(screen.getByText('⏳')).toBeInTheDocument()
  })
})
