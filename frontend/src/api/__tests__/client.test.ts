import { describe, expect, it } from 'vitest'
import type { AxiosError } from 'axios'
import { shouldRedirectOnUnauthorized } from '../client'

function buildAxiosError({
  status,
  method,
  url,
}: {
  status: number
  method?: string
  url?: string
}): AxiosError {
  return {
    response: { status },
    config: {
      method,
      url,
      headers: {},
    },
    isAxiosError: true,
    name: 'AxiosError',
    message: 'Request failed',
    toJSON: () => ({}),
  } as AxiosError
}

describe('shouldRedirectOnUnauthorized', () => {
  it('does not redirect on failed login requests', () => {
    const error = buildAxiosError({
      status: 401,
      method: 'post',
      url: '/sessions',
    })

    expect(shouldRedirectOnUnauthorized(error)).toBe(false)
  })

  it('redirects on unauthorized profile requests', () => {
    const error = buildAxiosError({
      status: 401,
      method: 'get',
      url: '/profile',
    })

    expect(shouldRedirectOnUnauthorized(error)).toBe(true)
  })

  it('does not redirect on non-401 responses', () => {
    const error = buildAxiosError({
      status: 500,
      method: 'get',
      url: '/profile',
    })

    expect(shouldRedirectOnUnauthorized(error)).toBe(false)
  })
})
