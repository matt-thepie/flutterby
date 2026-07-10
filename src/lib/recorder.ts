import { useCallback, useState } from 'react';

const ID_KEY = 'flutterby.recorderId';
const NAME_KEY = 'flutterby.recorderName';

/** A stable anonymous id for this device, created on first use. */
function readRecorderId(): string {
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export interface Recorder {
  id: string;
  name: string;
  setName: (name: string) => void;
}

export function useRecorder(): Recorder {
  const [id] = useState(readRecorderId);
  const [name, setNameState] = useState(() => localStorage.getItem(NAME_KEY) ?? '');

  const setName = useCallback((next: string) => {
    const trimmed = next.trim();
    if (trimmed) localStorage.setItem(NAME_KEY, trimmed);
    else localStorage.removeItem(NAME_KEY);
    setNameState(trimmed);
  }, []);

  return { id, name, setName };
}
