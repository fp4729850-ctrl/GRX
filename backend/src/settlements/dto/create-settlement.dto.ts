import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SettlementCurrency {
  INR = 'INR',
  AED = 'AED',
  RUB = 'RUB',
  CNY = 'CNY',
  USD = 'USD',
}

export class CreateSettlementDto {
  @ApiProperty({ description: 'Invoice ID' })
  @IsNotEmpty()
  @IsString()
  invoiceId: string;

  @ApiProperty({ description: 'Partner ID' })
  @IsNotEmpty()
  @IsString()
  partnerId: string;

  @ApiProperty({ description: 'Settlement currency', enum: SettlementCurrency })
  @IsNotEmpty()
  @IsEnum(SettlementCurrency)
  currency: SettlementCurrency;

  @ApiProperty({ description: 'Oracle snapshot ID to use for pricing' })
  @IsNotEmpty()
  @IsString()
  oracleSnapshotId: string;
}

