import {Dispatch, SetStateAction, useState} from 'react';

export type UseToggle = [
  boolean,
  () => void,
  () => void,
  () => void,
  Dispatch<SetStateAction<boolean>>
]

export const useBoolean = (value: boolean = false): UseToggle => {
  const [b, setB] = useState(value);
  return [b, () => setB(true), () => setB(false), () => setB(b => !b), setB];
};
