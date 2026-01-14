import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AppStoreProvider } from './state/store';

import DashboardPage from './pages/DashboardPage';
import KalenderPage from './pages/KalenderPage';
import SitzungenPage from './pages/SitzungenPage';
import SitzungDetailPage from './pages/SitzungDetailPage';
import MitgliederPage from './pages/MitgliederPage';
import VorschlaegePage from './pages/VorschlaegePage';
import EventsPage from './pages/EventsPage';
import KommunikationPage from './pages/KommunikationPage';
import DokumentePage from './pages/DokumentePage';
import ArchivPage from './pages/ArchivPage';
import EinstellungenPage from './pages/EinstellungenPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AppStoreProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/kalender" element={<KalenderPage />} />
          <Route path="/sitzungen" element={<SitzungenPage />} />
          <Route path="/sitzungen/:id" element={<SitzungDetailPage />} />
          <Route path="/mitglieder" element={<MitgliederPage />} />
          <Route path="/vorschlaege" element={<VorschlaegePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/kommunikation" element={<KommunikationPage />} />
          <Route path="/dokumente" element={<DokumentePage />} />
          <Route path="/archiv" element={<ArchivPage />} />
          <Route path="/einstellungen" element={<EinstellungenPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </AppStoreProvider>
  );
}
