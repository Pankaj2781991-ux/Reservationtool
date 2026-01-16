import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useTenant } from '../../context/TenantContext';
import { useReservations } from '../../hooks/useReservations';
import { StatusBadge } from '../../components/common/StatusBadge';
import './AdminDashboard.css';

export function AdminDashboard() {
    const { tenantSlug } = useParams<{ tenantSlug: string }>();
    const { currentTenant } = useTenant();
    const { getReservationsForTenant, getReservationsByStatus } = useReservations();

    const stats = useMemo(() => {
        if (!currentTenant) return null;

        const allReservations = getReservationsForTenant();
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        const todaysBookings = allReservations.filter(r => r.date === todayStr && r.status !== 'cancelled');
        const pending = getReservationsByStatus('pending');
        const confirmed = getReservationsByStatus('confirmed');
        const upcoming = allReservations.filter(r => {
            const reservationDate = parseISO(r.date);
            return (isToday(reservationDate) || isTomorrow(reservationDate)) && r.status !== 'cancelled';
        });

        return {
            todaysBookings: todaysBookings.length,
            pending: pending.length,
            confirmed: confirmed.length,
            total: allReservations.length,
            upcoming,
        };
    }, [currentTenant, getReservationsForTenant, getReservationsByStatus]);

    if (!currentTenant || !stats) {
        return <div>Loading...</div>;
    }

    const statCards = [
        { label: "Today's Bookings", value: stats.todaysBookings, icon: '📅', color: '#8B5CF6' },
        { label: 'Pending', value: stats.pending, icon: '⏳', color: '#F59E0B' },
        { label: 'Confirmed', value: stats.confirmed, icon: '✅', color: '#10B981' },
        { label: 'Total Reservations', value: stats.total, icon: '📊', color: '#6366F1' },
    ];

    return (
        <div className="admin-dashboard">
            <div className="dashboard-welcome">
                <h2>Welcome back! 👋</h2>
                <p>Here's what's happening with {currentTenant.businessName} today.</p>
            </div>

            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card" style={{ '--stat-color': stat.color } as React.CSSProperties}>
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-content">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-section">
                    <div className="section-header">
                        <h3>Upcoming Reservations</h3>
                        <Link to={`/tenant/${tenantSlug}/admin/reservations`} className="section-link">
                            View All
                        </Link>
                    </div>
                    <div className="reservations-list">
                        {stats.upcoming.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">📭</span>
                                <p>No upcoming reservations</p>
                            </div>
                        ) : (
                            stats.upcoming.slice(0, 5).map((reservation) => (
                                <div key={reservation.id} className="reservation-item">
                                    <div className="reservation-time">
                                        <span className="time">{reservation.startTime}</span>
                                        <span className="date">
                                            {isToday(parseISO(reservation.date)) ? 'Today' :
                                                isTomorrow(parseISO(reservation.date)) ? 'Tomorrow' :
                                                    format(parseISO(reservation.date), 'MMM d')}
                                        </span>
                                    </div>
                                    <div className="reservation-details">
                                        <span className="customer-name">{reservation.customerName}</span>
                                        <span className="customer-contact">{reservation.customerEmail}</span>
                                    </div>
                                    <StatusBadge status={reservation.status} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="dashboard-section">
                    <div className="section-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <div className="quick-actions">
                        <Link to={`/tenant/${tenantSlug}/admin/slots`} className="action-card">
                            <span className="action-icon">⏰</span>
                            <span className="action-label">Manage Time Slots</span>
                        </Link>
                        <Link to={`/tenant/${tenantSlug}/admin/reservations`} className="action-card">
                            <span className="action-icon">📋</span>
                            <span className="action-label">View All Reservations</span>
                        </Link>
                        <Link to={`/tenant/${tenantSlug}`} className="action-card">
                            <span className="action-icon">👤</span>
                            <span className="action-label">View User Panel</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
