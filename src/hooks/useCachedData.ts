import { useState, useEffect, useCallback, useRef } from 'react';
import { useTenant } from '../context/TenantContext';
import {
    fetchReservationsForTenant,
    fetchTimeSlotsForTenant,
    invalidateCache
} from '../firebase/firestoreService';
import type { Reservation, TimeSlot } from '../types';

interface CachedData {
    reservations: Reservation[];
    timeSlots: TimeSlot[];
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;
}

const STALE_TIME = 5 * 60 * 1000; // 5 minutes - data is considered fresh for this duration

export function useCachedData() {
    const { currentTenant, appData, updateAppData } = useTenant();
    const [state, setState] = useState<CachedData>({
        reservations: [],
        timeSlots: [],
        isLoading: false,
        error: null,
        lastFetched: null,
    });

    const fetchInProgress = useRef(false);

    // Check if data is stale
    const isDataStale = useCallback(() => {
        if (!state.lastFetched) return true;
        return Date.now() - state.lastFetched > STALE_TIME;
    }, [state.lastFetched]);

    // Fetch data from Firestore with caching
    const fetchData = useCallback(async (force = false) => {
        if (!currentTenant) return;

        // Skip if already fetching or data is fresh
        if (fetchInProgress.current || (!force && !isDataStale())) {
            return;
        }

        fetchInProgress.current = true;
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const [reservations, timeSlots] = await Promise.all([
                fetchReservationsForTenant(currentTenant.id),
                fetchTimeSlotsForTenant(currentTenant.id),
            ]);

            setState({
                reservations,
                timeSlots,
                isLoading: false,
                error: null,
                lastFetched: Date.now(),
            });

            // Also update appData for backward compatibility
            updateAppData(prev => ({
                ...prev,
                reservations: [
                    ...prev.reservations.filter(r => r.tenantId !== currentTenant.id),
                    ...reservations,
                ],
                timeSlots: [
                    ...prev.timeSlots.filter(s => s.tenantId !== currentTenant.id),
                    ...timeSlots,
                ],
            }));

        } catch (error) {
            console.error('Failed to fetch cached data:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Failed to load data',
            }));
        } finally {
            fetchInProgress.current = false;
        }
    }, [currentTenant, isDataStale, updateAppData]);

    // Refresh data (force fetch bypassing cache)
    const refreshData = useCallback(() => {
        if (currentTenant) {
            invalidateCache(currentTenant.id);
            fetchData(true);
        }
    }, [currentTenant, fetchData]);

    // Auto-fetch on mount and when tenant changes
    useEffect(() => {
        fetchData();
    }, [currentTenant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Get reservations for current tenant from local state (instant, no network)
    const getReservations = useCallback(() => {
        if (!currentTenant) return [];
        return appData.reservations.filter(r => r.tenantId === currentTenant.id);
    }, [currentTenant, appData.reservations]);

    // Get time slots for current tenant from local state (instant, no network)
    const getTimeSlots = useCallback(() => {
        if (!currentTenant) return [];
        return appData.timeSlots.filter(s => s.tenantId === currentTenant.id);
    }, [currentTenant, appData.timeSlots]);

    return {
        // Cached data state
        isLoading: state.isLoading,
        error: state.error,
        lastFetched: state.lastFetched,
        isStale: isDataStale(),

        // Data accessors (use local state for instant reads)
        getReservations,
        getTimeSlots,

        // Actions
        fetchData,
        refreshData,
    };
}
