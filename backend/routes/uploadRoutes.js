const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { protect } = require('../middleware/authMiddleware');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Check for Cloudinary configuration
let cloudinary = null;
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('[Upload] ✅ Cloudinary storage service connected');
  } catch (err) {
    console.warn('[Upload] Note: Cloudinary package not loaded, using local static storage.');
  }
}

// Configure Multer Disk Storage (Fast & Local Persistent Fallback)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `agri-${uniqueSuffix}${ext}`);
  },
});

// File filter: only images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

// Helper to determine the public URL
function getPublicUrl(req, filename) {
  // If request comes with origin or host
  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${protocol}://${host}/uploads/${filename}`;
}

// Upload single image
router.post('/single', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    let finalUrl = getPublicUrl(req, req.file.filename);

    // If Cloudinary is available, optionally upload to Cloudinary CDN
    if (cloudinary) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: 'agriconnect',
          resource_type: 'image',
        });
        if (uploadResult && uploadResult.secure_url) {
          finalUrl = uploadResult.secure_url;
          // Clean up local temp file
          fs.unlink(req.file.path, () => {});
        }
      } catch (cloudErr) {
        console.warn('[Upload] Cloudinary upload notice, using local file URL:', cloudErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: finalUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (error) {
    console.error('[Upload] Error uploading single image:', error);
    res.status(500).json({ success: false, message: error.message || 'Image upload failed' });
  }
});

// Upload multiple images (up to 6)
router.post('/multiple', protect, upload.array('images', 6), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files uploaded' });
    }

    const urls = [];

    for (const file of req.files) {
      let finalUrl = getPublicUrl(req, file.filename);

      if (cloudinary) {
        try {
          const uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: 'agriconnect',
            resource_type: 'image',
          });
          if (uploadResult && uploadResult.secure_url) {
            finalUrl = uploadResult.secure_url;
            fs.unlink(file.path, () => {});
          }
        } catch (cloudErr) {
          console.warn('[Upload] Cloudinary upload notice, using local file URL:', cloudErr.message);
        }
      }

      urls.push(finalUrl);
    }

    res.status(200).json({
      success: true,
      message: `${urls.length} images uploaded successfully`,
      urls,
      count: urls.length,
    });
  } catch (error) {
    console.error('[Upload] Error uploading multiple images:', error);
    res.status(500).json({ success: false, message: error.message || 'Multiple image upload failed' });
  }
});

module.exports = router;

