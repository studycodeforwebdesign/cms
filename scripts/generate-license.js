#!/usr/bin/env node
/**
 * Generate license keys for 10x CMS
 * Usage: node scripts/generate-license.js PRO 5
 */

const SECRET = '10xCMS2026';

function generateKey(plan, maxSites) {
    const payload = `${plan}-${maxSites}`;
    let hash = 0;
    const str = payload + SECRET;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const hashStr = Math.abs(hash).toString(36).slice(0, 6);
    return `CMS-${plan.toUpperCase()}-${maxSites}-${hashStr}`;
}

const plan = process.argv[2] || 'BASIC';
const maxSites = parseInt(process.argv[3]) || 1;

console.log('\n🔑 10x CMS License Generator\n');
console.log('Plan:', plan.toUpperCase());
console.log('Max Sites:', maxSites);
console.log('Key:', generateKey(plan, maxSites));
console.log('\nAdd to .env.local:');
console.log(`NEXT_PUBLIC_LICENSE_KEY=${generateKey(plan, maxSites)}`);
console.log('');

// Generate all plans
console.log('--- All plans ---');
console.log('BASIC (1 site):', generateKey('BASIC', 1));
console.log('PRO (5 sites):', generateKey('PRO', 5));
console.log('PRO (10 sites):', generateKey('PRO', 10));
console.log('BUSINESS (∞):', generateKey('BUSINESS', 999));
