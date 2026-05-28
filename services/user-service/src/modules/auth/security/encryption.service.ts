/**
 * Encryption Service
 * Handles AES-256-GCM encryption for sensitive data (API keys, etc.)
 */
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly saltLength = 64;
  private readonly iterations = 100000;

  private getMasterKey(): Buffer {
    const masterKey = process.env.ENCRYPTION_KEY;
    if (!masterKey) {
      throw new Error('ENCRYPTION_KEY not set');
    }
    return Buffer.from(masterKey, 'hex');
  }

  /**
   * Derive user-specific encryption key
   */
  private deriveKey(userId: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      this.getMasterKey(),
      Buffer.concat([Buffer.from(userId), salt]),
      this.iterations,
      this.keyLength,
      'sha256'
    );
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext: string, userId: string): string {
    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(this.ivLength);
    const key = this.deriveKey(userId, salt);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    // Combine: salt + iv + tag + encrypted
    const combined = Buffer.concat([salt, iv, tag, encrypted]);
    return combined.toString('base64');
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(ciphertext: string, userId: string): string {
    const combined = Buffer.from(ciphertext, 'base64');

    const salt = combined.slice(0, this.saltLength);
    const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
    const tag = combined.slice(
      this.saltLength + this.ivLength,
      this.saltLength + this.ivLength + this.tagLength
    );
    const encrypted = combined.slice(this.saltLength + this.ivLength + this.tagLength);

    const key = this.deriveKey(userId, salt);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Generate a secure random key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
