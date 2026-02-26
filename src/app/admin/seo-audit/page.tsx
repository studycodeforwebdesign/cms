"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Post } from "@/lib/types";
import { Search, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface SeoScore { title: string; slug: string; score: number; issues: string[]; passes: string[]; id: string; }

function analyzePost(post: Post): SeoScore {
    const issues: string[] = [];
    const passes: string[] = [];
    let score = 100;

    // Title check
    if (!post.title || post.title.length < 10) { issues.push("Tiêu đề quá ngắn (< 10 ký tự)"); score -= 15; }
    else if (post.title.length > 70) { issues.push("Tiêu đề quá dài (> 70 ký tự)"); score -= 10; }
    else passes.push(`Tiêu đề tốt (${post.title.length} ký tự)`);

    // Meta title
    const metaTitle = post.meta_title || post.title;
    if (!metaTitle || metaTitle.length < 15) { issues.push("Meta title quá ngắn"); score -= 10; }
    else if (metaTitle.length > 60) { issues.push("Meta title quá dài (> 60 ký tự)"); score -= 5; }
    else passes.push(`Meta title tốt (${metaTitle.length}/60)`);

    // Meta description
    if (!post.meta_description) { issues.push("Thiếu meta description"); score -= 15; }
    else if (post.meta_description.length < 50) { issues.push("Meta description quá ngắn (< 50 ký tự)"); score -= 10; }
    else if (post.meta_description.length > 160) { issues.push("Meta description quá dài (> 160 ký tự)"); score -= 5; }
    else passes.push(`Meta description tốt (${post.meta_description.length}/160)`);

    // Featured image
    if (!post.featured_image) { issues.push("Thiếu ảnh đại diện"); score -= 10; }
    else passes.push("Có ảnh đại diện");

    // Featured image alt
    if (post.featured_image && !post.featured_image_alt) { issues.push("Ảnh đại diện thiếu alt text"); score -= 5; }
    else if (post.featured_image_alt) passes.push("Ảnh có alt text");

    // Excerpt
    if (!post.excerpt) { issues.push("Thiếu đoạn tóm tắt"); score -= 5; }
    else passes.push("Có đoạn tóm tắt");

    // Content length
    const contentText = (post.content || "").replace(/<[^>]*>/g, "").trim();
    const wordCount = contentText.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 100) { issues.push(`Nội dung quá ngắn (${wordCount} từ, cần > 300)`); score -= 20; }
    else if (wordCount < 300) { issues.push(`Nội dung ngắn (${wordCount} từ, nên > 600)`); score -= 10; }
    else if (wordCount > 600) passes.push(`Nội dung dài tốt (${wordCount} từ)`);
    else passes.push(`Nội dung chuẩn (${wordCount} từ)`);

    // Headings check
    const hasH2 = /<h2/i.test(post.content || "");
    if (!hasH2 && wordCount > 300) { issues.push("Thiếu heading H2 cho nội dung dài"); score -= 5; }
    else if (hasH2) passes.push("Có heading H2");

    // Internal links
    const hasLinks = /<a /i.test(post.content || "");
    if (!hasLinks && wordCount > 300) { issues.push("Chưa có liên kết nội bộ"); score -= 5; }
    else if (hasLinks) passes.push("Có liên kết trong nội dung");

    // Slug
    if (post.slug && post.slug.length > 75) { issues.push("URL slug quá dài"); score -= 5; }
    else passes.push("URL slug tốt");

    return { title: post.title, slug: post.slug, score: Math.max(0, score), issues, passes, id: post.id };
}

export default function SeoAuditPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterScore, setFilterScore] = useState<"all" | "good" | "warning" | "bad">("all");

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
            setPosts(data || []);
            setLoading(false);
        }
        fetch();
    }, []);

    const scores = posts.map(analyzePost);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, p) => s + p.score, 0) / scores.length) : 0;

    const filtered = scores.filter(s => {
        const matchSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFilter = filterScore === "all" || (filterScore === "good" && s.score >= 80) || (filterScore === "warning" && s.score >= 50 && s.score < 80) || (filterScore === "bad" && s.score < 50);
        return matchSearch && matchFilter;
    });

    const getScoreColor = (score: number) => score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-500" : "text-red-500";
    const getScoreBg = (score: number) => score >= 80 ? "bg-emerald-50 border-emerald-200" : score >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
    const getScoreRing = (score: number) => score >= 80 ? "ring-emerald-500" : score >= 50 ? "ring-amber-500" : "ring-red-500";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">SEO Audit</h1>
                <p className="text-gray-500 text-sm mt-0.5">Kiểm tra On-Page SEO cho {posts.length} bài viết</p>
            </div>

            {!loading && scores.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
                        <p className={`text-4xl font-bold ${getScoreColor(avgScore)}`}>{avgScore}</p>
                        <p className="text-sm text-gray-500 mt-1">Điểm trung bình</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 text-center">
                        <p className="text-4xl font-bold text-emerald-600">{scores.filter(s => s.score >= 80).length}</p>
                        <p className="text-sm text-emerald-700 mt-1">Tốt (≥80)</p>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 text-center">
                        <p className="text-4xl font-bold text-amber-500">{scores.filter(s => s.score >= 50 && s.score < 80).length}</p>
                        <p className="text-sm text-amber-700 mt-1">Cần cải thiện</p>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-5 border border-red-200 text-center">
                        <p className="text-4xl font-bold text-red-500">{scores.filter(s => s.score < 50).length}</p>
                        <p className="text-sm text-red-700 mt-1">Yếu (&lt;50)</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Tìm bài viết..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-gray-300 focus:bg-white" />
                    </div>
                    <div className="flex gap-2">
                        {[{ key: "all", label: "Tất cả" }, { key: "good", label: "Tốt" }, { key: "warning", label: "Cần cải thiện" }, { key: "bad", label: "Yếu" }].map(f => (
                            <button key={f.key} onClick={() => setFilterScore(f.key as typeof filterScore)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${filterScore === f.key ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{f.label}</button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(s => (
                        <div key={s.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${getScoreBg(s.score)}`}>
                            <div className="flex items-start gap-4 p-5">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold ring-2 ring-offset-2 bg-white ${getScoreColor(s.score)} ${getScoreRing(s.score)}`}>
                                    {s.score}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{s.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">/{s.slug}</p>
                                    {s.issues.length > 0 && (
                                        <div className="mt-3 space-y-1">
                                            {s.issues.map((issue, i) => (
                                                <p key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                                                    <XCircle size={12} className="mt-0.5 shrink-0" /> {issue}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                    {s.passes.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            {s.passes.slice(0, 3).map((pass, i) => (
                                                <p key={i} className="text-xs text-emerald-600 flex items-start gap-1.5">
                                                    <CheckCircle2 size={12} className="mt-0.5 shrink-0" /> {pass}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <a href={`/admin/posts/${s.id}`} className="p-2 rounded-lg hover:bg-white/50 text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                                    <ExternalLink size={16} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
