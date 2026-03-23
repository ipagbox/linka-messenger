import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick handler', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('shows spinner when loading', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    expect(screen.queryByText('Click me')).not.toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when loading', () => {
    render(<Button loading>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies primary variant by default', () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('primary')
  })

  it('applies secondary variant', () => {
    render(<Button variant="secondary">Click me</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('secondary')
  })
})
