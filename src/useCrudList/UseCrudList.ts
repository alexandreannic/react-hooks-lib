import {Fetch, useFetcher, useMap, useSetState} from '..'
import {useState} from 'react'

type ReadAction<E> = (...args: any[]) => Promise<E>;
type CreateAction<E> = (...args: any[]) => Promise<E>;
type UpdateAction<E, PK extends keyof E> = (pk: E[PK], ...args: any[]) => Promise<E>
type DeleteAction<E, PK extends keyof E> = (pk: E[PK], ...args: any[]) => Promise<void>


export interface Create<T, ERR> {
  creating: boolean
  create: ReadAction<T>
  createError?: ERR
}

export interface Read<E, PK extends keyof E, ERR> {
  list?: E[]
  fetching: boolean
  fetch: Fetch<ReadAction<E[]>>
  find: (pk: E[PK]) => E | undefined
  clearCache: () => void
  fetchError?: ERR
}

export interface Update<E, PK extends keyof E, ERR> {
  updating: (pk: E[PK]) => boolean
  update: UpdateAction<E, PK>
  updateError: (pk: E[PK]) => ERR | undefined
}

export interface Delete<E, PK extends keyof E, ERR> {
  removing: (id: E[PK]) => boolean
  remove: DeleteAction<E, PK>
  removeError: (pk: E[PK]) => ERR | undefined
}

export type CrudListR<E, PK extends keyof E, ERR = any> = Read<E, PK, ERR>;
export type CrudListRD<E, PK extends keyof E, ERR = any> = Read<E, PK, ERR> & Delete<E, PK, ERR>;
export type CrudListRU<E, PK extends keyof E, ERR = any> = Read<E, PK, ERR> & Update<E, PK, ERR>;
export type CrudListRUD<E, PK extends keyof E, ERR = any> = Read<E, PK, ERR> & Update<E, PK, ERR> & Delete<E, PK, ERR>;
export type CrudListCRD<E, PK extends keyof E, ERR = any> = Create<E, ERR> & Read<E, PK, ERR> & Delete<E, PK, ERR>;
export type CrudListCRUD<E, PK extends keyof E, ERR = any> = Create<E, ERR> & Read<E, PK, ERR> & Delete<E, PK, ERR> & Update<E, PK, ERR>;
export type CrudListCR<E, PK extends keyof E, ERR = any> = Create<E, ERR> & Read<E, PK, ERR>;
export type CrudListC<E, PK extends keyof E, ERR = any> = Create<E, ERR>;
export type CrudListD<E, PK extends keyof E, ERR = any> = Delete<E, PK, ERR>;
export type CrudListCUD<E, PK extends keyof E, ERR = any> = Create<E, ERR> & Delete<E, PK, ERR> & Update<E, PK, ERR>;
export type CrudListCD<E, PK extends keyof E, ERR = any> = Create<E, ERR> & Delete<E, PK, ERR>;

export interface UseCrudList {
  <E, PK extends keyof E, ERR = any>(pk: PK, _: {r: ReadAction<E[]>}): CrudListR<E, PK, ERR>
  <E, PK extends keyof E, ERR = any>(pk: PK, _: {r: ReadAction<E[]>, c: CreateAction<E>,}): CrudListCR<E, PK, ERR>
  <E, PK extends keyof E, ERR = any>(pk: PK, _: {r: ReadAction<E[]>, d: DeleteAction<E, PK>}): CrudListRD<E, PK, ERR>
  <E, PK extends keyof E, ERR = any>(pk: PK, _: {r: ReadAction<E[]>, u: UpdateAction<E, PK>}): CrudListRU<E, PK, ERR>
  <E, PK extends keyof E, ERR = any>(pk: PK, _: {r: ReadAction<E[]>, u: UpdateAction<E, PK>, d: DeleteAction<E, PK>}): CrudListRUD<E, PK, ERR>
  <E, PK extends keyof E, ERR = any>(pk: PK, _: {r: ReadAction<E[]>, c: CreateAction<E>, u: UpdateAction<E, PK>, d: DeleteAction<E, PK>}): CrudListCRUD<E, PK, ERR>
  <E, PK extends keyof E, ERR = any>(pk: PK, _: {r: ReadAction<E[]>, c: CreateAction<E>, d: DeleteAction<E, PK>}): CrudListCRD<E, PK, ERR>
  <E, PK extends keyof E, ERR = any>(pk: PK, _: {c: CreateAction<E>,}): CrudListC<E, PK, ERR>
  <E, PK extends keyof E, ERR = any>(pk: PK, _: {d: DeleteAction<E, PK>}): CrudListD<E, PK, ERR>
  <E, PK extends keyof E, ERR = any>(pk: PK, _: {c: CreateAction<E>, u: UpdateAction<E, PK>, d: DeleteAction<E, PK>}): CrudListCUD<E, PK, ERR>
  <E, PK extends keyof E, ERR = any>(pk: PK, _: {c: CreateAction<E>, d: DeleteAction<E, PK>}): CrudListCD<E, PK, ERR>
}

