import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initMatrixClient, getMatrixClient, destroyMatrixClient } from '../client'
import { createClient } from 'matrix-js-sdk'

describe('Matrix client', () => {
  beforeEach(() => {
    destroyMatrixClient()
  })

  afterEach(() => {
    destroyMatrixClient()
  })

  it('initializes with credentials', async () => {
    const client = await initMatrixClient({
      baseUrl: 'http://localhost:8008',
      accessToken: 'test-token',
      userId: '@user:localhost',
      deviceId: 'DEVICE123',
    })
    expect(client).toBeDefined()
    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'http://localhost:8008',
        accessToken: 'test-token',
        userId: '@user:localhost',
        deviceId: 'DEVICE123',
      })
    )
  })

  it('returns null before initialization', () => {
    expect(getMatrixClient()).toBeNull()
  })

  it('returns client after initialization', async () => {
    await initMatrixClient({
      baseUrl: 'http://localhost:8008',
      accessToken: 'token',
      userId: '@user:localhost',
      deviceId: 'DEV',
    })
    expect(getMatrixClient()).not.toBeNull()
  })

  it('cleans up on destroy', async () => {
    await initMatrixClient({
      baseUrl: 'http://localhost:8008',
      accessToken: 'token',
      userId: '@user:localhost',
      deviceId: 'DEV',
    })
    destroyMatrixClient()
    expect(getMatrixClient()).toBeNull()
  })
})
