import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { useTenant } from '../../context/TenantContext';
import { useReservations } from '../../hooks/useReservations';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import type { ReservationStatus } from '../../types';
import './ReservationsPage.css';

export function ReservationsPage() {
    const { currentTenant } = useTenant();
    const { getReservationsForTenant, updateReservationStatus, cancelReservation } = useReservations();

    const [filter, setFilter] = useState<ReservationStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReservation, setSelectedReservation] = useState<string | null>(null);

    const reservations = useMemo(() => {
        if (!currentTenant) return [];

        let filtered = getReservationsForTenant();

        if (filter !== 'all') {
            filtered = filtered.filter(r => r.status === filter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.customerName.toLowerCase().includes(query) ||
                r.customerEmail.toLowerCase().includes(query) ||
                r.customerPhone.includes(query)
            );
        }

        return filtered.sort((a, b) => {
            const dateCompare = b.date.localeCompare(a.date);
            if (dateCompare !== 0) return dateCompare;
            return a.startTime.localeCompare(b.startTime);
        });
    }, [currentTenant, filter, searchQuery, getReservationsForTenant]);

    const selectedReservationData = reservations.find(r => r.id === selectedReservation);

    const handleConfirm = (id: string) => {
        updateReservationStatus(id, 'confirmed');
        setSelectedReservation(null);
    };

    const handleCancel = (id: string) => {
        cancelReservation(id);
        setSelectedReservation(null);
    };

    const handleComplete = (id: string) => {
        updateReservationStatus(id, 'completed');
        setSelectedReservation(null);
    };

    if (!currentTenant) {
        return <div>Loading...</div>;
    }

    return (
        <div className="reservations-page">
            <div className="page-header">
                <h2>Reservations</h2>
                <p>Manage all your bookings in one place</p>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="filter-tabs">
                    {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(status => (
                        <button
                            key={status}
                            className={`filter-tab ${filter === status ? 'active' : ''}`}
                            onClick={() => setFilter(status)}
                        >
                            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="reservations-table-container">
                {reservations.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <h3>No reservations found</h3>
                        <p>
                            {filter !== 'all'
                                ? `No ${filter} reservations to display.`
                                : 'Reservations will appear here when customers book appointments.'}
                        </p>
                    </div>
                ) : (
                    <table className="reservations-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Customer</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservations.map(reservation => (
                                <tr key={reservation.id}>
                                    <td className="datetime-cell">
                                        <span className="date">{format(parseISO(reservation.date), 'MMM d, yyyy')}</span>
                                        <span className="time">{reservation.startTime} - {reservation.endTime}</span>
                                    </td>
                                    <td className="customer-cell">
                                        <span className="name">{reservation.customerName}</span>
                                        {reservation.notes && <span className="notes">{reservation.notes}</span>}
                                    </td>
                                    <td className="contact-cell">
                                        <span className="email">{reservation.customerEmail}</span>
                                        <span className="phone">{reservation.customerPhone}</span>
                                    </td>
                                    <td>
                                        <StatusBadge status={reservation.status} />
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="action-btn"
                                            onClick={() => setSelectedReservation(reservation.id)}
                                            aria-label="View details"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="3" />
                                                <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={!!selectedReservation}
                onClose={() => setSelectedReservation(null)}
                title="Reservation Details"
                size="medium"
            >
                {selectedReservationData && (
                    <div className="reservation-details-modal">
                        <div className="detail-row">
                            <span className="detail-label">Customer</span>
                            <span className="detail-value">{selectedReservationData.customerName}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{selectedReservationData.customerEmail}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{selectedReservationData.customerPhone}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Date</span>
                            <span className="detail-value">
                                {format(parseISO(selectedReservationData.date), 'EEEE, MMMM d, yyyy')}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Time</span>
                            <span className="detail-value">
                                {selectedReservationData.startTime} - {selectedReservationData.endTime}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Status</span>
                            <StatusBadge status={selectedReservationData.status} />
                        </div>
                        {selectedReservationData.notes && (
                            <div className="detail-row">
                                <span className="detail-label">Notes</span>
                                <span className="detail-value notes">{selectedReservationData.notes}</span>
                            </div>
                        )}

                        <div className="modal-actions">
                            {selectedReservationData.status === 'pending' && (
                                <button
                                    className="btn btn-success"
                                    onClick={() => handleConfirm(selectedReservationData.id)}
                                >
                                    ✓ Confirm
                                </button>
                            )}
                            {(selectedReservationData.status === 'pending' || selectedReservationData.status === 'confirmed') && (
                                <>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleComplete(selectedReservationData.id)}
                                    >
                                        Complete
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleCancel(selectedReservationData.id)}
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
