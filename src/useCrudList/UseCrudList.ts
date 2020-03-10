import {Fetch, useFetcher} from '../useFetcher/UseFetcher';
import {useState} from 'react';
import {useSetState} from '../useSetState/UseSetState';

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

export interface CrudListR<E extends Entity> extends Read<E> {
}

export interface CrudListRD<E extends Entity> extends Read<E>, Delete<E> {
}

export interface CrudListCRD<E extends Entity> extends Create<E>, Read<E>, Delete<E> {
}

export interface CrudListCRUD<E extends Entity> extends Create<E>, Read<E>, Delete<E>, Update<E> {
}

export interface CrudListCR<E extends Entity> extends Create<E>, Read<E> {
}

export interface CrudListR<E extends Entity> extends Read<E> {
}

export interface CrudListC<E extends Entity> extends Create<E> {
}

export interface CrudListD<E extends Entity> extends Delete<E> {
}

export interface CrudListCUD<E extends Entity> extends Create<E>, Delete<E>, Update<E> {
}

export interface CrudListCD<E extends Entity> extends Create<E>, Delete<E> {
}

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
  const [creating, setCreating] = useState(false);
  const [list, fetching, fetch, set, clearCache] = useFetcher<E[]>(r!);
  const [removingList, addRemoving, removeRemoving] = useSetState<Id>();
  const [updatingList, addUpdating, removeUpdating] = useSetState<Id>();

  const create = async (...args: any[]): Promise<E> => {
    try {
      setCreating(true);
      const entity = await c!(...args);
      if (r) {
        set([...(list || []), entity]);
      }
      setCreating(false);
      return entity;
    } catch (e) {
      setCreating(false);
      throw e;
    }
  };

  const remove = async (id: Id) => {
    try {
      addRemoving(id);
      await d!(id);
      if (r) {
        set(n => n!.filter(x => x.id !== id));
      }
      removeRemoving(id);
    } catch (e) {
      removeRemoving(id);
      throw e;
    }
  };
  const update: UpdateAction<E> = async (id, ...args: any[]) => {
    try {
      addUpdating(id);
      const updatedEntity = await u!(id, ...args);
      if (r) {
        set(n => n!.map(x => (x.id === id) ? {...x, ...updatedEntity} : x));
      }
      return updatedEntity;
    } finally {
      removeUpdating(id);
    }
  };

  const find = (id: Id): E | undefined => {
    if (list) {
      return list.find(t => t.id === id);
    }
  };

  const removing = (id: Id): boolean => removingList.has(id);
  const updating = (id: Id): boolean => updatingList.has(id);

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
  } as any;
};
