import { db } from './firebase';
import {
    collection,
    doc,
    writeBatch,
    getDocs,
    query,
    where,
    Timestamp,
    orderBy,
    limit,
    increment,
} from 'firebase/firestore';
import type { Reservation, TimeSlot } from '../types';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: unknown; timestamp: number }>();

// Check if cache is valid
function isCacheValid(key: string): boolean {
    const cached = cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
}

// Get from cache
function getFromCache<T>(key: string): T | null {
    if (isCacheValid(key)) {
        return cache.get(key)?.data as T;
    }
    return null;
}

// Set cache
function setCache<T>(key: string, data: T): void {
    cache.set(key, { data, timestamp: Date.now() });
}

// Invalidate cache for a tenant
export function invalidateCache(tenantId: string): void {
    const keysToDelete: string[] = [];
    cache.forEach((_, key) => {
        if (key.includes(tenantId)) {
            keysToDelete.push(key);
        }
    });
    keysToDelete.forEach(key => cache.delete(key));
}

// Invalidate all cache
export function clearAllCache(): void {
    cache.clear();
}

/**
 * Fetch reservations for a tenant with caching
 */
export async function fetchReservationsForTenant(tenantId: string): Promise<Reservation[]> {
    const cacheKey = `reservations_${tenantId}`;

    // Check cache first
    const cached = getFromCache<Reservation[]>(cacheKey);
    if (cached) {
        console.log('📦 Reservations from cache');
        return cached;
    }

    // Fetch from Firestore
    console.log('🔥 Fetching reservations from Firestore');
    const q = query(
        collection(db, 'reservations'),
        where('tenantId', '==', tenantId),
        orderBy('createdAt', 'desc'),
        limit(500) // Limit to reduce reads
    );

    const snapshot = await getDocs(q);
    const reservations = snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id,
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
    })) as Reservation[];

    // Cache the result
    setCache(cacheKey, reservations);

    return reservations;
}

/**
 * Fetch time slots for a tenant with caching
 */
export async function fetchTimeSlotsForTenant(tenantId: string): Promise<TimeSlot[]> {
    const cacheKey = `timeslots_${tenantId}`;

    // Check cache first
    const cached = getFromCache<TimeSlot[]>(cacheKey);
    if (cached) {
        console.log('📦 Time slots from cache');
        return cached;
    }

    // Fetch from Firestore
    console.log('🔥 Fetching time slots from Firestore');
    const q = query(
        collection(db, 'timeSlots'),
        where('tenantId', '==', tenantId)
    );

    const snapshot = await getDocs(q);
    const slots = snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id,
    })) as TimeSlot[];

    // Cache the result
    setCache(cacheKey, slots);

    return slots;
}

/**
 * Create a reservation with batched write (updates both reservation and slot)
 */
export async function createReservationBatched(
    reservation: Omit<Reservation, 'id' | 'createdAt'>,
    slotId: string
): Promise<string> {
    const batch = writeBatch(db);

    // Create new reservation document
    const reservationRef = doc(collection(db, 'reservations'));
    batch.set(reservationRef, {
        ...reservation,
        createdAt: Timestamp.now(),
    });

    // Update the time slot's booked count atomically
    const slotRef = doc(db, 'timeSlots', slotId);
    batch.update(slotRef, { bookedCount: increment(1) });

    // Commit both operations in a single batch
    await batch.commit();

    // Invalidate cache for this tenant
    invalidateCache(reservation.tenantId);

    console.log('✅ Reservation created with batched write');

    return reservationRef.id;
}

/**
 * Update reservation status
 */
export async function updateReservationStatusBatched(
    reservationId: string,
    status: string,
    tenantId: string
): Promise<void> {
    const batch = writeBatch(db);

    const reservationRef = doc(db, 'reservations', reservationId);
    batch.update(reservationRef, { status });

    await batch.commit();

    // Invalidate cache
    invalidateCache(tenantId);

    console.log('✅ Reservation status updated');
}

/**
 * Cancel reservation with batched write (updates reservation and slot)
 */
export async function cancelReservationBatched(
    reservationId: string,
    slotId: string,
    tenantId: string
): Promise<void> {
    const batch = writeBatch(db);

    // Update reservation status
    const reservationRef = doc(db, 'reservations', reservationId);
    batch.update(reservationRef, { status: 'cancelled' });

    // Update slot's booked count atomically
    const slotRef = doc(db, 'timeSlots', slotId);
    batch.update(slotRef, { bookedCount: increment(-1) });

    await batch.commit();

    // Invalidate cache
    invalidateCache(tenantId);

    console.log('✅ Reservation cancelled with batched write');
}

/**
 * Create multiple time slots in a batch
 */
export async function createTimeSlotsBatched(
    slots: Omit<TimeSlot, 'id'>[],
    tenantId: string
): Promise<string[]> {
    const batch = writeBatch(db);
    const ids: string[] = [];

    slots.forEach(slot => {
        const slotRef = doc(collection(db, 'timeSlots'));
        batch.set(slotRef, slot);
        ids.push(slotRef.id);
    });

    await batch.commit();

    // Invalidate cache
    invalidateCache(tenantId);

    console.log(`✅ Created ${slots.length} time slots in batch`);

    return ids;
}

/**
 * Delete multiple time slots in a batch
 */
export async function deleteTimeSlotsBatched(
    slotIds: string[],
    tenantId: string
): Promise<void> {
    const batch = writeBatch(db);

    slotIds.forEach(id => {
        const slotRef = doc(db, 'timeSlots', id);
        batch.delete(slotRef);
    });

    await batch.commit();

    // Invalidate cache
    invalidateCache(tenantId);

    console.log(`✅ Deleted ${slotIds.length} time slots in batch`);
}

/**
 * Sync local data to Firestore in batches (useful for bulk operations)
 */
export async function syncDataToFirestore(
    reservations: Reservation[],
    timeSlots: TimeSlot[],
    tenantId: string
): Promise<void> {
    // Firestore batch limit is 500 operations
    const BATCH_SIZE = 450;

    // Sync reservations
    for (let i = 0; i < reservations.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = reservations.slice(i, i + BATCH_SIZE);

        chunk.forEach(reservation => {
            const ref = doc(db, 'reservations', reservation.id);
            batch.set(ref, {
                ...reservation,
                createdAt: reservation.createdAt instanceof Date
                    ? Timestamp.fromDate(reservation.createdAt)
                    : reservation.createdAt,
            }, { merge: true });
        });

        await batch.commit();
    }

    // Sync time slots
    for (let i = 0; i < timeSlots.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = timeSlots.slice(i, i + BATCH_SIZE);

        chunk.forEach(slot => {
            const ref = doc(db, 'timeSlots', slot.id);
            batch.set(ref, slot, { merge: true });
        });

        await batch.commit();
    }

    // Clear cache after sync
    invalidateCache(tenantId);

    console.log('✅ Data synced to Firestore');
}
