/**
 * Two-Factor Authentication Service
 * Implements TOTP (Time-based One-Time Password)
 */
import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
  /**
   * Generate a new 2FA secret for user
   */
  generateSecret(email: string): {
    secret: string;
    otpauthUrl: string;
  } {
    const secret = speakeasy.generateSecret({
      name: `Quantum Hedge (${email})`,
      issuer: 'Quantum Hedge',
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url || '',
    };
  }

  /**
   * Generate QR code for authenticator app
   */
  async generateQRCode(otpauthUrl: string): Promise<string> {
    return await QRCode.toDataURL(otpauthUrl);
  }

  /**
   * Verify TOTP token
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });
  }

  /**
   * Generate backup codes (10 single-use codes)
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
