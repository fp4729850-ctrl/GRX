import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import { AuditService } from '../common/services/audit.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { VerifyCertificateDto } from './dto/verify-certificate.dto';
import { UpdateCertificateStatusDto } from './dto/update-certificate-status.dto';
import { ethers } from 'ethers';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);

  // Vault partner public keys (in production, these would be stored securely)
  private readonly vaultPublicKeys: Record<string, string> = {
    MMTC_PAMP: process.env.VAULT_MMTC_PAMP_PUBLIC_KEY || '',
    AUGMONT: process.env.VAULT_AUGMONT_PUBLIC_KEY || '',
    SAFEGOLD: process.env.VAULT_SAFEGOLD_PUBLIC_KEY || '',
    DMCC: process.env.VAULT_DMCC_PUBLIC_KEY || '',
  };

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private auditService: AuditService,
  ) {}

  /**
   * Generate certId (bytes32 hash) from certificate data
   */
  private generateCertId(
    vaultPartner: string,
    vaultCertId: string,
    payload: string,
  ): string {
    const abiCoder = new ethers.AbiCoder();
    const encoded = abiCoder.encode(
      ['string', 'string', 'string'],
      [vaultPartner, vaultCertId, payload],
    );
    return ethers.keccak256(encoded);
  }

  /**
   * Verify vault signature
   * In production, this would use the vault partner's public key
   */
  private async verifySignature(
    vaultPartner: string,
    payload: string,
    signature: string,
  ): Promise<boolean> {
    try {
      // Get public key for vault partner
      const publicKey = this.vaultPublicKeys[vaultPartner];
      if (!publicKey) {
        this.logger.warn(
          `Public key not configured for vault partner: ${vaultPartner}`,
        );
        // In development, allow if no public key configured
        return process.env.NODE_ENV !== 'production';
      }

      // Hash the payload
      const payloadHash = this.encryptionService.hash(payload);

      // Verify signature (simplified - in production use proper ECDSA verification)
      // For now, we'll just check that signature is not empty
      if (!signature || signature.length === 0) {
        return false;
      }

      // TODO: Implement proper ECDSA signature verification
      // const recoveredAddress = ethers.verifyMessage(payloadHash, signature);
      // return recoveredAddress.toLowerCase() === publicKey.toLowerCase();

      // For now, return true if signature exists (placeholder)
      return true;
    } catch (error) {
      this.logger.error('Error verifying signature', error);
      return false;
    }
  }

  /**
   * Create certificate from vault partner
   */
  async createCertificate(dto: CreateCertificateDto) {
    try {
      // Validate payload is valid JSON
      let parsedPayload: any;
      try {
        parsedPayload = JSON.parse(dto.payload);
      } catch (error) {
        throw new BadRequestException('Invalid payload JSON');
      }

      // Generate certId (bytes32 hash)
      const certId = this.generateCertId(
        dto.vaultPartner,
        dto.vaultCertId,
        dto.payload,
      );

      // Check if certificate already exists
      const existing = await this.prisma.certificate.findUnique({
        where: { certId },
      });

      if (existing) {
        throw new BadRequestException('Certificate already exists');
      }

      // Hash payload
      const payloadHash = this.encryptionService.hash(dto.payload);

      // Verify signature
      const isValidSignature = await this.verifySignature(
        dto.vaultPartner,
        dto.payload,
        dto.signature,
      );

      if (!isValidSignature) {
        throw new BadRequestException('Invalid vault signature');
      }

      // Create certificate
      const certificate = await this.prisma.certificate.create({
        data: {
          certId,
          vaultPartner: dto.vaultPartner,
          vaultCertId: dto.vaultCertId,
          payload: dto.payload,
          payloadHash,
          signature: dto.signature,
          grams: new Decimal(dto.grams),
          status: isValidSignature ? 'VERIFIED' : 'PENDING',
        },
      });

      // Log audit
      await this.auditService.logAction({
        action: 'CERTIFICATE_CREATED',
        resourceType: 'CERTIFICATE',
        resourceId: certificate.id,
        details: {
          certId,
          vaultPartner: dto.vaultPartner,
          vaultCertId: dto.vaultCertId,
          grams: dto.grams,
          status: certificate.status,
        },
      });

      this.logger.log(
        `Certificate created: ${certId} from ${dto.vaultPartner}`,
      );

      return {
        id: certificate.id,
        certId: certificate.certId,
        vaultPartner: certificate.vaultPartner,
        vaultCertId: certificate.vaultCertId,
        grams: certificate.grams.toString(),
        status: certificate.status,
        createdAt: certificate.createdAt,
      };
    } catch (error) {
      this.logger.error('Error creating certificate', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create certificate');
    }
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(dto: VerifyCertificateDto) {
    try {
      const certificate = await this.prisma.certificate.findUnique({
        where: { certId: dto.certId },
      });

      if (!certificate) {
        throw new NotFoundException('Certificate not found');
      }

      if (dto.reVerify || certificate.status === 'PENDING') {
        // Re-verify signature
        const isValidSignature = await this.verifySignature(
          certificate.vaultPartner,
          certificate.payload,
          certificate.signature || '',
        );

        if (!isValidSignature) {
          // Update status to REJECTED
          await this.prisma.certificate.update({
            where: { certId: dto.certId },
            data: { status: 'REJECTED' },
          });

          throw new BadRequestException('Certificate signature verification failed');
        }

        // Update status to VERIFIED
        const updated = await this.prisma.certificate.update({
          where: { certId: dto.certId },
          data: { status: 'VERIFIED' },
        });

        // Log audit
        await this.auditService.logAction({
          action: 'CERTIFICATE_VERIFIED',
          resourceType: 'CERTIFICATE',
          resourceId: certificate.id,
          details: {
            certId: dto.certId,
            vaultPartner: certificate.vaultPartner,
          },
        });

        this.logger.log(`Certificate verified: ${dto.certId}`);

        return {
          id: updated.id,
          certId: updated.certId,
          status: updated.status,
          verified: true,
        };
      }

      // Already verified
      return {
        id: certificate.id,
        certId: certificate.certId,
        status: certificate.status,
        verified: certificate.status === 'VERIFIED',
      };
    } catch (error) {
      this.logger.error('Error verifying certificate', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to verify certificate');
    }
  }

  /**
   * Get certificate by certId
   */
  async getCertificate(certId: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { certId },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return {
      id: certificate.id,
      certId: certificate.certId,
      vaultPartner: certificate.vaultPartner,
      vaultCertId: certificate.vaultCertId,
      grams: certificate.grams.toString(),
      status: certificate.status,
      mintedAt: certificate.mintedAt,
      mintTxHash: certificate.mintTxHash,
      mintedBy: certificate.mintedBy,
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt,
    };
  }

  /**
   * Get certificates by vault partner
   */
  async getCertificatesByPartner(
    vaultPartner: string,
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const where: any = { vaultPartner };
    if (status) {
      where.status = status;
    }

    const [certificates, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.certificate.count({ where }),
    ]);

    return {
      certificates: certificates.map((cert) => ({
        id: cert.id,
        certId: cert.certId,
        vaultPartner: cert.vaultPartner,
        vaultCertId: cert.vaultCertId,
        grams: cert.grams.toString(),
        status: cert.status,
        createdAt: cert.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get pending certificates
   */
  async getPendingCertificates(limit: number = 50, offset: number = 0) {
    const [certificates, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.certificate.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      certificates: certificates.map((cert) => ({
        id: cert.id,
        certId: cert.certId,
        vaultPartner: cert.vaultPartner,
        vaultCertId: cert.vaultCertId,
        grams: cert.grams.toString(),
        status: cert.status,
        createdAt: cert.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Update certificate status
   */
  async updateCertificateStatus(
    certId: string,
    dto: UpdateCertificateStatusDto,
  ) {
    try {
      const certificate = await this.prisma.certificate.findUnique({
        where: { certId },
      });

      if (!certificate) {
        throw new NotFoundException('Certificate not found');
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        PENDING: ['VERIFIED', 'REJECTED'],
        VERIFIED: ['MINTED', 'REJECTED'],
        MINTED: [],
        REJECTED: [],
      };

      const allowedStatuses = validTransitions[certificate.status] || [];
      if (!allowedStatuses.includes(dto.status)) {
        throw new BadRequestException(
          `Invalid status transition from ${certificate.status} to ${dto.status}`,
        );
      }

      const updateData: any = { status: dto.status };
      if (dto.status === 'MINTED') {
        updateData.mintedAt = new Date();
        if (dto.mintTxHash) {
          updateData.mintTxHash = dto.mintTxHash;
        }
        if (dto.mintedBy) {
          updateData.mintedBy = dto.mintedBy;
        }
      }

      const updated = await this.prisma.certificate.update({
        where: { certId },
        data: updateData,
      });

      // Log audit
      await this.auditService.logAction({
        userId: dto.mintedBy,
        action: 'CERTIFICATE_STATUS_UPDATED',
        resourceType: 'CERTIFICATE',
        resourceId: certificate.id,
        details: {
          certId,
          oldStatus: certificate.status,
          newStatus: dto.status,
          mintTxHash: dto.mintTxHash,
        },
      });

      this.logger.log(
        `Certificate status updated: ${certId} from ${certificate.status} to ${dto.status}`,
      );

      return {
        id: updated.id,
        certId: updated.certId,
        status: updated.status,
        mintedAt: updated.mintedAt,
        mintTxHash: updated.mintTxHash,
        mintedBy: updated.mintedBy,
      };
    } catch (error) {
      this.logger.error('Error updating certificate status', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update certificate status');
    }
  }
}
