import multer from "multer";

// File memory mein rakh rha hu abhi
export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(Object.assign(new Error("Only PDF files are allowed"), { status: 400 }));
  },
});