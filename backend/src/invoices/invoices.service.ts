import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RedeemInvoiceDto } from './dto/redeem-invoice.dto';
import { SettleInvoiceDto } from './dto/settle-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { ethers } from 'ethers';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private readonly DEFAULT_EXPIRY_HOURS = 24; // 24 hours expiry

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Generate invoice ID using keccak256 (same as frontend)
   */
  generateInvoiceId(
    sender: string,
    recipient: string,
    amountWei: bigint | string,
  ): string {
    const ts = new Date().toISOString();
    const nonce = ethers.hexlify(ethers.randomBytes(8));

    const amountBigInt =
      typeof amountWei === 'string' ? BigInt(amountWei) : amountWei;

    const abiCoder = new ethers.AbiCoder();
    const encoded = abiCoder.encode(
      ['address', 'address', 'uint256', 'string', 'bytes'],
      [sender, recipient, amountBigInt, ts, nonce],
    );

    return ethers.keccak256(encoded);
  }

  /**
   * Create invoice after burn transaction
   */
  async createInvoice(userId: string, dto: CreateInvoiceDto) {
    try {
      // Validate invoiceId format
      if (!ethers.isHexString(dto.invoiceId)) {
        throw new BadRequestException('Invalid invoiceId format');
      }

      // Check if invoice already exists
      const existing = await this.prisma.invoices.findUnique({
        where: { invoiceId: dto.invoiceId },
      });

      if (existing) {
        throw new BadRequestException('Invoice already exists');
      }

      // Convert amountWei to Decimal
      const amount = new Decimal(dto.amountWei).div(
        new Decimal(10).pow(18),
      );

      // Calculate expiry (24 hours from now by default)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.DEFAULT_EXPIRY_HOURS);

      // Create invoice
      const invoice = await this.prisma.invoices.create({
        data: {
          invoiceId: dto.invoiceId,
          userId,
          recipient: dto.sender, // Recipient is the sender (burner)
          amount,
          status: 'BURN_PENDING',
          burnTxHash: dto.burnTxHash,
          burnBlockNumber: dto.burnBlockNumber
            ? BigInt(dto.burnBlockNumber)
            : null,
          burnTimestamp: new Date(dto.timestamp),
          oracleSnapshotId: dto.snapshotId,
          expiresAt,
        } as any,
      });

      // Log audit
      await this.auditService.logAction({
        userId,
        action: 'INVOICE_CREATED',
        resourceType: 'INVOICE',
        resourceId: invoice.id,
        details: {
          invoiceId: dto.invoiceId,
          burnTxHash: dto.burnTxHash,
          amount: amount.toString(),
          snapshotId: dto.snapshotId,
        },
      });

      this.logger.log(
        `Invoice created: ${dto.invoiceId} for user ${userId}`,
      );

      return {
        id: invoice.id,
        invoiceId: invoice.invoiceId,
        recipient: invoice.recipient,
        amount: invoice.amount.toString(),
        status: invoice.status,
        burnTxHash: invoice.burnTxHash,
        expiresAt: invoice.expiresAt,
        createdAt: invoice.createdAt,
      };
    } catch (error) {
      this.logger.error('Error creating invoice', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to create invoice');
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId: string, userId?: string) {
    const invoice = await this.prisma.invoices.findUnique({
      where: { invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // If userId provided, verify ownership
    if (userId && invoice.userId !== userId) {
      throw new NotFoundException('Invoice not found');
    }

    return {
      id: invoice.id,
      invoiceId: invoice.invoiceId,
      recipient: invoice.recipient,
      amount: invoice.amount.toString(),
      status: invoice.status,
      burnTxHash: invoice.burnTxHash,
      burnBlockNumber: invoice.burnBlockNumber?.toString(),
      burnTimestamp: invoice.burnTimestamp,
      settlementAmount: invoice.settlementAmount?.toString(),
      settlementCurrency: invoice.settlementCurrency,
      partnerId: invoice.partnerId,
      payoutTxHash: invoice.payoutTxHash,
      oracleSnapshotId: invoice.oracleSnapshotId,
      expiresAt: invoice.expiresAt,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  /**
   * Get invoices for a user
   */
  async getInvoicesByUserId(
    userId: string,
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoices.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.invoices.count({ where }),
    ]);

    return {
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceId: invoice.invoiceId,
        recipient: invoice.recipient,
        amount: invoice.amount.toString(),
        status: invoice.status,
        burnTxHash: invoice.burnTxHash,
        expiresAt: invoice.expiresAt,
        createdAt: invoice.createdAt,
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
   * Get invoices by recipient address
   */
  async getInvoicesByRecipient(
    recipient: string,
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const where: any = { recipient };
    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoices.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.invoices.count({ where }),
    ]);

    return {
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        invoiceId: invoice.invoiceId,
        recipient: invoice.recipient,
        amount: invoice.amount.toString(),
        status: invoice.status,
        burnTxHash: invoice.burnTxHash,
        expiresAt: invoice.expiresAt,
        createdAt: invoice.createdAt,
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
   * Redeem invoice (mark as awaiting redeem)
   */
  async redeemInvoice(userId: string, dto: RedeemInvoiceDto) {
    try {
      const invoice = await this.prisma.invoices.findUnique({
        where: { invoiceId: dto.invoiceId },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.userId !== userId) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status !== 'BURN_PENDING' && invoice.status !== 'RECEIVED') {
        throw new BadRequestException(
          `Invoice cannot be redeemed. Current status: ${invoice.status}`,
        );
      }

      // Check if expired
      if (invoice.expiresAt && invoice.expiresAt < new Date()) {
        await this.prisma.invoices.update({
          where: { invoiceId: dto.invoiceId },
          data: { status: 'EXPIRED' },
        });
        throw new BadRequestException('Invoice has expired');
      }

      // Update status
      const updated = await this.prisma.invoices.update({
        where: { invoiceId: dto.invoiceId },
        data: {
          status: 'AWAITING_REDEEM',
          recipient: dto.recipient || invoice.recipient,
        },
      });

      // Log audit
      await this.auditService.logAction({
        userId,
        action: 'INVOICE_REDEEMED',
        resourceType: 'INVOICE',
        resourceId: invoice.id,
        details: {
          invoiceId: dto.invoiceId,
          recipient: updated.recipient,
        },
      });

      this.logger.log(`Invoice redeemed: ${dto.invoiceId} by user ${userId}`);

      return {
        id: updated.id,
        invoiceId: updated.invoiceId,
        status: updated.status,
        recipient: updated.recipient,
      };
    } catch (error) {
      this.logger.error('Error redeeming invoice', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to redeem invoice');
    }
  }

  /**
   * Settle invoice (calculate settlement and create settlement record)
   */
  async settleInvoice(userId: string, dto: SettleInvoiceDto) {
    try {
      const invoice = await this.prisma.invoices.findUnique({
        where: { invoiceId: dto.invoiceId },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status !== 'AWAITING_REDEEM') {
        throw new BadRequestException(
          `Invoice cannot be settled. Current status: ${invoice.status}`,
        );
      }

      // Check if expired
      if (invoice.expiresAt && invoice.expiresAt < new Date()) {
        await this.prisma.invoices.update({
          where: { invoiceId: dto.invoiceId },
          data: { status: 'EXPIRED' },
        });
        throw new BadRequestException('Invoice has expired');
      }

      // Get oracle snapshot (would need OraclesModule)
      // For now, use the snapshot ID from invoice or provided one
      const snapshotId = dto.oracleSnapshotId || invoice.oracleSnapshotId;
      if (!snapshotId) {
        throw new BadRequestException('Oracle snapshot ID required');
      }

      // TODO: Fetch oracle snapshot and calculate settlement amount
      // For now, mark as settled with placeholder values
      // In production, this would:
      // 1. Fetch oracle snapshot
      // 2. Get gold price and FX rate
      // 3. Calculate settlement amount = (GRX amount * gold price * FX rate)
      // 4. Create settlement record

      const updated = await this.prisma.invoices.update({
        where: { invoiceId: dto.invoiceId },
        data: {
          status: 'SETTLED',
          partnerId: dto.partnerId,
          oracleSnapshotId: snapshotId,
          // settlementAmount and settlementCurrency would be set after calculation
        },
      });

      // Log audit
      await this.auditService.logAction({
        userId,
        action: 'INVOICE_SETTLED',
        resourceType: 'INVOICE',
        resourceId: invoice.id,
        details: {
          invoiceId: dto.invoiceId,
          partnerId: dto.partnerId,
          currency: dto.currency,
        },
      });

      this.logger.log(`Invoice settled: ${dto.invoiceId} by user ${userId}`);

      return {
        id: updated.id,
        invoiceId: updated.invoiceId,
        status: updated.status,
        partnerId: updated.partnerId,
      };
    } catch (error) {
      this.logger.error('Error settling invoice', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to settle invoice');
    }
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(
    invoiceId: string,
    dto: UpdateInvoiceStatusDto,
    userId?: string,
  ) {
    try {
      const invoice = await this.prisma.invoices.findUnique({
        where: { invoiceId },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (userId && invoice.userId !== userId) {
        throw new NotFoundException('Invoice not found');
      }

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        RECEIVED: ['AWAITING_REDEEM', 'BURN_PENDING', 'EXPIRED'],
        AWAITING_REDEEM: ['SETTLED', 'EXPIRED'],
        BURN_PENDING: ['USED', 'AWAITING_REDEEM', 'EXPIRED'],
        USED: ['SETTLED'],
        SETTLED: [],
        EXPIRED: [],
      };

      const allowedStatuses = validTransitions[invoice.status] || [];
      if (!allowedStatuses.includes(dto.status)) {
        throw new BadRequestException(
          `Invalid status transition from ${invoice.status} to ${dto.status}`,
        );
      }

      const updateData: any = { status: dto.status };
      if (dto.payoutTxHash) {
        updateData.payoutTxHash = dto.payoutTxHash;
      }

      const updated = await this.prisma.invoices.update({
        where: { invoiceId },
        data: updateData,
      });

      // Log audit
      await this.auditService.logAction({
        userId: userId || invoice.userId,
        action: 'INVOICE_STATUS_UPDATED',
        resourceType: 'INVOICE',
        resourceId: invoice.id,
        details: {
          invoiceId,
          oldStatus: invoice.status,
          newStatus: dto.status,
          payoutTxHash: dto.payoutTxHash,
        },
      });

      return {
        id: updated.id,
        invoiceId: updated.invoiceId,
        status: updated.status,
        payoutTxHash: updated.payoutTxHash,
      };
    } catch (error) {
      this.logger.error('Error updating invoice status', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update invoice status');
    }
  }

  /**
   * Check and expire old invoices (should be called by a scheduled job)
   */
  async expireOldInvoices() {
    const expired = await this.prisma.invoices.updateMany({
      where: {
        status: {
          in: ['RECEIVED', 'AWAITING_REDEEM', 'BURN_PENDING'],
        },
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    this.logger.log(`Expired ${expired.count} invoices`);
    return expired.count;
  }

  /**
   * Get invoice statistics for a user
   */
  async getInvoiceStats(userId: string) {
    const [total, byStatus] = await Promise.all([
      this.prisma.invoices.count({ where: { userId } }),
      this.prisma.invoices.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusCounts[item.status] = item._count;
    });

    return {
      total,
      byStatus: statusCounts,
    };
  }
}
