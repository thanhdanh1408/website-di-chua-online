// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { emptyState } from './shared'
import { useMeritSystem } from './useMeritSystem'

describe('useMeritSystem', () => {
  it('awards points and respects a source cap', () => {
    const stateRef = { current: emptyState() }
    const updatePersonal = (updater: (current: typeof stateRef.current) => typeof stateRef.current) => {
      stateRef.current = updater(stateRef.current)
      return stateRef.current
    }
    const { result } = renderHook(() => useMeritSystem(stateRef.current, stateRef, updatePersonal))

    act(() => {
      expect(result.current.addMerit('incense', 7, 'Lần một', 10)).toBe(7)
      expect(result.current.addMerit('incense', 7, 'Lần hai', 10)).toBe(3)
      expect(result.current.addMerit('incense', 1, 'Đã chạm trần', 10)).toBe(0)
    })
    expect(stateRef.current.merit).toBe(10)
    expect(stateRef.current.meritLogs).toHaveLength(2)
  })
})
