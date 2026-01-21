import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../common/ThemeToggle';
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

    const basePath = `/${tenantSlug}`;
    const isCustomer = currentTenant.isDemo || (session?.role === 'customer' && session.tenantId === currentTenant.id);
    const isDemoTenant = currentTenant.isDemo;

    const backgroundStyle: React.CSSProperties = {
        '--tenant-color': currentTenant.settings.primaryColor,
        ...(currentTenant.settings.backgroundUrl && {
            '--bg-image': `url(${currentTenant.settings.backgroundUrl})`,
        }),
    } as React.CSSProperties;

    return (
        <div className={`user-layout ${currentTenant.settings.backgroundUrl ? 'has-background' : ''}`} style={backgroundStyle}>
            <header className="user-header">
                <div className="header-container">
                    <NavLink to={basePath} className="business-brand">
                        {currentTenant.settings.logoUrl ? (
                            <img src={currentTenant.settings.logoUrl} alt={currentTenant.businessName} className="brand-logo" />
                        ) : (
                            <>
                                <span className="brand-icon">📅</span>
                                <span className="brand-name">{currentTenant.businessName}</span>
                            </>
                        )}
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
                        <ThemeToggle />
                        {isCustomer ? (
                            <button className="auth-link" onClick={signOut}>
                                Sign Out
                            </button>
                        ) : (
                            <NavLink to={`/?signin=user&tenant=${tenantSlug}`} className="auth-link">
                                Sign In
                            </NavLink>
                        )}
                        {isDemoTenant && (
                            <NavLink to={`${basePath}/admin`} className="admin-link">
                                Admin
                            </NavLink>
                        )}
                    </div>
                </div>
            </header>

            <main className="user-main">
                <Outlet />
            </main>

            <footer className="user-footer">
                <div className="footer-container">
                    <div className="footer-business">
                        <span className="footer-business-name">{currentTenant.businessName}</span>
                        <span className="footer-powered">Powered by <span className="footer-brand">ReserveHub</span></span>
                    </div>
                    {(currentTenant.settings.publicPhone || currentTenant.settings.publicEmail) && (
                        <div className="footer-contact">
                            {currentTenant.settings.publicPhone && <span>{currentTenant.settings.publicPhone}</span>}
                            {currentTenant.settings.publicEmail && <span>{currentTenant.settings.publicEmail}</span>}
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
}
