# react-hooks-lib ![npm](https://img.shields.io/npm/v/@axanc/react-hooks)

Comprehensive suite of custom React hooks with clear, consistent APIs and robust TypeScript inference.

## [useFetcher](src/useFetcher)

`useFetcher` is a custom hook that simplifies data fetching by handling caching, loading states, and error management
with full TypeScript inference.

```tsx
import React, {useEffect} from 'react'
import {useFetcher} from 'your-hooks-library'

const getUser = async (userId: number): Promise<{id: number, name: string}> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({id: userId, name: 'John Doe'})
    }, 1000)
  })
}

export function UserComponent({userId}: {userId: number}) {
  const {get: user, loading, error, fetch, clearCache} = useFetcher(getUser)

  useEffect(() => {
    fetch({
      // Use cache or wait for current promise to resolve if exist
      force: false,
      // Delete current value before refetching
      clean: true
    }, userId)
  }, [userId, fetch])

  if (loading) return <div>Loading user data...</div>
  if (error) return <div>{error}</div>
  if (!user) return <div>No user found</div>

  return (
    <>
      <h2>User Info</h2>
      <p>ID: {user.id}</p>
      <p>Name: {user.name}</p>
      <button onClick={clearCache}>Clear Cache</button>
    </>
  )
}
```

## [useEffectFn](src/useEffectFn)

## [useFormInput](src/useFormInput)

## [useInterval](src/useInterval)

## [useMap](src/useMap)

## [useMemoFn](src/useMemoFn)

## [useObjectState](src/useObjectState)

## [usePaginate](src/usePaginate)

## [usePrevious](src/usePrevious)

## [useSetState](src/useSetState)

## [useTimeout](src/useTimeout)
