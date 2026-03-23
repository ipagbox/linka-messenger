import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { OnboardingPage } from '../OnboardingPage'

vi.mock('../../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

import { useAuthStore } from '../../../store/authStore'

describe('OnboardingPage', () => {
  const mockOnboard = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      onboard: mockOnboard,
      isLoading: false,
    } as ReturnType<typeof useAuthStore>)
  })

  it('shows display name input', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/onboarding', state: { token: 'tok', circleName: 'Test' } }]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
  })

  it('validates display name is not empty', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/onboarding', state: { token: 'tok' } }]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText('Join Linka'))
    await waitFor(() => {
      expect(screen.getByText(/please enter/i)).toBeInTheDocument()
    })
    expect(mockOnboard).not.toHaveBeenCalled()
  })

  it('calls onboarding API on submit', async () => {
    mockOnboard.mockResolvedValue(undefined)
    render(
      <MemoryRouter initialEntries={[{ pathname: '/onboarding', state: { token: 'my-token', circleName: 'Test' } }]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Alice' } })
    fireEvent.click(screen.getByText('Join Linka'))
    await waitFor(() => {
      expect(mockOnboard).toHaveBeenCalledWith('my-token', 'Alice')
    })
  })

  it('shows error on API failure', async () => {
    mockOnboard.mockRejectedValue(new Error('Registration failed'))
    render(
      <MemoryRouter initialEntries={[{ pathname: '/onboarding', state: { token: 'tok' } }]}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText(/display name/i), { target: { value: 'Alice' } })
    fireEvent.click(screen.getByText('Join Linka'))
    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument()
    })
  })
})
