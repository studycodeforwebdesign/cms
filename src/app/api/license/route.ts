import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getLicense, canCreateTenant } from "@/lib/license";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
    const license = getLicense();
    const { count } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true });

    const currentCount = count || 0;
    const { allowed } = canCreateTenant(currentCount);

    return NextResponse.json({
        license: {
            plan: license.plan,
            maxSites: license.maxSites,
            isValid: license.isValid,
        },
        usage: {
            currentSites: currentCount,
            canCreateMore: allowed,
            remaining: Math.max(0, license.maxSites - currentCount),
        }
    });
}
