import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useTenant } from '../../context/TenantContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

export function AdminLayout() {
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
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>Loading tenant...</p>
            </div>
        );
    }

    const demoSlugs = ['demo-salon', 'dr-smith-clinic', 'fitness-pro'];
    const isDemoTenant = currentTenant.isDemo || (tenantSlug ? demoSlugs.includes(tenantSlug) : false);
    const hasAdminAccess = isDemoTenant || (session?.role === 'admin' && session.tenantId === currentTenant.id);
    if (!hasAdminAccess) {
        return (
            <div className="admin-loading admin-access-required">
                <span className="access-icon">🔒</span>
                <h2>Admin access required</h2>
                <p>Please sign in with your admin account to manage this tenant.</p>
                <NavLink to={`/?signin=admin&tenant=${tenantSlug}`} className="btn btn-primary">
                    Go to Sign In
                </NavLink>
            </div>
        );
    }

    const basePath = `/${tenantSlug}/admin`;

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-icon">📅</span>
                        <span className="logo-text">ReserveHub</span>
                    </div>
                    <div className="tenant-badge">
                        {currentTenant.settings.logoUrl ? (
                            <img
                                src={currentTenant.settings.logoUrl}
                                alt={`${currentTenant.businessName} logo`}
                                className="tenant-logo"
                            />
                        ) : (
                            <div className="tenant-logo-placeholder">
                                {currentTenant.businessName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="tenant-info">
                            <span className="tenant-name">{currentTenant.businessName}</span>
                            <span className="tenant-type">{currentTenant.serviceType}</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to={basePath} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="9" rx="1" />
                            <rect x="14" y="3" width="7" height="5" rx="1" />
                            <rect x="14" y="12" width="7" height="9" rx="1" />
                            <rect x="3" y="16" width="7" height="5" rx="1" />
                        </svg>
                        Dashboard
                    </NavLink>
                    <NavLink to={`${basePath}/reservations`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v11a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
                            <path d="M5 11h14" />
                        </svg>
                        Reservations
                    </NavLink>
                    <NavLink to={`${basePath}/slots`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                        </svg>
                        Time Slots
                    </NavLink>
                    <NavLink to={`${basePath}/settings`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                        </svg>
                        Settings
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    {isDemoTenant && (
                        <NavLink to={`/${tenantSlug}`} className="nav-item user-panel-link">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                            </svg>
                            View User Panel
                        </NavLink>
                    )}
                    <NavLink to="/" className="nav-item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <polyline points="9,22 9,12 15,12 15,22" />
                        </svg>
                        Back to Home
                    </NavLink>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <h1 className="page-title">Admin Panel</h1>
                    <div className="header-actions">
                        <ThemeToggle />
                        <span className="tenant-slug">/{currentTenant.slug}</span>
                        <button className="btn btn-secondary" onClick={signOut}>
                            Sign Out
                        </button>
                    </div>
                </header>
                <div className="admin-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
