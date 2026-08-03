import bcrypt from "bcryptjs";
import { DEFAULT_PASSWORD } from "./constants";

let cachedHash: string | null = null;

/**
 * Get a cached bcrypt hash for default seeded account passwords ("12345678").
 * Prevents heavy CPU bottlenecks during high-volume seeding.
 */
export async function getDefaultPasswordHash(): Promise<string> {
  if (!cachedHash) {
    cachedHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  }
  return cachedHash;
}

