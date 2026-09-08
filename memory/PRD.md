# TelorKu — PRD

## Problem Statement
Aplikasi mobile offline-first untuk mengelola usaha telur ayam kampung: pencatatan penjualan telur (Rp 3.000/butir), manajemen pembeli, biaya operasional (kategori kustom), dashboard harian/bulanan, laporan bulanan PDF, pelacak ayam produktif, pengingat harian, grafik laporan, dark mode. Bahasa Indonesia untuk seluruh UI.

## Arsitektur
- Expo + expo-router, 100% offline via AsyncStorage (`src/storage.ts`, key `telorku_data_v1`).
- Tanpa backend/login/cloud. PDF via expo-print + expo-sharing.
- UI monolitik di `app/index.tsx` (dashboard, tab Penjualan/Produksi/Keuangan, sheet Form/Flock/Report). Tema di `src/theme.ts` (light only).

## Persona
Pemilik usaha telur skala kecil, tidak tech-savvy, butuh input cepat dan ringkasan laba/rugi jelas.

## Terimplementasi
- 2026-09: Dashboard (harian + bulanan + indikator laba/rugi), CRUD Penjualan, CRUD Biaya + kategori kustom, CRUD Pembeli + riwayat, Produksi & ayam aktif bertelur (terpisah dari koleksi telur), autocomplete ala Google untuk pembeli & item biaya, ekspor PDF laporan, perbaikan race condition modal saat save.
- 2026-09-08: Laporan Tahunan (ringkasan setahun, rincian + grafik batang per bulan, PDF tahunan) dan Laporan Rentang Tanggal (dari–sampai tanggal spesifik, PDF sesuai rentang). testID pada tab bar, FAB, quick actions, tombol laporan, dan seluruh kontrol laporan baru.

## Backlog
- P0: —
- P1: Pengingat/notifikasi harian koleksi telur (butuh build native, tidak jalan di Expo Go).
- P2: Dark mode; refactor index.tsx menjadi komponen modular (DashboardTab, Forms, ReportTab).

## Catatan Teknis
- Test credentials: tidak ada (tanpa auth).
- Jangan tambahkan backend/API — aplikasi wajib tetap offline-first.
