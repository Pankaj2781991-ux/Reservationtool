import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TenantProvider } from './context/TenantContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ReservationsPage } from './pages/admin/ReservationsPage';
import { TimeSlotsPage } from './pages/admin/TimeSlotsPage';
import { UserLayout } from './components/user/UserLayout';
import { UserBookingPage } from './pages/user/UserBookingPage';
import { BookingFormPage } from './pages/user/BookingFormPage';
import { MyBookingsPage } from './pages/user/MyBookingsPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <TenantProvider>
          <AuthProvider>
            <Routes>
              {/* Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Admin Panel Routes */}
              <Route path="/tenant/:tenantSlug/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="reservations" element={<ReservationsPage />} />
                <Route path="slots" element={<TimeSlotsPage />} />
              </Route>

              {/* User Panel Routes */}
              <Route path="/tenant/:tenantSlug" element={<UserLayout />}>
                <Route index element={<UserBookingPage />} />
                <Route path="book/:slotId" element={<BookingFormPage />} />
                <Route path="my-bookings" element={<MyBookingsPage />} />
              </Route>
            </Routes>
          </AuthProvider>
        </TenantProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
