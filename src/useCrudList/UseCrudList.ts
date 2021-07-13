import {Fetch, useFetcher, useSetState} from '..'
import {useState} from 'react'

// export type Id = string;

// export interface Entity {
//   id: Id,
// }

type ReadAction<E> = (...args: any[]) => Promise<E>;
type CreateAction<E> = (...args: any[]) => Promise<E>;
type UpdateAction<E, PK extends keyof E> = (pk: E[PK], ...args: any[]) => Promise<E>
type DeleteAction<E, PK extends keyof E> = (pk: E[PK]) => Promise<void>


export interface Create<T> {
  creating: boolean
  create: ReadAction<T>
}

export interface Read<E, PK extends keyof E> {
  list?: E[]
  fetching: boolean
  fetch: Fetch<ReadAction<E[]>>
  find: (pk: E[PK]) => E | undefined
  clearCache: () => void
}

export interface Update<E, PK extends keyof E> {
  updating: (pk: E[PK]) => boolean
  update: UpdateAction<E, PK>
}

export interface Delete<E, PK extends keyof E> {
  removing: (id: E[PK]) => boolean
  remove: DeleteAction<E, PK>
}

export type CrudListR<E, PK extends keyof E> = Read<E, PK>;
export type CrudListRD<E, PK extends keyof E> = Read<E, PK> & Delete<E, PK>;
export type CrudListRU<E, PK extends keyof E> = Read<E, PK> & Update<E, PK>;
export type CrudListRUD<E, PK extends keyof E> = Read<E, PK> & Update<E, PK> & Delete<E, PK>;
export type CrudListCRD<E, PK extends keyof E> = Create<E> & Read<E, PK> & Delete<E, PK>;
export type CrudListCRUD<E, PK extends keyof E> = Create<E> & Read<E, PK> & Delete<E, PK> & Update<E, PK>;
export type CrudListCR<E, PK extends keyof E> = Create<E> & Read<E, PK>;
export type CrudListC<E, PK extends keyof E> = Create<E>;
export type CrudListD<E, PK extends keyof E> = Delete<E, PK>;
export type CrudListCUD<E, PK extends keyof E> = Create<E> & Delete<E, PK> & Update<E, PK>;
export type CrudListCD<E, PK extends keyof E> = Create<E> & Delete<E, PK>;

export interface UseCrudList {
  <E, PK extends keyof E>(pk: PK, _: {r: ReadAction<E[]>}): CrudListR<E, PK>
  <E, PK extends keyof E>(pk: PK, _: {r: ReadAction<E[]>, c: CreateAction<E>,}): CrudListCR<E, PK>
  <E, PK extends keyof E>(pk: PK, _: {r: ReadAction<E[]>, d: DeleteAction<E, PK>}): CrudListRD<E, PK>
  <E, PK extends keyof E>(pk: PK, _: {r: ReadAction<E[]>, u: UpdateAction<E, PK>}): CrudListRU<E, PK>
  <E, PK extends keyof E>(pk: PK, _: {r: ReadAction<E[]>, u: UpdateAction<E, PK>, d: DeleteAction<E, PK>}): CrudListRUD<E, PK>
  <E, PK extends keyof E>(pk: PK, _: {r: ReadAction<E[]>, c: CreateAction<E>, u: UpdateAction<E, PK>, d: DeleteAction<E, PK>}): CrudListCRUD<E, PK>
  <E, PK extends keyof E>(pk: PK, _: {r: ReadAction<E[]>, c: CreateAction<E>, d: DeleteAction<E, PK>}): CrudListCRD<E, PK>
  <E, PK extends keyof E>(pk: PK, _: {c: CreateAction<E>,}): CrudListC<E, PK>
  <E, PK extends keyof E>(pk: PK, _: {d: DeleteAction<E, PK>}): CrudListD<E, PK>
  <E, PK extends keyof E>(pk: PK, _: {c: CreateAction<E>, u: UpdateAction<E, PK>, d: DeleteAction<E, PK>}): CrudListCUD<E, PK>
  <E, PK extends keyof E>(pk: PK, _: {c: CreateAction<E>, d: DeleteAction<E, PK>}): CrudListCD<E, PK>
}

// export type UseCrudList<E> = (pk: keyof E) => CrudListReturn

interface UseCrudParams<E, PK extends keyof E> {
  c?: CreateAction<E>
  r?: ReadAction<E[]>
  u?: UpdateAction<E, PK>
  d?: DeleteAction<E, PK>
}

export const useCrudList: UseCrudList = <E, PK extends keyof E>(
  pk: keyof E,
  {c, r, u, d}: UseCrudParams<E, PK>
) => {
  const [creating, setCreating] = useState(false)
  const {entity: list, loading: fetching, fetch, setEntity: set, clearCache} = useFetcher<ReadAction<E[]>>(r!)
  const removeList = useSetState<E[PK]>()
  const updatingList = useSetState<E[PK]>()

  const create = async (...args: any[]): Promise<E> => {
    try {
      setCreating(true)
      const entity = await c!(...args)
      if (r) {
        set([...(list || []), entity])
      }
      setCreating(false)
      return entity
    } catch (e) {
      setCreating(false)
      throw e
    }
  }

  const remove = async (primaryKey: E[PK]) => {
    try {
      removeList.add(primaryKey)
      await d!(primaryKey)
      if (r) {
        set(n => n!.filter(x => x[pk] !== primaryKey))
      }
      removeList.delete(primaryKey)
    } catch (e) {
      removeList.delete(primaryKey)
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
      return updatedEntity
    } finally {
      updatingList.delete(primaryKey)
    }
  }

  const find = (primaryKey: E[PK]): E | undefined => {
    if (list) {
      return list.find(t => t[pk] === primaryKey)
    }
  }

  const removing = (primaryKey: E[PK]): boolean => removeList.has(primaryKey)
  const updating = (primaryKey: E[PK]): boolean => updatingList.has(primaryKey)

  return {
    ...(c && {
      creating,
      create: create,
    }),
    ...(r && {
      list,
      fetching,
      fetch,
      clearCache,
      find,
    }),
    ...(d && {
      removing,
      remove: remove,
    }),
    ...(u && {
      updating,
      update: update,
    }),
  } as any
}
