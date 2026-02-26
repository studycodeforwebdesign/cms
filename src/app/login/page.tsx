"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, Eye, EyeOff, AlertCircle, Info, X } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [checking, setChecking] = useState(true);
    const [showHint, setShowHint] = useState(false);

    // Nút chạy trốn
    const btnRef = useRef<HTMLButtonElement>(null);
    const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 });
    const isFormValid = email.trim().length > 0 && password.trim().length > 0;

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isFormValid || !btnRef.current) return;

        const btn = btnRef.current.getBoundingClientRect();
        const btnCenterX = btn.left + btn.width / 2;
        const btnCenterY = btn.top + btn.height / 2;
        const dist = Math.sqrt((e.clientX - btnCenterX) ** 2 + (e.clientY - btnCenterY) ** 2);

        if (dist < 120) {
            // Run away from cursor
            const angle = Math.atan2(btnCenterY - e.clientY, btnCenterX - e.clientX);
            const force = Math.max(0, (120 - dist) / 120);
            const moveX = Math.cos(angle) * force * 160;
            const moveY = Math.sin(angle) * force * 100;

            // Clamp within bounds
            const maxX = 140;
            const maxY = 60;
            setBtnOffset({
                x: Math.max(-maxX, Math.min(maxX, moveX)),
                y: Math.max(-maxY, Math.min(maxY, moveY)),
            });
        }
    }, [isFormValid]);

    // Reset button position when form becomes valid
    useEffect(() => {
        if (isFormValid) setBtnOffset({ x: 0, y: 0 });
    }, [isFormValid]);

    // Check if already logged in
    useEffect(() => {
        const token = document.cookie.split(';').find(c => c.trim().startsWith('cms_auth='));
        if (token) {
            router.replace('/admin');
        } else {
            setChecking(false);
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        setError("");
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.success) {
                router.replace('/admin');
            } else {
                setError(data.message || "Sai email hoặc mật khẩu");
            }
        } catch {
            setError("Lỗi kết nối. Vui lòng thử lại.");
        }

        setLoading(false);
    };

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4"
            onMouseMove={handleMouseMove}
        >
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Lock size={20} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">
                        {process.env.NEXT_PUBLIC_SITE_NAME || "CMS Admin"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Đăng nhập để quản trị</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            <AlertCircle size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                            autoFocus
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 text-sm transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Nút chạy trốn */}
                    <div className="relative" style={{ height: '44px' }}>
                        <button
                            ref={btnRef}
                            type="submit"
                            disabled={loading}
                            style={{
                                transform: `translate(${btnOffset.x}px, ${btnOffset.y}px)`,
                                transition: isFormValid ? 'transform 0.3s ease' : 'transform 0.15s ease-out',
                            }}
                            className={`absolute inset-0 w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${isFormValid
                                    ? 'bg-gray-900 text-white hover:bg-gray-800 cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                } disabled:opacity-50`}
                        >
                            {loading && <Loader2 size={14} className="animate-spin" />}
                            {loading ? "Đang đăng nhập..." : isFormValid ? "Đăng nhập" : "Nhập đủ thông tin đã 😏"}
                        </button>
                    </div>

                    {!isFormValid && (
                        <p className="text-center text-xs text-gray-400 animate-pulse">
                            ☝️ Hãy nhập email và mật khẩu trước
                        </p>
                    )}
                </form>

                {/* Hint button */}
                <div className="text-center mt-4">
                    <button
                        onClick={() => setShowHint(!showHint)}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Info size={14} />
                        Thông tin đăng nhập test
                    </button>
                </div>

                {/* Hint popup */}
                {showHint && (
                    <div className="mt-3 bg-white rounded-xl border border-blue-200 shadow-lg p-4 relative animate-fade-in">
                        <button
                            onClick={() => setShowHint(false)}
                            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full text-gray-400"
                        >
                            <X size={14} />
                        </button>
                        <p className="text-xs font-semibold text-blue-800 mb-2.5 flex items-center gap-1.5">
                            <Info size={14} />
                            Demo Account
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-xs text-gray-500">Email</span>
                                <code className="text-xs font-mono text-gray-900 select-all">admin@10xsolution.com</code>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                <span className="text-xs text-gray-500">Password</span>
                                <code className="text-xs font-mono text-gray-900 select-all">10xAdmin@2026</code>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setEmail("admin@10xsolution.com");
                                setPassword("10xAdmin@2026");
                                setShowHint(false);
                            }}
                            className="w-full mt-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                        >
                            Tự động điền →
                        </button>
                    </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-6">
                    © 2026 {process.env.NEXT_PUBLIC_SITE_NAME || "CMS"}. All rights reserved.
                </p>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}
