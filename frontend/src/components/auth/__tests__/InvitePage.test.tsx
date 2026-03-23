import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InvitePage } from '../InvitePage'

vi.mock('../../../api/invites', () => ({
  validateInvite: vi.fn(),
}))

import { validateInvite } from '../../../api/invites'

describe('InvitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading while validating', async () => {
    vi.mocked(validateInvite).mockReturnValue(new Promise(() => {}))
    render(
      <MemoryRouter initialEntries={['/invite/test-token']}>
        <Routes>
          <Route path="/invite/:token" element={<InvitePage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByLabelText('Loading')).toBeInTheDocument()
  })

  it('extracts token from URL and validates it', async () => {
    vi.mocked(validateInvite).mockResolvedValue({ valid: true, circle_name: 'Test Circle' })
    render(
      <MemoryRouter initialEntries={['/invite/my-token']}>
        <Routes>
          <Route path="/invite/:token" element={<InvitePage />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(validateInvite).toHaveBeenCalledWith('my-token')
    })
  })

  it('shows error for invalid token', async () => {
    vi.mocked(validateInvite).mockResolvedValue({ valid: false, reason: 'Expired invite' })
    render(
      <MemoryRouter initialEntries={['/invite/bad-token']}>
        <Routes>
          <Route path="/invite/:token" element={<InvitePage />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/expired invite/i)).toBeInTheDocument()
    })
  })

  it('shows success for valid token', async () => {
    vi.mocked(validateInvite).mockResolvedValue({ valid: true, circle_name: 'My Circle' })
    render(
      <MemoryRouter initialEntries={['/invite/good-token']}>
        <Routes>
          <Route path="/invite/:token" element={<InvitePage />} />
          <Route path="/onboarding" element={<div>Onboarding</div>} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText(/you're invited/i)).toBeInTheDocument()
    })
  })
})
