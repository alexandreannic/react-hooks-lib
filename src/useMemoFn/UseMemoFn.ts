import {useMemo} from 'react'

export const useMemoFn = <T, R>(dep: T | undefined, map: (_: T) => R): undefined extends T ? undefined : R => {
  // @ts-ignore
  return useMemo(() => {
    return dep ? map(dep) : undefined
  }, [dep])
}
