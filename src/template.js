function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function firstName(fullName = '') {
  const normalized = String(fullName).trim().replace(/\s+/g, ' ');
  if (!normalized) return 'Calon Mahasiswa ITTS';
  const word = normalized.split(' ')[0].toLowerCase();
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function journeyCopy(status = '') {
  const value = String(status).toLowerCase();
  if (value.includes('lolos')) {
    return {
      badge: 'Lanjutkan Daftar Ulang',
      lead: 'Selamat, proses seleksimu di ITTS sudah berada di tahap berikutnya. Jangan lewatkan kesempatan untuk menyelesaikan daftar ulang dan mengamankan kursimu.'
    };
  }
  return {
    badge: 'Lanjutkan Pendaftaran',
    lead: 'Pendaftaranmu di ITTS sudah tercatat. Yuk, lanjutkan prosesnya agar kesempatan bergabung sebagai mahasiswa ITTS tidak terlewat.'
  };
}

export function renderEmail(recipient, campaign) {
  const name = escapeHtml(firstName(recipient.name));
  const journey = journeyCopy(recipient.status);
  const deadline = escapeHtml(campaign.deadline);
  const promoCode = escapeHtml(campaign.promoCode);
  const promoDiscount = escapeHtml(campaign.promoDiscount);
  const registrationUrl = escapeHtml(campaign.registrationUrl);
  const whatsappUrl = `https://wa.me/${encodeURIComponent(campaign.whatsapp)}`;

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>PMB ITTS 2026</title>
</head>
<body style="margin:0;padding:0;background:#f3f5f7;font-family:Arial,Helvetica,sans-serif;color:#1c2733;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">PMB ITTS 2026/2027 masih dibuka hingga ${deadline}. Lanjutkan pendaftaranmu hari ini.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f5f7;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(22,34,48,.08);">
        <tr>
          <td style="background:#8f1020;padding:32px 36px;color:#ffffff;">
            <div style="font-size:13px;letter-spacing:1.4px;text-transform:uppercase;font-weight:700;opacity:.92;">Institut Teknologi Tangerang Selatan</div>
            <h1 style="margin:10px 0 8px;font-size:30px;line-height:1.2;">PMB ITTS 2026 Masih Dibuka</h1>
            <p style="margin:0;font-size:17px;line-height:1.55;">Bangun masa depan di bidang teknologi bersama kampus yang dekat dengan kebutuhan industri.</p>
          </td>
        </tr>

        <tr><td style="padding:34px 36px 8px;">
          <span style="display:inline-block;background:#f8e9eb;color:#8f1020;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;">${escapeHtml(journey.badge)}</span>
          <h2 style="margin:18px 0 10px;font-size:23px;line-height:1.35;">Halo ${name},</h2>
          <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#405060;">${escapeHtml(journey.lead)}</p>
          <p style="margin:0;font-size:16px;line-height:1.7;color:#405060;">Penerimaan Mahasiswa Baru ITTS Tahun Akademik 2026/2027 masih dibuka hingga <strong style="color:#1c2733;">${deadline}</strong>.</p>
        </td></tr>

        <tr><td style="padding:24px 36px 8px;">
          <h3 style="margin:0 0 14px;font-size:19px;">Pilih 3 Program Studi Teknologi</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td style="padding:14px 16px;border:1px solid #e5e9ee;border-radius:12px;">
              <strong style="font-size:16px;">Sistem Informasi</strong>
              <div style="margin-top:5px;color:#596a79;font-size:14px;line-height:1.55;">Perpaduan teknologi, data, proses bisnis, dan manajemen untuk membangun solusi digital organisasi.</div>
            </td></tr>
            <tr><td height="10"></td></tr>
            <tr><td style="padding:14px 16px;border:1px solid #e5e9ee;border-radius:12px;">
              <strong style="font-size:16px;">Teknologi Informasi</strong>
              <div style="margin-top:5px;color:#596a79;font-size:14px;line-height:1.55;">Fokus praktis pada infrastruktur TI, jaringan, keamanan siber, cloud, big data, dan DevOps.</div>
            </td></tr>
            <tr><td height="10"></td></tr>
            <tr><td style="padding:14px 16px;border:1px solid #e5e9ee;border-radius:12px;">
              <strong style="font-size:16px;">Informatika</strong>
              <div style="margin-top:5px;color:#596a79;font-size:14px;line-height:1.55;">Bangun kemampuan pemrograman, rekayasa perangkat lunak, AI, IoT, dan teknologi digital masa depan.</div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 36px 8px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fff7e6;border:1px solid #f3d59b;border-radius:14px;">
            <tr><td style="padding:18px 20px;">
              <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#8a5c00;">Promo PMB</div>
              <div style="margin-top:7px;font-size:20px;font-weight:700;color:#4c370e;">Kode <span style="background:#ffffff;border:1px dashed #b98216;border-radius:7px;padding:3px 8px;">${promoCode}</span></div>
              <div style="margin-top:8px;font-size:15px;line-height:1.55;color:#6e531e;">Dapatkan potongan biaya kuliah hingga <strong>${promoDiscount}</strong>. Promo mengikuti syarat, kuota, dan masa berlaku yang ditetapkan PMB ITTS.</div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 36px 8px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef5ff;border-radius:14px;">
            <tr><td style="padding:19px 20px;">
              <div style="font-size:18px;font-weight:700;color:#173a63;">Study From The Experts!</div>
              <p style="margin:8px 0 0;font-size:15px;line-height:1.6;color:#415d7d;">Belajar dari dosen dan praktisi, bangun portofolio, dan siapkan karier sejak kuliah. Tanyakan kepada tim PMB mengenai program <strong>“Dijamin Kerja Sebelum Lulus”</strong> beserta syarat dan ketentuannya.</p>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:28px 36px 12px;">
          <a href="${registrationUrl}" style="display:inline-block;background:#8f1020;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 24px;border-radius:10px;">Lanjutkan Pendaftaran</a>
          <div style="margin-top:14px;font-size:13px;color:#70808e;">Butuh bantuan? <a href="${whatsappUrl}" style="color:#8f1020;text-decoration:none;font-weight:700;">Hubungi PMB ITTS via WhatsApp</a></div>
        </td></tr>

        <tr><td style="padding:18px 36px 30px;">
          <div style="border-top:1px solid #edf0f3;padding-top:20px;text-align:center;">
            <div style="font-size:15px;font-weight:700;color:#1c2733;">Membangun Generasi Digital yang Kompeten dan Berintegritas</div>
            <div style="margin-top:7px;font-size:12px;line-height:1.55;color:#81909d;">Institut Teknologi Tangerang Selatan · PMB 2026/2027</div>
            <div style="margin-top:8px;font-size:11px;line-height:1.5;color:#9aa6b0;">Jika tidak ingin menerima informasi PMB berikutnya, balas email ini dengan subjek “Berhenti PMB”.</div>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Halo ${firstName(recipient.name)},

${journey.lead}

PMB Institut Teknologi Tangerang Selatan Tahun Akademik 2026/2027 masih dibuka hingga ${campaign.deadline}.

Tiga program studi ITTS:
- Sistem Informasi — teknologi, data, proses bisnis, dan manajemen.
- Teknologi Informasi — infrastruktur TI, jaringan, keamanan siber, cloud, big data, dan DevOps.
- Informatika — pemrograman, rekayasa perangkat lunak, AI, IoT, dan teknologi digital masa depan.

PROMO PMB
Gunakan kode ${campaign.promoCode} untuk mendapatkan potongan biaya kuliah hingga ${campaign.promoDiscount}, sesuai syarat, kuota, dan masa berlaku yang ditetapkan PMB ITTS.

Study From The Experts!
Belajar dari dosen dan praktisi, bangun portofolio, dan siapkan karier sejak kuliah. Tanyakan kepada tim PMB mengenai program “Dijamin Kerja Sebelum Lulus” beserta syarat dan ketentuannya.

Lanjutkan pendaftaran: ${campaign.registrationUrl}
WhatsApp PMB: https://wa.me/${campaign.whatsapp}

Membangun Generasi Digital yang Kompeten dan Berintegritas
Institut Teknologi Tangerang Selatan

Jika tidak ingin menerima informasi PMB berikutnya, balas email ini dengan subjek “Berhenti PMB”.`;

  return { html, text };
}
