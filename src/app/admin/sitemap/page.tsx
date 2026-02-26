"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Post, Category } from "@/lib/types";
import {
    MapPin, Download, Copy, Check, RefreshCw,
    Globe, FileText, FolderOpen, Loader2,
    CheckCircle2, AlertTriangle,
} from "lucide-react";

interface SitemapEntry {
    url: string;
    lastmod: string;
    changefreq: string;
    priority: number;
    type: 'page' | 'post' | 'category';
    title: string;
}

export default function SitemapPage() {
    const [entries, setEntries] = useState<SitemapEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [siteUrl, setSiteUrl] = useState(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com");
    const [generating, setGenerating] = useState(false);
    const [lastGenerated, setLastGenerated] = useState<string | null>(null);

    useEffect(() => { generateSitemap(); }, []);

    async function generateSitemap() {
        setLoading(true);
        const sitemapEntries: SitemapEntry[] = [];

        // Homepage
        sitemapEntries.push({
            url: '/', lastmod: new Date().toISOString().split('T')[0],
            changefreq: 'daily', priority: 1.0, type: 'page', title: 'Trang chủ',
        });

        // Static pages
        const staticPages = [
            { url: '/gioi-thieu', title: 'Giới thiệu', priority: 0.8 },
            { url: '/lien-he', title: 'Liên hệ', priority: 0.7 },
            { url: '/blog', title: 'Blog', priority: 0.9 },
        ];
        staticPages.forEach(p => {
            sitemapEntries.push({
                url: p.url, lastmod: new Date().toISOString().split('T')[0],
                changefreq: 'monthly', priority: p.priority, type: 'page', title: p.title,
            });
        });

        // Categories
        const { data: categories } = await supabase.from('categories').select('*').order('name');
        (categories || []).forEach((cat: Category) => {
            sitemapEntries.push({
                url: `/category/${cat.slug}`, lastmod: cat.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                changefreq: 'weekly', priority: 0.7, type: 'category', title: cat.name,
            });
        });

        // Published posts
        const { data: posts } = await supabase.from('posts').select('*').eq('is_published', true).order('published_at', { ascending: false });
        (posts || []).forEach((post: Post) => {
            sitemapEntries.push({
                url: `/blog/${post.slug}`, lastmod: (post.updated_at || post.published_at || post.created_at)?.split('T')[0],
                changefreq: 'monthly', priority: 0.6, type: 'post', title: post.title,
            });
        });

        setEntries(sitemapEntries);
        setLastGenerated(new Date().toLocaleString('vi-VN'));
        setLoading(false);
    }

    function generateXml(): string {
        const urls = entries.map(e => `  <url>
    <loc>${siteUrl}${e.url}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
    }

    function handleCopy() {
        navigator.clipboard.writeText(generateXml());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleDownload() {
        const blob = new Blob([generateXml()], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'sitemap.xml';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function handleRegenerate() {
        setGenerating(true);
        await generateSitemap();
        setGenerating(false);
    }

    const postCount = entries.filter(e => e.type === 'post').length;
    const categoryCount = entries.filter(e => e.type === 'category').length;
    const pageCount = entries.filter(e => e.type === 'page').length;

    const getTypeIcon = (type: string) => {
        if (type === 'post') return <FileText size={14} className="text-blue-500" />;
        if (type === 'category') return <FolderOpen size={14} className="text-purple-500" />;
        return <Globe size={14} className="text-emerald-500" />;
    };

    const getTypeLabel = (type: string) => {
        if (type === 'post') return 'Bài viết';
        if (type === 'category') return 'Chuyên mục';
        return 'Trang';
    };

    const getTypeBadge = (type: string) => {
        if (type === 'post') return 'bg-blue-50 text-blue-700 border-blue-200';
        if (type === 'category') return 'bg-purple-50 text-purple-700 border-purple-200';
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sitemap</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Quản lý sitemap.xml cho SEO — {entries.length} URLs
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleRegenerate} disabled={generating}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 disabled:opacity-50 transition-all">
                        <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                        Tạo lại
                    </button>
                    <button onClick={handleCopy}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all">
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        {copied ? 'Đã copy!' : 'Copy XML'}
                    </button>
                    <button onClick={handleDownload}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-all">
                        <Download size={14} />
                        Tải sitemap.xml
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-gray-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{entries.length}</p>
                    <p className="text-sm text-gray-500">Tổng URLs</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{postCount}</p>
                    <p className="text-sm text-gray-500">Bài viết</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-purple-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{categoryCount}</p>
                    <p className="text-sm text-gray-500">Chuyên mục</p>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{pageCount}</p>
                    <p className="text-sm text-gray-500">Trang tĩnh</p>
                </div>
            </div>

            {/* Site URL Config */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 shrink-0">Domain URL:</label>
                    <input type="url" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                    />
                    <span className="text-xs text-gray-400 shrink-0">URL gốc dùng để tạo sitemap</span>
                </div>
            </div>

            {/* URL List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Danh sách URLs</h2>
                    {lastGenerated && (
                        <span className="text-xs text-gray-400 flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            Cập nhật: {lastGenerated}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-500 mt-2">Đang tạo sitemap...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {entries.map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                    {getTypeIcon(entry.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{entry.title}</p>
                                    <p className="text-xs text-gray-400 truncate mt-0.5">{siteUrl}{entry.url}</p>
                                </div>
                                <span className={`text-[10px] font-medium px-2 py-1 rounded-full border shrink-0 ${getTypeBadge(entry.type)}`}>
                                    {getTypeLabel(entry.type)}
                                </span>
                                <span className="text-xs text-gray-400 shrink-0 hidden sm:block w-16 text-right">
                                    {entry.priority.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-400 shrink-0 hidden md:block w-20">
                                    {entry.lastmod}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* XML Preview */}
            {!loading && entries.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Xem trước XML</h2>
                        <button onClick={handleCopy} className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1.5 transition-colors">
                            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            {copied ? 'Đã copy!' : 'Copy'}
                        </button>
                    </div>
                    <div className="p-5">
                        <pre className="bg-gray-900 text-gray-300 p-4 rounded-xl overflow-x-auto text-xs leading-relaxed max-h-[400px] overflow-y-auto">
                            <code>{generateXml()}</code>
                        </pre>
                    </div>
                </div>
            )}

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">Hướng dẫn sử dụng Sitemap</h3>
                    <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Tải file <strong>sitemap.xml</strong> và đặt vào thư mục gốc (root) của website</li>
                        <li>• Submit sitemap tại <a href="https://search.google.com/search-console" target="_blank" rel="noopener" className="underline font-medium">Google Search Console</a> → Sitemaps → Nhập URL sitemap</li>
                        <li>• Thêm dòng <code className="bg-blue-100 px-1 py-0.5 rounded">Sitemap: {siteUrl}/sitemap.xml</code> vào file <strong>robots.txt</strong></li>
                        <li>• Nên tạo lại sitemap sau mỗi lần xuất bản/xóa bài viết</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
