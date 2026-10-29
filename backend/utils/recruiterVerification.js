import crypto from "crypto";

const httpError = (status, message) => Object.assign(new Error(message), { status });

export const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.in", "ymail.com", "outlook.com",
  "hotmail.com", "live.com", "msn.com", "icloud.com", "me.com", "proton.me",
  "protonmail.com", "aol.com", "rediffmail.com", "zoho.com", "gmx.com", "mail.com", "yandex.com",
]);

export const emailDomainOf = (email) => String(email).toLowerCase().split("@")[1] || "";
const stripWww = (host) => host.replace(/^www\./, "");

function text(value, label, min, max) {
  const v = String(value ?? "").trim();
  if (v.length < min) throw httpError(400, `${label} is required.`);
  if (v.length > max) throw httpError(400, `${label} is too long (max ${max} characters).`);
  return v;
}

function parseUrl(value, label) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url;
  } catch {
    throw httpError(400, `${label} is not a valid URL.`);
  }
}

function parseWebsite(value) {
  const url = parseUrl(value, "Company website");
  if (!url) return null;
  const host = stripWww(url.hostname.toLowerCase());
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
  if (!host.includes(".") || isIp || host === "localhost") {
    throw httpError(400, "Enter a real company website (not an IP address or localhost).");
  }
  return { url: url.origin, domain: host };
}

function parseLinkedin(value) {
  const url = parseUrl(value, "LinkedIn URL");
  if (!url) return "";
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || !(host === "linkedin.com" || host.endsWith(".linkedin.com"))) {
    throw httpError(400, "LinkedIn URL must be a https://linkedin.com link.");
  }
  return url.href.slice(0, 300);
}

// Form data -> saaf recruiterProfile. previous = pehle ka profile (domain same ho to DNS proof na ude)
export function buildRecruiterProfile(body, email, previous = {}) {
  const companyName = text(body.companyName, "Company name", 2, 100);
  const designation = text(body.designation, "Designation", 2, 80);
  const note = text(body.note, "Note", 0, 500);
  const site = parseWebsite(body.companyWebsite);
  const linkedinUrl = parseLinkedin(body.linkedinUrl);

  const emailDomain = emailDomainOf(email);
  const freeEmail = FREE_EMAIL_DOMAINS.has(emailDomain);
  if ((freeEmail || !site) && !linkedinUrl) {
    throw httpError(
      400,
      "A LinkedIn profile is required when you use a personal email or have no company website."
    );
  }

  // Domain client se nahi leते: website se, warna (personal email na ho to) email se
  const companyDomain = site?.domain || (freeEmail ? "" : emailDomain);
  const sameDomain = Boolean(previous.companyDomain) && previous.companyDomain === companyDomain;

  return {
    companyName,
    companyWebsite: site?.url || "",
    companyDomain,
    designation,
    linkedinUrl,
    note,
    domainToken: companyDomain
      ? (sameDomain && previous.domainToken) || crypto.randomBytes(16).toString("hex")
      : "",
    domainVerified: sameDomain && previous.domainVerified === true,
  };
}

const related = (a, b) => a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);

// Admin ko dikhane ke liye signals. Ye sirf madad hai, auto-approve nahi
export function getSignals(user) {
  const p = user.recruiterProfile || {};
  const emailDomain = emailDomainOf(user.email);
  return {
    emailDomain,
    emailVerified: user.emailVerified === true,
    freeEmail: FREE_EMAIL_DOMAINS.has(emailDomain),
    hasWebsite: Boolean(p.companyWebsite),
    domainMatch: p.companyWebsite && p.companyDomain ? related(emailDomain, p.companyDomain) : null,
    domainVerified: p.domainVerified === true,
    hasLinkedin: Boolean(p.linkedinUrl),
  };
}