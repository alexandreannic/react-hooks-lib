import {Dispatch, SetStateAction, useRef, useState} from 'react';

export type Fetch<T> = (force?: boolean, clean?: boolean) => T;

export type UseFetchableReturn<T> = [
  T | undefined,
  boolean,
  Fetch<(...args: any[]) => Promise<T>>,
  Dispatch<SetStateAction<T | undefined>>,
  () => void
];

/**
 * Factorize fetching logic which goal is to prevent unneeded fetchs and expose loading indicator.
 * @param fetcher
 * @param initialValue
 */
export const useFetcher = <T>(
  fetcher: (...args: any[]) => Promise<T>,
  initialValue?: T
): UseFetchableReturn<T> => {
  const [entity, setEntity] = useState<T | undefined>(initialValue);
  const [loading, setLoading] = useState<boolean>(false);
  const fetch$ = useRef<Promise<T>>();

  const fetch = (force: boolean = true, clean: boolean = true) => (...args: any[]): Promise<T> => {
    if (fetch$.current) {
      return fetch$.current!;
    }
    if (entity && !force) {
      return Promise.resolve(entity);
    }
    if (clean) {
      setEntity(undefined);
    }
    setLoading(true);
    fetch$.current = fetcher(...args);
    fetch$.current
      .then((x: T) => {
        setLoading(false);
        setEntity(x);
        fetch$.current = undefined;
      })
      .catch((e) => {
        setLoading(false);
        fetch$.current = undefined;
        throw e;
      });
    return fetch$.current;
  };

  const clearCache = () => {
    setEntity(undefined);
    fetch$.current = undefined;
  };

  return [entity, loading, fetch, setEntity, clearCache];
};
