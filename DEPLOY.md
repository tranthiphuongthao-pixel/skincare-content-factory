# Deploy lên Railway

## Tổng quan

Dự án gồm **3 services** trên Railway:

| Service      | Thư mục      | Port  |
|--------------|--------------|-------|
| PostgreSQL   | (Railway plugin) | 5432 |
| Backend      | `./backend`  | auto  |
| Frontend     | `./frontend` | auto  |

---

## Bước 1 — Push code lên GitHub

Bạn có thể dùng script hỗ trợ:

```bash
./setup-github.sh https://github.com/<user>/<repo>.git
```

Hoặc thực hiện thủ công:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

> **Quan trọng:** Đảm bảo `.env` không bị commit.
> Thêm vào `.gitignore`:
> ```
> backend/.env
> .env
> ```

---

## Bước 2 — Tạo project trên Railway

1. Vào [railway.app](https://railway.app) → **New Project**
2. Chọn **Deploy from GitHub repo** → chọn repo

---

## Bước 3 — Thêm PostgreSQL

1. Trong project → **+ New** → **Database** → **PostgreSQL**
2. Sau khi tạo xong, vào tab **Variables** của PostgreSQL service
3. Copy giá trị `DATABASE_URL` (dạng `postgresql://...`) — dùng ở bước 5

---

## Bước 4 — Cấu hình Backend service

1. Trong project → chọn service từ GitHub (hoặc **+ New** → **GitHub Repo** → chọn repo)
2. Vào **Settings** → **Root Directory** → đặt thành `backend`
3. Railway sẽ tự detect `backend/railway.toml` và dùng Dockerfile

---

## Bước 5 — Đặt Environment Variables cho Backend

Vào **Backend service** → tab **Variables** → thêm:

| Variable                    | Giá trị                                      |
|-----------------------------|----------------------------------------------|
| `DATABASE_URL`              | Paste từ bước 3 (PostgreSQL `DATABASE_URL`)  |
| `SECRET_KEY`                | Chuỗi random 64 ký tự (xem ghi chú bên dưới)|
| `GEMINI_API_KEY`            | API key từ [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `GEMINI_MODEL`              | `gemini-1.5-pro`                             |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440`                                     |

**Tạo SECRET_KEY ngẫu nhiên:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Bước 6 — Chạy schema SQL

Database mới hoàn toàn trống, cần chạy schema:

**Cách 1 — Railway CLI:**
```bash
npm install -g @railway/cli
railway login
railway link          # chọn project
railway connect postgresql   # mở psql shell
\i schema.sql         # paste nội dung schema.sql
```

**Cách 2 — psql local (cần Railway DB URL):**
```bash
# Lấy DATABASE_URL từ Railway PostgreSQL Variables
psql "<DATABASE_URL>" -f schema.sql
```

---

## Bước 7 — Cấu hình Frontend service

1. **+ New** → **GitHub Repo** → chọn cùng repo
2. **Settings** → **Root Directory** → đặt thành `frontend`
3. Railway tự detect `frontend/railway.toml`

---

## Bước 8 — Đặt Environment Variables cho Frontend

Vào **Frontend service** → tab **Variables** → thêm:

| Variable       | Giá trị                                                |
|----------------|--------------------------------------------------------|
| `BACKEND_URL`  | URL nội bộ của Backend service (xem ghi chú bên dưới) |

**Lấy Backend internal URL:**
- Vào **Backend service** → tab **Settings** → copy **Private Networking URL**
- Dạng: `http://backend.railway.internal:<port>`

> Railway Private Networking (miễn phí) cho phép frontend gọi backend không qua internet,
> nhanh hơn và không tốn egress bandwidth.

---

## Bước 9 — Tạo Admin user

Sau khi deploy xong:

```bash
# 1. Đăng ký tài khoản qua UI: https://<frontend-domain>/register

# 2. Kết nối DB và promote lên admin:
psql "<DATABASE_URL>" -c "UPDATE users SET role='admin' WHERE email='your@email.com';"
```

---

## Kiểm tra nhanh

```bash
# Health check backend
curl https://<backend-domain>/api/health
# → {"status":"ok"}

# Brands đã seed
curl https://<backend-domain>/api/brands/
# → [...6 brands...]

# Frontend
curl -I https://<frontend-domain>/
# → HTTP/2 200
```

---

## Lưu ý quan trọng

### Uploads (ảnh sản phẩm)
File upload hiện lưu vào `/app/uploads/` trong container. **Railway không có persistent disk** — file sẽ mất khi redeploy.

Để dùng production, cần chuyển sang object storage:
- [Cloudflare R2](https://www.cloudflare.com/products/r2/) (free 10GB/tháng)
- [AWS S3](https://aws.amazon.com/s3/)
- [Supabase Storage](https://supabase.com/storage)

Tạm thời có thể dùng `image_url` (paste URL từ ngoài) thay vì upload file.

### Biến môi trường nhạy cảm
Không commit `.env` lên Git. Luôn dùng Railway Variables cho production:
- `SECRET_KEY` — phải khác với dev
- `GEMINI_API_KEY` — giữ bí mật
- `DATABASE_URL` — Railway tự quản lý

### Free tier Railway
- Sleep sau 30 phút không có request (Hobby plan trở lên thì không)
- 500MB RAM, 1GB disk mỗi service (Starter plan)
- Để tránh cold start, upgrade lên Hobby ($5/tháng)
