import {Dispatch, SetStateAction, useState} from 'react'

type ReturnType<T> = [
  {[key: string]: T},
  (k: string, t: T) => void,
  (k: string) => void,
  (oldKey: string, newKey: string) => void,
  Dispatch<SetStateAction<{[key: string]: T}>>
];

export const useObjectState = <T>(initialValue: {[key: string]: T} = {}): ReturnType<T> => {
  const [obj, setObj] = useState<{[key: string]: T}>(initialValue)

  const set = (key: string, value: T): void => {
    setObj((lastObj: {[key: string]: T}) => ({...lastObj, [key]: value}))
  }

  const remove = (key: string): void => {
    const {[key]: removedValue, ...newValue} = obj
    setObj(newValue)
  }

  const renameKey = (oldKey: string, newKey: string): void => {
    const {[oldKey]: value, ...restObj} = obj
    setObj({...restObj, [newKey]: value})
  }

  return [obj, set, remove, renameKey, setObj]
}
