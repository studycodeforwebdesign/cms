"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Post, Category } from "@/lib/types";
import {
    Plus, Search, Trash2, Edit3, FileText,
    Check, X, Clock, Calendar, Send, FileX, Loader2,
    ChevronLeft, ChevronRight,
} from "lucide-react";

export default function PostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "published" | "scheduled" | "draft">("all");
    const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 20;

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        const [postsRes, catsRes] = await Promise.all([
            supabase.from('posts').select('*').order('created_at', { ascending: false }),
            supabase.from('categories').select('*')
        ]);
        setPosts(postsRes.data || []);
        setCategories(catsRes.data || []);
        setLoading(false);
    }

    async function togglePublish(post: Post) {
        const now = new Date().toISOString();
        await supabase.from('posts').update({
            is_published: !post.is_published,
            published_at: !post.is_published ? now : null,
            updated_at: now
        }).eq('id', post.id);
        fetchData();
    }

    async function handleDelete(id: string) {
        if (!confirm('Xóa bài viết này?')) return;
        await supabase.from('posts').delete().eq('id', id);
        fetchData();
    }

    async function bulkPublish() {
        if (!confirm(`Xuất bản ${selectedPosts.length} bài viết?`)) return;
        setBulkLoading(true);
        const now = new Date().toISOString();
        for (const id of selectedPosts) {
            await supabase.from('posts').update({ is_published: true, published_at: now, updated_at: now }).eq('id', id);
        }
        setSelectedPosts([]);
        setBulkLoading(false);
        fetchData();
    }

    async function bulkDraft() {
        if (!confirm(`Chuyển ${selectedPosts.length} bài về nháp?`)) return;
        setBulkLoading(true);
        for (const id of selectedPosts) {
            await supabase.from('posts').update({ is_published: false, scheduled_at: null, updated_at: new Date().toISOString() }).eq('id', id);
        }
        setSelectedPosts([]);
        setBulkLoading(false);
        fetchData();
    }

    async function bulkDelete() {
        if (!confirm(`⚠️ Xóa vĩnh viễn ${selectedPosts.length} bài viết?`)) return;
        setBulkLoading(true);
        for (const id of selectedPosts) {
            await supabase.from('posts').delete().eq('id', id);
        }
        setSelectedPosts([]);
        setBulkLoading(false);
        fetchData();
    }

    const getPostStatus = (post: Post) => {
        if (post.is_published) return 'published';
        if (post.scheduled_at && new Date(post.scheduled_at) > new Date()) return 'scheduled';
        return 'draft';
    };

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase());
        const status = getPostStatus(post);
        const matchesFilter = filterStatus === "all" || filterStatus === status;
        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const paginatedPosts = filteredPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus]);

    const getCategoryName = (categoryId: string | null) => {
        if (!categoryId) return 'Không có';
        const cat = categories.find(c => c.id === categoryId);
        return cat?.name || 'Không có';
    };

    const toggleSelectPost = (id: string) => {
        setSelectedPosts(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedPosts.length === filteredPosts.length) {
            setSelectedPosts([]);
        } else {
            setSelectedPosts(filteredPosts.map(p => p.id));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bài viết</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{posts.length} bài viết</p>
                </div>
                <Link
                    href="/admin/posts/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-all hover:shadow-lg hover:shadow-gray-900/20 w-fit"
                >
                    <Plus className="w-4 h-4" />
                    Bài viết mới
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm bài viết..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:bg-white transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        {[
                            { key: "all", label: "Tất cả" },
                            { key: "published", label: "Đã xuất bản" },
                            { key: "scheduled", label: "Lên lịch" },
                            { key: "draft", label: "Nháp" }
                        ].map(filter => (
                            <button
                                key={filter.key}
                                onClick={() => setFilterStatus(filter.key as typeof filterStatus)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${filterStatus === filter.key
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Posts Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
                                <div className="w-5 h-5 bg-gray-100 rounded animate-pulse" />
                                <div className="w-14 h-14 bg-gray-100 rounded-lg animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                                    <div className="h-3 bg-gray-100 rounded w-1/4 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-900 font-medium mb-1">Không có bài viết nào</p>
                        <p className="text-gray-500 text-sm mb-6">Bắt đầu tạo bài viết đầu tiên</p>
                        <Link href="/admin/posts/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors">
                            <Plus className="w-4 h-4" />
                            Tạo bài viết
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="col-span-1 flex items-center">
                                <button onClick={toggleSelectAll} className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center hover:border-gray-400 transition-colors">
                                    {selectedPosts.length === filteredPosts.length && filteredPosts.length > 0 && (
                                        <Check className="w-3 h-3 text-gray-600" />
                                    )}
                                </button>
                            </div>
                            <div className="col-span-5 sm:col-span-4">Tiêu đề</div>
                            <div className="col-span-2 hidden sm:block">Chuyên mục</div>
                            <div className="col-span-2">Trạng thái</div>
                            <div className="col-span-2 hidden sm:block">Ngày</div>
                            <div className="col-span-1"></div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-100">
                            {paginatedPosts.map((post) => (
                                <div
                                    key={post.id}
                                    className={`grid grid-cols-12 gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors ${selectedPosts.includes(post.id) ? 'bg-blue-50/50' : ''}`}
                                >
                                    <div className="col-span-1">
                                        <button
                                            onClick={() => toggleSelectPost(post.id)}
                                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedPosts.includes(post.id) ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-400'}`}
                                        >
                                            {selectedPosts.includes(post.id) && <Check className="w-3 h-3 text-white" />}
                                        </button>
                                    </div>

                                    <div className="col-span-5 sm:col-span-4 flex items-center gap-3 min-w-0">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                            {post.featured_image ? (
                                                <img src={post.featured_image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <Link href={`/admin/posts/${post.id}`} className="text-gray-900 font-medium text-sm truncate block hover:text-emerald-600 transition-colors">
                                                {post.title}
                                            </Link>
                                            <p className="text-gray-400 text-xs truncate mt-0.5">/{post.slug}</p>
                                        </div>
                                    </div>

                                    <div className="col-span-2 hidden sm:block">
                                        <span className="text-sm text-gray-600">{getCategoryName(post.category_id)}</span>
                                    </div>

                                    <div className="col-span-2">
                                        {(() => {
                                            const status = getPostStatus(post);
                                            const config = status === 'published'
                                                ? { bg: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', dot: 'bg-emerald-500', label: 'Xuất bản' }
                                                : status === 'scheduled'
                                                    ? { bg: 'bg-blue-50 text-blue-700 hover:bg-blue-100', dot: 'bg-blue-500', label: 'Lên lịch' }
                                                    : { bg: 'bg-amber-50 text-amber-700 hover:bg-amber-100', dot: 'bg-amber-500', label: 'Nháp' };
                                            return (
                                                <button
                                                    onClick={() => togglePublish(post)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${config.bg}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                                                    {config.label}
                                                </button>
                                            );
                                        })()}
                                    </div>

                                    <div className="col-span-2 hidden sm:flex flex-col justify-center text-sm">
                                        {(() => {
                                            const status = getPostStatus(post);
                                            if (status === 'scheduled' && post.scheduled_at) {
                                                const d = new Date(post.scheduled_at);
                                                return (
                                                    <>
                                                        <span className="text-blue-600 font-medium flex items-center gap-1">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                                        </span>
                                                        <span className="text-gray-400 text-xs mt-0.5">
                                                            {d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </>
                                                );
                                            }
                                            return (
                                                <span className="text-gray-500 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                                </span>
                                            );
                                        })()}
                                    </div>

                                    <div className="col-span-1 flex items-center justify-end gap-1">
                                        <Link href={`/admin/posts/${post.id}`} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                            <Edit3 className="w-4 h-4" />
                                        </Link>
                                        <button onClick={() => handleDelete(post.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-t border-gray-100">
                                <p className="text-xs text-gray-500">
                                    Hiển thị {(currentPage - 1) * postsPerPage + 1}–{Math.min(currentPage * postsPerPage, filteredPosts.length)} / {filteredPosts.length} bài
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                        .map((page, idx, arr) => (
                                            <span key={page}>
                                                {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-gray-300 px-1">…</span>}
                                                <button
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === currentPage ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            </span>
                                        ))}
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Bulk Actions */}
            {selectedPosts.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-50 border border-gray-700">
                    {bulkLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    <span className="text-sm font-medium">{selectedPosts.length} bài đã chọn</span>
                    <div className="w-px h-5 bg-gray-700" />
                    <button onClick={bulkPublish} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                        <Send className="w-3.5 h-3.5" /> Xuất bản
                    </button>
                    <button onClick={bulkDraft} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50">
                        <FileX className="w-3.5 h-3.5" /> Về nháp
                    </button>
                    <button onClick={bulkDelete} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50">
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                    <div className="w-px h-5 bg-gray-700" />
                    <button onClick={() => setSelectedPosts([])} className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