interface UseCrudParams<E, PK extends keyof E> {
  c?: CreateAction<E>
  r?: ReadAction<E[]>
  u?: UpdateAction<E, PK>
  d?: DeleteAction<E, PK>
}

export const useCrudList: UseCrudList = <E, PK extends keyof E, ERR = any>(
  pk: keyof E,
  {c, r, u, d}: UseCrudParams<E, PK>
) => {
  const {entity: list, loading: fetching, fetch, setEntity: set, clearCache, error: fetchError} = useFetcher<ReadAction<E[]>>(r!)

  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<ERR | undefined>(undefined)

  const removingList = useSetState<E[PK]>()
  const removeListError = useMap<E[PK], ERR | undefined>()

  const updatingList = useSetState<E[PK]>()
  const updatingListError = useMap<E[PK], ERR | undefined>()

  const create = async (...args: any[]): Promise<E> => {
    try {
      setCreating(true)
      const entity = await c!(...args)
      if (r) {
        set([...(list || []), entity])
      }
      setCreating(false)
      setCreateError(undefined)
      return entity
    } catch (e) {
      setCreateError(e)
      setCreating(false)
      throw e
    }
  }

  const remove = async (primaryKey: E[PK]) => {
    try {
      removingList.add(primaryKey)
      await d!(primaryKey)
      if (r) {
        set(n => n!.filter(x => x[pk] !== primaryKey))
      }
      removeListError.delete(primaryKey)
      removingList.delete(primaryKey)
    } catch (e) {
      removeListError.set(primaryKey, e)
      removingList.delete(primaryKey)
      throw e
    }
  }
  const update: UpdateAction<E, PK> = async (primaryKey, ...args: any[]) => {
    try {
      updatingList.add(primaryKey)
      const updatedEntity = await u!(primaryKey, ...args)
      if (r) {
        set(n => n!.map(x => (x[pk] === primaryKey) ? {...x, ...updatedEntity} : x))
      }
      updatingListError.set(primaryKey, undefined)
      return updatedEntity
    } catch (e) {
      updatingListError.set(primaryKey, e)
      throw e
    } finally {
      updatingList.delete(primaryKey)
    }
  }

  const find = (primaryKey: E[PK]): E | undefined => {
    if (list) {
      return list.find(t => t[pk] === primaryKey)
    }
  }

  const removing = (primaryKey: E[PK]): boolean => removingList.has(primaryKey)
  const updating = (primaryKey: E[PK]): boolean => updatingList.has(primaryKey)
  const removeError = (primaryKey: E[PK]): ERR | undefined => removeListError.get(primaryKey)
  const updateError = (primaryKey: E[PK]): ERR | undefined => updatingListError.get(primaryKey)

  return {
    ...(c && {
      createError,
      creating,
      create,
    }),
    ...(r && {
      list,
      fetching,
      fetch,
      fetchError,
      clearCache,
      find,
    }),
    ...(d && {
      removing,
      remove,
      removeError,
    }),
    ...(u && {
      updating,
      update,
      updateError,
    }),
  } as any
}
