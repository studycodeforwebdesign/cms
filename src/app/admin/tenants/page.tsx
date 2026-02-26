"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
    Plus, Trash2, Edit3, Check, X, Users, Globe, Shield,
    Building2, Loader2, Key, AlertTriangle,
} from "lucide-react";

interface Tenant {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    plan: string;
    is_active: boolean;
    created_at: string;
    _userCount?: number;
}

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    tenant_id: string | null;
    is_active: boolean;
    last_login: string | null;
    created_at: string;
}

export default function TenantsPage() {
    const { isSuperAdmin } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'tenants' | 'users'>('tenants');
    const [showForm, setShowForm] = useState<'tenant' | 'user' | null>(null);
    const [form, setForm] = useState<any>({});
    const [saving, setSaving] = useState(false);
    const [license, setLicense] = useState<{ plan: string; maxSites: number; isValid: boolean } | null>(null);
    const [canCreate, setCanCreate] = useState(true);

    useEffect(() => { fetchData(); }, []);

    async function fetchData() {
        setLoading(true);
        const [{ data: t }, { data: u }] = await Promise.all([
            supabase.from('tenants').select('*').order('created_at'),
            supabase.from('users').select('*').order('created_at'),
        ]);
        setTenants(t || []);
        setUsers(u || []);
        setLoading(false);
        // Check license
        try {
            const res = await fetch('/api/license');
            const lic = await res.json();
            setLicense(lic.license);
            setCanCreate(lic.usage.canCreateMore);
        } catch { }
    }

    async function saveTenant() {
        setSaving(true);
        if (form.id) {
            await supabase.from('tenants').update({
                name: form.name, slug: form.slug, domain: form.domain, plan: form.plan, is_active: form.is_active,
            }).eq('id', form.id);
        } else {
            await supabase.from('tenants').insert({
                name: form.name, slug: form.slug, domain: form.domain || null, plan: form.plan || 'free',
            });
        }
        setShowForm(null);
        setForm({});
        setSaving(false);
        fetchData();
    }

    async function saveUser() {
        setSaving(true);
        if (form.id) {
            await supabase.from('users').update({
                name: form.name, email: form.email, role: form.role,
                tenant_id: form.tenant_id || null, is_active: form.is_active,
            }).eq('id', form.id);
        } else {
            // Hash password via SQL
            const { data } = await supabase.rpc('create_user', {
                p_email: form.email,
                p_password: form.password || 'ChangeMeNow!',
                p_name: form.name,
                p_role: form.role || 'editor',
                p_tenant_id: form.tenant_id || null,
            });

            if (!data) {
                // Fallback: insert without hashing (will need manual password set)
                await supabase.from('users').insert({
                    email: form.email, name: form.name, role: form.role || 'editor',
                    tenant_id: form.tenant_id || null,
                    password_hash: 'NEEDS_RESET',
                });
            }
        }
        setShowForm(null);
        setForm({});
        setSaving(false);
        fetchData();
    }

    async function deleteTenant(id: string) {
        if (!confirm('Xóa tenant này? Tất cả data sẽ mất!')) return;
        await supabase.from('tenants').delete().eq('id', id);
        fetchData();
    }

    async function deleteUser(id: string) {
        if (!confirm('Xóa user này?')) return;
        await supabase.from('users').delete().eq('id', id);
        fetchData();
    }

    if (!isSuperAdmin) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Chỉ Super Admin mới truy cập được</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Multi-tenant</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{tenants.length} tenant · {users.length} users</p>
                </div>
                <button
                    onClick={() => {
                        if (tab === 'tenants' && !canCreate) {
                            alert('Đã đạt giới hạn số site. Liên hệ mua license cao hơn.');
                            return;
                        }
                        setForm({});
                        setShowForm(tab === 'tenants' ? 'tenant' : 'user');
                    }}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${tab === 'tenants' && !canCreate ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                >
                    <Plus className="w-4 h-4" />
                    {tab === 'tenants' ? 'Thêm Tenant' : 'Thêm User'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button onClick={() => setTab('tenants')} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'tenants' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                    <Building2 className="w-4 h-4 inline mr-1.5" />Tenants
                </button>
                <button onClick={() => setTab('users')} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'users' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                    <Users className="w-4 h-4 inline mr-1.5" />Users
                </button>
            </div>

            {/* License Info */}
            {license && (
                <div className={`rounded-xl p-4 flex items-center gap-4 ${license.plan === 'basic' ? 'bg-gray-50 border border-gray-200' : license.plan === 'pro' ? 'bg-emerald-50 border border-emerald-200' : 'bg-purple-50 border border-purple-200'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${license.plan === 'basic' ? 'bg-gray-200' : license.plan === 'pro' ? 'bg-emerald-200' : 'bg-purple-200'}`}>
                        <Key className={`w-5 h-5 ${license.plan === 'basic' ? 'text-gray-600' : license.plan === 'pro' ? 'text-emerald-600' : 'text-purple-600'}`} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">License: <span className="uppercase">{license.plan}</span></p>
                        <p className="text-xs text-gray-500">{tenants.length} / {license.maxSites >= 999 ? '∞' : license.maxSites} sites</p>
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${tenants.length >= license.maxSites && license.maxSites < 999 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (tenants.length / Math.max(license.maxSites, 1)) * 100)}%` }} />
                    </div>
                    {!canCreate && tab === 'tenants' && (
                        <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" /> Đạt giới hạn
                        </div>
                    )}
                </div>
            )}
            {/* Form Modal */}
            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900">
                        {showForm === 'tenant' ? (form.id ? 'Sửa Tenant' : 'Thêm Tenant') : (form.id ? 'Sửa User' : 'Thêm User')}
                    </h3>

                    {showForm === 'tenant' ? (
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Tên tenant" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" />
                            <input placeholder="Slug (vd: my-company)" value={form.slug || ''} onChange={e => setForm({ ...form, slug: e.target.value })}
                                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" />
                            <input placeholder="Domain (optional)" value={form.domain || ''} onChange={e => setForm({ ...form, domain: e.target.value })}
                                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" />
                            <select value={form.plan || 'free'} onChange={e => setForm({ ...form, plan: e.target.value })}
                                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400">
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="business">Business</option>
                            </select>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Họ tên" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" />
                            <input placeholder="Email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" />
                            {!form.id && (
                                <input placeholder="Mật khẩu" type="password" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })}
                                    className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400" />
                            )}
                            <select value={form.role || 'editor'} onChange={e => setForm({ ...form, role: e.target.value })}
                                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400">
                                <option value="super_admin">Super Admin</option>
                                <option value="admin">Admin</option>
                                <option value="editor">Editor</option>
                            </select>
                            <select value={form.tenant_id || ''} onChange={e => setForm({ ...form, tenant_id: e.target.value })}
                                className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400">
                                <option value="">-- Chọn Tenant --</option>
                                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button onClick={showForm === 'tenant' ? saveTenant : saveUser} disabled={saving}
                            className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Lưu
                        </button>
                        <button onClick={() => { setShowForm(null); setForm({}); }}
                            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                            Hủy
                        </button>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : tab === 'tenants' ? (
                    <div className="divide-y divide-gray-100">
                        {tenants.map(t => (
                            <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{t.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                        <span>/{t.slug}</span>
                                        {t.domain && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{t.domain}</span>}
                                        <span>{users.filter(u => u.tenant_id === t.id).length} users</span>
                                    </div>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${t.plan === 'pro' ? 'bg-emerald-50 text-emerald-600' : t.plan === 'business' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {t.plan}
                                </span>
                                <span className={`w-2 h-2 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                <div className="flex gap-1">
                                    <button onClick={() => { setForm(t); setShowForm('tenant'); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => deleteTenant(t.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {users.map(u => (
                            <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                    {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">{u.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.role === 'super_admin' ? 'bg-amber-50 text-amber-600' : u.role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                    {u.role === 'super_admin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : 'Editor'}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {tenants.find(t => t.id === u.tenant_id)?.name || '—'}
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => { setForm(u); setShowForm('user'); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => deleteUser(u.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
