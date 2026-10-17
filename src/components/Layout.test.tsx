// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Layout } from './Layout'

const { useAppMock } = vi.hoisted(() => ({ useAppMock: vi.fn() }))
vi.mock('../store/AppContext', () => ({ useApp: useAppMock }))
vi.mock('./AmbientEffects', () => ({ AmbientEffects: () => null }))

const state = {
  merit: 0,
  soundOn: false,
  user: { id: 'user-1', name: 'User', email: 'user@example.com', role: 'user' as const },
}

describe('Layout', () => {
  beforeEach(() => useAppMock.mockReturnValue({ state, setSound: vi.fn() }))

  it('hides the admin destination from a regular user', () => {
    render(
      <Layout>
        <p>Nội dung</p>
      </Layout>,
      { wrapper: MemoryRouter }
    )
    expect(document.querySelector('a[href="/admin"]')).toBeNull()
  })

  it('shows the admin destination only to an admin', () => {
    useAppMock.mockReturnValue({ state: { ...state, user: { ...state.user, role: 'admin' } }, setSound: vi.fn() })
    render(
      <Layout>
        <p>Nội dung</p>
      </Layout>,
      { wrapper: MemoryRouter }
    )
    expect(document.querySelector('a[href="/admin"]')).not.toBeNull()
    expect(screen.getByText(/quản trị/i)).toBeTruthy()
  })
})
