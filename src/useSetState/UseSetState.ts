import {useState} from 'react';

type ReturnType<T> = [Set<T>, (t: T) => void, (t: T) => void];

export const useSetState = <T>(initialValue: T[] = []): ReturnType<T> => {
  const [set, setSet] = useState(new Set<T>(initialValue));

  const add = (t: T): void => {
    set.add(t);
    setSet(new Set(set));
  };

  const remove = (t: T): void => {
    set.delete(t);
    setSet(new Set(set));
  };

  return [set, add, remove];
};
