/**
 * List of reserved slugs that cannot be used as tenant slugs
 * to avoid conflicts with platform-level routes.
 */
export const RESERVED_SLUGS = [
    'admin',
    'login',
    'signup',
    'api',
    'settings',
    'dashboard',
    'profile',
    'about',
    'contact',
    'help',
    'support',
    'terms',
    'privacy',
    'auth',
    't', // Keep 't' reserved just in case we ever want to use it again
    'user',
    'checkout',
    'pricing',
];

export function isReservedSlug(slug: string): boolean {
    return RESERVED_SLUGS.includes(slug.toLowerCase());
}
