import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../Input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Display Name" />)
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input label="Name" error="Name is required" />)
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('calls onChange handler', () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('applies placeholder', () => {
    render(<Input placeholder="Enter name" />)
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument()
  })
})
