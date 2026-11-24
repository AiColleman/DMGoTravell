import React, { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { RequireAuth } from './components/layout/RequireAuth';
import { AuthPage } from './pages/AuthPage';
import { CatalogPage } from './pages/CatalogPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ClientPortalPage } from './pages/ClientPortalPage';
import { HomePage } from './pages/HomePage';
import { OfferDetailPage } from './pages/OfferDetailPage';
import { AdminCommercialPage } from './pages/admin/AdminCommercialPage';
import { AdminGovernancePage } from './pages/admin/AdminGovernancePage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminReservationsPage } from './pages/admin/AdminReservationsPage';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const NotFoundPage: React.FC = () => (
  <div className="max-w-lg mx-auto my-24 text-center space-y-4 px-4">
    <span className="text-xs font-bold uppercase tracking-widest text-[#D95D39]">Error 404</span>
    <h1 className="font-headline font-extrabold text-3xl text-[#0B3B5B]">
      Página no encontrada
    </h1>
    <p className="text-sm text-slate-600">
      La ruta solicitada no existe o ha sido trasladada dentro de la plataforma DMGOTRAVEL.
    </p>
    <Link
      to="/"
      className="inline-block px-5 py-3 rounded-xl bg-[#0B3B5B] text-white text-xs font-bold"
    >
      Volver al Inicio
    </Link>
  </div>
);

export const App: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Portal Público y del Viajero */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/catalogo/:type/:id" element={<OfferDetailPage />} />
          <Route path="/acceso" element={<AuthPage />} />
          <Route
            path="/checkout/:reservationId"
            element={
              <RequireAuth>
                <CheckoutPage />
              </RequireAuth>
            }
          />
          <Route
            path="/cuenta"
            element={
              <RequireAuth>
                <ClientPortalPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Consola Empresarial Administrativa (Rol admin · RN-26) */}
        <Route
          path="/admin"
          element={
            <RequireAuth requireAdmin>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/admin/reportes" replace />} />
          <Route path="reportes" element={<AdminReportsPage />} />
          <Route path="reservas" element={<AdminReservationsPage />} />
          <Route path="comercial" element={<AdminCommercialPage />} />
          <Route path="gobernanza" element={<AdminGovernancePage />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
