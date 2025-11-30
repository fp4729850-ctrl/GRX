import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Invoice ID (bytes32 keccak256 hash)' })
  @IsNotEmpty()
  @IsString()
  invoiceId: string;

  @ApiProperty({ description: 'Burn transaction hash' })
  @IsNotEmpty()
  @IsString()
  burnTxHash: string;

  @ApiProperty({ description: 'Oracle snapshot ID' })
  @IsNotEmpty()
  @IsString()
  snapshotId: string;

  @ApiProperty({ description: 'Oracle snapshot signature' })
  @IsNotEmpty()
  @IsString()
  snapshotSignature: string;

  @ApiProperty({ description: 'Amount in Wei (as string)' })
  @IsNotEmpty()
  @IsString()
  amountWei: string;

  @ApiProperty({ description: 'Sender wallet address' })
  @IsNotEmpty()
  @IsString()
  sender: string;

  @ApiProperty({ description: 'ISO timestamp' })
  @IsNotEmpty()
  @IsString()
  timestamp: string;

  @ApiPropertyOptional({ description: 'Burn block number' })
  @IsOptional()
  @IsString()
  burnBlockNumber?: string;
}

