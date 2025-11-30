import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  totalWallets: number;

  @ApiProperty()
  totalInvoices: number;

  @ApiProperty()
  totalSettlements: number;

  @ApiProperty()
  totalCertificates: number;

  @ApiProperty()
  totalPartners: number;

  @ApiProperty()
  platformMetrics: {
    totalGRXMinted: string;
    totalGRXBurned: string;
    totalVolumeUSD: string;
  };

  @ApiProperty()
  oracleStatus: {
    latestSnapshot: any;
    lastUpdate: Date;
  };
}

