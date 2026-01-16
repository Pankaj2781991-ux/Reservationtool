import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Tenant, TenantSubscription, TenantUser } from '../types';
import { loadData, saveData, generateSlug } from '../data/mockData';
import type { AppData } from '../data/mockData';
import { db, auth } from '../firebase/firebase';
import {
    collection,
    getDocs,
    doc,
    setDoc,
    addDoc,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

interface TenantContextType {
    currentTenant: Tenant | null;
    allTenants: Tenant[];
    setCurrentTenantBySlug: (slug: string) => void;
    createTenant: (data: Omit<Tenant, 'id' | 'slug' | 'createdAt' | 'settings' | 'subscription' | 'ownerUserId'> & {
        ownerName: string;
        ownerPassword: string;
    }) => Promise<Tenant>;
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

    useEffect(() => {
        const loadRemoteData = async () => {
            try {
                const tenantsSnapshot = await getDocs(collection(db, 'tenants'));
                const usersSnapshot = await getDocs(collection(db, 'users'));

                const tenants = tenantsSnapshot.docs.map((docSnap) => {
                    const data = docSnap.data() as Omit<Tenant, 'id' | 'createdAt'> & { createdAt?: string };
                    return {
                        ...data,
                        id: docSnap.id,
                        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                        isDemo: data.isDemo ?? false,
                    } as Tenant;
                });

                const users = usersSnapshot.docs.map((docSnap) => {
                    const data = docSnap.data() as Omit<TenantUser, 'id' | 'createdAt'> & { createdAt?: string };
                    return {
                        ...data,
                        id: docSnap.id,
                        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
                        password: '',
                    } as TenantUser;
                });

                if (tenants.length > 0) {
                    setAppData((prev) => ({
                        ...prev,
                        tenants,
                        users: users.length > 0 ? users : prev.users,
                    }));
                }
            } catch (error) {
                console.error('Failed to load Firestore data:', error);
            }
        };

        loadRemoteData();
    }, []);

    const setCurrentTenantBySlug = (slug: string) => {
        const tenant = appData.tenants.find((t) => t.slug === slug) || null;
        setCurrentTenant(tenant);
    };

    const createTenant = async (data: Omit<Tenant, 'id' | 'slug' | 'createdAt' | 'settings' | 'subscription' | 'ownerUserId'> & {
        ownerName: string;
        ownerPassword: string;
    }): Promise<Tenant> => {
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

        const ownerCredential = await createUserWithEmailAndPassword(auth, tenantData.email, ownerPassword);
        const ownerUserId = ownerCredential.user.uid;

        const tenantPayload = {
            ...tenantData,
            slug: uniqueSlug,
            createdAt: new Date().toISOString(),
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

        const tenantDoc = await addDoc(collection(db, 'tenants'), tenantPayload);

        await setDoc(doc(db, 'users', ownerUserId), {
            tenantId: tenantDoc.id,
            role: 'admin',
            name: ownerName,
            email: tenantData.email,
            phone: tenantData.phone,
            createdAt: new Date().toISOString(),
        });

        const newTenant: Tenant = {
            ...tenantData,
            id: tenantDoc.id,
            slug: uniqueSlug,
            createdAt: new Date(),
            ownerUserId,
            subscription,
            settings: tenantPayload.settings,
        };

        setAppData((prev) => ({
            ...prev,
            tenants: [...prev.tenants, newTenant],
            users: [
                ...prev.users,
                {
                    id: ownerUserId,
                    tenantId: tenantDoc.id,
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
