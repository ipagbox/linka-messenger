import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from '../Avatar'

describe('Avatar', () => {
  it('renders initials for single name', () => {
    render(<Avatar name="Alice" />)
    expect(screen.getByLabelText('Alice')).toBeInTheDocument()
    expect(screen.getByLabelText('Alice')).toHaveTextContent('AL')
  })

  it('renders initials for two-word name', () => {
    render(<Avatar name="John Doe" />)
    expect(screen.getByLabelText('John Doe')).toHaveTextContent('JD')
  })

  it('applies different sizes', () => {
    const { rerender } = render(<Avatar name="Test" size="sm" />)
    expect(screen.getByLabelText('Test').className).toContain('sm')

    rerender(<Avatar name="Test" size="lg" />)
    expect(screen.getByLabelText('Test').className).toContain('lg')
  })
})
