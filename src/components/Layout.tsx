import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { navItems } from './navItems';
import Badge from './Badge';
import { useOnlineStatus } from '../lib/useOnlineStatus';
import { useAppStore } from '../state/store';

function NavList({ variant }: { variant: 'sidebar' | 'mobile' }) {
  const base =
    variant === 'sidebar'
      ? 'flex flex-col gap-1 p-3'
      : 'flex gap-1 overflow-x-auto p-2';

  return (
    <nav className={base} aria-label="Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                variant === 'mobile' ? 'whitespace-nowrap' : '',
                isActive
                  ? 'border-primary-300 bg-primary-100 text-primary-900'
                  : 'border-transparent hover:bg-primary-100 text-primary-700'
              ].join(' ')
            }
          >
            <Icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function titleFromPath(pathname: string): string {
  const hit = navItems.find((n) => n.to === pathname);
  return hit ? hit.label : 'Elternrat Tool';
}

export default function Layout() {
  const online = useOnlineStatus();
  const { state } = useAppStore();
  const location = useLocation();

  const title = titleFromPath(location.pathname);

  return (
    <div className="min-h-screen bg-primary-50 text-primary-900 md:flex">
      <aside className="hidden w-64 flex-col border-r border-primary-200 md:flex">
        <div className="px-4 py-4">
          <div className="text-sm font-semibold tracking-tight">Elternrat</div>
          <div className="text-xs text-primary-600">Primarstufe Rittergasse</div>
        </div>
        <NavList variant="sidebar" />
        <div className="mt-auto border-t border-primary-200 p-4 text-xs text-primary-600">
          <div>Schuljahr: {state.settings.activeSchoolYear}</div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-primary-200 bg-primary-50/80 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{title}</div>
              <div className="truncate text-xs text-primary-600">{state.settings.schoolName}</div>
            </div>
            <div className="flex items-center gap-2">
              {!online ? <Badge variant="warning">Offline</Badge> : null}
              {state.settings.readOnly ? <Badge>Nur lesen</Badge> : null}
            </div>
          </div>
          <div className="md:hidden">
            <NavList variant="mobile" />
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
