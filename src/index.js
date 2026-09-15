import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import nodemailer from 'nodemailer';
import { renderEmail } from './template.js';

const EMAIL_RE = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findHeaderLine(raw) {
  const lines = raw.split(/\r?\n/);
  const index = lines.findIndex((line) => /(^|[;,])\s*email\s*([;,]|$)/i.test(line));
  if (index < 0) throw new Error('Header CSV tidak ditemukan. Pastikan ada kolom Email.');
  return { index, line: lines[index] };
}

function loadRecipients(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const header = findHeaderLine(raw);
  const delimiter = header.line.includes(';') ? ';' : ',';
  const records = parse(raw, {
    columns: true,
    delimiter,
    from_line: header.index + 1,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true
  });

  if (!records.length) return [];
  const keys = Object.keys(records[0]);
  const byNormalized = new Map(keys.map((key) => [normalizeKey(key), key]));
  const emailKey = byNormalized.get('email');
  const nameKey = byNormalized.get('namalengkap') || byNormalized.get('nama') || byNormalized.get('name');
  const statusKey = byNormalized.get('statuspendaftar') || byNormalized.get('status');
  const idKey = byNormalized.get('idpendaftar') || byNormalized.get('id');
  const programKey = byNormalized.get('prodilulus') || byNormalized.get('prodi');

  if (!emailKey) throw new Error('Kolom Email tidak ditemukan.');

  return records.map((row, rowIndex) => ({
    row: rowIndex + 1,
    email: String(row[emailKey] || '').trim(),
    name: nameKey ? String(row[nameKey] || '').trim() : '',
    status: statusKey ? String(row[statusKey] || '').trim() : '',
    applicantId: idKey ? String(row[idKey] || '').trim() : '',
    program: programKey ? String(row[programKey] || '').trim() : ''
  }));
}

function analyzeRecipients(recipients) {
  const seen = new Set();
  const valid = [];
  const invalid = [];
  const duplicates = [];

  for (const recipient of recipients) {
    const normalized = recipient.email.toLowerCase();
    if (!recipient.email || !EMAIL_RE.test(recipient.email)) {
      invalid.push(recipient);
      continue;
    }
    if (seen.has(normalized)) {
      duplicates.push(recipient);
      continue;
    }
    seen.add(normalized);
    valid.push(recipient);
  }
  return { valid, invalid, duplicates };
}

function loadSuppression(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return new Set();
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const values = raw
    .split(/\r?\n/)
    .flatMap((line) => line.split(/[;,]/))
    .map((value) => value.trim().toLowerCase())
    .filter((value) => EMAIL_RE.test(value));
  return new Set(values);
}

function loadSent(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return new Set();
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(Boolean);
  const sent = new Set();
  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      if (item.status === 'sent' && item.email) sent.add(String(item.email).toLowerCase());
    } catch {
      // Ignore malformed historical log lines.
    }
  }
  return sent;
}

