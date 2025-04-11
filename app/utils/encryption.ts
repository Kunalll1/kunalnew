// app/utils/encryption.ts

import crypto from 'crypto';

/**
 * Encryption service implementation
 * Provides secure encryption and decryption of sensitive data
 */
class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';

  /**
   * Gets the encryption key from environment variables
   * @returns The encryption key as a Buffer
   * @throws Error if the encryption key is missing or invalid
   */
  private getEncryptionKey(): Buffer {
    // Get the encryption key from environment variables
    const key = process.env.ENCRYPTION_KEY || 'default_encryption_key_for_development_only';

    // Log a warning if using the default key
    if (key === 'default_encryption_key_for_development_only') {
      console.warn('WARNING: Using default encryption key. Set ENCRYPTION_KEY environment variable for production.');
    }

    // Convert hex string to buffer
    if (key.startsWith('hex:')) {
      const hexKey = key.substring(4);
      const buffer = Buffer.from(hexKey, 'hex');

      if (buffer.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
      }

      return buffer;
    }

    // Use string directly (hashed to get correct length)
    const hash = crypto.createHash('sha256');
    hash.update(key);
    return hash.digest();
  }

  /**
   * Encrypts a plaintext string
   * @param plaintext - The text to encrypt
   * @returns Promise resolving to the encrypted text
   */
  async encrypt(plaintext: string): Promise<string> {
    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);

      // Get the encryption key
      const key = this.getEncryptionKey();

      // Create the cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      // Encrypt the plaintext
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Return IV + encrypted data (IV is needed for decryption)
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts an encrypted string
   * @param encryptedText - The text to decrypt
   * @returns Promise resolving to the decrypted plaintext
   */
  async decrypt(encryptedText: string): Promise<string> {
    try {
      // Split the IV from the encrypted text
      const parts = encryptedText.split(':');

      if (parts.length !== 2) {
        throw new Error('Invalid encrypted text format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      // Get the encryption key
      const key = this.getEncryptionKey();

      // Create the decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

      // Decrypt the text
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

/**
 * Singleton instance of the encryption service
 */
export const encryptionService = new EncryptionService();