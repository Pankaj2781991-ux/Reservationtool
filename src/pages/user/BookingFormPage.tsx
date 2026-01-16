import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useTimeSlots } from '../../hooks/useTimeSlots';
import { useReservations } from '../../hooks/useReservations';
import { useUsers } from '../../hooks/useUsers';
import './BookingFormPage.css';

export function BookingFormPage() {
    const navigate = useNavigate();
    const { tenantSlug, slotId } = useParams<{ tenantSlug: string; slotId: string }>();
    const { currentTenant } = useTenant();
    const { session } = useAuth();
    const { getSlotById } = useTimeSlots();
    const { createReservation } = useReservations();
    const { getUserById } = useUsers();

    const [formData, setFormData] = useState({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        notes: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const slot = slotId ? getSlotById(slotId) : null;

    useEffect(() => {
        if (session?.role === 'customer' && currentTenant && session.tenantId === currentTenant.id) {
            const user = getUserById(session.userId);
            if (user) {
                setFormData((prev) => ({
                    ...prev,
                    customerName: user.name || prev.customerName,
                    customerEmail: user.email || prev.customerEmail,
                    customerPhone: user.phone || prev.customerPhone,
                }));
            }
        }
    }, [session, currentTenant, getUserById]);

    if (!currentTenant || !slot) {
        return (
            <div className="booking-form-page">
                <div className="error-state">
                    <span className="error-icon">⚠️</span>
                    <h2>Slot Not Found</h2>
                    <p>The selected time slot is no longer available.</p>
                    <button className="btn btn-primary" onClick={() => navigate(`/tenant/${tenantSlug}`)}>
                        Back to Booking
                    </button>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
            setError('Please fill in all required fields.');
            return;
        }

        setIsSubmitting(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const reservation = createReservation({
            timeSlotId: slot.id,
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            customerPhone: formData.customerPhone,
            notes: formData.notes,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
        });

        if (reservation) {
            navigate(`/tenant/${tenantSlug}/my-bookings?success=true`);
        } else {
            setError('Failed to create reservation. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="booking-form-page">
            <div className="form-container">
                <div className="form-header">
                    <button className="back-btn" onClick={() => navigate(`/tenant/${tenantSlug}`)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1>Complete Your Booking</h1>
                </div>

                <div className="booking-summary">
                    <div className="summary-icon">📅</div>
                    <div className="summary-details">
                        <span className="summary-date">{format(parseISO(slot.date), 'EEEE, MMMM d, yyyy')}</span>
                        <span className="summary-time">{slot.startTime} - {slot.endTime}</span>
                    </div>
                </div>

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit} className="booking-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name *</label>
                        <input
                            type="text"
                            id="name"
                            value={formData.customerName}
                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <input
                            type="email"
                            id="email"
                            value={formData.customerEmail}
                            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone Number *</label>
                        <input
                            type="tel"
                            id="phone"
                            value={formData.customerPhone}
                            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                            placeholder="+1 555-0123"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="notes">Additional Notes</label>
                        <textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any special requests or notes..."
                            rows={3}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-large btn-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                    </button>

                    <p className="form-disclaimer">
                        By booking, you agree to receive appointment reminders via email and SMS.
                    </p>
                </form>
            </div>
        </div>
    );
}
