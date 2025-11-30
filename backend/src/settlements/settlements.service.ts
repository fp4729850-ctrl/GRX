import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import { OraclesService } from '../oracles/oracles.service';
import { EncryptionService } from '../common/services/encryption.service';
import { AuditService } from '../common/services/audit.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { ProcessSettlementDto } from './dto/process-settlement.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SettlementsService {
  private readonly logger = new Logger(SettlementsService.name);

  constructor(
    private prisma: PrismaService,
    private invoicesService: InvoicesService,
    private oraclesService: OraclesService,
    private encryptionService: EncryptionService,
    private auditService: AuditService,
  ) {}

  /**
   * Calculate settlement amount
   */
  private calculateSettlementAmount(
    grxAmount: Decimal,
    goldPriceUSD: Decimal,
    fxRate: number,
  ): Decimal {
    // Settlement = (GRX amount in grams) * (Gold price USD per gram) * (FX rate)
    return grxAmount.mul(goldPriceUSD).mul(new Decimal(fxRate));
  }

  /**
   * Generate settlement packet (signed JSON)
   */
  private generateSettlementPacket(
    invoiceId: string,
    partnerId: string,
    amount: Decimal,
    currency: string,
    fxRate: number,
    goldPrice: Decimal,
  ): string {
    const packet = {
      invoiceId,
      partnerId,
      amount: amount.toString(),
      currency,
      fxRate,
      goldPrice: goldPrice.toString(),
      timestamp: new Date().toISOString(),
    };

    const packetJson = JSON.stringify(packet);
    const signature = this.encryptionService.hash(packetJson);

    return JSON.stringify({
      ...packet,
      signature,
    });
  }

  /**
   * Create settlement
   */
  async createSettlement(userId: string, dto: CreateSettlementDto) {
    try {
      // Get invoice
      const invoice = await this.invoicesService.getInvoiceById(dto.invoiceId);
      if (invoice.status !== 'AWAITING_REDEEM') {
        throw new BadRequestException(
          `Invoice cannot be settled. Current status: ${invoice.status}`,
        );
      }

      // Get oracle snapshot
      const snapshot = await this.oraclesService.getLatestSnapshot();
      if (!snapshot || snapshot.id !== dto.oracleSnapshotId) {
        // Try to get specific snapshot
        const snapshots = await this.oraclesService.getSnapshots(100, 0);
        const specificSnapshot = snapshots.snapshots.find(
          (s) => s.id === dto.oracleSnapshotId,
        );
        if (!specificSnapshot) {
          throw new NotFoundException('Oracle snapshot not found');
        }
      }

      const snapshotData = snapshot || (await this.oraclesService.getLatestSnapshot());
      if (!snapshotData) {
        throw new NotFoundException('Oracle snapshot not found');
      }

      // Get FX rate for currency
      const fxRate = snapshotData.fxRates[dto.currency];
      if (!fxRate) {
        throw new BadRequestException(
          `FX rate not available for currency: ${dto.currency}`,
        );
      }

      // Calculate settlement amount
      const grxAmount = new Decimal(invoice.amount);
      const goldPriceUSD = new Decimal(snapshotData.goldPriceUSD);
      const settlementAmount = this.calculateSettlementAmount(
        grxAmount,
        goldPriceUSD,
        fxRate,
      );

      // Generate settlement packet
      const settlementPacket = this.generateSettlementPacket(
        dto.invoiceId,
        dto.partnerId,
        settlementAmount,
        dto.currency,
        fxRate,
        goldPriceUSD,
      );

      // Create settlement
      const settlement = await this.prisma.settlement.create({
        data: {
          invoiceId: dto.invoiceId,
          partnerId: dto.partnerId,
          amount: settlementAmount,
          currency: dto.currency,
          fxRate: new Decimal(fxRate),
          goldPrice: goldPriceUSD,
          oracleSnapshotId: snapshotData.id,
          settlementPacket,
          status: 'PENDING',
        },
      });

      // Update invoice status
      await this.invoicesService.updateInvoiceStatus(dto.invoiceId, {
        status: 'SETTLED',
      }, userId);

      // Log audit
      await this.auditService.logAction({
        userId,
        action: 'SETTLEMENT_CREATED',
        resourceType: 'SETTLEMENT',
        resourceId: settlement.id,
        details: {
          invoiceId: dto.invoiceId,
          partnerId: dto.partnerId,
          amount: settlementAmount.toString(),
          currency: dto.currency,
        },
      });

      this.logger.log(`Settlement created: ${settlement.id} for invoice ${dto.invoiceId}`);

      return {
        id: settlement.id,
        invoiceId: settlement.invoiceId,
        partnerId: settlement.partnerId,
        amount: settlement.amount.toString(),
        currency: settlement.currency,
        fxRate: settlement.fxRate.toString(),
        goldPrice: settlement.goldPrice.toString(),
        status: settlement.status,
        settlementPacket: JSON.parse(settlementPacket),
        createdAt: settlement.createdAt,
      };
    } catch (error) {
      this.logger.error('Error creating settlement', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create settlement');
    }
  }

  /**
   * Process settlement (send to partner)
   */
  async processSettlement(settlementId: string, dto: ProcessSettlementDto) {
    try {
      const settlement = await this.prisma.settlement.findUnique({
        where: { id: settlementId },
      });

      if (!settlement) {
        throw new NotFoundException('Settlement not found');
      }

      if (settlement.status !== 'PENDING') {
        throw new BadRequestException(
          `Settlement cannot be processed. Current status: ${settlement.status}`,
        );
      }

      const updateData: any = { status: 'SENT' };
      if (dto.payoutTxHash) {
        updateData.payoutTxHash = dto.payoutTxHash;
      }

      const updated = await this.prisma.settlement.update({
        where: { id: settlementId },
        data: updateData,
      });

      // Log audit
      await this.auditService.logAction({
        action: 'SETTLEMENT_PROCESSED',
        resourceType: 'SETTLEMENT',
        resourceId: settlement.id,
        details: {
          settlementId,
          payoutTxHash: dto.payoutTxHash,
        },
      });

      this.logger.log(`Settlement processed: ${settlementId}`);

      return {
        id: updated.id,
        status: updated.status,
        payoutTxHash: updated.payoutTxHash,
      };
    } catch (error) {
      this.logger.error('Error processing settlement', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to process settlement');
    }
  }

  /**
   * Confirm settlement (partner confirms receipt)
   */
  async confirmSettlement(settlementId: string) {
    try {
      const settlement = await this.prisma.settlement.findUnique({
        where: { id: settlementId },
      });

      if (!settlement) {
        throw new NotFoundException('Settlement not found');
      }

      if (settlement.status !== 'SENT') {
        throw new BadRequestException(
          `Settlement cannot be confirmed. Current status: ${settlement.status}`,
        );
      }

      const updated = await this.prisma.settlement.update({
        where: { id: settlementId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      // Log audit
      await this.auditService.logAction({
        action: 'SETTLEMENT_CONFIRMED',
        resourceType: 'SETTLEMENT',
        resourceId: settlement.id,
        details: {
          settlementId,
        },
      });

      this.logger.log(`Settlement confirmed: ${settlementId}`);

      return {
        id: updated.id,
        status: updated.status,
        confirmedAt: updated.confirmedAt,
      };
    } catch (error) {
      this.logger.error('Error confirming settlement', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to confirm settlement');
    }
  }

  /**
   * Get settlement by ID
   */
  async getSettlement(settlementId: string) {
    const settlement = await this.prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        invoice: true,
      },
    });

    if (!settlement) {
      throw new NotFoundException('Settlement not found');
    }

    return {
      id: settlement.id,
      invoiceId: settlement.invoiceId,
      partnerId: settlement.partnerId,
      amount: settlement.amount.toString(),
      currency: settlement.currency,
      fxRate: settlement.fxRate.toString(),
      goldPrice: settlement.goldPrice.toString(),
      oracleSnapshotId: settlement.oracleSnapshotId,
      settlementPacket: JSON.parse(settlement.settlementPacket),
      status: settlement.status,
      payoutTxHash: settlement.payoutTxHash,
      confirmedAt: settlement.confirmedAt,
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
    };
  }

  /**
   * Get settlements by partner
   */
  async getSettlementsByPartner(
    partnerId: string,
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const where: any = { partnerId };
    if (status) {
      where.status = status;
    }

    const [settlements, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      settlements: settlements.map((s) => ({
        id: s.id,
        invoiceId: s.invoiceId,
        partnerId: s.partnerId,
        amount: s.amount.toString(),
        currency: s.currency,
        status: s.status,
        createdAt: s.createdAt,
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

