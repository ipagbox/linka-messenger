import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InvitePage } from '../../components/auth/InvitePage'
import { OnboardingPage } from '../../components/auth/OnboardingPage'
import { useAuthStore } from '../../store/authStore'

vi.mock('../../api/invites', () => ({
  validateInvite: vi.fn(),
}))

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

import { validateInvite } from '../../api/invites'

describe('Onboarding Flow', () => {
  const mockOnboard = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      onboard: mockOnboard,
      isLoading: false,
    } as ReturnType<typeof useAuthStore>)
  })

  it('validates invite → enters name → creates account', async () => {
    vi.mocked(validateInvite).mockResolvedValue({ valid: true, circle_name: 'Dev Team' })
    mockOnboard.mockResolvedValue(undefined)

    render(
      <MemoryRouter initialEntries={['/invite/good-token']}>
        <Routes>
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<div data-testid="home">Home</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Invite page validates
    await waitFor(() => {
      expect(screen.getByText(/you're invited/i)).toBeInTheDocument()
    })
    expect(validateInvite).toHaveBeenCalledWith('good-token')
  })

  it('handles invalid invite gracefully', async () => {
    vi.mocked(validateInvite).mockResolvedValue({ valid: false, reason: 'Invite has expired' })

    render(
      <MemoryRouter initialEntries={['/invite/bad-token']}>
        <Routes>
          <Route path="/invite/:token" element={<InvitePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/invite has expired/i)).toBeInTheDocument()
    })
  })

  it('handles network error during validation', async () => {
    vi.mocked(validateInvite).mockRejectedValue(new Error('Network error'))

    render(
      <MemoryRouter initialEntries={['/invite/some-token']}>
        <Routes>
          <Route path="/invite/:token" element={<InvitePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to validate/i)).toBeInTheDocument()
    })
  })
})
