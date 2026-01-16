import type { ReservationStatus } from '../../types';
import './StatusBadge.css';

interface StatusBadgeProps {
    status: ReservationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'confirmed':
                return { label: 'Confirmed', className: 'status-confirmed' };
            case 'pending':
                return { label: 'Pending', className: 'status-pending' };
            case 'cancelled':
                return { label: 'Cancelled', className: 'status-cancelled' };
            case 'completed':
                return { label: 'Completed', className: 'status-completed' };
            default:
                return { label: status, className: '' };
        }
    };

    const config = getStatusConfig();

    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
}
