# ITTS Blast Email (Node.js + SMTP/Nodemailer)

Utility untuk mengirim email PMB ITTS secara terkontrol dari file CSV. Program ini dibuat untuk format data `Daftar Sisa Pendaftar` ITTS (metadata di tiga baris awal, delimiter `;`) tetapi juga menerima CSV biasa yang memiliki kolom `Email`.

## Fitur

- Validasi format email dan deteksi duplikat sebelum pengiriman.
- Personalisasi nama dan status pendaftar (`Pendaftar` / `Lolos Seleksi`).
- Template HTML responsif + versi plain text.
- Pengiriman melalui SMTP menggunakan Nodemailer.
- Cocok untuk Google Workspace/Gmail SMTP dengan App Password.
- `preview` dan `test email` sebelum blast.
- `DRY_RUN=true` sebagai default agar tidak ada pengiriman tak sengaja.
- Delay antar email, suppression list, dan log `sent/failed` untuk mencegah pengiriman ganda saat proses dilanjutkan.
- `List-Unsubscribe` via email dan instruksi opt-out di footer.
- CSV recipient dan SMTP password tidak perlu disimpan di repository.

## 1. Persiapan

Persyaratan: Node.js 20+.

```bash
npm install
cp .env.example .env
```

**Jangan commit `.env`, password SMTP/App Password, atau CSV pendaftar asli.** Repository ini mengabaikannya melalui `.gitignore`.

## 2. Letakkan file recipient

Contoh:

```text
data/recipients.csv
```

File produksi tidak akan masuk Git karena `data/*.csv` di-ignore, kecuali file contoh.

CSV ITTS saat ini dapat dibaca langsung, termasuk tiga baris metadata sebelum header.

## 3. Konfigurasi SMTP Gmail / Google Workspace

Isi `.env`:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USERNAME=pelatihan@itts.ac.id
SMTP_PASSWORD=ISI_APP_PASSWORD_BARU_DI_SINI

SENDER_EMAIL=pelatihan@itts.ac.id
SENDER_NAME=PMB Institut Teknologi Tangerang Selatan
REPLY_TO_EMAIL=pelatihan@itts.ac.id
UNSUBSCRIBE_EMAIL=pelatihan@itts.ac.id
```

Untuk port `587`, Nodemailer menggunakan STARTTLS (`SMTP_SECURE=false`, `SMTP_REQUIRE_TLS=true`). Untuk Google Workspace/Gmail, gunakan **App Password**, bukan password login utama akun.

Jika App Password ditampilkan Google dengan spasi per empat karakter, program otomatis menghapus whitespace ketika host adalah `smtp.gmail.com`.

Jika `SENDER_EMAIL` berbeda dari `SMTP_USERNAME`, pastikan alamat tersebut sudah dikonfigurasi sebagai alias pengirim yang diizinkan. Jika tidak, gunakan alamat yang sama dengan `SMTP_USERNAME`.

## 4. Validasi recipient

```bash
npm run validate -- --file ./data/recipients.csv
```

Output menampilkan jumlah baris, email valid unik, invalid, dan duplikat. Validasi ini memeriksa format/sintaks; bukan memastikan mailbox tujuan benar-benar aktif.

## 5. Preview template

```bash
npm run preview -- --file ./data/recipients.csv
```

File `preview.html` akan dibuat di root project. Buka di browser dan periksa copy, CTA, promo, serta tampilan mobile/desktop.

## 6. Kirim satu test email

Ubah sementara:

```dotenv
DRY_RUN=false
```

Lalu jalankan:

```bash
npm run send -- --file ./data/recipients.csv --test-email email-anda@contoh.com
```

Program akan menjalankan `transporter.verify()` terlebih dahulu. Jika autentikasi SMTP gagal, blast tidak dimulai.

## 7. Blast ke seluruh recipient

Setelah test email sudah diperiksa:

```dotenv
DRY_RUN=false
CONFIRM_SEND=YES
SEND_DELAY_MS=1500
```

Kemudian:

```bash
npm run send -- --file ./data/recipients.csv
```

Untuk uji batch kecil:

```bash
npm run send -- --file ./data/recipients.csv --limit 5 --confirm
```

Program mengirim satu per satu dan mencatat keberhasilan ke `logs/sent.jsonl`. Jika command dijalankan lagi, alamat yang sudah sukses akan dilewati. Gunakan `--resend` hanya jika memang ingin mengirim ulang.

## 8. Suppression / opt-out

Buat file:

```text
data/suppression-list.csv
```

Isi satu email per baris, misalnya:

```text
email
user@example.com
```

Alamat di suppression list tidak akan masuk antrean blast.

## Konten kampanye default

Default template berisi:

- PMB Tahun Akademik 2026/2027 hingga **30 September 2026**.
- Program Studi **Sistem Informasi, Teknologi Informasi, dan Informatika**.
- Kode promo **ITTS08**, potongan hingga **Rp2.000.000**, dengan keterangan promo tunduk pada syarat, kuota, dan masa berlaku PMB.
- Tagline **“Study From The Experts!”** dan **“Membangun Generasi Digital yang Kompeten dan Berintegritas.”**
- Informasi program **“Dijamin Kerja Sebelum Lulus”** dengan arahan untuk mengonfirmasi syarat dan ketentuannya kepada PMB.
- CTA menuju `https://registrasi.itts.ac.id` dan WhatsApp PMB.

Seluruh item utama dapat diganti melalui `.env` tanpa mengubah source code.

> Catatan promo: sebelum live blast, pastikan kembali bahwa kode promo `ITTS08` masih berlaku sampai tanggal pengiriman kampanye.

## Struktur

```text
.
├── .env.example
├── .gitignore
├── data/
│   ├── recipients.example.csv
│   └── suppression-list.example.csv
├── src/
│   ├── index.js
│   └── template.js
├── package.json
└── README.md
```

## Catatan operasional

Gunakan mailbox institusi yang sah dan hanya hubungi pendaftar yang memang berhak menerima komunikasi PMB. Hormati permintaan berhenti menerima email dan masukkan alamat tersebut ke suppression list. Jangan menaruh credential SMTP, recipient CSV, atau log pengiriman ke repository publik.
