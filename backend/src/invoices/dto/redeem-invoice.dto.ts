import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RedeemInvoiceDto {
  @ApiProperty({ description: 'Invoice ID' })
  @IsNotEmpty()
  @IsString()
  invoiceId: string;

  @ApiPropertyOptional({ description: 'Recipient wallet address (if different from invoice recipient)' })
  @IsOptional()
  @IsString()
  recipient?: string;
}