function appendLog(filePath, entry) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, 'utf8');
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} wajib diisi.`);
  return value;
}

function envBoolean(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function createSmtpTransport() {
  const host = requireEnv('SMTP_HOST');
  const port = Number(process.env.SMTP_PORT || 587);
  const username = requireEnv('SMTP_USERNAME');
  let password = requireEnv('SMTP_PASSWORD');

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT tidak valid.');
  }

  // Google menampilkan App Password dalam grup empat karakter. Bila spasi ikut
  // tersalin ke .env, buang spasinya hanya untuk Gmail/Google Workspace SMTP.
  if (/(^|\.)gmail\.com$/i.test(host)) {
    password = password.replace(/\s+/g, '');
  }

  const secure = envBoolean('SMTP_SECURE', port === 465);
  const requireTLS = envBoolean('SMTP_REQUIRE_TLS', port === 587);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS,
    auth: {
      user: username,
      pass: password
    },
    tls: {
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 15000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 15000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 30000)
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function campaignConfig() {
  return {
    deadline: process.env.PMB_DEADLINE || '30 September 2026',
    promoCode: process.env.PROMO_CODE || 'ITTS08',
    promoDiscount: process.env.PROMO_DISCOUNT || 'Rp2.000.000',
    registrationUrl: process.env.REGISTRATION_URL || 'https://registrasi.itts.ac.id',
    whatsapp: process.env.PMB_WHATSAPP || '6287772771775'
  };
}

function printAnalysis(recipients, analysis) {
  console.log('\nValidasi recipient');
  console.log('-------------------');
  console.log(`Total baris      : ${recipients.length}`);
  console.log(`Email valid unik : ${analysis.valid.length}`);
  console.log(`Email invalid     : ${analysis.invalid.length}`);
  console.log(`Duplikat          : ${analysis.duplicates.length}`);
  if (analysis.invalid.length) {
    console.log('\nBaris invalid:');
    for (const item of analysis.invalid) console.log(`- row ${item.row}: ${item.email || '(kosong)'}`);
  }
}

async function main() {
  const command = process.argv[2] || 'validate';
  const file = argValue('--file', process.env.RECIPIENTS_FILE || './data/recipients.csv');

  if (!fs.existsSync(file)) {
    throw new Error(`File recipient tidak ditemukan: ${file}. Gunakan --file <path-csv>.`);
  }

  const recipients = loadRecipients(file);
  const analysis = analyzeRecipients(recipients);
  printAnalysis(recipients, analysis);

  if (command === 'validate') return;
  if (!analysis.valid.length) throw new Error('Tidak ada recipient valid.');

  const campaign = campaignConfig();

  if (command === 'preview') {
    const previewRecipient = analysis.valid[0];
    const { html } = renderEmail(previewRecipient, campaign);
    const output = argValue('--output', './preview.html');
    fs.writeFileSync(output, html, 'utf8');
    console.log(`\nPreview HTML dibuat: ${output}`);
    return;
  }

  if (command !== 'send') {
    throw new Error(`Command tidak dikenal: ${command}. Gunakan validate, preview, atau send.`);
  }

  const smtpUsername = requireEnv('SMTP_USERNAME');
  const senderEmail = process.env.SENDER_EMAIL || smtpUsername;
  if (!EMAIL_RE.test(senderEmail)) throw new Error('SENDER_EMAIL/SMTP_USERNAME tidak valid.');
  const senderName = process.env.SENDER_NAME || 'PMB Institut Teknologi Tangerang Selatan';
  const replyTo = process.env.REPLY_TO_EMAIL || senderEmail;
  const unsubscribeEmail = process.env.UNSUBSCRIBE_EMAIL || replyTo;
  const subject = process.env.EMAIL_SUBJECT || 'PMB ITTS 2026 Masih Dibuka — Lanjutkan Langkahmu Bersama ITTS';
  const dryRun = (process.env.DRY_RUN ?? 'true').toLowerCase() !== 'false';
  const testEmail = argValue('--test-email', process.env.TEST_EMAIL);
  const delayMs = Math.max(0, Number(process.env.SEND_DELAY_MS || 1500));
  const limitArg = Number(argValue('--limit', '0'));
  const suppression = loadSuppression(process.env.SUPPRESSION_FILE || './data/suppression-list.csv');
  const sentLogFile = process.env.SENT_LOG_FILE || './logs/sent.jsonl';
  const alreadySent = hasArg('--resend') ? new Set() : loadSent(sentLogFile);

  if (senderEmail.toLowerCase() !== smtpUsername.toLowerCase()) {
    console.warn(`WARNING: SENDER_EMAIL (${senderEmail}) berbeda dari SMTP_USERNAME (${smtpUsername}). Pastikan alamat tersebut adalah alias pengirim yang diizinkan di Google Workspace.`);
  }

  let queue = analysis.valid.filter((recipient) => !suppression.has(recipient.email.toLowerCase()));
  queue = queue.filter((recipient) => !alreadySent.has(recipient.email.toLowerCase()));
  if (Number.isFinite(limitArg) && limitArg > 0) queue = queue.slice(0, limitArg);

  if (testEmail) {
    if (!EMAIL_RE.test(testEmail)) throw new Error('--test-email tidak valid.');
    queue = [{ ...analysis.valid[0], email: testEmail, name: 'Test Recipient', status: 'Pendaftar' }];
  }

  console.log(`Suppressed        : ${analysis.valid.filter((r) => suppression.has(r.email.toLowerCase())).length}`);
  console.log(`Already sent      : ${analysis.valid.filter((r) => alreadySent.has(r.email.toLowerCase())).length}`);
  console.log(`Queue             : ${queue.length}`);
  console.log(`Mode              : ${testEmail ? 'TEST EMAIL' : dryRun ? 'DRY RUN' : 'LIVE SEND'}`);

  if (!queue.length) return;

  if (dryRun) {
    console.log('\nDRY_RUN=true — tidak ada email yang dikirim. Set DRY_RUN=false setelah preview dan test email diperiksa.');
    return;
  }

  if (!testEmail && process.env.CONFIRM_SEND !== 'YES' && !hasArg('--confirm')) {
    throw new Error('Live blast diblokir. Set CONFIRM_SEND=YES atau tambahkan --confirm setelah recipient dan preview diperiksa.');
  }

  const transporter = createSmtpTransport();
  console.log('\nMemeriksa koneksi SMTP...');
  await transporter.verify();
  console.log('SMTP authentication berhasil.');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < queue.length; i += 1) {
    const recipient = queue[i];
    const { html, text } = renderEmail(recipient, campaign);

    const headers = {};
    if (unsubscribeEmail && EMAIL_RE.test(unsubscribeEmail)) {
      headers['List-Unsubscribe'] = `<mailto:${unsubscribeEmail}?subject=Berhenti%20PMB>`;
    }

    try {
      const info = await transporter.sendMail({
        from: {
          name: senderName,
          address: senderEmail
        },
        to: recipient.email,
        replyTo,
        subject,
        text,
        html,
        headers
      });

      success += 1;
      appendLog(sentLogFile, {
        timestamp: new Date().toISOString(),
        status: 'sent',
        email: recipient.email.toLowerCase(),
        applicantId: recipient.applicantId,
        smtpMessageId: info.messageId || null,
        accepted: info.accepted || [],
        rejected: info.rejected || []
      });
      console.log(`[${i + 1}/${queue.length}] SENT ${recipient.email}`);
    } catch (error) {
      failed += 1;
      appendLog(sentLogFile, {
        timestamp: new Date().toISOString(),
        status: 'failed',
        email: recipient.email.toLowerCase(),
        applicantId: recipient.applicantId,
        error: error?.message || String(error),
        code: error?.code || null,
        responseCode: error?.responseCode || null
      });
      console.error(`[${i + 1}/${queue.length}] FAILED ${recipient.email}: ${error?.message || error}`);
    }

    if (i < queue.length - 1 && delayMs > 0) await sleep(delayMs);
  }

  transporter.close();
  console.log(`\nSelesai. Sent: ${success}, Failed: ${failed}. Log: ${sentLogFile}`);
  if (failed) process.exitCode = 2;
}

main().catch((error) => {
  console.error(`\nERROR: ${error.message}`);
  process.exitCode = 1;
});
