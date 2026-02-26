import { supabase } from './supabase';

/**
 * Get tenant_id from auth cookie (client-side)
 */
export function getTenantIdFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('cms_auth='));
    if (!cookie) return null;
    try {
        const token = cookie.split('=')[1];
        const data = JSON.parse(atob(token));
        return data.tenantId || null;
    } catch { return null; }
}

/**
 * Get user role from auth cookie
 */
export function getUserRoleFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('cms_auth='));
    if (!cookie) return null;
    try {
        const token = cookie.split('=')[1];
        const data = JSON.parse(atob(token));
        return data.role || null;
    } catch { return null; }
}

/**
 * Create a tenant-scoped query builder
 * Super admin sees all, others see only their tenant
 */
export function tenantQuery(table: string) {
    const tenantId = getTenantIdFromCookie();
    const role = getUserRoleFromCookie();

    let query = supabase.from(table).select('*');

    // Super admin sees everything, others filtered by tenant
    if (role !== 'super_admin' && tenantId) {
        query = query.eq('tenant_id', tenantId);
    }

    return query;
}

/**
 * Add tenant_id to data before insert
 */
export function withTenantId<T extends Record<string, any>>(data: T): T & { tenant_id?: string } {
    const tenantId = getTenantIdFromCookie();
    if (tenantId) {
        return { ...data, tenant_id: tenantId };
    }
    return data;
}
