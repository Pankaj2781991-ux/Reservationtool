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

    const hasAdminAccess = session?.role === 'admin' && session.tenantId === currentTenant.id;
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

    const basePath = `/tenant/${tenantSlug}/admin`;

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-icon">📅</span>
                        <span className="logo-text">ReserveHub</span>
                    </div>
                    <div className="tenant-badge">
                        <span className="tenant-name">{currentTenant.businessName}</span>
                        <span className="tenant-type">{currentTenant.serviceType}</span>
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
                </nav>

                <div className="sidebar-footer">
                    <NavLink to={`/tenant/${tenantSlug}`} className="nav-item user-panel-link">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                        </svg>
                        View User Panel
                    </NavLink>
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
