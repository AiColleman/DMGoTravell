import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { PublicEditorialLayout } from './components/layout/SiteHeaderFooter';
import { AdminEditorialLayout, RequireAuth } from './components/layout/AdminShell';
import { HomePage } from './pages/HomePage';
import {
  LegacyExperiencesRedirect,
  PackagesCatalogPage,
  ToursCatalogPage,
} from './pages/ExperiencesCatalogPage';
import {
  AboutPage,
  HotelDetailPage,
  HotelsCatalogPage,
  MobilityFleetPage,
  PoliciesPage,
} from './pages/HotelsAndMobilityPages';
import { ExperienceDetailBookingPage } from './pages/ExperienceDetailBookingPage';
import { CheckoutCulqiPage } from './pages/CheckoutCulqiPage';
import { AuthEditorialPage } from './pages/AuthEditorialPage';
import { TravelerAccountPage } from './pages/TravelerAccountPage';
import { AdminOperationsPage, AdminReportsPage } from './pages/admin/AdminReportsAndOperations';
import {
  AdminCommercialPage,
  AdminGovernancePage,
} from './pages/admin/AdminCommercialAndGovernance';

export const AppRoutes: React.FC = () => (
  <Routes>
    {/* Portal Público y del Viajero */}
    <Route element={<PublicEditorialLayout />}>
      <Route path="/" element={<HomePage />} />

      {/* Secciones Descentralizadas: Tours Turísticos y Paquetes Turísticos */}
      <Route path="/tours" element={<ToursCatalogPage />} />
      <Route path="/tours-turisticos" element={<Navigate to="/tours" replace />} />
      <Route path="/tours/:id" element={<ExperienceDetailBookingPage forcedType="tours" />} />

      <Route path="/paquetes" element={<PackagesCatalogPage />} />
      <Route path="/paquetes-turisticos" element={<Navigate to="/paquetes" replace />} />
      <Route path="/packages" element={<Navigate to="/paquetes" replace />} />
      <Route path="/paquetes/:id" element={<ExperienceDetailBookingPage forcedType="packages" />} />

      {/* Retrocompatibilidad con enlaces previos de /experiencias y /catalogo */}
      <Route path="/experiencias" element={<LegacyExperiencesRedirect />} />
      <Route path="/catalogo" element={<LegacyExperiencesRedirect />} />
      <Route path="/experiencias/:type/:id" element={<ExperienceDetailBookingPage />} />

      <Route path="/hoteles" element={<HotelsCatalogPage />} />
      <Route path="/hoteles/:id" element={<HotelDetailPage />} />
      <Route path="/hotels" element={<Navigate to="/hoteles" replace />} />
      <Route path="/movilidad" element={<MobilityFleetPage />} />
      <Route path="/nosotros" element={<AboutPage />} />
      <Route path="/about" element={<Navigate to="/nosotros" replace />} />
      <Route path="/politicas" element={<PoliciesPage />} />
      <Route path="/acceso" element={<AuthEditorialPage />} />
      <Route path="/auth/google/callback" element={<AuthEditorialPage />} />
      <Route path="/login" element={<Navigate to="/acceso?mode=login" replace />} />
      <Route path="/register" element={<Navigate to="/acceso?mode=register" replace />} />
      <Route
        path="/cuenta"
        element={
          <RequireAuth>
            <TravelerAccountPage />
          </RequireAuth>
        }
      />
      <Route
        path="/checkout/:reservationId"
        element={
          <RequireAuth>
            <CheckoutCulqiPage />
          </RequireAuth>
        }
      />
    </Route>

    {/* Consola Ejecutiva Administrativa */}
    <Route
      path="/admin"
      element={
        <RequireAuth requireAdmin>
          <AdminEditorialLayout />
        </RequireAuth>
      }
    >
      <Route index element={<Navigate to="/admin/reportes" replace />} />
      <Route path="reportes" element={<AdminReportsPage />} />
      <Route path="reservas" element={<AdminOperationsPage />} />
      <Route path="comercial" element={<AdminCommercialPage />} />
      <Route path="gobernanza" element={<AdminGovernancePage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export const App: React.FC = () => (
  <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </ToastProvider>
);

export default App;
