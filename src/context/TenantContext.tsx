import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Tenant, TenantSubscription } from '../types';
import { loadData, saveData, generateId, generateSlug } from '../data/mockData';
import type { AppData } from '../data/mockData';

interface TenantContextType {
    currentTenant: Tenant | null;
    allTenants: Tenant[];
    setCurrentTenantBySlug: (slug: string) => void;
    createTenant: (data: Omit<Tenant, 'id' | 'slug' | 'createdAt' | 'settings' | 'subscription' | 'ownerUserId'> & {
        ownerName: string;
        ownerPassword: string;
    }) => Tenant;
    appData: AppData;
    updateAppData: (updater: (data: AppData) => AppData) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
    const [appData, setAppData] = useState<AppData>(() => loadData());
    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

    useEffect(() => {
        saveData(appData);
    }, [appData]);

    const setCurrentTenantBySlug = (slug: string) => {
        const tenant = appData.tenants.find((t) => t.slug === slug) || null;
        setCurrentTenant(tenant);
    };

    const createTenant = (data: Omit<Tenant, 'id' | 'slug' | 'createdAt' | 'settings' | 'subscription' | 'ownerUserId'> & {
        ownerName: string;
        ownerPassword: string;
    }): Tenant => {
        const { ownerName, ownerPassword, ...tenantData } = data;
        const baseSlug = generateSlug(tenantData.businessName);
        const uniqueSlug = (() => {
            if (!appData.tenants.some((t) => t.slug === baseSlug)) return baseSlug;
            let counter = 2;
            while (appData.tenants.some((t) => t.slug === `${baseSlug}-${counter}`)) {
                counter += 1;
            }
            return `${baseSlug}-${counter}`;
        })();

        const subscription: TenantSubscription = {
            status: 'trial',
            plan: 'starter',
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };

        const ownerUserId = generateId();
        const newTenant: Tenant = {
            ...tenantData,
            id: generateId(),
            slug: uniqueSlug,
            createdAt: new Date(),
            ownerUserId,
            subscription,
            settings: {
                primaryColor: '#8B5CF6',
                slotDuration: 60,
                maxAdvanceBookingDays: 30,
                workingHoursStart: '09:00',
                workingHoursEnd: '17:00',
                workingDays: [1, 2, 3, 4, 5],
            },
        };

        setAppData((prev) => ({
            ...prev,
            tenants: [...prev.tenants, newTenant],
            users: [
                ...prev.users,
                {
                    id: ownerUserId,
                    tenantId: newTenant.id,
                    role: 'admin',
                    name: ownerName,
                    email: tenantData.email,
                    phone: tenantData.phone,
                    password: ownerPassword,
                    createdAt: newTenant.createdAt,
                },
            ],
        }));

        return newTenant;
    };

    const updateAppData = (updater: (data: AppData) => AppData) => {
        setAppData((prev) => updater(prev));
    };

    return (
        <TenantContext.Provider
            value={{
                currentTenant,
                allTenants: appData.tenants,
                setCurrentTenantBySlug,
                createTenant,
                appData,
                updateAppData,
            }}
        >
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
