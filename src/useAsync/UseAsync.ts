import {Func} from '../useFetcher/UseFetcher'
import {useMap} from '../useMap/UseMap'

export interface UseAsync<F extends Func<Promise<any>>, K extends number | symbol | string = any, E = any> {
  getLoading: (k?: K) => boolean,
  getError: (k?: K) => E
  call: F,
}

export interface UseAsyncFn {
  <F extends Func<Promise<any>>, K extends number | symbol | string = any, E = any>(
    caller: F,
    params: {
      mapError?: (_: any) => E,
      requestKey: (_: Parameters<F>) => K,
    }
  ): {
    getLoading: (k: K) => boolean,
    getError: (k: K) => E
    call: F,
  }
  <F extends Func<Promise<any>>, K extends number | symbol | string = any, E = any>(
    caller: F,
    params?: {
      mapError?: (_: any) => E,
      requestKey?: undefined,
    }
  ): {
    getLoading: () => boolean,
    getError: () => E
    call: F,
  }
}

const defaultKey: any = 1

/**
 * Factorize async by exposing loading indicator and error status.
 */
export const useAsync: UseAsyncFn = <F extends Func<Promise<any>>, K extends number | symbol | string = any, E = any>(
  caller: F,
  {
    mapError = _ => _,
    requestKey = () => defaultKey
  }: {
    mapError?: (_: any) => E,
    requestKey?: (_: Parameters<F>) => K,
  } = {} as any
) => {
  const loading = useMap<K, boolean>()
  const error = useMap<K, E>()

  const call = (...args: Parameters<F>) => {
    loading.set(requestKey(args), true)
    return caller(...args)
      .then(_ => {
        loading.set(requestKey(args), false)
        return _
      })
      .catch((e: E) => {
        loading.set(requestKey(args), false)
        error.set(requestKey(args), mapError(e))
        throw e
      })
  }

  return {
    getLoading: (k?: K) => loading.get(k ? k : defaultKey),
    getError: (k?: K) => error.get(k ? k : defaultKey),
    call,
  } as any
}

