"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    LayoutDashboard,
    FileText,
    FolderOpen,
    Tags,
    Image as ImageIcon,
    Search,
    Calendar,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    MapPin,
    Activity,
    Link2,
    BarChart3,
} from "lucide-react";

const menuItems = [
    { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
    { label: "Bài viết", href: "/admin/posts", icon: FileText },
    { label: "Chuyên mục", href: "/admin/categories", icon: FolderOpen },
    { label: "Tags", href: "/admin/tags", icon: Tags },
    { label: "Thư viện ảnh", href: "/admin/media", icon: ImageIcon },
    { label: "SEO Audit", href: "/admin/seo-audit", icon: Search },
    { label: "Broken Links", href: "/admin/broken-links", icon: Link2 },
    { label: "Sitemap", href: "/admin/sitemap", icon: MapPin },
    { label: "Tích hợp", href: "/admin/integrations", icon: BarChart3 },
    { label: "Lịch nội dung", href: "/admin/content-calendar", icon: Calendar },
    { label: "Hệ thống", href: "/admin/system", icon: Activity },
    { label: "Cài đặt", href: "/admin/settings", icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-30 ${collapsed ? "w-[72px]" : "w-[260px]"
                }`}
        >
            {/* Logo / Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100 flex-shrink-0">
                {!collapsed && (
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
                            <span className="text-white font-black text-xs">10x</span>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 leading-tight">10x Solution</h1>
                            <p className="text-[10px] text-gray-400 leading-tight">Content Management</p>
                        </div>
                    </div>
                )}
                {collapsed && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                        <span className="text-white font-black text-[9px]">10x</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {menuItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${active
                                ? "bg-gray-900 text-white shadow-sm"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                            title={collapsed ? item.label : undefined}
                        >
                            <item.icon
                                className={`w-[18px] h-[18px] flex-shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                                    }`}
                            />
                            {!collapsed && <span>{item.label}</span>}
                            {collapsed && (
                                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-100 p-3 space-y-1 flex-shrink-0">
                <button
                    onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/login';
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full group relative"
                >
                    <LogOut className="w-[18px] h-[18px]" />
                    {!collapsed && <span>Đăng xuất</span>}
                    {collapsed && (
                        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-lg">
                            Đăng xuất
                        </div>
                    )}
                </button>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors w-full"
                >
                    {collapsed ? (
                        <ChevronRight className="w-[18px] h-[18px] mx-auto" />
                    ) : (
                        <>
                            <ChevronLeft className="w-[18px] h-[18px]" />
                            <span>Thu gọn</span>
                        </>
                    )}
                </button>
                {!collapsed && (
                    <div className="px-3 pt-2 pb-1">
                        <p className="text-[10px] text-gray-300 text-center">© {new Date().getFullYear()} 10x Solution</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
