import type { EventItem, Meeting } from './types';

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatUtc(dt: Date): string {
  return (
    dt.getUTCFullYear() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    'T' +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    'Z'
  );
}

function formatDateOnly(d: Date): string {
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
}

function esc(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function foldLine(line: string): string {
  const max = 75;
  if (line.length <= max) return line;
  const parts: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + max);
    parts.push(i === 0 ? chunk : ' ' + chunk);
    i += max;
  }
  return parts.join('\r\n');
}

function lines(ls: string[]): string {
  return ls.map(foldLine).join('\r\n') + '\r\n';
}

export function buildICal(params: {
  produktId?: string;
  calendarName?: string;
  meetings: Meeting[];
  events: EventItem[];
}): string {
  const prodId = params.produktId ?? '-//Elternrat//Tool//DE';
  const name = params.calendarName ?? 'Elternrat';
  const dtstamp = formatUtc(new Date());

  const out: string[] = [];
  out.push('BEGIN:VCALENDAR');
  out.push('VERSION:2.0');
  out.push(`PRODID:${prodId}`);
  out.push('CALSCALE:GREGORIAN');
  out.push('METHOD:PUBLISH');
  out.push(`X-WR-CALNAME:${esc(name)}`);

  // Meetings
  for (const m of params.meetings) {
    const uid = `meeting-${m.id}@elternrat`;
    const title = `Sitzung Elternrat`;
    const descParts: string[] = [];
    if (m.ort) descParts.push(`Ort: ${m.ort}`);
    if (m.traktanden.length) {
      descParts.push('');
      descParts.push('Traktanden:');
      for (const t of m.traktanden) descParts.push(`- ${t.titel}`);
    }

    out.push('BEGIN:VEVENT');
    out.push(`UID:${uid}`);
    out.push(`DTSTAMP:${dtstamp}`);
    out.push(`SUMMARY:${esc(title)}`);

    const dateOnly = new Date(m.datum + 'T00:00:00');
    if (m.start && m.ende) {
      const start = new Date(`${m.datum}T${m.start}:00`);
      const end = new Date(`${m.datum}T${m.ende}:00`);
      out.push(`DTSTART:${formatUtc(start)}`);
      out.push(`DTEND:${formatUtc(end)}`);
    } else {
      // All-day: DTEND is exclusive
      const end = new Date(dateOnly);
      end.setDate(end.getDate() + 1);
      out.push(`DTSTART;VALUE=DATE:${formatDateOnly(dateOnly)}`);
      out.push(`DTEND;VALUE=DATE:${formatDateOnly(end)}`);
    }

    if (m.ort) out.push(`LOCATION:${esc(m.ort)}`);
    const desc = descParts.join('\n').trim();
    if (desc) out.push(`DESCRIPTION:${esc(desc)}`);

    out.push('END:VEVENT');
  }

  // Events
  for (const e of params.events) {
    const uid = `event-${e.id}@elternrat`;
    out.push('BEGIN:VEVENT');
    out.push(`UID:${uid}`);
    out.push(`DTSTAMP:${dtstamp}`);
    out.push(`SUMMARY:${esc(e.titel)}`);
    out.push(`DTSTART:${formatUtc(new Date(e.start))}`);
    out.push(`DTEND:${formatUtc(new Date(e.ende))}`);
    if (e.ort) out.push(`LOCATION:${esc(e.ort)}`);
    const desc = e.beschreibung?.trim();
    if (desc) out.push(`DESCRIPTION:${esc(desc)}`);
    out.push('END:VEVENT');
  }

  out.push('END:VCALENDAR');
  return lines(out);
}
