import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ToastContainer } from '../Toast'

describe('ToastContainer', () => {
  it('renders toast messages', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Success!' },
      { id: '2', type: 'error' as const, message: 'Error!' },
    ]
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />)
    expect(screen.getByText('Success!')).toBeInTheDocument()
    expect(screen.getByText('Error!')).toBeInTheDocument()
  })

  it('renders empty when no toasts', () => {
    render(<ToastContainer toasts={[]} onDismiss={vi.fn()} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
