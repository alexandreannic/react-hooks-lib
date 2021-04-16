import {Fetch, useFetcher} from '../useFetcher/UseFetcher'
import {useState} from 'react'

export interface Paginate<T> {
  data: T[]
  totalSize: number
}

export type OrderBy = 'desc' | 'asc';

export interface ISearch<T = any> {
  limit: number
  offset: number
  orderBy?: OrderBy
  sortBy?: keyof T
}

export interface UsePaginate<T, S> {
  list?: Paginate<T>,
  fetching: boolean,
  fetch: Fetch<Promise<Paginate<T>>>
  filters: S,
  setFilters: (s: S) => void,
}

const defaultFilters: ISearch = {offset: 0, limit: 10,}

export const usePaginate = <T, S extends ISearch>(
  fetcher: (search: S) => Promise<Paginate<T>>,
  initialFilters?: S,
): UsePaginate<T, S> => {
  const [filters, setFilters] = useState<S>({...defaultFilters, ...(initialFilters || {}) as any})
  const [list, fetching, fetch, set, clearCache] = useFetcher<Paginate<T>>(fetcher)

  return {
    list,
    fetching,
    fetch: (args: {force?: boolean, clean?: boolean} = {}) => fetch(args)(filters),
    filters,
    setFilters: (filters: S, refetch = true) => {
      setFilters({...defaultFilters, ...filters})
      if (refetch) {
        fetch({force: true, clean: false})(filters)
      }
    },
  }
}
