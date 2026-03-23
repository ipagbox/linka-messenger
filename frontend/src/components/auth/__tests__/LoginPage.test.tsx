import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LoginPage } from '../LoginPage'

vi.mock('../../../store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

import { useAuthStore } from '../../../store/authStore'

describe('LoginPage', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoading: false,
    } as ReturnType<typeof useAuthStore>)
  })

  it('renders login form with password field', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/matrix user id/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument()
    expect(screen.getByText('Войти')).toBeInTheDocument()
  })

  it('calls login with user id and password', async () => {
    mockLogin.mockResolvedValue(undefined)
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText(/matrix user id/i), {
      target: { value: '@alice:localhost' },
    })
    fireEvent.change(screen.getByLabelText(/пароль/i), {
      target: { value: 'secret123' },
    })
    fireEvent.click(screen.getByText('Войти'))
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('@alice:localhost', 'secret123')
    })
  })

  it('shows error on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid'))
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText(/matrix user id/i), {
      target: { value: '@bad:localhost' },
    })
    fireEvent.change(screen.getByLabelText(/пароль/i), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByText('Войти'))
    await waitFor(() => {
      expect(screen.getByText(/неверные учётные данные/i)).toBeInTheDocument()
    })
  })

  it('shows error when password is empty', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    fireEvent.change(screen.getByLabelText(/matrix user id/i), {
      target: { value: '@alice:localhost' },
    })
    fireEvent.click(screen.getByText('Войти'))
    await waitFor(() => {
      expect(screen.getByText(/введите пароль/i)).toBeInTheDocument()
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })
})
