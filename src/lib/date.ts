import { de } from 'date-fns/locale';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';

// date-fns ships a German locale (`de`). A dedicated Swiss-German locale (`de-CH`) is not
// reliably available across date-fns versions/bundlers, so we standardize on `de`.
// Swiss-specific formatting is handled via explicit format patterns in this app.
export const locale = de;

export function fmtDate(date: Date | string, pattern = 'EEE, d. MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, pattern, { locale });
}

export function fmtDateShort(date: Date | string): string {
  return fmtDate(date, 'd. MMM yyyy');
}

export function fmtTime(time?: string): string {
  return time ?? '';
}

export function parseISODateOnly(dateISO: string): Date {
  return parseISO(dateISO);
}

export function monthGrid(baseDate: Date) {
  const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(baseDate), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  return {
    start,
    end,
    days,
    nextMonth: addMonths(baseDate, 1),
    prevMonth: subMonths(baseDate, 1)
  };
}

export function sameDay(a: string | Date, b: string | Date): boolean {
  const da = typeof a === 'string' ? parseISO(a) : a;
  const db = typeof b === 'string' ? parseISO(b) : b;
  return isSameDay(da, db);
}
