import { useTenant } from '../context/TenantContext';
import type { TimeSlot } from '../types';
import { generateId } from '../data/mockData';

export function useTimeSlots() {
    const { currentTenant, appData, updateAppData } = useTenant();

    const getTimeSlotsForTenant = (tenantId?: string): TimeSlot[] => {
        const id = tenantId || currentTenant?.id;
        if (!id) return [];
        return appData.timeSlots.filter((s) => s.tenantId === id);
    };

    const getAvailableSlots = (date: string, tenantId?: string): TimeSlot[] => {
        return getTimeSlotsForTenant(tenantId).filter(
            (s) => s.date === date && s.isActive && s.bookedCount < s.capacity
        );
    };

    const getSlotsByDate = (date: string, tenantId?: string): TimeSlot[] => {
        return getTimeSlotsForTenant(tenantId).filter((s) => s.date === date);
    };

    const getSlotById = (slotId: string): TimeSlot | undefined => {
        return appData.timeSlots.find((s) => s.id === slotId);
    };

    const createTimeSlot = (
        data: Omit<TimeSlot, 'id' | 'tenantId' | 'bookedCount'>
    ): TimeSlot | null => {
        if (!currentTenant) return null;

        const newSlot: TimeSlot = {
            ...data,
            id: generateId(),
            tenantId: currentTenant.id,
            bookedCount: 0,
        };

        updateAppData((prev) => ({
            ...prev,
            timeSlots: [...prev.timeSlots, newSlot],
        }));

        return newSlot;
    };

    const updateTimeSlot = (slotId: string, updates: Partial<TimeSlot>): void => {
        updateAppData((prev) => ({
            ...prev,
            timeSlots: prev.timeSlots.map((s) =>
                s.id === slotId ? { ...s, ...updates } : s
            ),
        }));
    };

    const deleteTimeSlot = (slotId: string): void => {
        updateAppData((prev) => ({
            ...prev,
            timeSlots: prev.timeSlots.filter((s) => s.id !== slotId),
        }));
    };

    const toggleSlotActive = (slotId: string): void => {
        updateAppData((prev) => ({
            ...prev,
            timeSlots: prev.timeSlots.map((s) =>
                s.id === slotId ? { ...s, isActive: !s.isActive } : s
            ),
        }));
    };

    return {
        getTimeSlotsForTenant,
        getAvailableSlots,
        getSlotsByDate,
        getSlotById,
        createTimeSlot,
        updateTimeSlot,
        deleteTimeSlot,
        toggleSlotActive,
    };
}
