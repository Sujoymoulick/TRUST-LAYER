/**
 * Cryptographic utilities for Zero-Knowledge Identity Anchors
 */

/**
 * Generates a SHA-256 hash of a string.
 * Used for storing "Identity Anchors" without exposing raw documents.
 */
export async function generateAnchorHash(data: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Placeholder for AES-256 encryption.
 * In a real-world scenario, this should use a secure KMS or Supabase Vault.
 */
export async function encryptIdentityValue(value: string, secretKey: string): Promise<string> {
  // Simple Base64 "encryption" placeholder for demonstration.
  // NOTE: Replace with Web Crypto API or Supabase Vault for production.
  return btoa(`${secretKey}:${value}`);
}
