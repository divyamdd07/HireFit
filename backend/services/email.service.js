import nodemailer from "nodemailer";
import User from "../models/User.js";

const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

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

// ---------- Transporter: pehli baar zarurat pe banta hai ----------
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null; // email setup nahi hai

  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 465 = seedha SSL, 587/2525 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

// Server start pe ek baar: sirf log karta hai
export async function verifyEmailSetup() {
  const t = getTransporter();
  if (!t) return console.warn("Email: SMTP not configured. Emails will be skipped.");
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
         ${escapeHtml(linkText || "Open HireFit")}</a></p>`
    : "";

  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#111827">
    <h2 style="color:#2563eb;margin-top:0">HireFit</h2>
    <h3 style="margin:0 0 16px">${escapeHtml(heading)}</h3>
    ${body}
    ${button}
    <p style="margin-top:28px;font-size:12px;color:#6b7280">This is an automated message from HireFit.</p>
  </div>`;
}

// ---------- Low-level: ek email bhejo. Kabhi throw nahi karta ----------
async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) return;
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: cleanSubject(subject),
      html,
      text,
    });
  } catch (err) {
    console.error("Email failed:", err.message);
  }
}

// ---------- Ek user ko (user id se) ----------
export async function emailUser(userId, { subject, heading, lines, linkPath, linkText }) {
  try {
    if (!getTransporter()) return;
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

// ---------- Bahut saare users ko: ek ek karke (SMTP ko spam nahi karte) ----------
export async function emailUsers(userIds, payload) {
  for (const id of userIds) {
    await emailUser(id, payload);
  }
}