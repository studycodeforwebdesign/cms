"use client";

import { useEffect, useState } from "react";
import { getScheduledContent, createScheduledContent, updateScheduledContent, deleteScheduledContent } from "@/lib/supabase";
import { ScheduledContent } from "@/lib/types";
import {
    Calendar, Plus, Trash2, Edit3, Check,
    Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";

const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const TYPES = [
    { value: 'article', label: 'Bài viết', color: 'bg-blue-100 text-blue-700' },
    { value: 'update', label: 'Cập nhật', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'review', label: 'Review', color: 'bg-purple-100 text-purple-700' },
];

export default function ContentCalendarPage() {
    const [items, setItems] = useState<ScheduledContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ title: "", type: "article" as string, scheduled_date: "", author: "", category: "", notes: "" });

    useEffect(() => { loadItems(); }, []);

    async function loadItems() {
        setLoading(true);
        const data = await getScheduledContent();
        setItems(data);
        setLoading(false);
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    const getItemsForDay = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return items.filter(item => item.scheduled_date?.startsWith(dateStr));
    };

    async function handleSave() {
        if (!form.title.trim() || !form.scheduled_date) return;
        setSaving(true);
        const data = { title: form.title, type: form.type as ScheduledContent['type'], scheduled_date: form.scheduled_date, author: form.author, category: form.category, notes: form.notes, status: 'scheduled' as const };
        if (editingId) await updateScheduledContent(editingId, data);
        else await createScheduledContent(data);
        setForm({ title: "", type: "article", scheduled_date: "", author: "", category: "", notes: "" });
        setEditingId(null); setShowForm(false); setSaving(false);
        loadItems();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    async function handleDelete(id: string) {
        if (!confirm('Xóa?')) return;
        await deleteScheduledContent(id); loadItems();
    }

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-gray-900">Lịch nội dung</h1><p className="text-gray-500 text-sm mt-0.5">{items.length} nội dung đã lên lịch</p></div>
                <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: "", type: "article", scheduled_date: new Date().toISOString().split('T')[0], author: "", category: "", notes: "" }); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800">
                    <Plus className="w-4 h-4" /> Thêm lịch
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up">
                    <h3 className="font-semibold text-gray-900 mb-4">{editingId ? "Sửa" : "Thêm lịch mới"}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Tiêu đề</label>
                            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Bài SEO 2026" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" /></div>
                        <div><label className="text-sm font-medium text-gray-700 mb-1 block">Loại</label>
                            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
                                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select></div>
                        <div><label className="text-sm font-medium text-gray-700 mb-1 block">Ngày</label>
                            <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" /></div>
                        <div><label className="text-sm font-medium text-gray-700 mb-1 block">Tác giả</label>
                            <input type="text" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" /></div>
                        <div><label className="text-sm font-medium text-gray-700 mb-1 block">Chuyên mục</label>
                            <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" /></div>
                        <div className="sm:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Ghi chú</label>
                            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none" /></div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {editingId ? "Cập nhật" : "Tạo"}</button>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><ChevronLeft size={18} /></button>
                    <h2 className="text-base font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
                    <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><ChevronRight size={18} /></button>
                </div>

                <div className="grid grid-cols-7 border-b border-gray-100">
                    {DAYS.map(d => <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase">{d}</div>)}
                </div>

                {loading ? (
                    <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></div>
                ) : (
                    <div className="grid grid-cols-7">
                        {calendarDays.map((day, idx) => {
                            const isToday = day && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                            const dayItems = day ? getItemsForDay(day) : [];
                            return (
                                <div key={idx} className={`min-h-[100px] border-b border-r border-gray-100 p-1.5 ${!day ? 'bg-gray-50/50' : 'hover:bg-gray-50/50'}`}>
                                    {day && (
                                        <>
                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isToday ? 'bg-gray-900 text-white' : 'text-gray-500'}`}>{day}</span>
                                            <div className="mt-1 space-y-0.5">
                                                {dayItems.map(item => {
                                                    const typeConfig = TYPES.find(t => t.value === item.type) || TYPES[0];
                                                    return (
                                                        <div key={item.id} className={`text-[10px] px-1.5 py-1 rounded ${typeConfig.color} truncate cursor-pointer group relative`}>
                                                            {item.title}
                                                            <div className="absolute left-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-30 w-48 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all pointer-events-none">
                                                                <p className="text-xs font-medium text-gray-900 mb-1">{item.title}</p>
                                                                {item.author && <p className="text-[10px] text-gray-500">Tác giả: {item.author}</p>}
                                                                {item.notes && <p className="text-[10px] text-gray-400 mt-1">{item.notes}</p>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
