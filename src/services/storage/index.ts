import { IStorageProvider } from './storage.interface';
import { CloudinaryService } from './cloudinary.service';

// Singleton instance of the configured storage provider
// Can be seamlessly switched to an S3Service or SupabaseService implementation if required in the future
export const storageService: IStorageProvider = new CloudinaryService();

export * from './storage.interface';
export * from './cloudinary.service';
