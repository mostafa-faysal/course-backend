import { Express } from 'express';

export interface IStorageProvider {
  /**
   * Uploads an avatar image to the cloud storage provider after validating file integrity.
   * @param userId - The ID of the user owning the avatar
   * @param file - The Express.Multer.File object containing memory buffer
   * @returns Promise containing the generated public URL of the uploaded image
   */
  uploadAvatar(userId: string, file: Express.Multer.File): Promise<{ url: string }>;

  /**
   * Deletes a file from the storage provider given its public URL.
   * Silently ignores URLs from external or fallback providers (e.g. DiceBear initials).
   * @param fileUrl - The public URL of the file to delete
   */
  deleteFile(fileUrl: string): Promise<void>;
}
