import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useReservations } from '../../hooks/useReservations';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import './MyBookingsPage.css';

export function MyBookingsPage() {
    const [searchParams] = useSearchParams();
    const { tenantSlug } = useParams<{ tenantSlug: string }>();
    const { currentTenant } = useTenant();
    const { session } = useAuth();
    const { cancelReservation, getReservationsByEmail } = useReservations();

    const [email, setEmail] = useState('');
    const [searchedEmail, setSearchedEmail] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
        }
    }, [searchParams]);

    useEffect(() => {
        if (session?.role === 'customer' && currentTenant && session.tenantId === currentTenant.id) {
            setEmail(session.email);
            setSearchedEmail(session.email);
        }
    }, [session, currentTenant]);

    const reservations = useMemo(() => {
        if (!searchedEmail) return [];
        return getReservationsByEmail(searchedEmail).sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
        });
    }, [searchedEmail, getReservationsByEmail]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchedEmail(email);
    };

    const handleCancel = () => {
        if (cancelConfirm) {
            cancelReservation(cancelConfirm);
            setCancelConfirm(null);
        }
    };

    if (!currentTenant) {
        return <div className="loading">Loading...</div>;
    }

    const hasCustomerAccess = session?.role === 'customer' && session.tenantId === currentTenant.id;
    if (!hasCustomerAccess) {
        return (
            <div className="my-bookings-page">
                <div className="access-required">
                    <span className="access-icon">🔐</span>
                    <h2>Sign in to view your bookings</h2>
                    <p>Use your customer account to manage your appointments.</p>
                    <a className="btn btn-primary" href={`/?signin=user&tenant=${tenantSlug}`}>
                        Sign In
                    </a>
                </div>
            </div>
        );
    }

    const reservationToCancel = reservations.find(r => r.id === cancelConfirm);

    return (
        <div className="my-bookings-page">
            {showSuccess && (
                <div className="success-banner">
                    <span className="success-icon">✅</span>
                    <div>
                        <strong>Booking Confirmed!</strong>
                        <p>You'll receive a confirmation email shortly.</p>
                    </div>
                </div>
            )}

            <div className="page-header">
                <h1>My Bookings</h1>
                <p>View and manage your appointments</p>
            </div>

            <div className="search-section">
                <form onSubmit={handleSearch} className="email-search">
                    <div className="search-input-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email to see your bookings"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        Find Bookings
                    </button>
                </form>
            </div>

            {searchedEmail && (
                <div className="bookings-section">
                    {reservations.length === 0 ? (
                        <div className="no-bookings">
                            <span className="no-bookings-icon">📭</span>
                            <h3>No bookings found</h3>
                            <p>No reservations found for {searchedEmail}</p>
                        </div>
                    ) : (
                        <>
                            <h2>Showing bookings for {searchedEmail}</h2>
                            <div className="bookings-list">
                                {reservations.map(reservation => (
                                    <div key={reservation.id} className={`booking-card ${reservation.status}`}>
                                        <div className="booking-datetime">
                                            <span className="booking-date">
                                                {format(parseISO(reservation.date), 'EEE, MMM d')}
                                            </span>
                                            <span className="booking-time">
                                                {reservation.startTime} - {reservation.endTime}
                                            </span>
                                        </div>
                                        <div className="booking-details">
                                            <span className="booking-name">{reservation.customerName}</span>
                                            {reservation.notes && (
                                                <span className="booking-notes">{reservation.notes}</span>
                                            )}
                                        </div>
                                        <div className="booking-status">
                                            <StatusBadge status={reservation.status} />
                                        </div>
                                        <div className="booking-actions">
                                            {(reservation.status === 'pending' || reservation.status === 'confirmed') &&
                                                !isPast(parseISO(reservation.date)) && (
                                                    <button
                                                        className="cancel-btn"
                                                        onClick={() => setCancelConfirm(reservation.id)}
                                                    >
                                                        Cancel
                                                    </button>
                                                )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            <Modal
                isOpen={!!cancelConfirm}
                onClose={() => setCancelConfirm(null)}
                title="Cancel Booking"
                size="small"
            >
                {reservationToCancel && (
                    <div className="cancel-modal">
                        <p>Are you sure you want to cancel this booking?</p>
                        <div className="cancel-details">
                            <span className="detail-date">
                                {format(parseISO(reservationToCancel.date), 'EEEE, MMMM d, yyyy')}
                            </span>
                            <span className="detail-time">
                                {reservationToCancel.startTime} - {reservationToCancel.endTime}
                            </span>
                        </div>
                        <div className="cancel-actions">
                            <button className="btn btn-secondary" onClick={() => setCancelConfirm(null)}>
                                Keep Booking
                            </button>
                            <button className="btn btn-danger" onClick={handleCancel}>
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
