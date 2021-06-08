import {Fetch, useFetcher} from '../useFetcher/UseFetcher'
import {useState} from 'react'
import {useSetState} from '../useSetState/UseSetState'

export type Id = string;

export interface Entity {
  id: Id,
}

type ReadAction<T> = (...args: any[]) => Promise<T>;
type CreateAction<T> = (...args: any[]) => Promise<T>;
type UpdateAction<T> = (id: Id, ...args: any[]) => Promise<T>
type DeleteAction = (id: Id) => Promise<void>


export interface Create<T> {
  creating: boolean
  create: ReadAction<T>
}

export interface Read<T> {
  list?: T[]
  fetching: boolean
  fetch: Fetch<ReadAction<T[]>>
  find: (id: Id) => T | undefined
  clearCache: () => void
}

export interface Update<T> {
  updating: (id: Id) => boolean
  update: UpdateAction<T>
}

export interface Delete<T> {
  removing: (id: Id) => boolean
  remove: DeleteAction
}

export type CrudListR<E extends Entity> = Read<E>;
export type CrudListRD<E extends Entity> = Read<E> & Delete<E>;
export type CrudListCRD<E extends Entity> = Create<E> & Read<E> & Delete<E>;
export type CrudListCRUD<E extends Entity> = Create<E> & Read<E> & Delete<E> & Update<E>;
export type CrudListCR<E extends Entity> = Create<E> & Read<E>;
export type CrudListC<E extends Entity> = Create<E>;
export type CrudListD<E extends Entity> = Delete<E>;
export type CrudListCUD<E extends Entity> = Create<E> & Delete<E> & Update<E>;
export type CrudListCD<E extends Entity> = Create<E> & Delete<E>;

export interface UseCrudList {
  <E extends Entity>(_: {r: ReadAction<E[]>}): CrudListR<E>
  <E extends Entity>(_: {r: ReadAction<E[]>, c: CreateAction<E>,}): CrudListCR<E>
  <E extends Entity>(_: {r: ReadAction<E[]>, d: DeleteAction}): CrudListRD<E>
  <E extends Entity>(_: {r: ReadAction<E[]>, c: CreateAction<E>, u: UpdateAction<E>, d: DeleteAction}): CrudListCRUD<E>
  <E extends Entity>(_: {r: ReadAction<E[]>, c: CreateAction<E>, d: DeleteAction}): CrudListCRD<E>
  <E extends Entity>(_: {c: CreateAction<E>,}): CrudListC<E>
  <E extends Entity>(_: {d: DeleteAction}): CrudListD<E>
  <E extends Entity>(_: {c: CreateAction<E>, u: UpdateAction<E>, d: DeleteAction}): CrudListCUD<E>
  <E extends Entity>(_: {c: CreateAction<E>, d: DeleteAction}): CrudListCD<E>
}

interface UseCrudParams<E> {
  c?: CreateAction<E>
  r?: ReadAction<E[]>
  u?: UpdateAction<E>
  d?: DeleteAction
}

export const useCrudList: UseCrudList = <E extends Entity>({c, r, u, d}: UseCrudParams<E>) => {
  const [creating, setCreating] = useState(false)
  const {entity: list, loading: fetching, fetch, setEntity: set, clearCache} = useFetcher<E[]>(r!)
  const removeList = useSetState<Id>()
  const updatingList = useSetState<Id>()

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

  const remove = async (id: Id) => {
    try {
      removeList.add(id)
      await d!(id)
      if (r) {
        set(n => n!.filter(x => x.id !== id))
      }
      removeList.delete(id)
    } catch (e) {
      removeList.delete(id)
      throw e
    }
  }
  const update: UpdateAction<E> = async (id, ...args: any[]) => {
    try {
      updatingList.add(id)
      const updatedEntity = await u!(id, ...args)
      if (r) {
        set(n => n!.map(x => (x.id === id) ? {...x, ...updatedEntity} : x))
      }
      return updatedEntity
    } finally {
      updatingList.delete(id)
    }
  }

  const find = (id: Id): E | undefined => {
    if (list) {
      return list.find(t => t.id === id)
    }
  }

  const removing = (id: Id): boolean => removeList.has(id)
  const updating = (id: Id): boolean => updatingList.has(id)

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
