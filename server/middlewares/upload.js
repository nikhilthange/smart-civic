const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const path = require("path");

// ─── Allowed file types ───────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = {
  "image/jpeg": "image",
  "image/jpg":  "image",
  "image/png":  "image",
  "image/webp": "image",
  "image/gif":  "image",
  "video/mp4":  "video",
  "application/pdf": "raw",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── Cloudinary Storage ───────────────────────────────────────────────────────
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const resourceType = ALLOWED_MIME_TYPES[file.mimetype] || "raw";
    const isImage = resourceType === "image";

    return {
      folder: "smart-civic/complaints",
      resource_type: resourceType,
      // Compression & optimisation for images
      ...(isImage && {
        transformation: [
          {
            quality: "auto:good",      // Cloudinary auto quality
            fetch_format: "auto",      // Serve WebP to supporting browsers
            width: 1920,               // Cap width at Full HD
            crop: "limit",             // Never upscale
          },
        ],
      }),
      // Use original filename (sanitised) + timestamp for uniqueness
      public_id: `${Date.now()}-${path.basename(
        file.originalname,
        path.extname(file.originalname)
      ).replace(/[^a-zA-Z0-9_-]/g, "_")}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "pdf"],
    };
  },
});

// ─── Fallback disk storage (when Cloudinary creds are missing) ────────────────
const fs = require("fs");
const diskUploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(diskUploadDir)) fs.mkdirSync(diskUploadDir, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, diskUploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

// ─── File filter ──────────────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        `Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP, GIF, MP4, PDF`
      )
    );
  }
};

// ─── Pick storage backend based on env ────────────────────────────────────────
const hasCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name";

const storage = hasCloudinary ? cloudinaryStorage : diskStorage;

if (!hasCloudinary) {
  console.warn(
    "⚠️  Cloudinary credentials not set — falling back to local disk storage.\n" +
    "    Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env"
  );
}

let exifr = null;
try {
  exifr = require("exifr");
} catch (e) {
  console.warn("⚠️ exifr optional dependency loading note:", e.message);
}

/**
 * Extracts GPS coordinates and timestamp from image file path or buffer
 */
const extractExifGps = async (filePathOrBuffer) => {
  if (!exifr) return null;
  try {
    const data = await exifr.parse(filePathOrBuffer, {
      gps: true,
      tiff: true,
      exif: true,
    });
    if (data && (data.latitude || data.latitude === 0) && (data.longitude || data.longitude === 0)) {
      return {
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        dateTime: data.DateTimeOriginal || data.CreateDate || null,
      };
    }
  } catch (err) {
    // Silently ignore images without EXIF header
  }
  return null;
};

/**
 * Express middleware to automatically extract EXIF GPS coordinates from uploaded photo(s)
 * and attach to req.exifLocation
 */
const processExifMetadata = async (req, _res, next) => {
  try {
    req.exifLocation = null;
    const files = req.files || (req.file ? [req.file] : []);
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.path && !file.path.startsWith("http") && fs.existsSync(file.path)) {
          const gps = await extractExifGps(file.path);
          if (gps) {
            req.exifLocation = gps;
            console.log(`📍 EXIF GPS extracted from uploaded photo: [Lat: ${gps.latitude}, Lng: ${gps.longitude}]`);
            break;
          }
        } else if (file.buffer) {
          const gps = await extractExifGps(file.buffer);
          if (gps) {
            req.exifLocation = gps;
            console.log(`📍 EXIF GPS extracted from uploaded buffer: [Lat: ${gps.latitude}, Lng: ${gps.longitude}]`);
            break;
          }
        }
      }
    }
  } catch (err) {
    console.warn("EXIF processing warning:", err.message);
  }
  next();
};

// ─── Multer instance ──────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
});

// ─── Error handler middleware ─────────────────────────────────────────────────
const handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE:       "File too large. Maximum size is 10 MB per file.",
      LIMIT_FILE_COUNT:      "Too many files. Maximum is 5 attachments.",
      LIMIT_UNEXPECTED_FILE: err.message || "Unexpected file field.",
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || `Upload error: ${err.message}`,
    });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// ─── Helper: normalise uploaded files to our attachment schema ────────────────
// Works for both Cloudinary and disk storage uploads
const normaliseAttachments = (files = []) =>
  files.map((f) => {
    // Cloudinary sets f.path to the secure URL; disk sets f.path to local path
    const isCloudinary = Boolean(f.filename && f.path && f.path.startsWith("http"));
    const generatedName = f.filename || f.originalname || `upload_${Date.now()}.jpg`;
    const defaultUrl = isCloudinary ? f.path : (f.path ? `/uploads/${path.basename(f.path)}` : `/uploads/${generatedName}`);
    return {
      url:        defaultUrl,
      path:       f.path || null,
      buffer:     f.buffer || null,
      publicId:   f.filename || generatedName,
      filename:   f.originalname || f.filename || generatedName,
      mimetype:   f.mimetype || "image/jpeg",
      size:       f.size || (f.buffer ? f.buffer.length : 0),
      resourceType: ALLOWED_MIME_TYPES[f.mimetype] || "image",
    };
  });

module.exports = {
  upload,
  handleUploadError,
  processExifMetadata,
  extractExifGps,
  normaliseAttachments,
  hasCloudinary,
};
