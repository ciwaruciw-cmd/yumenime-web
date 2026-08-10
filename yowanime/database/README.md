# 🐘 Yowanime PostgreSQL Database Setup Guide

Database PostgreSQL untuk Yowanime telah dikonfigurasi secara lengkap dengan tabel relasional, indeks performa tinggi, schema Prisma, Docker Compose, serta file `seed.sql` berisi data 167+ anime dan koleksi Yuri dari MyAnimeList / manami-project database.

---

## 📁 Struktur File Database

- 📄 [`database/schema.sql`](file:///home/yowa/yume/yowanime/database/schema.sql) — DDL Script Pembuatan Tabel PostgreSQL (`animes`, `genres`, `episodes`, `users`, `watchlists`, `comments`, dll.)
- 📄 [`database/seed.sql`](file:///home/yowa/yume/yowanime/database/seed.sql) — Script SQL Seed Data (~230 KB SQL DML) 167 Anime + Yuri Collection
- 🐳 [`docker-compose.yml`](file:///home/yowa/yume/yowanime/docker-compose.yml) — Container PostgreSQL 16 + Otomatisasi Init DDL & Seed
- 💎 [`prisma/schema.prisma`](file:///home/yowa/yume/yowanime/prisma/schema.prisma) — Skema Prisma ORM untuk PostgreSQL
- ⚡ [`server/index.js`](file:///home/yowa/yume/yowanime/server/index.js) — Express Backend API Server PostgreSQL (`http://localhost:3001`)

---

## 🚀 Cara Menjalankan (Pilih Salah Satu)

### Cara 1: Menggunakan Docker Compose (Direkomendasikan)
Cukup jalankan satu perintah berikut di terminal:
```bash
docker compose up -d
```
> PostgreSQL container akan otomatis menyalakan server di port `5432` dan menjalankan `schema.sql` serta `seed.sql`.

---

### Cara 2: Manual Menggunakan PostgreSQL Lokal (`psql`)
Jika Anda sudah menginstal PostgreSQL di komputer:

1. **Buat database**:
   ```sql
   CREATE DATABASE yowanime;
   CREATE USER yowa WITH PASSWORD 'yowapassword';
   GRANT ALL PRIVILEGES ON DATABASE yowanime TO yowa;
   ```

2. **Eksekusi Schema & Seed**:
   ```bash
   psql -U yowa -d yowanime -f database/schema.sql
   psql -U yowa -d yowanime -f database/seed.sql
   ```

---

### Cara 3: Menggunakan Prisma ORM
Jika ingin menggunakan Prisma ORM:
```bash
npx prisma db push
node database/generate_seed_sql.cjs
```

---

## ⚡ Menjalankan Backend Server Express API

Untuk menyalakan REST API Server backend yang terhubung langsung ke PostgreSQL:
```bash
npm install express cors pg dotenv
node server/index.js
```
Server backend akan berjalan di `http://localhost:3001/api/animes`.
