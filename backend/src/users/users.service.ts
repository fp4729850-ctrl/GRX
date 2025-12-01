import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadKycDto } from './dto/upload-kyc.dto';
import { UpdateKycStatusDto } from './dto/update-kyc-status.dto';
import { users_kycStatus, users_role } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        twoFactorSecret: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
        kycVerifiedAt: true,
        biometricEnabled: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: { email },
    });
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    // Check if email or phone already exists
    if (updateUserDto.email || updateUserDto.phone) {
      const existingUser = await this.prisma.users.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                ...(updateUserDto.email ? [{ email: updateUserDto.email }] : []),
                ...(updateUserDto.phone ? [{ phone: updateUserDto.phone }] : []),
              ],
            },
          ],
        },
      });

      if (existingUser) {
        throw new ConflictException('Email or phone already in use');
      }
    }

    return this.prisma.users.update({
      where: { id: userId },
      data: {
        ...updateUserDto,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async uploadKycDocument(userId: string, uploadKycDto: UploadKycDto) {
    // Check if user exists
    const user = await this.findById(userId);

    // Create KYC document
    const kycDocument = await this.prisma.kyc_documents.create({
      data: {
        userId,
        documentType: uploadKycDto.documentType,
        documentHash: uploadKycDto.documentHash,
        fileName: uploadKycDto.fileName,
        mimeType: uploadKycDto.mimeType,
        status: users_kycStatus.SUBMITTED,
      } as any,
    });

    // Update user KYC status to SUBMITTED
    await this.prisma.users.update({
      where: { id: userId },
      data: {
        kycStatus: users_kycStatus.SUBMITTED,
      },
    });

    return kycDocument;
  }

  async updateKycStatus(userId: string, updateKycStatusDto: UpdateKycStatusDto) {
    const user = await this.findById(userId);

    const updateData: any = {
      kycStatus: updateKycStatusDto.status,
    };

    if (updateKycStatusDto.status === users_kycStatus.VERIFIED) {
      updateData.kycVerifiedAt = new Date();
    }

    return this.prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        kycStatus: true,
        kycVerifiedAt: true,
        updatedAt: true,
      },
    });
  }

  async enable2FA(userId: string, code: string) {
    const user = await this.findById(userId);

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate secret if not exists
    let secret = user.twoFactorSecret;
    if (!secret) {
      secret = speakeasy.generateSecret({
        name: `GRX Wallet (${user.email})`,
        issuer: 'BRICSPAY Global',
      }).base32;

      await this.prisma.users.update({
        where: { id: userId },
        data: { twoFactorSecret: secret },
      });
    }

    // Verify code
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Enable 2FA
    await this.prisma.users.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      },
    });

    // Generate QR code
    const otpAuthUrl = speakeasy.otpauthURL({
      secret,
      label: `GRX Wallet (${user.email})`,
      issuer: 'BRICSPAY Global',
      encoding: 'base32',
    });

    const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl);

    return {
      secret,
      qrCodeUrl,
      message: '2FA enabled successfully',
    };
  }

  async disable2FA(userId: string, code: string) {
    const user = await this.findById(userId);

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA secret not found');
    }

    // Verify code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Disable 2FA
    await this.prisma.users.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return { message: '2FA disabled successfully' };
  }

  async getAllUsers(filters?: {
    role?: users_role;
    kycStatus?: users_kycStatus;
    search?: string;
  }, pagination?: {
    page?: number;
    limit?: number;
  }) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.kycStatus) {
      where.kycStatus = filters.kycStatus;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          kycStatus: true,
          kycVerifiedAt: true,
          twoFactorEnabled: true,
          createdAt: true,
        },
      }),
      this.prisma.users.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserStats() {
    const [
      totalUsers,
      verifiedUsers,
      pendingKyc,
      institutionalUsers,
      twoFactorEnabled,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.users.count({ where: { kycStatus: users_kycStatus.VERIFIED } }),
      this.prisma.users.count({
        where: { kycStatus: { in: [users_kycStatus.PENDING, users_kycStatus.SUBMITTED] } },
      }),
      this.prisma.users.count({ where: { role: users_role.INSTITUTIONAL } }),
      this.prisma.users.count({ where: { twoFactorEnabled: true } }),
    ]);

    return {
      totalUsers,
      verifiedUsers,
      pendingKyc,
      institutionalUsers,
      twoFactorEnabled,
    };
  }
}


