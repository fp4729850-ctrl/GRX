import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SettlementCurrency {
  INR = 'INR',
  AED = 'AED',
  RUB = 'RUB',
  CNY = 'CNY',
  USD = 'USD',
}

export class SettleInvoiceDto {
  @ApiProperty({ description: 'Invoice ID' })
  @IsNotEmpty()
  @IsString()
  invoiceId: string;

  @ApiProperty({ description: 'Partner ID who will process the settlement' })
  @IsNotEmpty()
  @IsString()
  partnerId: string;

  @ApiProperty({ description: 'Settlement currency', enum: SettlementCurrency })
  @IsNotEmpty()
  @IsEnum(SettlementCurrency)
  currency: SettlementCurrency;

  @ApiPropertyOptional({ description: 'Oracle snapshot ID to use for pricing (if different from invoice)' })
  @IsOptional()
  @IsString()
  oracleSnapshotId?: string;
}

