import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAppStore } from '../state/store';
import { fmtDateShort } from '../lib/date';

export default function DashboardPage() {
  const { state } = useAppStore();
  const year = state.settings.activeSchoolYear;

  const meetings = state.entities.meetings
    .filter((m) => m.schuljahr === year)
    .sort((a, b) => (a.datum > b.datum ? 1 : -1));

  const proposals = state.entities.proposals.filter((p) => p.schuljahr === year);
  const openProposals = proposals.filter((p) => p.status === 'Offen' || p.status === 'In Abstimmung');

  const events = state.entities.events
    .filter((e) => e.schuljahr === year)
    .sort((a, b) => (a.start > b.start ? 1 : -1));

  const nextMeeting = meetings.find((m) => m.datum >= new Date().toISOString().slice(0, 10));
  const nextEvent = events.find((e) => e.start >= new Date().toISOString());

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Sitzungen">
          <div className="text-2xl font-semibold">{meetings.length}</div>
          <div className="mt-1 text-sm text-primary-600">im Schuljahr {year}</div>
        </Card>
        <Card title="Vorschläge">
          <div className="text-2xl font-semibold">{openProposals.length}</div>
          <div className="mt-1 text-sm text-primary-600">offen / in Abstimmung</div>
        </Card>
        <Card title="Events">
          <div className="text-2xl font-semibold">{events.length}</div>
          <div className="mt-1 text-sm text-primary-600">im Schuljahr {year}</div>
        </Card>
        <Card title="Dokumente">
          <div className="text-2xl font-semibold">
            {state.entities.documents.filter((d) => d.schuljahr === year).length}
          </div>
          <div className="mt-1 text-sm text-primary-600">im Schuljahr {year}</div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Als Nächstes"
          actions={
            <div className="flex items-center gap-2">
              <Link to="/sitzungen">
                <Button size="sm">Sitzung erfassen</Button>
              </Link>
              <Link to="/events">
                <Button size="sm" variant="ghost">
                  Event erstellen
                </Button>
              </Link>
            </div>
          }
        >
          <div className="space-y-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">Nächste Sitzung</div>
                <div className="text-primary-600">
                  {nextMeeting ? fmtDateShort(nextMeeting.datum) : 'Keine geplant'}
                </div>
              </div>
              {nextMeeting ? (
                <Link to={`/sitzungen/${nextMeeting.id}`}>
                  <Button size="sm" variant="secondary">
                    Öffnen
                  </Button>
                </Link>
              ) : null}
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">Nächster Event</div>
                <div className="text-primary-600">
                  {nextEvent ? `${nextEvent.titel} · ${fmtDateShort(nextEvent.start)}` : 'Keine geplant'}
                </div>
              </div>
              {nextEvent ? (
                <Link to="/events">
                  <Button size="sm" variant="secondary">
                    Öffnen
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        </Card>

        <Card title="Schnellzugriff">
          <div className="flex flex-wrap gap-2">
            <Link to="/kalender">
              <Button>Kalender</Button>
            </Link>
            <Link to="/vorschlaege">
              <Button>Vorschläge</Button>
            </Link>
            <Link to="/dokumente">
              <Button>Dokumente</Button>
            </Link>
            <Link to="/einstellungen">
              <Button variant="ghost">Einstellungen</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
