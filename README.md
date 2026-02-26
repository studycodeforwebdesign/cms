# 10x Solution CMS

Hệ thống quản lý nội dung chuyên nghiệp, được xây dựng trên Next.js 14 + Supabase.

## 🚀 Cài đặt nhanh (5 phút)

### Bước 1: Clone & cài dependencies

```bash
git clone https://github.com/studycodeforwebdesign/cms.git
cd cms
npm install
```

### Bước 2: Tạo Supabase Project

1. Vào [supabase.com](https://supabase.com) → Tạo project mới (hoặc dùng project có sẵn)
2. Vào **SQL Editor** → Paste toàn bộ nội dung file `supabase-schema.sql` → Bấm **Run**
3. Vào **Settings → API** → Copy:
   - `Project URL` (dạng `https://xxxxx.supabase.co`)
   - `anon public` key (dạng `sb_publishable_xxxxx`)
   - `service_role` key (dạng `sb_secret_xxxxx`)

### Bước 3: Cấu hình môi trường

Tạo file `.env.local` ở thư mục gốc:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YOUR_KEY
SUPABASE_SERVICE_ROLE_KEY=sb_secret_YOUR_KEY

# Site Configuration
NEXT_PUBLIC_SITE_NAME=10x Solution CMS
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cron Secret (for auto-publish)
CRON_SECRET=cms-cron-secret-2026
```

### Bước 4: Chạy

```bash
npm run dev
```

Mở **http://localhost:3000/admin** → Xong! 🎉

---

## 📋 Tính năng

| Module | Mô tả |
|--------|--------|
| **Tổng quan** | Dashboard thống kê, bài viết gần đây, biểu đồ |
| **Bài viết** | Tạo/sửa/xóa bài, rich text editor (Tiptap), SEO fields |
| **Chuyên mục** | CRUD chuyên mục |
| **Tags** | CRUD tags |
| **Thư viện ảnh** | Upload, quản lý ảnh (Supabase Storage) |
| **SEO Audit** | Phân tích SEO on-page cho tất cả bài viết |
| **Broken Links** | Scan link trỏ đi/trỏ về, kiểm tra trạng thái |
| **Sitemap** | Tự động tạo sitemap.xml, download, copy |
| **Tích hợp** | Cấu hình Google Analytics 4 & Search Console |
| **Lịch nội dung** | Lên lịch xuất bản bài viết |
| **Hệ thống** | Health check, backup/restore dữ liệu |
| **Cài đặt** | Cấu hình chung |

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Editor**: Tiptap (ProseMirror)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📁 Cấu trúc dự án

```
src/
├── app/
│   ├── admin/                  # Tất cả trang admin
│   │   ├── page.tsx            # Dashboard
│   │   ├── posts/              # Quản lý bài viết
│   │   ├── categories/         # Chuyên mục
│   │   ├── tags/               # Tags
│   │   ├── media/              # Thư viện ảnh
│   │   ├── seo-audit/          # SEO Audit
│   │   ├── broken-links/       # Kiểm tra link hỏng
│   │   ├── sitemap/            # Quản lý sitemap
│   │   ├── integrations/       # GA4 & Search Console
│   │   ├── content-calendar/   # Lịch nội dung
│   │   ├── system/             # Trạng thái hệ thống
│   │   └── settings/           # Cài đặt
│   └── api/
│       ├── check-link/         # API check link status
│       └── cron/publish/       # Auto-publish API
├── components/admin/
│   ├── Sidebar.tsx             # Sidebar navigation
│   ├── RichTextEditor.tsx      # Tiptap editor
│   └── MediaLibrary.tsx        # Media picker
└── lib/
    ├── supabase.ts             # Supabase client & CRUD
    └── types.ts                # TypeScript interfaces
```

## 🔐 Backup & Restore

- Vào **Hệ thống** → **Sao lưu & Khôi phục**
- **Export**: Tải toàn bộ dữ liệu thành file JSON
- **Import**: Upload file JSON để khôi phục dữ liệu

## 📞 Hỗ trợ

Telegram: [@cmssupport10xsolution](https://t.me/cmssupport10xsolution)

---

© 2026 10x Solution. All rights reserved.
