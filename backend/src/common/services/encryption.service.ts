import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  private readonly tagPosition = this.saltLength + this.ivLength;
  private readonly encryptedPosition = this.tagPosition + this.tagLength;

  constructor(private configService: ConfigService) {}

  /**
   * Get encryption key from environment or generate one
   */
  private getEncryptionKey(): Buffer {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      this.logger.warn('ENCRYPTION_KEY not set, using default (not secure for production)');
      return crypto.scryptSync('default-key', 'salt', this.keyLength);
    }
    return Buffer.from(key, 'hex');
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(data: string, password?: string): string {
    try {
      const key = password
        ? crypto.scryptSync(password, 'salt', this.keyLength)
        : this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const salt = crypto.randomBytes(this.saltLength);

      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      cipher.setAAD(salt);

      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Combine: salt + iv + tag + encrypted
      return (
        salt.toString('hex') +
        iv.toString('hex') +
        tag.toString('hex') +
        encrypted
      );
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData: string, password?: string): string {
    try {
      const key = password
        ? crypto.scryptSync(password, 'salt', this.keyLength)
        : this.getEncryptionKey();

      const salt = Buffer.from(
        encryptedData.slice(0, this.saltLength * 2),
        'hex',
      );
      const iv = Buffer.from(
        encryptedData.slice(this.saltLength * 2, this.tagPosition),
        'hex',
      );
      const tag = Buffer.from(
        encryptedData.slice(this.tagPosition, this.encryptedPosition),
        'hex',
      );
      const encrypted = encryptedData.slice(this.encryptedPosition);

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      decipher.setAAD(salt);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash data using SHA256
   */
  hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate random key
   */
  generateKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate random bytes
   */
  generateRandomBytes(length: number): Buffer {
    return crypto.randomBytes(length);
  }
}

