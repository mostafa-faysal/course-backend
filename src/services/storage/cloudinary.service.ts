import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import crypto from 'crypto';
import { Express } from 'express';
import { IStorageProvider } from './storage.interface';
import { logger } from '../../utils/logger';

// Configure Cloudinary SDK with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService implements IStorageProvider {
  /**
   * Verifies file integrity by checking Magic Bytes against JPEG, PNG, and WebP signatures.
   */
  private validateMagicBytes(buffer: Buffer): void {
    if (!buffer || buffer.length < 12) {
      throw new Error('Bad Request: Corrupted or empty file buffer');
    }

    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isWebp =
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && // RIFF
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50; // WEBP

    if (!isJpeg && !isPng && !isWebp) {
      logger.warn('Security alert: Rejected avatar file due to mismatched magic bytes (MIME forgery attempt)');
      throw new Error('Bad Request: Security check failed. Invalid magic bytes or forged file format.');
    }
  }

  public async uploadAvatar(userId: string, file: Express.Multer.File): Promise<{ url: string }> {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Internal Server Error: Cloudinary storage credentials are not properly configured');
    }

    // Perform deep security validation (Magic Bytes)
    this.validateMagicBytes(file.buffer);

    const folderPath = `avatars/${userId}`;
    const uniqueFileName = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          public_id: uniqueFileName,
          resource_type: 'image',
          // Enterprise Image Transformations: auto format, auto quality, resized to 300x300, face crop
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' }
          ],
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) {
            logger.error('Cloudinary upload failure', { error: error?.message, userId });
            return reject(new Error(`Internal Server Error: Failed to upload image to Cloud storage: ${error?.message || 'Unknown storage error'}`));
          }
          resolve({ url: result.secure_url });
        }
      );

      // Pipe memory buffer into Cloudinary upload stream without temporary disk storage
      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  public async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) return;

    // Guard: Only delete files hosted on our Cloudinary account. Avoid touching DiceBear initials or external URIs.
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!fileUrl.includes('cloudinary.com') || (cloudName && !fileUrl.includes(cloudName))) {
      logger.debug('Skipping deletion of non-Cloudinary or external avatar URL', { fileUrl });
      return;
    }

    try {
      // Extract public_id from Cloudinary URL (e.g. /upload/v12345/avatars/userId/uuid.webp -> avatars/userId/uuid)
      const match = fileUrl.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
      if (match && match[1]) {
        const publicId = match[1];
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        logger.info('Successfully deleted old Cloudinary avatar asset', { publicId });
      } else {
        logger.warn('Could not extract public_id from Cloudinary asset URL for deletion', { fileUrl });
      }
    } catch (error: any) {
      // Non-blocking error handling as required by enterprise architectural specifications
      logger.warn('Failed to delete old avatar asset from Cloudinary (non-blocking)', { fileUrl, error: error?.message });
    }
  }
}
