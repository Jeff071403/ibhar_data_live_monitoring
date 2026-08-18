import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import { MonitoringProvider } from './hooks/useMonitoring';

// Layout
import { MainLayout } from './components/layout/MainLayout';

// Pages
import { LoginPage } from './pages/Login/LoginPage';
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { HospitalsPage } from './pages/Hospitals/HospitalsPage';
import { HospitalDetailsPage } from './pages/HospitalDetails/HospitalDetailsPage';
import { AlertsPage } from './pages/Alerts/AlertsPage';
import { AnalyticsPage } from './pages/Analytics/AnalyticsPage';
import { HospitalComparisonPage } from './pages/HospitalComparison/HospitalComparisonPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';
import { SimulationLabPage } from './pages/SimulationLab/SimulationLabPage';
import { MorePage } from './pages/More/MorePage';
import { ProfilePage } from './pages/Profile/ProfilePage';
import { UserManagementPage } from './pages/UserManagement/UserManagementPage';
import { RoleManagementPage } from './pages/RoleManagement/RoleManagementPage';
import { NotificationSettingsPage } from './pages/NotificationSettings/NotificationSettingsPage';
import { AboutPage } from './pages/About/AboutPage';
import { HelpSupportPage } from './pages/HelpSupport/HelpSupportPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <MonitoringProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth Page */}
            <Route path="/login" element={<LoginPage />} />

            {/* Application Main Layout */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="hospitals" element={<HospitalsPage />} />
              <Route path="hospitals/:id" element={<HospitalDetailsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="comparison" element={<HospitalComparisonPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="simulation-lab" element={<SimulationLabPage />} />
              <Route path="more" element={<MorePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="user-management" element={<UserManagementPage />} />
              <Route path="role-management" element={<RoleManagementPage />} />
              <Route path="notification-settings" element={<NotificationSettingsPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="help-support" element={<HelpSupportPage />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </BrowserRouter>
      </MonitoringProvider>
    </ThemeProvider>
  );
};

export default App;
