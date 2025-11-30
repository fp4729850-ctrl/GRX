import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProcessSettlementDto {
  @ApiProperty({ description: 'Settlement ID' })
  @IsNotEmpty()
  @IsString()
  settlementId: string;

  @ApiPropertyOptional({ description: 'Payout transaction hash' })
  @IsOptional()
  @IsString()
  payoutTxHash?: string;
}

