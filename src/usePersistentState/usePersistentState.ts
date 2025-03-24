import {Dispatch, SetStateAction, useCallback, useEffect, useState} from 'react'

const generateHash = (x: string): number => {
  return x.split('').reduce((prevHash, currVal) =>
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0
  )
}

const generateId = (key?: string | number): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `react-persistent-state-${key ?? crypto.randomUUID()}`
  }
  const timestamp = new Date().getTime()
  const randomPart = Math.random().toString(36).substring(2, 15)
  const stackHash = generateHash(new Error().stack ?? '')

  return `react-persistent-state-${key ?? `${timestamp}-${randomPart}-${stackHash}`}`
}

export const usePersistentState = <S>(
  initialState: S | (() => S),
  options: {
    storageKey?: string;
    transformFromStorage?: (_: unknown) => S;
    storageType?: 'localStorage' | 'sessionStorage';
  } = {}
): [S, Dispatch<SetStateAction<S>>, () => void] => {
  const {
    storageKey = generateId(),
    transformFromStorage = (value: unknown) => value as S,
    storageType = 'localStorage'
  } = options

  const isStorageAvailable = () => {
    try {
      const storage = window[storageType]
      const testKey = '__storage_test__'
      storage.setItem(testKey, testKey)
      storage.removeItem(testKey)
      return true
    } catch (e) {
      return false
    }
  }

  const getInitialValue = (): S | (() => S) => {
    if (!isStorageAvailable()) return initialState

    try {
      const storage = window[storageType]
      const storedValue = storage.getItem(storageKey)

      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        return transformFromStorage(parsed)
      }
    } catch (error) {
      console.warn(`Error reading from ${storageType} for key "${storageKey}":`, error)
    }

    return initialState
  }

  const [state, setState] = useState<S>(getInitialValue())

  useEffect(() => {
    if (isStorageAvailable()) {
      try {
        const storage = window[storageType]
        storage.setItem(storageKey, JSON.stringify(state))
      } catch (error) {
        console.warn(`Error writing to ${storageType} for key "${storageKey}":`, error)
      }
    }
  }, [storageKey, state, storageType])

  const clear = useCallback(() => {
    if (isStorageAvailable()) {
      try {
        const storage = window[storageType]
        storage.removeItem(storageKey)
      } catch (error) {
        console.warn(`Error clearing ${storageType} for key "${storageKey}":`, error)
      }
    }
    setState(initialState)
  }, [initialState, storageKey, storageType])

  return [state, setState, clear]
}