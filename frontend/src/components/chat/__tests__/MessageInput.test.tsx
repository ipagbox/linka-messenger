import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MessageInput } from '../MessageInput'

describe('MessageInput', () => {
  it('sends message on Enter', () => {
    const onSend = vi.fn()
    render(<MessageInput onSend={onSend} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(onSend).toHaveBeenCalledWith('Hello')
  })

  it('does not send on Shift+Enter', () => {
    const onSend = vi.fn()
    render(<MessageInput onSend={onSend} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()
  })

  it('does not send empty message', () => {
    const onSend = vi.fn()
    render(<MessageInput onSend={onSend} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(onSend).not.toHaveBeenCalled()
  })

  it('clears input after send', () => {
    const onSend = vi.fn()
    render(<MessageInput onSend={onSend} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(textarea).toHaveValue('')
  })

  it('calls onSend when Send button clicked', () => {
    const onSend = vi.fn()
    render(<MessageInput onSend={onSend} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Test' } })
    fireEvent.click(screen.getByLabelText('Send message'))
    expect(onSend).toHaveBeenCalledWith('Test')
  })
})
