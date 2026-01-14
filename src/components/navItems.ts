import {
  Archive,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
  Vote,
  CalendarClock,
  ClipboardList
} from 'lucide-react';

export const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/kalender', label: 'Kalender', icon: CalendarDays },
  { to: '/sitzungen', label: 'Sitzungen', icon: ClipboardList },
  { to: '/mitglieder', label: 'Mitglieder', icon: Users },
  { to: '/vorschlaege', label: 'Vorschläge', icon: Vote },
  { to: '/events', label: 'Events', icon: CalendarClock },
  { to: '/kommunikation', label: 'Kommunikation', icon: Megaphone },
  { to: '/dokumente', label: 'Dokumente', icon: FileText },
  { to: '/archiv', label: 'Archiv', icon: Archive },
  { to: '/einstellungen', label: 'Einstellungen', icon: Settings }
] as const;
