import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { buildRecruiterProfile } from "../utils/recruiterVerification.js";
import { hashToken, issueEmailVerification } from "../services/emailVerification.service.js";
import { OAuth2Client } from "google-auth-library";
const createToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified === true,
  verificationStatus: user.verificationStatus || "none",
  verificationReason: user.verificationReason || "",
  companyName: user.recruiterProfile?.companyName || "",
});

const isText = (v) => typeof v === "string";
const googleClient = new OAuth2Client();
export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    // Type check: email={"$ne":null} jaisi NoSQL injection yahin ruk jati hai
    if (!isText(name) || !isText(email) || !isText(password) || !name.trim() || !email.trim() || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    // Sirf candidate ya recruiter. Admin register se kabhi nahi
    const isRecruiter = role === "recruiter";
    const cleanEmail = email.trim().toLowerCase();

    const recruiterProfile = isRecruiter ? buildRecruiterProfile(req.body, cleanEmail) : undefined;

    const exists = await User.findOne({ email: cleanEmail });
    if (exists) return res.status(409).json({ message: "Email already registered." });

    const hashed = await bcrypt.hash(password, 10);

    // Body se sirf upar wale fields. verificationStatus/isBlocked/emailVerified server decide karta hai
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashed,
      role: isRecruiter ? "recruiter" : "candidate",
      verificationStatus: isRecruiter ? "pending" : "none",
      verificationSubmittedAt: isRecruiter ? new Date() : undefined,
      recruiterProfile,
    });

    if (isRecruiter) await issueEmailVerification(user);

    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!isText(email) || !isText(password) || !email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    const ok = user && user.password && (await bcrypt.compare(password, user.password));
    if (!ok) return res.status(401).json({ message: "Invalid email or password." });
    if (user.isBlocked) return res.status(403).json({ message: "Your account has been blocked." });

    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}
export async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body;
    if (!isText(credential) || !credential) {
      return res.status(400).json({ message: "Google credential is missing." });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ message: "Google sign-in is not configured on the server." });
    }

    // Google ka token SERVER pe verify hota hai. Frontend ki baat par bharosa nahi
    let profile;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID, // token isi app ke liye bana hona chahiye
      });
      profile = ticket.getPayload();
    } catch {
      return res.status(401).json({ message: "Google sign-in failed. Please try again." });
    }
    if (!profile?.sub || !profile.email || profile.email_verified !== true) {
      return res.status(401).json({ message: "Your Google email is not verified." });
    }

    const email = profile.email.toLowerCase();
    let user = await User.findOne({ googleId: profile.sub }).select("+password");
    if (!user) user = await User.findOne({ email }).select("+password");

    if (user?.isBlocked) return res.status(403).json({ message: "Your account has been blocked." });

    if (!user) {
      // Naya account: hamesha candidate. Recruiter email form se register karta hai
      user = await User.create({
        name: profile.name || email.split("@")[0],
        email,
        googleId: profile.sub,
        role: "candidate",
        emailVerified: true,
      });
    } else if (!user.googleId) {
      // Purana account same email se mila: Google se link karo.
      // Agar email pehle verify nahi tha, to purana password hata do (neeche note dekho)
      if (!user.emailVerified) user.password = undefined;
      user.googleId = profile.sub;
      user.emailVerified = true;
      await user.save();
    }

    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}
export async function getMe(req, res) {
  res.json({ user: publicUser(req.user) });
}

// Link se token aata hai. POST hai taaki email scanner ka GET token na kha jaye
export async function verifyEmail(req, res, next) {
  try {
    const token = String(req.body.token || "");
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ message: "This verification link is invalid or expired." });
    }

    const user = await User.findOne({
      emailVerifyTokenHash: hashToken(token),
      emailVerifyExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: "This verification link is invalid or expired." });

    user.emailVerified = true;
    user.emailVerifyTokenHash = undefined; // single-use
    user.emailVerifyExpires = undefined;
    await user.save();

    res.json({ message: "Email verified.", user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("+emailVerifySentAt");
    if (user.emailVerified) return res.status(400).json({ message: "Your email is already verified." });

    const waitMs = 60000 - (Date.now() - (user.emailVerifySentAt?.getTime() || 0));
    if (waitMs > 0) {
      return res.status(429).json({
        message: `Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another email.`,
      });
    }

    await issueEmailVerification(user);
    res.json({ message: "Verification email sent." });
  } catch (err) {
    next(err);
  }
}