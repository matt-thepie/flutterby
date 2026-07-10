/** Helpers for splitting/joining the report's observedAt across day+time inputs. */

const pad = (n: number): string => String(n).padStart(2, '0');

/** Local date as yyyy-mm-dd, for <input type="date">. */
export function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local time as HH:MM, for <input type="time">. */
export function toTimeInput(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Combine date + time input values into an ISO timestamp (local timezone). */
export function combineToIso(dateValue: string, timeValue: string): string {
  return new Date(`${dateValue}T${timeValue || '00:00'}`).toISOString();
}
