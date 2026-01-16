import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import './UserLayout.css';

export function UserLayout() {
    const { tenantSlug } = useParams<{ tenantSlug: string }>();
    const { currentTenant, setCurrentTenantBySlug } = useTenant();
    const { session, signOut } = useAuth();

    useEffect(() => {
        if (tenantSlug) {
            setCurrentTenantBySlug(tenantSlug);
        }
    }, [tenantSlug, setCurrentTenantBySlug]);

    if (!currentTenant) {
        return (
            <div className="user-loading">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    const basePath = `/tenant/${tenantSlug}`;
    const isCustomer = currentTenant.isDemo || (session?.role === 'customer' && session.tenantId === currentTenant.id);

    return (
        <div className="user-layout" style={{ '--tenant-color': currentTenant.settings.primaryColor } as React.CSSProperties}>
            <header className="user-header">
                <div className="header-container">
                    <NavLink to={basePath} className="business-brand">
                        <span className="brand-icon">📅</span>
                        <span className="brand-name">{currentTenant.businessName}</span>
                    </NavLink>

                    <nav className="user-nav">
                        <NavLink to={basePath} end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            Book Now
                        </NavLink>
                        <NavLink to={`${basePath}/my-bookings`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            My Bookings
                        </NavLink>
                    </nav>

                    <div className="header-actions">
                        {isCustomer ? (
                            <button className="auth-link" onClick={signOut}>
                                Sign Out
                            </button>
                        ) : (
                            <NavLink to={`/?signin=user&tenant=${tenantSlug}`} className="auth-link">
                                Sign In
                            </NavLink>
                        )}
                        <NavLink to={`${basePath}/admin`} className="admin-link">
                            Admin
                        </NavLink>
                    </div>
                </div>
            </header>

            <main className="user-main">
                <Outlet />
            </main>

            <footer className="user-footer">
                <div className="footer-container">
                    <p className="footer-text">
                        Powered by <span className="footer-brand">ReserveHub</span>
                    </p>
                    <div className="footer-contact">
                        {currentTenant.phone && <span>{currentTenant.phone}</span>}
                        <span>{currentTenant.email}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
