import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/posts — Public API lấy bài viết
// Query params: ?slug=xxx | ?limit=10 | ?page=1 | ?category=slug | ?tag=name | ?tenant=slug
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const tenantSlug = searchParams.get('tenant');

    try {
        // Resolve tenant
        let tenantId: string | null = null;
        if (tenantSlug) {
            const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).single();
            tenantId = tenant?.id || null;
        }

        // Single post by slug
        if (slug) {
            let query = supabase
                .from('posts')
                .select('id,title,slug,content,excerpt,featured_image,tags,meta_title,meta_description,published_at,created_at,category_id')
                .eq('slug', slug)
                .eq('is_published', true)
                .is('deleted_at', null);

            if (tenantId) query = query.eq('tenant_id', tenantId);

            const { data, error } = await query.single();
            if (error || !data) {
                return NextResponse.json({ error: 'Post not found' }, { status: 404 });
            }
            return NextResponse.json({ post: data });
        }

        // List posts
        let query = supabase
            .from('posts')
            .select('id,title,slug,excerpt,featured_image,tags,published_at,created_at,category_id', { count: 'exact' })
            .eq('is_published', true)
            .is('deleted_at', null)
            .order('published_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        // Filter by tenant
        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        }

        // Filter by category
        if (category) {
            const { data: cat } = await supabase.from('categories').select('id').eq('slug', category).single();
            if (cat) query = query.eq('category_id', cat.id);
        }

        // Filter by tag
        if (tag) {
            query = query.contains('tags', [tag]);
        }

        const { data, count, error } = await query;
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            posts: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            }
        });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
