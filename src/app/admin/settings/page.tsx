"use client";

import { useState } from "react";
import { Globe, Database, Save, Loader2, Check, Info } from "lucide-react";

export default function SettingsPage() {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        siteName: process.env.NEXT_PUBLIC_SITE_NAME || "CMS Admin",
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "",
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        storageBucket: "post-images",
        postsPerPage: "10",
        autoPublish: true,
    });

    const handleSave = async () => {
        setSaving(true);
        // In a real app this would save to Supabase site_settings table
        await new Promise(r => setTimeout(r, 800));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div><h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1><p className="text-gray-500 text-sm mt-0.5">Cấu hình chung của CMS</p></div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <h2 className="font-semibold text-gray-900">Thông tin website</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Tên website</label>
                        <input type="text" value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">URL website</label>
                        <input type="url" value={settings.siteUrl} onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                            placeholder="https://example.com" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Số bài / trang</label>
                        <input type="number" value={settings.postsPerPage} onChange={(e) => setSettings({ ...settings, postsPerPage: e.target.value })}
                            className="w-full max-w-[120px] px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings.autoPublish} onChange={(e) => setSettings({ ...settings, autoPublish: e.target.checked })} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                        </label>
                        <div>
                            <span className="text-sm font-medium text-gray-900">Tự động xuất bản</span>
                            <p className="text-xs text-gray-500">Tự động xuất bản bài viết đã lên lịch khi đến giờ</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <Database className="w-5 h-5 text-gray-400" />
                    <h2 className="font-semibold text-gray-900">Kết nối Supabase</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">Thông tin kết nối Supabase được cấu hình qua file <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">.env.local</code>. Thay đổi biến môi trường và restart để áp dụng.</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Supabase URL</label>
                        <input type="text" value={settings.supabaseUrl} disabled className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Storage Bucket</label>
                        <input type="text" value={settings.storageBucket} onChange={(e) => setSettings({ ...settings, storageBucket: e.target.value })}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 disabled:opacity-50 transition-all">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
                    {saving ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu cài đặt'}
                </button>
            </div>
        </div>
    );
}
