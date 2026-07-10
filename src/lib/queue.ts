import { api } from './api';
import type { NewReportInput } from '../types/models';

/**
 * A tiny localStorage-backed upload queue. A finished report that can't reach
 * the server (no signal on a hillside, server blip) is queued here and pushed
 * when the connection returns. Queue order is preserved; a report is only
 * removed once the server confirms it.
 */

const KEY = 'flutterby.uploadQueue';

export interface QueuedReport {
  /** Client-generated id so the UI can key/track the entry. */
  queueId: string;
  input: NewReportInput;
  queuedAt: string;
  attempts: number;
}

function read(): QueuedReport[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as QueuedReport[];
  } catch {
    return [];
  }
}

function write(queue: QueuedReport[]): void {
  localStorage.setItem(KEY, JSON.stringify(queue));
}

export function getQueue(): QueuedReport[] {
  return read();
}

export function enqueue(input: NewReportInput): QueuedReport {
  const entry: QueuedReport = {
    queueId: crypto.randomUUID(),
    input,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  };
  write([...read(), entry]);
  return entry;
}

export function removeFromQueue(queueId: string): void {
  write(read().filter((e) => e.queueId !== queueId));
}

/**
 * Try to upload everything in the queue, oldest first. Stops at the first
 * failure (if one can't get through, the rest won't either). Returns how many
 * were uploaded.
 */
export async function flushQueue(): Promise<number> {
  let uploaded = 0;
  for (const entry of read()) {
    try {
      await api.createReport(entry.input);
      removeFromQueue(entry.queueId);
      uploaded += 1;
    } catch {
      const queue = read();
      const item = queue.find((e) => e.queueId === entry.queueId);
      if (item) {
        item.attempts += 1;
        write(queue);
      }
      break;
    }
  }
  return uploaded;
}
