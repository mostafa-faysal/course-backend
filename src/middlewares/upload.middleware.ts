import multer from 'multer';

// Use memory storage to temporarily hold the file before uploading it to Supabase
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // Limit file size to 100MB
  },
});
