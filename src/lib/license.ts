/**
 * License system — giới hạn số tenant theo license key
 * 
 * Key format: CMS-{plan}-{maxSites}-{hash}
 * Example: CMS-PRO-5-a1b2c3
 * 
 * Plans:
 *   BASIC: 1 site
 *   PRO: 5 sites  
 *   BUSINESS: unlimited
 */

interface LicenseInfo {
    plan: 'basic' | 'pro' | 'business' | 'invalid';
    maxSites: number;
    isValid: boolean;
}

const SECRET = '10xCMS2026';

/**
 * Generate license key (chạy offline để tạo key cho khách)
 */
export function generateLicenseKey(plan: string, maxSites: number): string {
    const payload = `${plan}-${maxSites}`;
    // Simple hash
    let hash = 0;
    const str = payload + SECRET;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const hashStr = Math.abs(hash).toString(36).slice(0, 6);
    return `CMS-${plan.toUpperCase()}-${maxSites}-${hashStr}`;
}

/**
 * Validate & parse license key
 */
export function parseLicenseKey(key: string): LicenseInfo {
    if (!key || !key.startsWith('CMS-')) {
        // No key = free trial, 1 site
        return { plan: 'basic', maxSites: 1, isValid: true };
    }

    const parts = key.split('-');
    if (parts.length !== 4) return { plan: 'invalid', maxSites: 0, isValid: false };

    const [, plan, maxSitesStr] = parts;
    const maxSites = parseInt(maxSitesStr);

    // Verify hash
    const expectedKey = generateLicenseKey(plan, maxSites);
    if (expectedKey !== key) {
        return { plan: 'invalid', maxSites: 0, isValid: false };
    }

    return {
        plan: plan.toLowerCase() as LicenseInfo['plan'],
        maxSites: plan.toUpperCase() === 'BUSINESS' ? 999 : maxSites,
        isValid: true,
    };
}

/**
 * Get license from env
 */
export function getLicense(): LicenseInfo {
    const key = process.env.NEXT_PUBLIC_LICENSE_KEY || '';
    return parseLicenseKey(key);
}

/**
 * Check if can create new tenant
 */
export function canCreateTenant(currentCount: number): { allowed: boolean; license: LicenseInfo } {
    const license = getLicense();
    return {
        allowed: license.isValid && currentCount < license.maxSites,
        license,
    };
}
