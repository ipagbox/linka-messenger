import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../Modal'

describe('Modal', () => {
  it('renders when open', () => {
    render(<Modal isOpen onClose={vi.fn()} title="Test Modal"><p>Content</p></Modal>)
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="Test Modal"><p>Content</p></Modal>)
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('calls onClose when overlay clicked', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="Test"><p>Content</p></Modal>)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="Test"><p>Content</p></Modal>)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalled()
  })
})
