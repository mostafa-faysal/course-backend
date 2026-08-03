import multer from 'multer';
import path from 'path';

// Use memory storage to temporarily hold the file in buffer before cloud streaming
const storage = multer.memoryStorage();

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Strict 5MB size limit for avatars
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isMimeValid = allowedMimeTypes.includes(file.mimetype);
    const isExtValid = allowedExtensions.includes(ext);

    if (isMimeValid && isExtValid) {
      cb(null, true);
    } else {
      cb(new Error('Bad Request: Unsupported file format. Only JPEG, PNG, and WebP images are allowed.') as any, false);
    }
  },
});

