import { useCallback, useEffect, useState } from 'react';
import { enqueue, flushQueue, getQueue, type QueuedReport } from '../lib/queue';
import type { NewReportInput } from '../types/models';

export interface UploadQueue {
  pending: QueuedReport[];
  /** Queue a report for upload and immediately try to flush. */
  add: (input: NewReportInput) => void;
  /** Attempt to push everything queued; fires onUploaded if any got through. */
  flush: () => void;
}

/**
 * React face of the offline upload queue: keeps the pending list in state,
 * flushes when the browser comes back online and shortly after mount.
 */
export function useUploadQueue(onUploaded: () => void): UploadQueue {
  const [pending, setPending] = useState<QueuedReport[]>(getQueue);

  const flush = useCallback(() => {
    void flushQueue().then((uploaded) => {
      setPending(getQueue());
      if (uploaded > 0) onUploaded();
    });
  }, [onUploaded]);

  const add = useCallback(
    (input: NewReportInput) => {
      enqueue(input);
      setPending(getQueue());
      flush();
    },
    [flush],
  );

  useEffect(() => {
    flush(); // anything left over from a previous session
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [flush]);

  return { pending, add, flush };
}
