import { useTenant } from '../context/TenantContext';
import type { TenantUser, UserRole } from '../types';
import { generateId } from '../data/mockData';

export function useUsers() {
    const { currentTenant, appData, updateAppData } = useTenant();

    const getUsersForTenant = (tenantId?: string): TenantUser[] => {
        const id = tenantId || currentTenant?.id;
        if (!id) return [];
        return (appData.users || []).filter((u) => u.tenantId === id);
    };

    const getUserById = (userId: string): TenantUser | undefined => {
        return (appData.users || []).find((u) => u.id === userId);
    };

    const findUserByEmail = (email: string, tenantId?: string, role?: UserRole): TenantUser | undefined => {
        const users = getUsersForTenant(tenantId).filter((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!role) return users[0];
        return users.find((u) => u.role === role);
    };

    const createUser = (
        data: Omit<TenantUser, 'id' | 'tenantId' | 'createdAt'>,
        tenantId?: string
    ): TenantUser | null => {
        const id = tenantId || currentTenant?.id;
        if (!id) return null;

        const existing = findUserByEmail(data.email, id, data.role);
        if (existing) return null;

        const newUser: TenantUser = {
            ...data,
            id: generateId(),
            tenantId: id,
            createdAt: new Date(),
        };

        updateAppData((prev) => ({
            ...prev,
            users: [...prev.users, newUser],
        }));

        return newUser;
    };

    return {
        getUsersForTenant,
        getUserById,
        findUserByEmail,
        createUser,
    };
}
