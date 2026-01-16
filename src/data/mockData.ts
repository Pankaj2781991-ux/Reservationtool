import type { Tenant, TimeSlot, Reservation, TenantUser, TenantSubscription } from '../types';
import { format, addDays } from 'date-fns';

const STORAGE_KEY = 'reservation_app_data';

// Default tenants for demo
const defaultTenants: Tenant[] = [
    {
        id: 'tenant-1',
        slug: 'demo-salon',
        businessName: 'Glamour Hair Studio',
        email: 'contact@glamourhair.com',
        phone: '+1 555-0123',
        serviceType: 'Hair Salon',
        description: 'Premium hair styling and beauty services',
        createdAt: new Date('2024-01-01'),
        ownerUserId: 'user-admin-1',
        subscription: {
            status: 'active',
            plan: 'pro',
            currentPeriodEnd: '2026-02-01',
        },
        settings: {
            primaryColor: '#8B5CF6',
            slotDuration: 60,
            maxAdvanceBookingDays: 30,
            workingHoursStart: '09:00',
            workingHoursEnd: '18:00',
            workingDays: [1, 2, 3, 4, 5, 6],
        },
    },
    {
        id: 'tenant-2',
        slug: 'dr-smith-clinic',
        businessName: "Dr. Smith's Medical Clinic",
        email: 'appointments@drsmith.com',
        phone: '+1 555-0456',
        serviceType: 'Medical Clinic',
        description: 'General practice and specialized consultations',
        createdAt: new Date('2024-01-15'),
        ownerUserId: 'user-admin-2',
        subscription: {
            status: 'active',
            plan: 'starter',
            currentPeriodEnd: '2026-01-25',
        },
        settings: {
            primaryColor: '#10B981',
            slotDuration: 30,
            maxAdvanceBookingDays: 60,
            workingHoursStart: '08:00',
            workingHoursEnd: '17:00',
            workingDays: [1, 2, 3, 4, 5],
        },
    },
    {
        id: 'tenant-3',
        slug: 'fitness-pro',
        businessName: 'FitnessPro Training Center',
        email: 'book@fitnesspro.com',
        phone: '+1 555-0789',
        serviceType: 'Fitness Center',
        description: 'Personal training and group fitness classes',
        createdAt: new Date('2024-02-01'),
        ownerUserId: 'user-admin-3',
        subscription: {
            status: 'trial',
            plan: 'starter',
            currentPeriodEnd: '2026-02-10',
        },
        settings: {
            primaryColor: '#F59E0B',
            slotDuration: 45,
            maxAdvanceBookingDays: 14,
            workingHoursStart: '06:00',
            workingHoursEnd: '21:00',
            workingDays: [0, 1, 2, 3, 4, 5, 6],
        },
    },
];

const defaultUsers: TenantUser[] = [
    {
        id: 'user-admin-1',
        tenantId: 'tenant-1',
        role: 'admin',
        name: 'Glamour Admin',
        email: 'owner@glamourhair.com',
        phone: '+1 555-0123',
        password: 'demo1234',
        createdAt: new Date('2024-01-01'),
    },
    {
        id: 'user-admin-2',
        tenantId: 'tenant-2',
        role: 'admin',
        name: 'Dr. Smith Admin',
        email: 'owner@drsmith.com',
        phone: '+1 555-0456',
        password: 'demo1234',
        createdAt: new Date('2024-01-15'),
    },
    {
        id: 'user-admin-3',
        tenantId: 'tenant-3',
        role: 'admin',
        name: 'FitnessPro Admin',
        email: 'owner@fitnesspro.com',
        phone: '+1 555-0789',
        password: 'demo1234',
        createdAt: new Date('2024-02-01'),
    },
    {
        id: 'user-customer-1',
        tenantId: 'tenant-1',
        role: 'customer',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '+1 555-1111',
        password: 'customer123',
        createdAt: new Date('2024-02-01'),
    },
];

