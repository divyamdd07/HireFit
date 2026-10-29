import nodemailer from "nodemailer";
import User from "../models/User.js";

const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";
const useBrevo = () => Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);

// HTML mein user ka data daalne se pehle zaroori (HTML injection rokta hai)
const escapeHtml = (text) =>
  String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Subject mein newline nahi hona chahiye
const cleanSubject = (text) => String(text).replace(/[\r\n]+/g, " ").slice(0, 150);

// ---------- SMTP transporter (local development ke liye) ----------
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000, // atakne ki jagah jaldi fail
    socketTimeout: 15000,
  });
  return transporter;
}

const emailConfigured = () => useBrevo() || Boolean(getTransporter());

// Server start pe ek baar: sirf log karta hai
export async function verifyEmailSetup() {
  if (useBrevo()) return console.log("Email: using Brevo HTTP API");

  const t = getTransporter();
  if (!t) return console.warn("Email: not configured. Emails will be skipped.");
  try {
    await t.verify();
    console.log("Email: SMTP connection OK");
  } catch (err) {
    console.error("Email: SMTP connection failed:", err.message);
  }
}

// ---------- Simple HTML template ----------
function buildHtml({ heading, lines, linkPath, linkText }) {
  const body = lines.map((line) => `<p style="margin:0 0 10px">${escapeHtml(line)}</p>`).join("");
  const button = linkPath
    ? `<p style="margin:20px 0 0"><a href="${escapeHtml(clientUrl() + linkPath)}"
         style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">
         ${escapeHtml(linkText || "Open SmartHire")}</a></p>`
    : "";

  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#111827">
    <h2 style="color:#2563eb;margin-top:0">SmartHire</h2>
    <h3 style="margin:0 0 16px">${escapeHtml(heading)}</h3>
    ${body}
    ${button}
    <p style="margin-top:28px;font-size:12px;color:#6b7280">This is an automated message from SmartHire.</p>
  </div>`;
}

// ---------- Brevo HTTP API (port 443, Render pe chalta hai) ----------
async function sendViaBrevo({ to, subject, html, text }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: process.env.BREVO_SENDER_NAME || "SmartHire", email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status}: ${detail.slice(0, 300)}`);
  }
}

// ---------- Low-level: ek email bhejo. Kabhi throw nahi karta ----------
async function sendEmail({ to, subject, html, text }) {
  if (!emailConfigured()) return;
  const cleanedSubject = cleanSubject(subject);
  try {
    if (useBrevo()) {
      await sendViaBrevo({ to, subject: cleanedSubject, html, text });
    } else {
      await getTransporter().sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject: cleanedSubject,
        html,
        text,
      });
    }
  } catch (err) {
    console.error("Email failed:", err.message);
  }
}

// ---------- Ek user ko (user id se) ----------
export async function emailUser(userId, { subject, heading, lines, linkPath, linkText }) {
  try {
    if (!emailConfigured()) return;
    const user = await User.findById(userId).select("email name isBlocked");
    if (!user || user.isBlocked) return;

    await sendEmail({
      to: user.email,
      subject,
      html: buildHtml({ heading, lines: [`Hi ${user.name},`, ...lines], linkPath, linkText }),
      text: [`Hi ${user.name},`, ...lines].join("\n"),
    });
  } catch (err) {
    console.error("emailUser failed:", err.message);
  }
}

// ---------- Bahut saare users ko: ek ek karke ----------
export async function emailUsers(userIds, payload) {
  for (const id of userIds) {
    await emailUser(id, payload);
  }
}