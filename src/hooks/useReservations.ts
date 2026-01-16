import { useTenant } from '../context/TenantContext';
import type { Reservation, ReservationStatus } from '../types';
import { generateId } from '../data/mockData';

export function useReservations() {
    const { currentTenant, appData, updateAppData } = useTenant();

    const getReservationsForTenant = (tenantId?: string): Reservation[] => {
        const id = tenantId || currentTenant?.id;
        if (!id) return [];
        return appData.reservations.filter((r) => r.tenantId === id);
    };

    const getReservationsByDate = (date: string, tenantId?: string): Reservation[] => {
        return getReservationsForTenant(tenantId).filter((r) => r.date === date);
    };

    const getReservationsByStatus = (status: ReservationStatus, tenantId?: string): Reservation[] => {
        return getReservationsForTenant(tenantId).filter((r) => r.status === status);
    };

    const getReservationsByEmail = (email: string, tenantId?: string): Reservation[] => {
        return getReservationsForTenant(tenantId).filter(
            (r) => r.customerEmail.toLowerCase() === email.toLowerCase()
        );
    };

    const createReservation = (
        data: Omit<Reservation, 'id' | 'tenantId' | 'createdAt' | 'status'>
    ): Reservation | null => {
        if (!currentTenant) return null;

        const newReservation: Reservation = {
            ...data,
            id: generateId(),
            tenantId: currentTenant.id,
            createdAt: new Date(),
            status: 'pending',
        };

        updateAppData((prev) => {
            // Update the time slot's booked count
            const updatedSlots = prev.timeSlots.map((slot) =>
                slot.id === data.timeSlotId
                    ? { ...slot, bookedCount: slot.bookedCount + 1 }
                    : slot
            );

            return {
                ...prev,
                reservations: [...prev.reservations, newReservation],
                timeSlots: updatedSlots,
            };
        });

        return newReservation;
    };

    const updateReservationStatus = (reservationId: string, status: ReservationStatus): void => {
        updateAppData((prev) => ({
            ...prev,
            reservations: prev.reservations.map((r) =>
                r.id === reservationId ? { ...r, status } : r
            ),
        }));
    };

    const cancelReservation = (reservationId: string): void => {
        updateAppData((prev) => {
            const reservation = prev.reservations.find((r) => r.id === reservationId);
            if (!reservation) return prev;

            return {
                ...prev,
                reservations: prev.reservations.map((r) =>
                    r.id === reservationId ? { ...r, status: 'cancelled' as ReservationStatus } : r
                ),
                timeSlots: prev.timeSlots.map((slot) =>
                    slot.id === reservation.timeSlotId
                        ? { ...slot, bookedCount: Math.max(0, slot.bookedCount - 1) }
                        : slot
                ),
            };
        });
    };

    return {
        getReservationsForTenant,
        getReservationsByDate,
        getReservationsByStatus,
        getReservationsByEmail,
        createReservation,
        updateReservationStatus,
        cancelReservation,
    };
}
