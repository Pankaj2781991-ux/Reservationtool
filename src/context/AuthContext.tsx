import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTenant } from './TenantContext';
import type { Tenant, TenantSubscription, TenantUser, UserRole } from '../types';
import { auth, db } from '../firebase/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthSession {
    userId: string;
    tenantId: string;
    role: UserRole;
    email: string;
}

interface AuthContextType {
    session: AuthSession | null;
    signInAdmin: (email: string, password: string) => Promise<{ ok: boolean; error?: string; tenantSlug?: string }>;
    signInCustomer: (tenantSlug: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    signUpCustomer: (data: {
        tenantSlug: string;
        name: string;
        email: string;
        phone?: string;
        password: string;
    }) => Promise<{ ok: boolean; error?: string }>;
    signOut: () => void;
    isTenantAccessAllowed: (tenant: Tenant) => boolean;
}

const SESSION_KEY = 'reservation_app_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isSubscriptionActive(subscription: TenantSubscription): boolean {
    if (subscription.status === 'canceled') return false;
    if (subscription.status === 'past_due') return false;
    if (subscription.status === 'active') return true;
    if (subscription.status === 'trial') {
        const end = new Date(subscription.currentPeriodEnd);
        return end.getTime() >= new Date().setHours(0, 0, 0, 0);
    }
    return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const { appData, demoTenants, updateAppData } = useTenant();
    const [session, setSession] = useState<AuthSession | null>(() => {
        const stored = localStorage.getItem(SESSION_KEY);
        return stored ? (JSON.parse(stored) as AuthSession) : null;
    });

    useEffect(() => {
        if (session) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } else {
            localStorage.removeItem(SESSION_KEY);
        }
    }, [session]);

    const isTenantAccessAllowed = (tenant: Tenant) => {
        return isSubscriptionActive(tenant.subscription);
    };

    const fetchTenantById = async (tenantId: string): Promise<Tenant | null> => {
        const localTenant = appData.tenants.find((t) => t.id === tenantId) || null;
        if (localTenant) return localTenant;

        const tenantSnap = await getDoc(doc(db, 'tenants', tenantId));
        if (!tenantSnap.exists()) return null;
        const data = tenantSnap.data() as Omit<Tenant, 'id' | 'createdAt'> & { createdAt?: string };
        const tenant: Tenant = {
            ...data,
            id: tenantSnap.id,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        };
        updateAppData((prev) => ({
            ...prev,
            tenants: [...prev.tenants, tenant],
        }));
        return tenant;
    };

    const fetchUserProfile = async (uid: string): Promise<TenantUser | null> => {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (!userSnap.exists()) return null;
        const data = userSnap.data() as Omit<TenantUser, 'id' | 'createdAt'> & { createdAt?: string };
        const user: TenantUser = {
            ...data,
            id: userSnap.id,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            password: '',
        };
        updateAppData((prev) => ({
            ...prev,
            users: prev.users.some((u) => u.id === user.id) ? prev.users : [...prev.users, user],
        }));
        return user;
    };

    const signInAdmin = async (email: string, password: string) => {
        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const user = await fetchUserProfile(credential.user.uid);
            if (!user || user.role !== 'admin') {
                return { ok: false, error: 'Admin account not found.' };
            }

            const tenant = await fetchTenantById(user.tenantId);
            if (!tenant) {
                return { ok: false, error: 'Tenant not found.' };
            }
            if (!isTenantAccessAllowed(tenant)) {
                return { ok: false, error: 'Subscription inactive. Please contact support.' };
            }

            setSession({ userId: user.id, tenantId: tenant.id, role: 'admin', email: user.email });
            return { ok: true, tenantSlug: tenant.slug };
        } catch (error) {
            console.error('Admin sign-in failed:', error);
            return { ok: false, error: 'Invalid admin credentials.' };
        }
    };

    const signInCustomer = async (tenantSlug: string, email: string, password: string) => {
        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const user = await fetchUserProfile(credential.user.uid);
            if (!user || user.role !== 'customer') {
                return { ok: false, error: 'Customer account not found.' };
            }

            const tenant = demoTenants.find((t) => t.slug === tenantSlug) ||
                appData.tenants.find((t) => t.slug === tenantSlug) ||
                await fetchTenantById(user.tenantId);
            if (!tenant || tenant.id !== user.tenantId) {
                return { ok: false, error: 'Tenant not found.' };
            }
            if (!isTenantAccessAllowed(tenant)) {
                return { ok: false, error: 'This tenant is not currently active.' };
            }

            setSession({ userId: user.id, tenantId: tenant.id, role: 'customer', email: user.email });
            return { ok: true };
        } catch (error) {
            console.error('Customer sign-in failed:', error);
            return { ok: false, error: 'Invalid customer credentials.' };
        }
    };

    const signUpCustomer = async (data: {
        tenantSlug: string;
        name: string;
        email: string;
        phone?: string;
        password: string;
    }) => {
        try {
            const tenant = demoTenants.find((t) => t.slug === data.tenantSlug) ||
                appData.tenants.find((t) => t.slug === data.tenantSlug);
            if (!tenant) {
                return { ok: false, error: 'Tenant not found.' };
            }
            if (!isTenantAccessAllowed(tenant)) {
                return { ok: false, error: 'This tenant is not currently active.' };
            }

            const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const uid = credential.user.uid;

            await setDoc(doc(db, 'users', uid), {
                tenantId: tenant.id,
                role: 'customer',
                name: data.name,
                email: data.email,
                phone: data.phone || '',
                createdAt: new Date().toISOString(),
            });

            const user: TenantUser = {
                id: uid,
                tenantId: tenant.id,
                role: 'customer',
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: '',
                createdAt: new Date(),
            };

            updateAppData((prev) => ({
                ...prev,
                users: prev.users.some((u) => u.id === user.id) ? prev.users : [...prev.users, user],
            }));

            setSession({ userId: user.id, tenantId: tenant.id, role: 'customer', email: user.email });
            return { ok: true };
        } catch (error) {
            console.error('Customer sign-up failed:', error);
            return { ok: false, error: 'Unable to create account.' };
        }
    };

    const signOut = () => {
        firebaseSignOut(auth).catch(() => undefined);
        setSession(null);
    };

    const value = useMemo(
        () => ({
            session,
            signInAdmin,
            signInCustomer,
            signUpCustomer,
            signOut,
            isTenantAccessAllowed,
        }),
        [session, appData]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
