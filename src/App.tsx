import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { LoginPage } from "@/features/auth/login-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { ApplicationsPage } from "@/pages/applications-page";
import { CompaniesPage } from "@/pages/companies-page";
import { ContactsPage } from "@/pages/contacts-page";
import { AnalyticsPage } from "@/pages/analytics-page";
import { RemindersPage } from "@/pages/reminders-page";
import { OffersComparePage } from "@/pages/offers-compare-page";
import { ArchivePage } from "@/pages/archive-page";
import { SettingsPage } from "@/pages/settings-page";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/apps" element={<ApplicationsPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/offers/compare" element={<OffersComparePage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
