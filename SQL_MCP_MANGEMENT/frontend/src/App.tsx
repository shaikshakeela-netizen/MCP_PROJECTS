import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { StudioProvider } from '@/context/StudioContext';
import { CustomersPage } from '@/pages/CustomersPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ExplorerPage } from '@/pages/ExplorerPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { PlaygroundPage } from '@/pages/PlaygroundPage';
import { QualityPage } from '@/pages/QualityPage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <StudioProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="quality" element={<QualityPage />} />
            <Route path="explorer" element={<ExplorerPage />} />
            <Route path="playground" element={<PlaygroundPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </StudioProvider>
    </BrowserRouter>
  );
}
