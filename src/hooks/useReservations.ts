import { useTenant } from '../context/TenantContext';
import type { Reservation, ReservationStatus } from '../types';
import { generateId } from '../data/mockData';
import {
    createReservationBatched,
    updateReservationStatusBatched,
    cancelReservationBatched
} from '../firebase/firestoreService';

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

    const createReservation = async (
        data: Omit<Reservation, 'id' | 'tenantId' | 'createdAt' | 'status'>
    ): Promise<Reservation | null> => {
        if (!currentTenant) return null;

        const reservationId = generateId();
        const newReservation: Reservation = {
            ...data,
            id: reservationId,
            tenantId: currentTenant.id,
            createdAt: new Date(),
            status: 'pending',
        };

        // Optimistic update - update local state immediately
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

        // Batched write to Firestore (async, non-blocking)
        try {
            await createReservationBatched(
                {
                    ...data,
                    tenantId: currentTenant.id,
                    status: 'pending',
                },
                data.timeSlotId
            );
            console.log('✅ Reservation synced to Firestore');
        } catch (error) {
            console.error('Failed to sync reservation to Firestore:', error);
            // Note: In production, you might want to rollback the optimistic update
        }

        return newReservation;
    };

    const updateReservationStatus = async (reservationId: string, status: ReservationStatus): Promise<void> => {
        if (!currentTenant) return;

        // Optimistic update
        updateAppData((prev) => ({
            ...prev,
            reservations: prev.reservations.map((r) =>
                r.id === reservationId ? { ...r, status } : r
            ),
        }));

        // Sync to Firestore
        try {
            await updateReservationStatusBatched(reservationId, status, currentTenant.id);
        } catch (error) {
            console.error('Failed to sync status update to Firestore:', error);
        }
    };

    const cancelReservation = async (reservationId: string): Promise<void> => {
        if (!currentTenant) return;

        const reservation = appData.reservations.find((r) => r.id === reservationId);
        if (!reservation) return;

        // Optimistic update
        updateAppData((prev) => ({
            ...prev,
            reservations: prev.reservations.map((r) =>
                r.id === reservationId ? { ...r, status: 'cancelled' as ReservationStatus } : r
            ),
            timeSlots: prev.timeSlots.map((slot) =>
                slot.id === reservation.timeSlotId
                    ? { ...slot, bookedCount: Math.max(0, slot.bookedCount - 1) }
                    : slot
            ),
        }));

        // Batched write to Firestore
        try {
            await cancelReservationBatched(
                reservationId,
                reservation.timeSlotId,
                currentTenant.id
            );
        } catch (error) {
            console.error('Failed to sync cancellation to Firestore:', error);
        }
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

