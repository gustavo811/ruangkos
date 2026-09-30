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

## Arsitektur Penyimpanan Data (Storage Architecture)

1. **Secure Storage (`expo-secure-store`)**
   - **Tingkat Keamanan:** Enkripsi perangkat keras (iOS Keychain / Android Keystore).
   - **Data yang Disimpan:**
     - `ruangkos_auth_token_v1`: Bearer session token pengguna aktif.
     - `ruangkos_auth_credentials_v1`: Hash kredensial login & sesi terverifikasi.
     - `ruangkos_session_id_v1`: ID sesi kriptografis perangkat.

2. **Local Storage (`@react-native-async-storage/async-storage`)**
   - **Tingkat Keamanan:** Unencrypted key-value store untuk performa & offline persistence.
   - **Data yang Disimpan:**
     - `@ruangkos_active_user_v1`: Data profil aktif (Nama, Peran, Kamar, Nama Kos, Warna Avatar).
     - `@ruangkos_remember_email_v1`: Cache email untuk fitur "Ingat Saya" (Auto-fill).
     - `@ruangkos_registered_accounts_v1`: Basis data pengguna terdaftar secara lokal.
     - `@ruangkos_tasks_v1`, `@ruangkos_roommates_v1`, `@ruangkos_history_v1`, `@ruangkos_settings_v1`.

3. **Fitur Transparansi & Audit Penyimpanan**
   - Terdapat tombol avatar profil di pojok kanan atas Header.
   - Tab **"Audit Penyimpanan"** dapat dibuka secara langsung untuk menginspeksi status real-time item mana yang tersimpan di **SecureStore** vs **AsyncStorage**.

## Akun Demo Siap Pakai (1-Klik):
- **Ketua Kos:** `budi@ruangkos.id` / `password123`
- **Penghuni 1:** `agus@ruangkos.id` / `password123`
- **Penghuni 2:** `siti@ruangkos.id` / `password123`
- Atau daftar akun baru lewat tombol **"Daftar Penghuni Baru"**.