import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTenant } from './TenantContext';
import { useUsers } from '../hooks/useUsers';
import type { Tenant, TenantSubscription, TenantUser, UserRole } from '../types';

interface AuthSession {
    userId: string;
    tenantId: string;
    role: UserRole;
    email: string;
}

interface AuthContextType {
    session: AuthSession | null;
    signInAdmin: (email: string, password: string) => { ok: boolean; error?: string; tenantSlug?: string };
    signInCustomer: (tenantSlug: string, email: string, password: string) => { ok: boolean; error?: string };
    signUpCustomer: (data: {
        tenantSlug: string;
        name: string;
        email: string;
        phone?: string;
        password: string;
    }) => { ok: boolean; error?: string };
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
    const { appData } = useTenant();
    const { createUser } = useUsers();
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

    const signInAdmin = (email: string, password: string) => {
        const users = appData.users || [];
        const user = users.find(
            (u: TenantUser) => u.role === 'admin' && u.email.toLowerCase() === email.toLowerCase()
        );

        if (!user || user.password !== password) {
            return { ok: false, error: 'Invalid admin credentials.' };
        }

        const tenant = appData.tenants.find((t) => t.id === user.tenantId);
        if (!tenant) {
            return { ok: false, error: 'Tenant not found.' };
        }

        if (!isTenantAccessAllowed(tenant)) {
            return { ok: false, error: 'Subscription inactive. Please contact support.' };
        }

        setSession({ userId: user.id, tenantId: tenant.id, role: 'admin', email: user.email });
        return { ok: true, tenantSlug: tenant.slug };
    };

    const signInCustomer = (tenantSlug: string, email: string, password: string) => {
        const tenant = appData.tenants.find((t) => t.slug === tenantSlug);
        if (!tenant) {
            return { ok: false, error: 'Tenant not found.' };
        }
        if (!isTenantAccessAllowed(tenant)) {
            return { ok: false, error: 'This tenant is not currently active.' };
        }

        const user = (appData.users || []).find(
            (u: TenantUser) =>
                u.tenantId === tenant.id &&
                u.role === 'customer' &&
                u.email.toLowerCase() === email.toLowerCase()
        );

        if (!user || user.password !== password) {
            return { ok: false, error: 'Invalid customer credentials.' };
        }

        setSession({ userId: user.id, tenantId: tenant.id, role: 'customer', email: user.email });
        return { ok: true };
    };

    const signUpCustomer = (data: {
        tenantSlug: string;
        name: string;
        email: string;
        phone?: string;
        password: string;
    }) => {
        const tenant = appData.tenants.find((t) => t.slug === data.tenantSlug);
        if (!tenant) {
            return { ok: false, error: 'Tenant not found.' };
        }
        if (!isTenantAccessAllowed(tenant)) {
            return { ok: false, error: 'This tenant is not currently active.' };
        }

        const newUser = createUser(
            {
                role: 'customer',
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: data.password,
            },
            tenant.id
        );

        if (!newUser) {
            return { ok: false, error: 'A customer with this email already exists.' };
        }

        setSession({ userId: newUser.id, tenantId: tenant.id, role: 'customer', email: newUser.email });
        return { ok: true };
    };

    const signOut = () => setSession(null);

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
