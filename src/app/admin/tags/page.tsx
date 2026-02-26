"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { tenantQuery, withTenantId } from "@/lib/tenant-filter";
import { Tag } from "@/lib/types";
import { Plus, Trash2, Tags as TagsIcon, Loader2, Check, Edit3, Hash } from "lucide-react";

export default function TagsPage() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", slug: "", description: "" });
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => { fetchTags(); }, []);

    async function fetchTags() {
        setLoading(true);
        const { data } = await tenantQuery('tags').order('name');
        setTags(data || []);
        setLoading(false);
    }

    const genSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").trim();

    async function handleSave() {
        if (!form.name.trim()) return;
        setSaving(true);
        const slug = form.slug || genSlug(form.name);
        if (editingId) {
            await supabase.from('tags').update({ name: form.name, slug, description: form.description || null }).eq('id', editingId);
        } else {
            await supabase.from('tags').insert([withTenantId({ name: form.name, slug, description: form.description || null })]);
        }
        setForm({ name: "", slug: "", description: "" });
        setEditingId(null); setShowForm(false); setSaving(false);
        fetchTags();
    }

    async function handleDelete(id: string) {
        if (!confirm('Xóa tag này?')) return;
        await supabase.from('tags').delete().eq('id', id);
        fetchTags();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-gray-900">Tags</h1><p className="text-gray-500 text-sm mt-0.5">{tags.length} tags</p></div>
                <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", slug: "", description: "" }); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800"><Plus className="w-4 h-4" /> Thêm tag</button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up">
                    <h3 className="font-semibold text-gray-900 mb-4">{editingId ? "Sửa tag" : "Thêm tag mới"}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-gray-700 mb-1 block">Tên</label>
                            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: SEO" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" /></div>
                        <div><label className="text-sm font-medium text-gray-700 mb-1 block">Slug</label>
                            <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder={genSlug(form.name) || "tu-dong"} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" /></div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {editingId ? "Cập nhật" : "Tạo mới"}</button>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {loading ? (
                    <div className="p-8 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}</div>
                ) : tags.length === 0 ? (
                    <div className="p-16 text-center"><TagsIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Chưa có tag nào</p></div>
                ) : (
                    <div className="p-5 flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <div key={tag.id} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl group hover:border-gray-300 transition-colors">
                                <Hash size={14} className="text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">{tag.name}</span>
                                <button onClick={() => { setEditingId(tag.id); setForm({ name: tag.name, slug: tag.slug, description: tag.description || "" }); setShowForm(true); }}
                                    className="p-0.5 rounded text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={12} /></button>
                                <button onClick={() => handleDelete(tag.id)} className="p-0.5 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
