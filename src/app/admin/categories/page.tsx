"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { tenantQuery, withTenantId } from "@/lib/tenant-filter";
import { Category } from "@/lib/types";
import { Plus, Edit3, Trash2, FolderOpen, Loader2, X, Check } from "lucide-react";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", slug: "", description: "" });
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => { fetchCategories(); }, []);

    async function fetchCategories() {
        setLoading(true);
        const { data } = await tenantQuery('categories').order('name');
        setCategories(data || []);
        setLoading(false);
    }

    const generateSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").trim();

    async function handleSave() {
        if (!form.name.trim()) return;
        setSaving(true);
        const slug = form.slug || generateSlug(form.name);
        if (editingId) {
            await supabase.from('categories').update({ name: form.name, slug, description: form.description || null }).eq('id', editingId);
        } else {
            await supabase.from('categories').insert([withTenantId({ name: form.name, slug, description: form.description || null })]);
        }
        setForm({ name: "", slug: "", description: "" });
        setEditingId(null);
        setShowForm(false);
        setSaving(false);
        fetchCategories();
    }

    async function handleDelete(id: string) {
        if (!confirm('Xóa chuyên mục này?')) return;
        await supabase.from('categories').delete().eq('id', id);
        fetchCategories();
    }

    function startEdit(cat: Category) {
        setForm({ name: cat.name, slug: cat.slug, description: cat.description || "" });
        setEditingId(cat.id);
        setShowForm(true);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Chuyên mục</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{categories.length} chuyên mục</p>
                </div>
                <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", slug: "", description: "" }); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-all">
                    <Plus className="w-4 h-4" /> Thêm chuyên mục
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up">
                    <h3 className="font-semibold text-gray-900 mb-4">{editingId ? "Sửa chuyên mục" : "Thêm chuyên mục mới"}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Tên</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="VD: Tin tức" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Slug</label>
                            <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                placeholder={generateSlug(form.name) || "tu-dong-tao"} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Mô tả</label>
                        <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Mô tả ngắn..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none" />
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {editingId ? "Cập nhật" : "Tạo mới"}
                        </button>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}</div>
                ) : categories.length === 0 ? (
                    <div className="p-16 text-center">
                        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Chưa có chuyên mục nào</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">/{cat.slug}</p>
                                    {cat.description && <p className="text-xs text-gray-500 mt-1">{cat.description}</p>}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => startEdit(cat)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit3 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
