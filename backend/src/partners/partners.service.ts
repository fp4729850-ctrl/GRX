import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import { AuditService } from '../common/services/audit.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private auditService: AuditService,
  ) {}

  /**
   * Create partner
   */
  async createPartner(dto: CreatePartnerDto) {
    try {
      // Validate currencies JSON
      let currencies: string[];
      try {
        currencies = JSON.parse(dto.supportedCurrencies);
      } catch (error) {
        throw new BadRequestException('Invalid supportedCurrencies JSON');
      }

      // Validate IP allowlist if provided
      let ipAllowlist: string[] | null = null;
      if (dto.ipAllowlist) {
        try {
          ipAllowlist = JSON.parse(dto.ipAllowlist);
        } catch (error) {
          throw new BadRequestException('Invalid ipAllowlist JSON');
        }
      }

      // Hash API key
      const apiKeyHash = this.encryptionService.hash(dto.apiKey);

      // Check if API key already exists
      const existing = await this.prisma.partners.findUnique({
        where: { apiKey: dto.apiKey },
      });

      if (existing) {
        throw new BadRequestException('API key already exists');
      }

      // Create partner
      const partner = await this.prisma.partners.create({
        data: {
          id: uuidv4(),
          name: dto.name,
          apiKey: dto.apiKey,
          apiKeyHash,
          webhookUrl: dto.webhookUrl || null,
          ipAllowlist: dto.ipAllowlist || null,
          supportedCurrencies: dto.supportedCurrencies,
          status: 'ACTIVE',
          updatedAt: new Date(),
        } as any,
      });

      this.logger.log(`Partner created: ${partner.name} (${partner.id})`);

      return {
        id: partner.id,
        name: partner.name,
        webhookUrl: partner.webhookUrl,
        supportedCurrencies: JSON.parse(partner.supportedCurrencies),
        status: partner.status,
        createdAt: partner.createdAt,
      };
    } catch (error) {
      this.logger.error('Error creating partner', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create partner');
    }
  }

  /**
   * Authenticate partner by API key
   */
  async authenticatePartner(apiKey: string, ipAddress?: string) {
    try {
      const partner = await this.prisma.partners.findUnique({
        where: { apiKey },
      });

      if (!partner) {
        throw new UnauthorizedException('Invalid API key');
      }

      if (partner.status !== 'ACTIVE') {
        throw new UnauthorizedException('Partner is not active');
      }

      // Verify API key hash
      const apiKeyHash = this.encryptionService.hash(apiKey);
      if (apiKeyHash !== partner.apiKeyHash) {
        throw new UnauthorizedException('Invalid API key');
      }

      // Check IP allowlist if configured
      if (partner.ipAllowlist && ipAddress) {
        const allowedIPs: string[] = JSON.parse(partner.ipAllowlist);
        if (!allowedIPs.includes(ipAddress)) {
          throw new UnauthorizedException('IP address not allowed');
        }
      }

      return {
        id: partner.id,
        name: partner.name,
        webhookUrl: partner.webhookUrl,
        supportedCurrencies: JSON.parse(partner.supportedCurrencies),
        status: partner.status,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Send webhook to partner
   */
  async sendWebhook(partnerId: string, event: string, data: any) {
    try {
      const partner = await this.prisma.partners.findUnique({
        where: { id: partnerId },
      });

      if (!partner || !partner.webhookUrl) {
        return;
      }

      await axios.post(
        partner.webhookUrl,
        {
          event,
          data,
          timestamp: new Date().toISOString(),
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Webhook sent to partner ${partner.name}: ${event}`);
    } catch (error) {
      this.logger.error(`Webhook failed for partner ${partnerId}`, error);
      // Don't throw - webhook failures shouldn't break the flow
    }
  }

  /**
   * Get partner by ID
   */
  async getPartner(partnerId: string) {
    const partner = await this.prisma.partners.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found');
    }

    return {
      id: partner.id,
      name: partner.name,
      webhookUrl: partner.webhookUrl,
      supportedCurrencies: JSON.parse(partner.supportedCurrencies),
      status: partner.status,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
    };
  }

  /**
   * Get all partners
   */
  async getPartners(limit: number = 50, offset: number = 0) {
    const [partners, total] = await Promise.all([
      this.prisma.partners.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.partners.count(),
    ]);

    return {
      partners: partners.map((p) => ({
        id: p.id,
        name: p.name,
        webhookUrl: p.webhookUrl,
        supportedCurrencies: JSON.parse(p.supportedCurrencies),
        status: p.status,
        createdAt: p.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }
}
