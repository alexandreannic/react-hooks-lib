import {Fetch, useFetcher} from '..'
import {Dispatch, SetStateAction, useState} from 'react'

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

export interface UsePaginate<T, S, E = any> {
  list?: Paginate<T>,
  error?: E
  fetching: boolean,
  fetch: Fetch<(...args: any[]) => Promise<Paginate<T>>>
  filters: S,
  updateFilters: (_: SetStateAction<S>, params?: UpdateFiltersParams) => void,
  setEntity: Dispatch<SetStateAction<Paginate<T> | undefined>>,
  clearFilters: () => void,
  pageNumber: number
  initialFilters: S
}

export interface UpdateFiltersParams {
  noRefetch?: boolean
}

const defaultFilters: ISearch = {offset: 0, limit: 10,}

export const usePaginate = <T, S extends ISearch, E = any>(
  fetcher: (search: S) => Promise<Paginate<T>>,
  initialFilters: S,
  mapError: (_: any) => E = _ => _
): UsePaginate<T, S, E> => {
  const [filters, setFilters] = useState<S>({...defaultFilters, ...initialFilters})
  const {entity: list, error, loading: fetching, fetch, setEntity, clearCache} = useFetcher<typeof fetcher, E>(fetcher, undefined, mapError)

  const updateFilters = (update: SetStateAction<S>, {noRefetch = false}: UpdateFiltersParams = {}) => {
    setFilters(prev => {
      const updatedFilters = typeof update === 'function' ? update(prev) : update
      if (!noRefetch) fetch({force: true, clean: false}, updatedFilters)
      return updatedFilters
    })
  }

  return {
    list,
    error,
    fetching,
    fetch: (args: {force?: boolean, clean?: boolean} = {}) => fetch(args, filters),
    filters,
    pageNumber: filters.offset / filters.limit,
    updateFilters,
    clearFilters: () => updateFilters(initialFilters),
    initialFilters,
    setEntity,
  }
}
