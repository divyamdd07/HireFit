export const isVerifiedRecruiter = (user) =>
  user?.role === "recruiter" && user.emailVerified === true && user.verificationStatus === "verified";