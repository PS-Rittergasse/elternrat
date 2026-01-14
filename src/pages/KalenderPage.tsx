import { useMemo, useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import { fmtDate, monthGrid, sameDay } from '../lib/date';
import { buildICal } from '../lib/ics';
import { useAppStore } from '../state/store';

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function KalenderPage() {
  const { state } = useAppStore();
  const [baseDate, setBaseDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const grid = monthGrid(baseDate);

  const itemsByDay = useMemo(() => {
    const year = state.settings.activeSchoolYear;
    const meetings = state.entities.meetings.filter((m) => m.schuljahr === year);
    const events = state.entities.events.filter((e) => e.schuljahr === year);

    return grid.days.map((day) => {
      const dateISO = day.toISOString().slice(0, 10);
      const dayMeetings = meetings.filter((m) => m.datum === dateISO);
      const dayEvents = events.filter((e) => sameDay(e.start, day));
      return { day, dayMeetings, dayEvents };
    });
  }, [grid.days, state.entities.events, state.entities.meetings, state.settings.activeSchoolYear]);

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const inMonth = (d: Date) => d.getMonth() === baseDate.getMonth();

  const onIcal = () => {
    const year = state.settings.activeSchoolYear;
    const meetings = state.entities.meetings.filter((m) => m.schuljahr === year);
    const events = state.entities.events.filter((e) => e.schuljahr === year);
    const ics = buildICal({
      calendarName: `Elternrat ${year}`,
      meetings,
      events
    });
    downloadText(`elternrat-${year}.ics`, ics, 'text/calendar;charset=utf-8');
  };

  return (
    <div className="space-y-4">
      <Card
        title={fmtDate(baseDate, 'MMMM yyyy')}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setBaseDate(grid.prevMonth)}>
              Zurück
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setBaseDate(grid.nextMonth)}>
              Weiter
            </Button>
            <Button size="sm" variant="secondary" onClick={onIcal}>
              iCal exportieren
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((w) => (
            <div key={w} className="px-1 text-xs font-medium text-primary-600">
              {w}
            </div>
          ))}
          {itemsByDay.map(({ day, dayMeetings, dayEvents }) => {
            const key = day.toISOString();
            const muted = !inMonth(day);
            const dayNum = day.getDate();
            return (
              <div
                key={key}
                className={[
                  'min-h-[96px] rounded-xl border border-primary-200 p-2',
                  muted ? 'bg-primary-50/40 text-primary-500' : 'bg-primary-50'
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold">{dayNum}</div>
                  <div className="text-[11px] text-primary-600">
                    {dayMeetings.length + dayEvents.length ? `${dayMeetings.length + dayEvents.length}` : ''}
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  {dayMeetings.slice(0, 2).map((m) => (
                    <div key={m.id} className="truncate text-xs">
                      Sitzung
                    </div>
                  ))}
                  {dayEvents.slice(0, 2).map((e) => (
                    <div key={e.id} className="truncate text-xs">
                      {e.titel}
                    </div>
                  ))}
                  {dayMeetings.length + dayEvents.length > 4 ? (
                    <div className="text-xs text-primary-600">+{dayMeetings.length + dayEvents.length - 4}</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Hinweis">
        <div className="text-sm text-primary-700">
          iCal enthält Sitzungen und Events aus dem aktiven Schuljahr.
        </div>
      </Card>
    </div>
  );
}
