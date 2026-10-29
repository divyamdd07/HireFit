import dns from "dns/promises";
import { buildRecruiterProfile } from "../utils/recruiterVerification.js";
import { logAudit } from "../services/moderation.service.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });

const dnsHost = (domain) => `_hirefit.${domain}`;
const dnsValue = (token) => `hirefit-verify=${token}`;

const view = (user) => {
  const p = user.toObject().recruiterProfile || {};
  return {
    verificationStatus: user.verificationStatus || "none",
    verificationReason: user.verificationReason || "",
    emailVerified: user.emailVerified === true,
    profile: {
      companyName: p.companyName || "",
      companyWebsite: p.companyWebsite || "",
      companyDomain: p.companyDomain || "",
      designation: p.designation || "",
      linkedinUrl: p.linkedinUrl || "",
      note: p.note || "",
      domainVerified: p.domainVerified === true,
    },
    dnsRecord:
      p.companyDomain && p.domainToken
        ? { type: "TXT", host: dnsHost(p.companyDomain), value: dnsValue(p.domainToken) }
        : null,
  };
};

export async function getMine(req, res) {
  res.json(view(req.user));
}

// none / pending / rejected mein details dobara bhej sakte hain.
// verified ya suspended mein nahi (approve ke baad company badalna allowed nahi)
export async function resubmit(req, res, next) {
  try {
    const user = req.user;
    const status = user.verificationStatus || "none";
    if (!["none", "pending", "rejected"].includes(status)) {
      throw httpError(400, "Your details cannot be changed in the current status.");
    }

    const previous = user.toObject().recruiterProfile || {};
    user.recruiterProfile = buildRecruiterProfile(req.body, user.email, previous);
    user.verificationStatus = "pending";
    user.verificationReason = "";
    user.verificationSubmittedAt = new Date();
    await user.save();

    logAudit({
      actor: user._id,
      target: user._id,
      action: "recruiter.submit",
      details: { from: status, company: user.recruiterProfile.companyName },
    });
    res.json(view(user));
  } catch (err) {
    next(err);
  }
}

// DNS TXT check: _hirefit.<domain> pe "hirefit-verify=<token>" hona chahiye
export async function checkDomain(req, res, next) {
  try {
    const user = req.user;
    const p = user.toObject().recruiterProfile || {};
    if (!p.companyDomain || !p.domainToken) throw httpError(400, "No company domain to verify.");
    if (p.domainVerified) return res.json(view(user));

    let records;
    try {
      records = await dns.resolveTxt(dnsHost(p.companyDomain));
    } catch {
      throw httpError(400, "TXT record not found yet. DNS changes can take a few minutes to a few hours.");
    }

    const expected = dnsValue(p.domainToken);
    if (!records.some((chunks) => chunks.join("") === expected)) {
      throw httpError(400, "A TXT record was found, but the value does not match. Check for typos.");
    }

    user.set("recruiterProfile.domainVerified", true);
    await user.save();
    logAudit({ actor: user._id, target: user._id, action: "recruiter.domain_verified", details: { domain: p.companyDomain } });

    res.json(view(user));
  } catch (err) {
    next(err);
  }
}