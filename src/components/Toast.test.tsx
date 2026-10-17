// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Toast } from './Toast'

const { useAppMock } = vi.hoisted(() => ({ useAppMock: vi.fn() }))
vi.mock('../store/AppContext', () => ({ useApp: useAppMock }))

describe('Toast', () => {
  beforeEach(() => useAppMock.mockReset())

  it('renders nothing without a message', () => {
    useAppMock.mockReturnValue({ toast: null, setToast: vi.fn() })
    expect(render(<Toast />).container.innerHTML).toBe('')
  })

  it('shows and dismisses the current message', () => {
    const setToast = vi.fn()
    useAppMock.mockReturnValue({ toast: 'Đã lưu thay đổi', setToast })
    render(<Toast />)
    expect(screen.getByRole('status').textContent).toContain('Đã lưu thay đổi')
    fireEvent.click(screen.getByRole('button'))
    expect(setToast).toHaveBeenCalledWith(null)
  })
})
