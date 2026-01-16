import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { useTenant } from '../../context/TenantContext';
import { useTimeSlots } from '../../hooks/useTimeSlots';
import { Calendar } from '../../components/common/Calendar';
import { Modal } from '../../components/common/Modal';
import './TimeSlotsPage.css';

export function TimeSlotsPage() {
    const { currentTenant } = useTenant();
    const { getSlotsByDate, createTimeSlot, deleteTimeSlot, toggleSlotActive } = useTimeSlots();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSlot, setNewSlot] = useState({
        startTime: '09:00',
        endTime: '10:00',
        capacity: 1,
    });

    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const slots = useMemo(() => {
        return getSlotsByDate(dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [dateStr, getSlotsByDate]);

    const handleAddSlot = (e: React.FormEvent) => {
        e.preventDefault();

        createTimeSlot({
            date: dateStr,
            startTime: newSlot.startTime,
            endTime: newSlot.endTime,
            capacity: newSlot.capacity,
            isActive: true,
        });

        setShowAddModal(false);
        setNewSlot({ startTime: '09:00', endTime: '10:00', capacity: 1 });
    };

    if (!currentTenant) {
        return <div>Loading...</div>;
    }

    return (
        <div className="time-slots-page">
            <div className="page-header">
                <div>
                    <h2>Time Slots</h2>
                    <p>Manage your available booking slots</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Slot
                </button>
            </div>

            <div className="slots-container">
                <div className="calendar-section">
                    <Calendar
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        minDate={new Date()}
                        maxDate={addDays(new Date(), currentTenant.settings.maxAdvanceBookingDays)}
                    />
                </div>

                <div className="slots-section">
                    <div className="slots-header">
                        <h3>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
                        <span className="slots-count">{slots.length} slots</span>
                    </div>

                    {slots.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📅</span>
                            <h4>No slots for this day</h4>
                            <p>Add time slots to allow bookings</p>
                            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                                Add Time Slot
                            </button>
                        </div>
                    ) : (
                        <div className="slots-list">
                            {slots.map(slot => (
                                <div key={slot.id} className={`slot-card ${!slot.isActive ? 'inactive' : ''}`}>
                                    <div className="slot-time">
                                        <span className="time-range">{slot.startTime} - {slot.endTime}</span>
                                        <span className="capacity">
                                            {slot.bookedCount}/{slot.capacity} booked
                                        </span>
                                    </div>
                                    <div className="slot-status">
                                        {slot.bookedCount >= slot.capacity ? (
                                            <span className="status-badge full">Full</span>
                                        ) : slot.isActive ? (
                                            <span className="status-badge available">Available</span>
                                        ) : (
                                            <span className="status-badge disabled">Disabled</span>
                                        )}
                                    </div>
                                    <div className="slot-actions">
                                        <button
                                            className={`action-btn ${slot.isActive ? '' : 'activate'}`}
                                            onClick={() => toggleSlotActive(slot.id)}
                                            title={slot.isActive ? 'Disable' : 'Enable'}
                                        >
                                            {slot.isActive ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                    <line x1="1" y1="1" x2="23" y2="23" />
                                                </svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                        <button
                                            className="action-btn delete"
                                            onClick={() => deleteTimeSlot(slot.id)}
                                            title="Delete"
                                            disabled={slot.bookedCount > 0}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Time Slot"
                size="small"
            >
                <form onSubmit={handleAddSlot} className="add-slot-form">
                    <div className="form-group">
                        <label>Date</label>
                        <input type="text" value={format(selectedDate, 'MMMM d, yyyy')} disabled />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="startTime">Start Time</label>
                            <input
                                type="time"
                                id="startTime"
                                value={newSlot.startTime}
                                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="endTime">End Time</label>
                            <input
                                type="time"
                                id="endTime"
                                value={newSlot.endTime}
                                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="capacity">Capacity</label>
                        <input
                            type="number"
                            id="capacity"
                            min="1"
                            max="100"
                            value={newSlot.capacity}
                            onChange={(e) => setNewSlot({ ...newSlot, capacity: parseInt(e.target.value) || 1 })}
                            required
                        />
                        <span className="form-hint">Number of bookings allowed for this slot</span>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full">
                        Create Slot
                    </button>
                </form>
            </Modal>
        </div>
    );
}
