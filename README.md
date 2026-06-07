# Selfie 📁

> A self-hosted file storage you actually own.

Selfie is a lightweight, self-hosted file storage server built with **Node.js**, **TypeScript**, **Hono**, and **PostgreSQL + Prisma**. Designed to run on minimal hardware — including a rooted Android device with Termux.

---

## Features

- Upload and download files via REST API
- Multi-user support with role-based access (`USER` / `ADMIN`)
- Per-user storage quotas
- JWT authentication
- Public share links with TTL *(Sprint 4)*
- Virtual folder support *(Sprint 4)*
- CLI client with local folder sync *(Sprint 5)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Hono |
| Language | TypeScript (strict) |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Tunnel | Cloudflare Tunnel |

---

## Project Structure

```
selfie/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── files.ts
│   │   └── admin.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── upload.ts
│   ├── services/
│   │   ├── storage.ts
│   │   └── jwt.ts
│   ├── db/
│   │   └── prisma.ts
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── storage/          # uploaded files (gitignored)
├── .env.example
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (local or via Termux)
- Cloudflare account (for tunnel, optional)

### Installation

```bash
git clone https://github.com/youruser/selfie
cd selfie
npm install
```

### Environment setup

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://selfie:password@localhost:5432/selfie"
JWT_SECRET="your-secret-here"
STORAGE_PATH="./storage"
PORT=3000
```

### Database setup

```bash
npx prisma migrate dev --name init
```

### Run

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

---

## API Reference

All protected endpoints require `Authorization: Bearer <token>`.

### Auth

```
POST /auth/register   Create a new user account
POST /auth/login      Get a JWT token
```

### Files

```
POST   /files/upload        Upload a file (multipart/form-data)
GET    /files               List your files (paginated)
GET    /files/:id/download  Download a file by ID
DELETE /files/:id           Delete a file
```

### Example

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}' \
  | jq -r '.token')

# Upload a file
curl -X POST http://localhost:3000/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@photo.jpg"

# List files
curl http://localhost:3000/files \
  -H "Authorization: Bearer $TOKEN"
```

---

## Running on Termux (Android)

```bash
# Install PostgreSQL
pkg install postgresql nodejs

# Initialize database cluster
initdb $PREFIX/var/lib/postgresql

# Start PostgreSQL
pg_ctl -D $PREFIX/var/lib/postgresql start

# Create database
createdb selfie

# Auto-start on boot (requires Termux:Boot)
mkdir -p ~/.termux/boot
echo 'pg_ctl -D $PREFIX/var/lib/postgresql start' > ~/.termux/boot/start-postgres.sh
chmod +x ~/.termux/boot/start-postgres.sh
```

---

## Roadmap

- [x] Multi-user auth with JWT
- [x] Upload / download / delete
- [x] Per-user storage quotas
- [ ] Public share links with TTL
- [ ] Virtual folder navigation
- [ ] CLI client (`selfie upload`, `selfie list`, ...)
- [ ] Local folder watcher (Dropbox-style sync)

---

## License

MIT