// Generate sample time slots for the next 7 days
function generateDefaultTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const today = new Date();

    defaultTenants.forEach((tenant) => {
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const date = format(addDays(today, dayOffset), 'yyyy-MM-dd');
            const dayOfWeek = addDays(today, dayOffset).getDay();

            if (!tenant.settings.workingDays.includes(dayOfWeek)) continue;

            const startHour = parseInt(tenant.settings.workingHoursStart.split(':')[0]);
            const endHour = parseInt(tenant.settings.workingHoursEnd.split(':')[0]);
            const slotDuration = tenant.settings.slotDuration;

            for (let hour = startHour; hour < endHour; hour++) {
                for (let min = 0; min < 60; min += slotDuration) {
                    if (hour + min / 60 + slotDuration / 60 > endHour) break;

                    const startTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                    const endMin = min + slotDuration;
                    const endHourCalc = hour + Math.floor(endMin / 60);
                    const endMinCalc = endMin % 60;
                    const endTime = `${endHourCalc.toString().padStart(2, '0')}:${endMinCalc.toString().padStart(2, '0')}`;

                    slots.push({
                        id: `slot-${tenant.id}-${date}-${startTime}`,
                        tenantId: tenant.id,
                        date,
                        startTime,
                        endTime,
                        capacity: 1,
                        bookedCount: 0,
                        isActive: true,
                    });
                }
            }
        }
    });

    return slots;
}

// Generate sample reservations
function generateDefaultReservations(): Reservation[] {
    const today = format(new Date(), 'yyyy-MM-dd');
    return [
        {
            id: 'res-1',
            tenantId: 'tenant-1',
            timeSlotId: `slot-tenant-1-${today}-10:00`,
            customerName: 'Alice Johnson',
            customerEmail: 'alice@example.com',
            customerPhone: '+1 555-1111',
            notes: 'Haircut and color',
            status: 'confirmed',
            createdAt: new Date(),
            date: today,
            startTime: '10:00',
            endTime: '11:00',
        },
        {
            id: 'res-2',
            tenantId: 'tenant-1',
            timeSlotId: `slot-tenant-1-${today}-14:00`,
            customerName: 'Bob Williams',
            customerEmail: 'bob@example.com',
            customerPhone: '+1 555-2222',
            status: 'pending',
            createdAt: new Date(),
            date: today,
            startTime: '14:00',
            endTime: '15:00',
        },
    ];
}

export interface AppData {
    tenants: Tenant[];
    timeSlots: TimeSlot[];
    reservations: Reservation[];
    users: TenantUser[];
}

function getDefaultData(): AppData {
    return {
        tenants: defaultTenants,
        timeSlots: generateDefaultTimeSlots(),
        reservations: generateDefaultReservations(),
        users: defaultUsers,
    };
}

function withDefaultSubscription(subscription?: TenantSubscription): TenantSubscription {
    return (
        subscription || {
            status: 'trial',
            plan: 'starter',
            currentPeriodEnd: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
        }
    );
}

export function loadData(): AppData {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            // Convert date strings back to Date objects
            data.tenants = data.tenants.map((t: Tenant) => ({
                ...t,
                createdAt: new Date(t.createdAt),
                subscription: withDefaultSubscription(t.subscription),
            }));
            data.reservations = data.reservations.map((r: Reservation) => ({
                ...r,
                createdAt: new Date(r.createdAt),
            }));
            data.users = (data.users || []).map((u: TenantUser) => ({
                ...u,
                createdAt: new Date(u.createdAt),
            }));

            if (!data.users || data.users.length === 0) {
                data.users = defaultUsers;
            }

            data.tenants = data.tenants.map((tenant: Tenant) => {
                let owner = data.users.find((u: TenantUser) => u.role === 'admin' && u.tenantId === tenant.id);
                if (!owner) {
                    owner = {
                        id: `user-admin-${tenant.id}`,
                        tenantId: tenant.id,
                        role: 'admin',
                        name: `${tenant.businessName} Admin`,
                        email: tenant.email,
                        phone: tenant.phone,
                        password: 'demo1234',
                        createdAt: tenant.createdAt,
                    };
                    data.users.push(owner);
                }
                return {
                    ...tenant,
                    ownerUserId: tenant.ownerUserId || owner.id,
                    subscription: withDefaultSubscription(tenant.subscription),
                };
            });
            return data;
        }
    } catch (e) {
        console.error('Failed to load data from localStorage:', e);
    }
    const defaultData = getDefaultData();
    saveData(defaultData);
    return defaultData;
}

export function saveData(data: AppData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save data to localStorage:', e);
    }
}

export function resetData(): AppData {
    const defaultData = getDefaultData();
    saveData(defaultData);
    return defaultData;
}

// Utility functions
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSlug(businessName: string): string {
    return businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
