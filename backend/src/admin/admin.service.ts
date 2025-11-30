import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OraclesService } from '../oracles/oracles.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private oraclesService: OraclesService,
  ) {}

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalUsers,
      totalWallets,
      totalInvoices,
      totalSettlements,
      totalCertificates,
      totalPartners,
      latestSnapshot,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.wallets.count(),
      this.prisma.invoices.count(),
      this.prisma.settlements.count(),
      this.prisma.certificates.count(),
      this.prisma.partners.count(),
      this.oraclesService.getLatestSnapshot(),
    ]);

    // Calculate platform metrics (placeholder - would need actual contract queries)
    const platformMetrics = {
      totalGRXMinted: '0',
      totalGRXBurned: '0',
      totalVolumeUSD: '0',
    };

    return {
      totalUsers,
      totalWallets,
      totalInvoices,
      totalSettlements,
      totalCertificates,
      totalPartners,
      platformMetrics,
      oracleStatus: {
        latestSnapshot,
        lastUpdate: latestSnapshot?.timestamp || new Date(),
      },
    };
  }

  /**
   * Get user management stats
   */
  async getUserStats() {
    const [total, byRole, byKycStatus] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.users.groupBy({
        by: ['role'],
        _count: true,
      }),
      this.prisma.users.groupBy({
        by: ['kycStatus'],
        _count: true,
      }),
    ]);

    return {
      total,
      byRole: byRole.reduce((acc, item) => {
        acc[item.role] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byKycStatus: byKycStatus.reduce((acc, item) => {
        acc[item.kycStatus] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Get transaction monitoring data
   */
  async getTransactionMonitoring(limit: number = 50) {
    const [invoices, settlements, certificates] = await Promise.all([
      this.prisma.invoices.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          users: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.settlements.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.certificates.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    return {
      recentInvoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceId: inv.invoiceId,
        amount: inv.amount.toString(),
        status: inv.status,
        user: inv.users.email,
        createdAt: inv.createdAt,
      })),
      recentSettlements: settlements.map((s) => ({
        id: s.id,
        amount: s.amount.toString(),
        currency: s.currency,
        status: s.status,
        createdAt: s.createdAt,
      })),
      recentCertificates: certificates.map((c) => ({
        id: c.id,
        certId: c.certId,
        vaultPartner: c.vaultPartner,
        grams: c.grams.toString(),
        status: c.status,
        createdAt: c.createdAt,
      })),
    };
  }

  /**
   * Get system logs (audit logs)
   */
  async getSystemLogs(limit: number = 100, offset: number = 0) {
    const [logs, total] = await Promise.all([
      this.prisma.audit_logs.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          users: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.audit_logs.count(),
    ]);

    return {
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        user: log.users ? {
          email: log.users.email,
          role: log.users.role,
        } : null,
        details: log.details ? JSON.parse(log.details) : null,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
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
   * Get oracle status
   */
  async getOracleStatus() {
    const latestSnapshot = await this.oraclesService.getLatestSnapshot();
    const snapshots = await this.oraclesService.getSnapshots(10, 0);

    return {
      latestSnapshot,
      recentSnapshots: snapshots.snapshots,
      status: latestSnapshot ? 'ACTIVE' : 'INACTIVE',
    };
  }

  /**
   * Get platform metrics
   */
  async getPlatformMetrics() {
    // This would typically query blockchain contracts
    // For now, return placeholder data
    return {
      totalGRXMinted: '0',
      totalGRXBurned: '0',
      totalVolumeUSD: '0',
      activeUsers: await this.prisma.users.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    };
  }
}
