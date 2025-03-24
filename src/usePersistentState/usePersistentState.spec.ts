import {renderHook, act, waitFor} from '@testing-library/react'
import {usePersistentState} from './usePersistentState'

// Mock localStorage
const localStorageMock = (() => {
  let store: {[key: string]: string} = {}
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn(key => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    store
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('usePersistentState', () => {
  beforeEach(() => {
    localStorageMock.clear()
    localStorageMock.store = {}
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  // Basic initialization test
  test('should initialize state with initial value', () => {
    const initialState = {count: 0}
    const {result} = renderHook(() => usePersistentState(initialState))

    expect(result.current[0]).toEqual(initialState)
  })

  // Storage saving test
  test('should save state to localStorage when state changes', async () => {
    const initialState = {count: 0}
    const {result} = renderHook(() =>
      usePersistentState(initialState, {storageKey: 'test-key'})
    )

    act(() => {
      result.current[1]({count: 5})
    })

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({count: 5})
      )
    })
  })

  // Storage retrieval test
  test('should retrieve state from localStorage on initialization', () => {
    const storedState = {count: 10}
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedState))

    const {result} = renderHook(() =>
      usePersistentState({count: 0}, {storageKey: 'test-key'})
    )

    expect(result.current[0]).toEqual(storedState)
  })

  // Custom transform test
  test('should apply custom transform when retrieving from storage', () => {
    const storedState = {count: '10'}
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedState))

    const {result} = renderHook(() =>
      usePersistentState({count: 0}, {
        storageKey: 'test-key',
        transformFromStorage: (value: any) => ({
          count: parseInt(value.count, 10)
        })
      })
    )

    expect(result.current[0]).toEqual({count: 10})
  })

  // Clear functionality test
  test('should clear localStorage and reset state when clear is called', async () => {
    const initialState = {count: 0}
    const {result} = renderHook(() =>
      usePersistentState(initialState, {storageKey: 'test-key'})
    )

    act(() => {
      result.current[1]({count: 5}) // Change state
      result.current[2]() // Call clear function
    })

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
    })

    expect(result.current[0]).toEqual(initialState)
  })

  // Function initial state test
  test('should work with function as initial state', () => {
    const initialStateFunc = () => ({count: 42})
    const {result} = renderHook(() => usePersistentState(initialStateFunc))

    expect(result.current[0]).toEqual({count: 42})
  })

  // Error handling test
  test('should handle JSON parsing errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    localStorageMock.getItem.mockReturnValueOnce('invalid json')

    const initialState = {count: 0}
    const {result} = renderHook(() => usePersistentState(initialState))

    expect(result.current[0]).toEqual(initialState)
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  // Storage type test
  test('should support sessionStorage', async () => {
    const sessionStorageMock = (() => {
      let store: {[key: string]: string} = {}
      return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString()
        }),
        removeItem: jest.fn(key => {
          delete store[key]
        }),
        clear: jest.fn(() => {
          store = {}
        }),
        store
      }
    })()

    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock
    })

    const initialState = {count: 0}
    const {result} = renderHook(() =>
      usePersistentState(initialState, {storageType: 'sessionStorage'})
    )

    act(() => {
      result.current[1]({count: 5})
    })

    await waitFor(() => {
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify({count: 5})
      )
    })
  })
})