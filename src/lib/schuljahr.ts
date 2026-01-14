import type { Schuljahr } from './types';

export function schuljahrFromDate(d: Date): Schuljahr {
  // Schweizer Schuljahr: 1. August – 31. Juli
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-11
  const startYear = month >= 7 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}/${String(endYear).slice(-2)}`;
}

export function currentSchuljahr(): Schuljahr {
  return schuljahrFromDate(new Date());
}

export function schuljahrLabel(s: Schuljahr): string {
  return s;
}

export function sortedSchuljahre(existing: Schuljahr[]): Schuljahr[] {
  const uniq = Array.from(new Set(existing));
  uniq.sort((a, b) => {
    const ay = parseInt(a.split('/')[0] || '0', 10);
    const by = parseInt(b.split('/')[0] || '0', 10);
    return by - ay;
  });
  return uniq;
}

export function lastNYears(n: number): Schuljahr[] {
  const curStart = parseInt(currentSchuljahr().split('/')[0], 10);
  return Array.from({ length: n }, (_, i) => {
    const start = curStart - i;
    const end = start + 1;
    return `${start}/${String(end).slice(-2)}` as Schuljahr;
  });
}

// UI helper: years for dropdowns etc.
// Kept for backwards compatibility with the settings page.
export function availableSchoolYears(n = 6): Schuljahr[] {
  return lastNYears(n);
}
