
/**
 * EncryptionFacade provides a simple interface for encrypting and decrypting sensitive data.
 * It abstracts away the complexity of cryptographic operations and key management.
 */
export interface EncryptionFacade {
    /**
     * Encrypts a plaintext string
     * @param plaintext - The text to encrypt
     * @returns The encrypted text
     */
    encrypt(plaintext: string): Promise<string>;
    
    /**
     * Decrypts an encrypted string
     * @param encryptedText - The text to decrypt
     * @returns The decrypted plaintext
     */
    decrypt(encryptedText: string): Promise<string>;
  }
  
  // Import the actual implementation
  import { encryptionService } from '../utils/encryption';
  
  /**
   * Default implementation of the EncryptionFacade
   * This exports a singleton instance of the facade for use throughout the app
   */
  export const encryptionFacade: EncryptionFacade = encryptionService;