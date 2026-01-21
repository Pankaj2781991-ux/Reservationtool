import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { useTenant } from '../../context/TenantContext';
import { useTimeSlots } from '../../hooks/useTimeSlots';
import { Calendar } from '../../components/common/Calendar';
import './UserBookingPage.css';

export function UserBookingPage() {
    const navigate = useNavigate();
    const { tenantSlug } = useParams<{ tenantSlug: string }>();
    const { currentTenant } = useTenant();
    const { getAvailableSlots } = useTimeSlots();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const availableSlots = useMemo(() => {
        return getAvailableSlots(dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [dateStr, getAvailableSlots]);

    if (!currentTenant) {
        return <div className="loading">Loading...</div>;
    }

    const handleSelectSlot = (slotId: string) => {
        navigate(`/${tenantSlug}/book/${slotId}`);
    };

    return (
        <div className="user-booking-page">
            {currentTenant.settings.backgroundUrl && (
                <div
                    className="page-background"
                    style={{ backgroundImage: `url(${currentTenant.settings.backgroundUrl})` }}
                />
            )}
            <div className="booking-header">
                <h1>Book an Appointment</h1>
                <p>Select a date and time that works for you</p>
            </div>

            <div className="booking-container">
                <div className="date-selection">
                    <h2>Select Date</h2>
                    <Calendar
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        minDate={new Date()}
                        maxDate={addDays(new Date(), currentTenant.settings.maxAdvanceBookingDays)}
                    />
                </div>

                <div className="time-selection">
                    <h2>Available Times for {format(selectedDate, 'MMMM d, yyyy')}</h2>

                    {availableSlots.length === 0 ? (
                        <div className="no-slots">
                            <span className="no-slots-icon">😔</span>
                            <h3>No available slots</h3>
                            <p>Please select a different date to see available times.</p>
                        </div>
                    ) : (
                        <div className="slots-grid">
                            {availableSlots.map(slot => (
                                <button
                                    key={slot.id}
                                    className="time-slot-btn"
                                    onClick={() => handleSelectSlot(slot.id)}
                                >
                                    <span className="slot-time">{slot.startTime}</span>
                                    <span className="slot-duration">
                                        {slot.startTime} - {slot.endTime}
                                    </span>
                                    <span className="slot-availability">
                                        {slot.capacity - slot.bookedCount} spot{slot.capacity - slot.bookedCount !== 1 ? 's' : ''} left
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
