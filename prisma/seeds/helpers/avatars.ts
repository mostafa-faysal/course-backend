import { cloudinaryAssets } from "./assets";

/**
 * Deterministically assign a verified Cloudinary portrait or avatar based on index.
 */
export function getAvatar(index: number): string {
  const list = cloudinaryAssets.avatars;
  return list[index % list.length];
}
