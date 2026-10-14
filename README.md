# RuangKos – Aplikasi Jadwal Kebersihan Kos

## Masalah
Mahasiswa yang tinggal di kos sering lupa jadwal membersihkan kamar, membuang sampah, mengepel, atau membersihkan kamar mandi. Jika tinggal bersama teman sekamar, pembagian tugas kebersihan juga sering tidak jelas sehingga kamar menjadi berantakan.

## Target
Mahasiswa, anak kos, dan penghuni kontrakan.

## Solusi
Membangun aplikasi mobile yang membantu pengguna membuat jadwal kebersihan, membagi tugas dengan teman sekamar, serta memberikan pengingat agar setiap tugas dilakukan sesuai jadwal.

## Produk
**RuangKos**

## Core Fitur

| Fitur | Fungsi |
| :--- | :--- |
| **Autentikasi & Akun** | Masuk (Login) & Daftar (Register) dengan peran Ketua Kos / Penghuni. |
| **Jadwal Piket** | Membuat jadwal kebersihan harian atau mingguan. |
| **Checklist Tugas** | Menandai tugas yang sudah selesai dikerjakan. |
| **Pengingat Otomatis** | Notifikasi saat jadwal kebersihan tiba. |
| **Pembagian Tugas** | Menentukan siapa yang bertugas setiap hari & acak rotasi mingguan. |
| **Riwayat Kebersihan** | Melihat daftar tugas yang sudah selesai dan papan peringkat rajin piket. |

## Arsitektur Autentikasi JWT (JSON Web Token) & Penyimpanan Data

### 1. Implementasi JWT Token (RFC 7519 Standard)
- **Struktur Token:** `Header.Payload.Signature`
  - **Header:** `{"alg":"HS256","typ":"JWT"}`
  - **Payload Claims:** `sub` (User ID), `email`, `name`, `role`, `roomNumber`, `kosName`, `iat` (Issued At), `exp` (Expiration 7 hari), `iss`, `aud`.
  - **Signature:** Kriptografi HMAC-SHA256 dengan kunci rahasia aplikasi.
- **Penyimpanan:** Disimpan secara aman di **Expo SecureStore** (`ruangkos_auth_token_v1`) yang terenkripsi tingkat perangkat keras (iOS Keychain / Android Keystore).

### 2. Alur Akses Endpoint dengan Bearer Token
1. **Saat Login (`POST /api/v1/auth/login`):**
   - Aplikasi memverifikasi kredensial pengguna, menerbitkan JWT token yang ditandatangani, dan menyimpannya ke `SecureStorage`.
2. **Saat Akses Menu Utama (`GET /api/v1/dashboard/overview` & `GET /api/v1/tasks`):**
   - Setiap request ke endpoint menu utama menyertakan header:
     ```http
     Authorization: Bearer <jwt_token>
     ```
   - Server memvalidasi signature & masa aktif token. Jika valid, data dikembalikan (HTTP 200). Jika token tidak disertakan atau palsu, akses ditolak (HTTP 401 Unauthorized).
3. **Saat Logout (`POST /api/v1/auth/logout`):**
   - Aplikasi mengirimkan token aktif melalui header `Authorization: Bearer <token>` untuk mencabut sesi di server.
   - Token langsung **dihapus/direfresh** dari penyimpanan lokal (`SecureStorage` & `AsyncStorage`), mengembalikan status aplikasi ke unauthenticated.

### 3. Fitur Inspeksi & Uji Live (Modal Profil)
- Klik tombol avatar pengguna di pojok kanan atas Header:
  - Tab **"JWT & API"**: Melihat string token, payload claims yang didekodekan, masa berlaku, tombol uji endpoint secara interaktif, serta log rekaman network HTTP real-time.
  - Tab **"Storage"**: Audit langsung transparansi data di Expo SecureStore vs AsyncStorage.

## Akun Demo Siap Pakai (1-Klik):
- **Ketua Kos:** `erling@ruangkos.id` / `password123` (Erling Rascals)
- **Penghuni 1:** `rex@ruangkos.id` / `password123` (Rex)
- **Penghuni 2:** `fiona@ruangkos.id` / `password123` (Fiona)
- Atau daftar akun baru lewat tombol **"Daftar Penghuni Baru"**.
