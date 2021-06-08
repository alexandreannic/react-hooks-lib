import {Dispatch, SetStateAction, useRef, useState} from 'react'

export type Fetch<T> = (args?: {force?: boolean, clean?: boolean}) => T;

export type UseFetchableReturn<T, E = any> = {
  entity: T | undefined,
  loading: boolean,
  error?: E
  fetch: Fetch<(...args: any[]) => Promise<T>>,
  setEntity: Dispatch<SetStateAction<T | undefined>>,
  clearCache: () => void,
};

/**
 * Factorize fetching logic which goal is to prevent unneeded fetchs and expose loading indicator.
 */
export const useFetcher = <T, E = any>(
  fetcher: (...args: any[]) => Promise<T>,
  initialValue?: T,
  mapError: (_: any) => E = _ => _
): UseFetchableReturn<T, E> => {
  const [entity, setEntity] = useState<T | undefined>(initialValue)
  const [error, setError] = useState<E | undefined>()
  const [loading, setLoading] = useState<boolean>(false)
  const fetch$ = useRef<Promise<T>>()

  const fetch = ({force = true, clean = true}: {force?: boolean, clean?: boolean} = {}) => (...args: any[]): Promise<T> => {
    if (fetch$.current) {
      return fetch$.current!
    }
    if (entity && !force) {
      return Promise.resolve(entity)
    }
    if (clean) {
      setError(undefined)
      setEntity(undefined)
    }
    setLoading(true)
    fetch$.current = fetcher(...args)
    fetch$.current
      .then((x: T) => {
        setLoading(false)
        setEntity(x)
        fetch$.current = undefined
      })
      .catch((e) => {
        setLoading(false)
        fetch$.current = undefined
        setError(mapError(e))
        setEntity(undefined)
        // throw e
      })
    return fetch$.current
  }

  const clearCache = () => {
    setEntity(undefined)
    setError(undefined)
    fetch$.current = undefined
  }

  return {entity, loading, error, fetch, setEntity, clearCache}
}
