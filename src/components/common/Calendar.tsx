import { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore } from 'date-fns';
import './Calendar.css';

interface CalendarProps {
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
    availableDates?: string[]; // ISO date strings
    minDate?: Date;
    maxDate?: Date;
}

export function Calendar({
    selectedDate,
    onDateSelect,
    availableDates,
    minDate = new Date(),
    maxDate,
}: CalendarProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState(() =>
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

    const goToPreviousWeek = () => {
        setCurrentWeekStart((prev) => addDays(prev, -7));
    };

    const goToNextWeek = () => {
        setCurrentWeekStart((prev) => addDays(prev, 7));
    };

    const isDateAvailable = (date: Date): boolean => {
        if (!availableDates) return true;
        return availableDates.includes(format(date, 'yyyy-MM-dd'));
    };

    const isDateDisabled = (date: Date): boolean => {
        if (isBefore(date, minDate) && !isSameDay(date, minDate)) return true;
        if (maxDate && isBefore(maxDate, date)) return true;
        return false;
    };

    return (
        <div className="calendar">
            <div className="calendar-header">
                <button className="calendar-nav" onClick={goToPreviousWeek} aria-label="Previous week">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <span className="calendar-title">
                    {format(currentWeekStart, 'MMMM yyyy')}
                </span>
                <button className="calendar-nav" onClick={goToNextWeek} aria-label="Next week">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </button>
            </div>

            <div className="calendar-weekdays">
                {weekDays.map((day) => (
                    <div key={day} className="calendar-weekday">
                        {day}
                    </div>
                ))}
            </div>

            <div className="calendar-days">
                {days.map((date) => {
                    const disabled = isDateDisabled(date);
                    const available = isDateAvailable(date) && !disabled;
                    const selected = selectedDate && isSameDay(date, selectedDate);
                    const today = isToday(date);

                    return (
                        <button
                            key={date.toISOString()}
                            className={`calendar-day ${selected ? 'selected' : ''} ${today ? 'today' : ''} ${disabled ? 'disabled' : ''
                                } ${available ? 'available' : ''}`}
                            onClick={() => !disabled && onDateSelect(date)}
                            disabled={disabled}
                        >
                            <span className="calendar-day-number">{format(date, 'd')}</span>
                            <span className="calendar-day-name">{format(date, 'EEE')}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
