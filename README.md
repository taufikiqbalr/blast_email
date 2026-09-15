# ITTS Blast Email (Node.js + Gmail API)

Utility untuk mengirim email PMB ITTS secara terkontrol dari file CSV. Program ini dibuat untuk format data `Daftar Sisa Pendaftar` ITTS (metadata di tiga baris awal, delimiter `;`) tetapi juga menerima CSV biasa yang memiliki kolom `Email`.

## Fitur

- Validasi format email dan deteksi duplikat sebelum pengiriman.
- Personalisasi nama dan status pendaftar (`Pendaftar` / `Lolos Seleksi`).
- Template HTML responsif + versi plain text.
- Gmail API dengan OAuth2 atau Google Workspace Service Account + Domain-Wide Delegation.
- `preview` dan `test email` sebelum blast.
- `DRY_RUN=true` sebagai default agar tidak ada pengiriman tak sengaja.
- Delay antar email, suppression list, dan log `sent/failed` untuk mencegah pengiriman ganda saat proses dilanjutkan.
- `List-Unsubscribe` via email dan instruksi opt-out di footer.
- Data recipient dan Google credential tidak pernah perlu disimpan di repository.

## 1. Persiapan

Persyaratan: Node.js 20+.

```bash
npm install
cp .env.example .env
```

**Jangan commit `.env`, file key Google, atau CSV pendaftar asli.** Repository ini mengabaikannya melalui `.gitignore`.

## 2. Letakkan file recipient

Contoh paling aman:

```text
data/recipients.csv
```

File produksi tidak akan masuk Git karena `data/*.csv` di-ignore, kecuali file contoh.

CSV ITTS saat ini dapat dibaca langsung, termasuk tiga baris metadata sebelum header.

## 3. Konfigurasi Google/Gmail

### Opsi A — OAuth2 (direkomendasikan untuk mailbox biasa)

Isi `.env`:

```dotenv
GOOGLE_AUTH_MODE=oauth2
SENDER_EMAIL=pmb@itts.ac.id
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
```

OAuth consent harus memiliki scope:

```text
https://www.googleapis.com/auth/gmail.send
```

### Opsi B — Service Account

Untuk Google Workspace, service account harus diberi **Domain-Wide Delegation** oleh administrator Workspace dan diizinkan untuk scope `gmail.send`. Service account kemudian mengimpersonasi mailbox pengirim.

```dotenv
GOOGLE_AUTH_MODE=service_account
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./credentials.json
GMAIL_IMPERSONATED_USER=pmb@itts.ac.id
SENDER_EMAIL=pmb@itts.ac.id
```

Service account Gmail **tidak dapat mengirim sebagai dirinya sendiri**; ia harus mengimpersonasi user Workspace yang sah.

## 4. Validasi recipient

```bash
npm run validate -- --file ./data/recipients.csv
```

Output menampilkan jumlah baris, email valid unik, invalid, dan duplikat. Validasi ini adalah validasi format/sintaks; bukan verifikasi bahwa mailbox benar-benar aktif.

## 5. Preview template

```bash
npm run preview -- --file ./data/recipients.csv
```

File `preview.html` akan dibuat di root project. Buka di browser dan periksa copy, CTA, promo, serta tampilan mobile/desktop.

## 6. Kirim satu test email

Biarkan `DRY_RUN=true` saat validasi dan preview. Setelah siap mengirim test:

```dotenv
DRY_RUN=false
TEST_EMAIL=email-anda@contoh.com
```

Lalu:

```bash
npm run send -- --file ./data/recipients.csv
```

Atau tanpa menyimpan `TEST_EMAIL`:

```bash
npm run send -- --file ./data/recipients.csv --test-email email-anda@contoh.com
```

## 7. Blast ke seluruh recipient

Setelah test email sudah diperiksa:

```dotenv
DRY_RUN=false
CONFIRM_SEND=YES
SEND_DELAY_MS=1500
```

Pastikan `TEST_EMAIL` dikosongkan, kemudian:

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
- Kode promo **ITTS08**, potongan hingga **Rp2.000.000**, dengan keterangan bahwa promo tunduk pada syarat, kuota, dan masa berlaku PMB.
- Tagline **“Study From The Experts!”** dan **“Membangun Generasi Digital yang Kompeten dan Berintegritas.”**
- Informasi program **“Dijamin Kerja Sebelum Lulus”** ditulis dengan arahan untuk mengonfirmasi syarat dan ketentuannya kepada PMB.
- CTA menuju `https://registrasi.itts.ac.id` dan WhatsApp PMB.

Seluruh item utama dapat diganti melalui `.env` tanpa mengubah source code.

> Catatan promo: informasi publik ITTS yang terindeks menyebut PMB Gelombang III sampai 30 September 2026, sedangkan publikasi kode ITTS08 yang ditemukan menyebut periode voucher 1–31 Agustus 2026. Karena itu, konfirmasikan terlebih dahulu apakah ITTS08 sudah diperpanjang sebelum live blast pada September 2026.

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

Gunakan mailbox institusi yang sah dan hanya hubungi pendaftar yang memang berhak menerima komunikasi PMB. Hormati permintaan berhenti menerima email dan masukkan alamat tersebut ke suppression list. Jangan menaruh credential Google, recipient CSV, atau log pengiriman ke repository publik.
