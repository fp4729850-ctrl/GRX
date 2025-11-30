import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InvoiceStatus {
  RECEIVED = 'RECEIVED',
  AWAITING_REDEEM = 'AWAITING_REDEEM',
  BURN_PENDING = 'BURN_PENDING',
  USED = 'USED',
  SETTLED = 'SETTLED',
  EXPIRED = 'EXPIRED',
}

export class UpdateInvoiceStatusDto {
  @ApiProperty({ description: 'New status', enum: InvoiceStatus })
  @IsNotEmpty()
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @ApiPropertyOptional({ description: 'Payout transaction hash (for SETTLED status)' })
  @IsOptional()
  @IsString()
  payoutTxHash?: string;
}

