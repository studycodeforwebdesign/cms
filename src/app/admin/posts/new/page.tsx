"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";
import MediaLibrary from "@/components/admin/MediaLibrary";
import { uploadImage, createPost, getCategories, getTags, createTag } from "@/lib/supabase";
import {
    ChevronLeft, Loader2, Trash2, Image as ImageIcon,
    Type, Hash, Clock, AlertCircle, ChevronUp, ChevronDown,
    X, Plus,
} from "lucide-react";

// ==================== HELPERS ====================
function countWords(html: string): number {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(w => w.length > 0).length;
}

function countChars(html: string): number {
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim().length;
}

function readingTime(wordCount: number): number {
    return Math.max(1, Math.ceil(wordCount / 200));
}

// ==================== COLLAPSIBLE CARD ====================
function CollapsibleCard({ title, children, defaultOpen = true }: {
    title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-semibold text-gray-900">{title}</span>
                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {isOpen && <div className="px-5 pb-4 border-t border-gray-100">{children}</div>}
        </div>
    );
}

// ==================== TAG PICKER ====================
function TagPicker({ selectedTags, allTags, onChange, onCreateTag }: {
    selectedTags: string[]; allTags: string[]; onChange: (tags: string[]) => void; onCreateTag: (name: string) => Promise<void>;
}) {
    const [inputValue, setInputValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [creating, setCreating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const suggestions = useMemo(() => {
        if (!inputValue.trim()) return [];
        const term = inputValue.toLowerCase();
        return allTags.filter(t => t.toLowerCase().includes(term) && !selectedTags.includes(t)).slice(0, 10);
    }, [inputValue, allTags, selectedTags]);

    const exactMatch = allTags.some(t => t.toLowerCase() === inputValue.trim().toLowerCase());
    const alreadySelected = selectedTags.some(t => t.toLowerCase() === inputValue.trim().toLowerCase());

    const addTag = (tagName: string) => {
        if (!selectedTags.includes(tagName)) onChange([...selectedTags, tagName]);
        setInputValue("");
        inputRef.current?.focus();
    };

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const value = inputValue.trim().replace(/,$/, "");
            if (!value || alreadySelected) { setInputValue(""); return; }
            if (exactMatch) {
                const match = allTags.find(t => t.toLowerCase() === value.toLowerCase());
                if (match) addTag(match);
            } else {
                setCreating(true); await onCreateTag(value); addTag(value); setCreating(false);
            }
        } else if (e.key === "Backspace" && !inputValue && selectedTags.length > 0) {
            onChange(selectedTags.slice(0, -1));
        }
    };

    return (
        <div className="space-y-2">
            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200">
                            {tag}
                            <button onClick={() => onChange(selectedTags.filter(t => t !== tag))} className="text-blue-400 hover:text-blue-600 ml-0.5"><X size={12} /></button>
                        </span>
                    ))}
                </div>
            )}
            <div className="relative">
                <input ref={inputRef} type="text" value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => { if (inputValue.trim()) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedTags.length > 0 ? "Thêm tag..." : "Nhập tag và Enter..."}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm transition-all"
                    disabled={creating}
                />
                {creating && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 size={14} className="animate-spin text-gray-400" /></div>}
                {showSuggestions && inputValue.trim() && (suggestions.length > 0 || (!exactMatch && !alreadySelected)) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                        {suggestions.map(tag => (
                            <button key={tag} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => addTag(tag)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Hash size={12} className="text-gray-400" /> {tag}
                            </button>
                        ))}
                        {!exactMatch && !alreadySelected && (
                            <button type="button" onMouseDown={(e) => e.preventDefault()}
                                onClick={async () => { setCreating(true); await onCreateTag(inputValue.trim()); addTag(inputValue.trim()); setCreating(false); }}
                                className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 border-t border-gray-100 font-medium">
                                <Plus size={12} /> Tạo tag mới &quot;{inputValue.trim()}&quot;
                            </button>
                        )}
                    </div>
                )}
            </div>
            <p className="text-xs text-gray-400">Nhập và Enter để thêm • Chọn từ gợi ý hoặc tạo mới</p>
        </div>
    );
}

// ==================== MAIN EDITOR ====================
interface PostForm {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImage: string;
    featuredImageAlt: string;
    category: string;
    tags: string[];
    metaTitle: string;
    metaDescription: string;
    isPublished: boolean;
    scheduledAt: string;
}

