import { NextRequest, NextResponse } from "next/server";

// Simple admin credentials - set these in .env.local
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@10xsolution.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "10xAdmin@2026";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // Create a simple token
            const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

            const response = NextResponse.json({ success: true });

            // Set HTTP-only cookie
            response.cookies.set('cms_auth', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: '/',
            });

            return response;
        }

        return NextResponse.json(
            { success: false, message: "Sai email hoặc mật khẩu" },
            { status: 401 }
        );
    } catch {
        return NextResponse.json(
            { success: false, message: "Lỗi server" },
            { status: 500 }
        );
    }
}