export default function NewPostPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [showMediaLibrary, setShowMediaLibrary] = useState(false);
    const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const featuredImageInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState<PostForm>({
        title: "", slug: "", excerpt: "", content: "",
        featuredImage: "", featuredImageAlt: "", category: "",
        tags: [], metaTitle: "", metaDescription: "",
        isPublished: false, scheduledAt: "",
    });

    useEffect(() => {
        async function load() {
            const cats = await getCategories();
            setCategories(cats.map(c => ({ slug: c.slug, name: c.name })));
            if (cats.length > 0) updateForm({ category: cats[0].slug });
            const tagsData = await getTags();
            setAllTags(tagsData.map(t => t.name));
        }
        load();
    }, []);

    const updateForm = (updates: Partial<PostForm>) => {
        setForm(prev => ({ ...prev, ...updates }));
        setUnsavedChanges(true);
    };

    // Auto-save to localStorage every 30s
    useEffect(() => {
        if (!unsavedChanges) return;
        const timer = setTimeout(() => {
            localStorage.setItem('cms_draft_new', JSON.stringify(form));
        }, 30000);
        return () => clearTimeout(timer);
    }, [form, unsavedChanges]);

    // Restore draft on mount
    useEffect(() => {
        const saved = localStorage.getItem('cms_draft_new');
        if (saved) {
            try {
                const draft = JSON.parse(saved);
                if (draft.title && confirm('Có bản nháp chưa lưu. Khôi phục?')) {
                    setForm(prev => ({ ...prev, ...draft }));
                } else {
                    localStorage.removeItem('cms_draft_new');
                }
            } catch { localStorage.removeItem('cms_draft_new'); }
        }
    }, []);

    // Warn before leaving
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (unsavedChanges) { e.preventDefault(); }
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [unsavedChanges]);

    // Ctrl+S / Cmd+S to save
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });

    const generateSlug = (title: string) => {
        return title.toLowerCase().normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").trim();
    };

    const handleSave = async () => {
        if (!form.title.trim()) { alert("Vui lòng nhập tiêu đề!"); return; }
        setSaving(true);

        const slug = form.slug || generateSlug(form.title);
        const postData = {
            title: form.title, slug,
            excerpt: form.excerpt, content: form.content,
            featured_image: form.featuredImage || null,
            featured_image_alt: form.featuredImageAlt || null,
            category_id: form.category || null, tags: form.tags,
            author: null,
            meta_title: form.metaTitle || `${form.title}`,
            meta_description: form.metaDescription || null,
            is_published: form.isPublished,
            published_at: form.isPublished ? new Date().toISOString() : null,
            scheduled_at: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
        };

        try {
            const result = await createPost(postData);
            if (result) {
                setUnsavedChanges(false);
                localStorage.removeItem('cms_draft_new');
                router.push('/admin/posts');
            } else {
                alert("Có lỗi xảy ra!");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Có lỗi xảy ra!");
        }
        setSaving(false);
    };

    const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert("Ảnh tối đa 5MB!"); return; }
        setUploading(true);
        const url = await uploadImage(file, 'post-images');
        if (url) updateForm({ featuredImage: url });
        setUploading(false);
    };

    const handleBack = () => {
        if (unsavedChanges && !confirm("Bạn có thay đổi chưa lưu. Thoát?")) return;
        router.push('/admin/posts');
    };

    type PostStatus = 'published' | 'scheduled' | 'draft';
    const getCurrentStatus = (): PostStatus => {
        if (form.isPublished) return 'published';
        if (form.scheduledAt) return 'scheduled';
        return 'draft';
    };

    const setStatus = (status: PostStatus) => {
        if (status === 'published') updateForm({ isPublished: true, scheduledAt: "" });
        else if (status === 'scheduled') {
            const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(9, 0, 0, 0);
            updateForm({ isPublished: false, scheduledAt: tomorrow.toISOString().slice(0, 16) });
        } else updateForm({ isPublished: false, scheduledAt: "" });
    };

    const wordCount = countWords(form.content);
    const charCount = countChars(form.content);
    const readTime = readingTime(wordCount);
    const metaTitleLen = (form.metaTitle || form.title).length;
    const metaDescLen = (form.metaDescription || form.excerpt).length;
    const currentSlug = form.slug || generateSlug(form.title) || "url-bai-viet";

    return (
        <div className="min-h-screen bg-gray-50/80 -m-6 lg:-m-8">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <button onClick={handleBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <ChevronLeft size={20} className="text-gray-500" />
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">Bài viết mới</span>
                        {unsavedChanges && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Chưa lưu</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleBack} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
                    <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2">
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

                    {/* Left Column */}
                    <div className="space-y-5">
                        {/* Title + Content */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-5">
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Tiêu đề</label>
                                <input type="text" value={form.title} onChange={(e) => updateForm({ title: e.target.value })}
                                    placeholder="VD: Hướng dẫn SEO cho người mới bắt đầu"
                                    className="w-full px-0 py-2 text-lg font-medium border-0 border-b border-gray-200 focus:outline-none focus:border-gray-900 placeholder-gray-300 transition-colors bg-transparent"
                                />
                            </div>
                            <div className="border-t border-gray-100">
                                <div className="px-5 pt-4 pb-1">
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">Nội dung</label>
                                </div>
                                <RichTextEditor content={form.content} onChange={(content) => updateForm({ content })} placeholder="Viết nội dung bài viết..." />
                                <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Type size={12} /> {wordCount.toLocaleString()} từ</span>
                                    <span className="flex items-center gap-1"><Hash size={12} /> {charCount.toLocaleString()} ký tự</span>
                                    <span className="flex items-center gap-1"><Clock size={12} /> ~{readTime} phút đọc</span>
                                </div>
                            </div>
                        </div>

                        {/* Excerpt */}
                        <CollapsibleCard title="Tóm tắt" defaultOpen={false}>
                            <div className="pt-3">
                                <p className="text-xs text-gray-500 mb-2">Thêm tóm tắt để hiển thị ở danh sách bài viết.</p>
                                <textarea rows={3} value={form.excerpt} onChange={(e) => updateForm({ excerpt: e.target.value })}
                                    placeholder="Viết tóm tắt ngắn gọn..."
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 resize-none text-sm transition-all"
                                />
                            </div>
                        </CollapsibleCard>

                        {/* SEO */}
                        <CollapsibleCard title="Tối ưu công cụ tìm kiếm (SEO)" defaultOpen={true}>
                            <div className="pt-3 space-y-4">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Xem trước trên Google</p>
                                    <div className="space-y-1">
                                        <p className="text-[13px] text-green-700 truncate">yoursite.com › blog › {currentSlug}</p>
                                        <p className="text-lg text-[#1a0dab] hover:underline cursor-pointer leading-tight line-clamp-1">
                                            {form.metaTitle || form.title || "Tiêu đề trang"}
                                        </p>
                                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                            {form.metaDescription || form.excerpt || "Thêm mô tả meta để kiểm soát cách bài viết hiển thị trên Google..."}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-medium text-gray-700">Tiêu đề trang (Meta title)</label>
                                        <span className={`text-xs font-medium ${metaTitleLen > 60 ? 'text-red-500' : metaTitleLen > 50 ? 'text-amber-500' : 'text-gray-400'}`}>{metaTitleLen}/60</span>
                                    </div>
                                    <input type="text" value={form.metaTitle} onChange={(e) => updateForm({ metaTitle: e.target.value })}
                                        placeholder={form.title || "Tiêu đề SEO"}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm transition-all"
                                    />
                                    {metaTitleLen > 60 && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> Nên giữ dưới 60 ký tự</p>}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-medium text-gray-700">Mô tả (Meta description)</label>
                                        <span className={`text-xs font-medium ${metaDescLen > 160 ? 'text-red-500' : metaDescLen > 140 ? 'text-amber-500' : 'text-gray-400'}`}>{metaDescLen}/160</span>
                                    </div>
                                    <textarea rows={3} value={form.metaDescription} onChange={(e) => updateForm({ metaDescription: e.target.value })}
                                        placeholder={form.excerpt || "Mô tả SEO"}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm resize-none transition-all"
                                    />
                                    {metaDescLen > 160 && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> Nên giữ dưới 160 ký tự</p>}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">URL handle</label>
                                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                        <span className="text-xs text-gray-400 px-3 bg-gray-100 py-2.5 border-r border-gray-200 shrink-0">/blog/</span>
                                        <input type="text" value={form.slug} onChange={(e) => updateForm({ slug: e.target.value })}
                                            placeholder={currentSlug} className="flex-1 px-3 py-2.5 bg-transparent focus:outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CollapsibleCard>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-5">
                        {/* Status */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-100">
                                <span className="text-sm font-semibold text-gray-900">Trạng thái</span>
                            </div>
                            <div className="p-5 space-y-3">
                                <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors has-[:checked]:border-green-300 has-[:checked]:bg-green-50/50">
                                    <input type="radio" name="status" checked={getCurrentStatus() === 'published'} onChange={() => setStatus('published')} className="w-4 h-4 accent-green-600" />
                                    <div><span className="text-sm font-medium text-gray-900 block">Công khai</span><span className="text-xs text-gray-500">Hiển thị trên website</span></div>
                                </label>
                                <label className="flex items-start gap-3 p-3 rounded-lg cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors has-[:checked]:border-blue-300 has-[:checked]:bg-blue-50/50">
                                    <input type="radio" name="status" checked={getCurrentStatus() === 'scheduled'} onChange={() => setStatus('scheduled')} className="w-4 h-4 mt-0.5 accent-blue-600" />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-900 block">Lên lịch</span>
                                        <span className="text-xs text-gray-500">Tự động đăng vào ngày chọn</span>
                                        {getCurrentStatus() === 'scheduled' && (
                                            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => updateForm({ scheduledAt: e.target.value })}
                                                min={new Date().toISOString().slice(0, 16)}
                                                className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                            />
                                        )}
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors has-[:checked]:border-gray-400 has-[:checked]:bg-gray-50">
                                    <input type="radio" name="status" checked={getCurrentStatus() === 'draft'} onChange={() => setStatus('draft')} className="w-4 h-4 accent-gray-600" />
                                    <div><span className="text-sm font-medium text-gray-900 block">Bản nháp</span><span className="text-xs text-gray-500">Chỉ bạn mới xem được</span></div>
                                </label>
                            </div>
                        </div>

                        {/* Organization */}
                        <CollapsibleCard title="Tổ chức" defaultOpen={true}>
                            <div className="pt-3 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Danh mục</label>
                                    <select value={form.category} onChange={(e) => updateForm({ category: e.target.value })}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm transition-all bg-white">
                                        {categories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Tags</label>
                                    <TagPicker selectedTags={form.tags} allTags={allTags} onChange={(tags) => updateForm({ tags })}
                                        onCreateTag={async (name) => {
                                            const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                                            const result = await createTag({ name, slug, description: null });
                                            if (result) setAllTags(prev => [...prev, name].sort());
                                        }}
                                    />
                                </div>
                            </div>
                        </CollapsibleCard>

                        {/* Featured Image */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-100">
                                <span className="text-sm font-semibold text-gray-900">Ảnh đại diện</span>
                            </div>
                            <div className="p-5">
                                <input type="file" ref={featuredImageInputRef} accept="image/*" onChange={handleFeaturedImageUpload} className="hidden" />
                                {form.featuredImage ? (
                                    <div className="space-y-3">
                                        <div className="relative group rounded-lg overflow-hidden">
                                            <img src={form.featuredImage} alt="" className="w-full h-40 object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button onClick={() => setShowMediaLibrary(true)} className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 text-xs font-medium">Thay đổi</button>
                                                <button onClick={() => updateForm({ featuredImage: "", featuredImageAlt: "" })} className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Alt text (SEO)</label>
                                            <input type="text" value={form.featuredImageAlt} onChange={(e) => updateForm({ featuredImageAlt: e.target.value })}
                                                placeholder="Mô tả ảnh cho SEO..."
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <button onClick={() => setShowMediaLibrary(true)}
                                            className="w-full py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all flex flex-col items-center gap-2">
                                            <ImageIcon size={28} />
                                            <span className="text-sm font-medium">Chọn từ thư viện</span>
                                            <span className="text-xs text-gray-400">hoặc upload ảnh mới</span>
                                        </button>
                                        <button onClick={() => featuredImageInputRef.current?.click()} disabled={uploading}
                                            className="w-full py-2 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                                            {uploading ? <Loader2 size={12} className="animate-spin" /> : null}
                                            {uploading ? 'Đang tải...' : 'Upload từ máy tính'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Library Modal */}
            <MediaLibrary isOpen={showMediaLibrary} onClose={() => setShowMediaLibrary(false)}
                onSelect={(url) => updateForm({ featuredImage: url })}
            />
        </div>
    );
}
